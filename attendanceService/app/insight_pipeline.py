"""
InsightFace (buffalo_l): detect + embedding 512-D.
Passive liveness: đa khung + độ biến thiên Laplacian trên vùng mặt.
"""
from __future__ import annotations

import os
import tempfile
import time
from typing import List, Optional, Tuple

import cv2
import numpy as np

EMB_DIM = 512

# Lazy init FaceAnalysis
_app = None


def _get_app():
    global _app
    if _app is None:
        from insightface.app import FaceAnalysis

        root = os.path.expanduser(os.environ.get("INSIGHTFACE_ROOT", "~/.insightface"))
        prov_env = os.environ.get(
            "ONNX_PROVIDERS", "CUDAExecutionProvider,CPUExecutionProvider"
        )
        plist = [p.strip() for p in prov_env.split(",") if p.strip()]
        ctx = int(os.environ.get("INSIGHTFACE_CTX_ID", "0"))
        try:
            _app = FaceAnalysis(name="buffalo_l", root=root, providers=plist)
            _app.prepare(ctx_id=ctx, det_size=(640, 640))
        except Exception:
            _app = FaceAnalysis(
                name="buffalo_l",
                root=root,
                providers=["CPUExecutionProvider"],
            )
            _app.prepare(ctx_id=-1, det_size=(640, 640))
    return _app


def image_bytes_to_bgr(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Không đọc được ảnh")
    return img


def _resize_max_side(bgr: np.ndarray, max_side: int = 640) -> np.ndarray:
    h, w = bgr.shape[:2]
    m = max(h, w)
    if m <= max_side:
        return bgr
    scale = max_side / float(m)
    return cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def _largest_face_embedding_and_bbox(
    bgr: np.ndarray,
) -> Tuple[Optional[np.ndarray], Optional[np.ndarray], float]:
    """Trả (normed_embedding 512, bbox, laplacian_var)."""
    app = _get_app()
    img = _resize_max_side(bgr, 640)
    faces = app.get(img)
    if not faces:
        return None, None, 0.0
    face = max(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
    )
    emb = getattr(face, "normed_embedding", None)
    if emb is None:
        raw = face.embedding
        emb = raw / (np.linalg.norm(raw) + 1e-8)
    emb = np.asarray(emb, dtype=np.float32).reshape(EMB_DIM)
    x1, y1, x2, y2 = [int(round(x)) for x in face.bbox]
    H, W = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(W, x2), min(H, y2)
    if x2 <= x1 or y2 <= y1:
        lap = 0.0
    else:
        crop = img[y1:y2, x1:x2]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return emb, face.bbox, lap


def encode_face_from_image_bytes(data: bytes) -> List[float]:
    bgr = image_bytes_to_bgr(data)
    emb, _, _ = _largest_face_embedding_and_bbox(bgr)
    if emb is None:
        raise ValueError("Không phát hiện được khuôn mặt trong ảnh")
    return emb.tolist()


def analyze_image_bytes(data: bytes) -> Tuple[np.ndarray, float]:
    """Embedding đã chuẩn hóa + Laplacian variance (vùng mặt)."""
    bgr = image_bytes_to_bgr(data)
    emb, _, lap = _largest_face_embedding_and_bbox(bgr)
    if emb is None:
        raise ValueError("Không phát hiện được khuôn mặt trong ảnh")
    return emb.astype(np.float32), float(lap)


def decode_webm_frames(data: bytes, max_frames: int = 16, step: int = 3) -> List[np.ndarray]:
    if len(data) < 32:
        raise ValueError("Dữ liệu video quá ngắn")
    fd, path = tempfile.mkstemp(suffix=".webm")
    try:
        os.write(fd, data)
        os.close(fd)
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise ValueError("Không mở được WebM")
        frames: List[np.ndarray] = []
        i = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if i % step == 0:
                frames.append(frame)
                if len(frames) >= max_frames:
                    break
            i += 1
        cap.release()
        if not frames:
            raise ValueError("Không đọc được khung hình từ video")
        return frames
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def recognize_from_webm_bytes(
    data: bytes,
    min_lap_var: float,
    min_frames_ok: int,
) -> Tuple[Optional[np.ndarray], List[float], bool, str]:
    """
    Trả về (embedding trung bình đã chuẩn hóa, laplacian từng khung, liveness_ok, lý do).
    """
    frames = decode_webm_frames(data)
    embs: List[np.ndarray] = []
    laps: List[float] = []
    for fr in frames:
        emb, _, lap = _largest_face_embedding_and_bbox(fr)
        if emb is not None:
            embs.append(emb)
            laps.append(lap)
    if len(embs) < min_frames_ok:
        return None, laps, False, "insufficient_face_frames"
    mean_lap = float(np.mean(laps)) if laps else 0.0
    if mean_lap < min_lap_var:
        return None, laps, False, "liveness_low_texture"
    stacked = np.stack(embs, axis=0)
    merged = np.mean(stacked, axis=0)
    merged = merged / (np.linalg.norm(merged) + 1e-8)
    return merged.astype(np.float32), laps, True, "ok"


_last_hid: Optional[str] = None
_last_ts: float = 0.0


def cooldown_should_suppress(hocvien_id: str, cooldown_sec: float) -> bool:
    """True nếu vừa nhận diện cùng hocvienId trong cửa sổ cooldown."""
    global _last_hid, _last_ts
    if not hocvien_id:
        return False
    now = time.time()
    return hocvien_id == _last_hid and (now - _last_ts) < cooldown_sec


def cooldown_mark(hocvien_id: str) -> None:
    global _last_hid, _last_ts
    _last_hid = hocvien_id
    _last_ts = time.time()
