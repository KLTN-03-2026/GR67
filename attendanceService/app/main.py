import os
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.face_pipeline import (
    DEFAULT_MATCH_THRESHOLD,
    encode_face_from_image_bytes,
    encode_webm_bytes_to_embedding,
    match_encoding,
)

app = FastAPI(title="Attendance Face Service", version="1.0.0")

MAX_MB = int(os.environ.get("MAX_IMAGE_MB", "8"))


class MatchRequest(BaseModel):
    probe: List[float] = Field(..., min_length=128, max_length=128)
    gallery: List[dict] = Field(..., description="[{id, encoding: number[128]}]")
    threshold: Optional[float] = DEFAULT_MATCH_THRESHOLD


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/encode")
async def encode_face(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, "Ảnh quá lớn")
    try:
        encoding, mode = encode_face_from_image_bytes(data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"success": True, "encoding": encoding, "mode": mode}


@app.post("/encode-webm")
async def encode_webm(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, "Video quá lớn")
    try:
        encoding, frames_used = encode_webm_bytes_to_embedding(data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"success": True, "encoding": encoding, "frames_used": frames_used}


@app.post("/match")
def match_face(body: MatchRequest):
    if not body.gallery:
        raise HTTPException(400, "gallery rỗng")
    try:
        best_id, dist, _ = match_encoding(
            body.probe, body.gallery, body.threshold or DEFAULT_MATCH_THRESHOLD
        )
    except Exception as e:
        raise HTTPException(400, str(e))
    return {
        "success": best_id is not None,
        "id": best_id,
        "distance": dist,
        "threshold": body.threshold or DEFAULT_MATCH_THRESHOLD,
    }
