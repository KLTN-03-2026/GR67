"""
OpenCV: phát hiện & cắt khuôn mặt cục bộ.
face_recognition (dlib): embedding 128 chiều trên ảnh đã cắt — khớp HocVien.faceDescriptor.
"""
from __future__ import annotations

from typing import List, Optional, Tuple

import os
import tempfile

import cv2
import face_recognition
import numpy as np

# Ngưỡng mặc định (face_recognition dùng khoảng cách L2; càng nhỏ càng giống)
DEFAULT_MATCH_THRESHOLD = 0.55

# Haar cascade có sẵn trong OpenCV
_cascade_path = (
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
_face_cascade = cv2.CascadeClassifier(_cascade_path)


def _bgr_to_rgb(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def detect_largest_face_crop(bgr: np.ndarray) -> Optional[np.ndarray]:
    """Trả về ảnh BGR đã crop vùng mặt lớn nhất, hoặc None."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(64, 64),
    )
    if len(faces) == 0:
        return None
    # Chọn bbox có diện tích lớn nhất
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    pad = int(0.1 * max(w, h))
    H, W = bgr.shape[:2]
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(W, x + w + pad)
    y1 = min(H, y + h + pad)
    return bgr[y0:y1, x0:x1]


def image_bytes_to_bgr(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Không đọc được ảnh (định dạng không hợp lệ)")
    return img


def encode_face_from_image_bytes(data: bytes) -> Tuple[List[float], str]:
    """
    Trả về (encoding 128 phần tử, mode: 'opencv_crop' | 'full_image').
    Raises ValueError nếu không trích được đặc trưng.
    """
    bgr = image_bytes_to_bgr(data)
    crop = detect_largest_face_crop(bgr)
    rgb: np.ndarray
    mode = "opencv_crop"
    if crop is not None and crop.size > 0:
        rgb = _bgr_to_rgb(crop)
    else:
        # Fallback: thử face_recognition trên toàn ảnh (HOG)
        rgb = _bgr_to_rgb(bgr)
        mode = "full_image"

    encs = face_recognition.face_encodings(rgb, num_jitters=1)
    if len(encs) == 0:
        if mode == "opencv_crop":
            rgb_full = _bgr_to_rgb(bgr)
            encs = face_recognition.face_encodings(rgb_full, num_jitters=1)
            mode = "full_image_retry"
        if len(encs) == 0:
            raise ValueError("Không phát hiện được khuôn mặt trong ảnh")
    if len(encs) > 1:
        raise ValueError("Có nhiều hơn một khuôn mặt — chỉ chụm một người")

    return encs[0].tolist(), mode


def l2_distance(a: List[float], b: List[float]) -> float:
    return float(np.linalg.norm(np.asarray(a) - np.asarray(b)))


def match_encoding(
    probe: List[float],
    gallery: List[dict],
    threshold: float = DEFAULT_MATCH_THRESHOLD,
) -> Tuple[Optional[str], float, Optional[dict]]:
    """
    gallery: [{ "id": str, "encoding": number[] }, ...]
    Trả về (best_id, distance, entry) hoặc (None, inf, None).
    """
    best_id: Optional[str] = None
    best_dist = float("inf")
    best_entry: Optional[dict] = None
    for item in gallery:
        enc = item.get("encoding")
        if not enc or len(enc) != 128:
            continue
        d = l2_distance(probe, enc)
        if d < best_dist:
            best_dist = d
            best_id = item.get("id")
            best_entry = item
    if best_id is None or best_dist > threshold:
        return None, best_dist, best_entry
    return best_id, best_dist, best_entry


def _encode_bgr_frame_to_vector(bgr: np.ndarray) -> Optional[List[float]]:
    """Một khung BGR → vector 128 hoặc None."""
    rgb = _bgr_to_rgb(bgr)
    encs = face_recognition.face_encodings(rgb, num_jitters=0)
    if encs:
        return encs[0].tolist()
    crop = detect_largest_face_crop(bgr)
    if crop is not None and crop.size > 0:
        encs = face_recognition.face_encodings(_bgr_to_rgb(crop), num_jitters=0)
        if encs:
            return encs[0].tolist()
    return None


def encode_webm_bytes_to_embedding(data: bytes) -> Tuple[List[float], int]:
    """
    Giải mã đoạn WebM (chunk MediaRecorder), lấy nhiều khung, gộp embedding (trung bình).
    """
    if len(data) < 32:
        raise ValueError("Dữ liệu video quá ngắn")

    fd, path = tempfile.mkstemp(suffix=".webm")
    try:
        os.write(fd, data)
        os.close(fd)
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise ValueError("Không mở được file video (WebM)")

        vectors: List[List[float]] = []
        frame_i = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_i % 3 == 0:
                vec = _encode_bgr_frame_to_vector(frame)
                if vec is not None:
                    vectors.append(vec)
            frame_i += 1
            if len(vectors) >= 16:
                break
        cap.release()

        if not vectors:
            raise ValueError("Không trích được khuôn mặt từ đoạn video")

        merged = np.mean(np.asarray(vectors, dtype=np.float64), axis=0).tolist()
        return merged, len(vectors)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
