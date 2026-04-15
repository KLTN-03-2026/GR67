import os
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.faiss_store import FaissGallery
from app.insight_pipeline import (
    EMB_DIM,
    analyze_image_bytes,
    cooldown_mark,
    cooldown_should_suppress,
    encode_face_from_image_bytes,
    recognize_from_webm_bytes,
)

app = FastAPI(title="Attendance Face Service (InsightFace + FAISS)", version="2.0.0")

MAX_MB = int(os.environ.get("MAX_IMAGE_MB", "8"))
MIN_SIM = float(os.environ.get("MATCH_MIN_SIMILARITY", "0.45"))
MIN_LAP = float(os.environ.get("LIVENESS_MIN_LAPLACIAN_VAR", "25.0"))
MIN_FRAMES = int(os.environ.get("LIVENESS_MIN_FRAMES", "3"))
COOLDOWN_SEC = float(os.environ.get("RECOGNITION_COOLDOWN_SEC", "4.0"))

_gallery = FaissGallery()


class ReloadBody(BaseModel):
    items: List[dict] = Field(default_factory=list)


class AddUserBody(BaseModel):
    hocvienId: str
    embedding: List[float] = Field(..., min_length=EMB_DIM, max_length=EMB_DIM)


@app.get("/health")
def health():
    return {
        "ok": True,
        "gallery_size": _gallery.size,
        "min_similarity": MIN_SIM,
    }


@app.post("/reload")
def reload_index(body: ReloadBody):
    try:
        n = _gallery.reload(body.items)
    except Exception as e:
        raise HTTPException(400, str(e))
    return {"success": True, "count": n}


@app.post("/add-user")
def add_user(body: AddUserBody):
    try:
        n = _gallery.add_or_update(body.hocvienId, body.embedding)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"success": True, "count": n}


@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, "Ảnh quá lớn")
    try:
        enc = encode_face_from_image_bytes(data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"success": True, "embedding": enc, "dim": EMB_DIM}


@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, "File quá lớn")
    try:
        merged, laps, liveness_ok, reason = recognize_from_webm_bytes(
            data, min_lap_var=MIN_LAP, min_frames_ok=MIN_FRAMES
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    if not liveness_ok or merged is None:
        return {
            "success": True,
            "recognized": False,
            "liveness_ok": False,
            "reason": reason,
            "mean_laplacian": float(sum(laps) / len(laps)) if laps else 0.0,
        }

    hid, sim = _gallery.search(merged, MIN_SIM)
    if hid is None:
        return {
            "success": True,
            "recognized": False,
            "liveness_ok": True,
            "reason": "no_match",
            "similarity": sim,
        }

    if cooldown_should_suppress(hid, COOLDOWN_SEC):
        return {
            "success": True,
            "recognized": False,
            "liveness_ok": True,
            "reason": "cooldown",
            "hocvienId": hid,
        }

    cooldown_mark(hid)
    return {
        "success": True,
        "recognized": True,
        "liveness_ok": True,
        "hocvienId": hid,
        "similarity": float(sim),
        "distance": float(1.0 - sim),
    }


@app.post("/recognize-image")
async def recognize_image(file: UploadFile = File(...)):
    """Nhận diện từ một ảnh JPEG (ví dụ kiosk HTTP)."""
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, "Ảnh quá lớn")
    try:
        emb, lap = analyze_image_bytes(data)
        liveness_ok = lap >= MIN_LAP
    except ValueError as e:
        raise HTTPException(400, str(e))

    if not liveness_ok:
        return {
            "success": True,
            "recognized": False,
            "liveness_ok": False,
            "reason": "liveness_low_texture",
        }

    hid, sim = _gallery.search(emb, MIN_SIM)
    if hid is None:
        return {
            "success": True,
            "recognized": False,
            "liveness_ok": True,
            "reason": "no_match",
            "similarity": sim,
        }

    if cooldown_should_suppress(hid, COOLDOWN_SEC):
        return {
            "success": True,
            "recognized": False,
            "liveness_ok": True,
            "reason": "cooldown",
            "hocvienId": hid,
        }

    cooldown_mark(hid)
    return {
        "success": True,
        "recognized": True,
        "liveness_ok": True,
        "hocvienId": hid,
        "similarity": float(sim),
        "distance": float(1.0 - sim),
    }
