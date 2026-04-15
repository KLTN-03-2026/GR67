"""FAISS IndexFlatIP trên vector đã chuẩn hóa L2 (cosine = inner product)."""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np

EMB_DIM = 512


class FaissGallery:
    def __init__(self) -> None:
        self._emb: Dict[str, np.ndarray] = {}
        self._index: Optional[faiss.IndexFlatIP] = None
        self._ids: List[str] = []

    def clear(self) -> None:
        self._emb.clear()
        self._index = None
        self._ids = []

    def reload(self, items: List[dict]) -> int:
        """items: [{ hocvienId: str, embedding: list[float] }]"""
        self.clear()
        for it in items:
            hid = str(it.get("hocvienId", "")).strip()
            emb = it.get("embedding")
            if not hid or not emb or len(emb) != EMB_DIM:
                continue
            v = np.asarray(emb, dtype=np.float32).reshape(1, EMB_DIM)
            faiss.normalize_L2(v)
            self._emb[hid] = v.reshape(EMB_DIM)
        self._rebuild()
        return len(self._ids)

    def add_or_update(self, hocvien_id: str, embedding: List[float]) -> int:
        hid = str(hocvien_id).strip()
        if len(embedding) != EMB_DIM:
            raise ValueError("embedding phải đủ 512 chiều")
        v = np.asarray(embedding, dtype=np.float32).reshape(1, EMB_DIM)
        faiss.normalize_L2(v)
        self._emb[hid] = v.reshape(EMB_DIM)
        self._rebuild()
        return len(self._ids)

    def _rebuild(self) -> None:
        self._ids = list(self._emb.keys())
        if not self._ids:
            self._index = None
            return
        mat = np.zeros((len(self._ids), EMB_DIM), dtype=np.float32)
        for i, hid in enumerate(self._ids):
            mat[i] = self._emb[hid]
        self._index = faiss.IndexFlatIP(EMB_DIM)
        self._index.add(mat)

    def search(
        self, probe: np.ndarray, min_similarity: float
    ) -> Tuple[Optional[str], float]:
        """
        probe: (512,) float32 đã chuẩn hóa L2.
        Trả về (hocvienId hoặc None, similarity).
        """
        if self._index is None or self._index.ntotal == 0:
            return None, 0.0
        q = probe.astype(np.float32).reshape(1, EMB_DIM)
        faiss.normalize_L2(q)
        sims, idxs = self._index.search(q, min(5, self._index.ntotal))
        best_i = int(idxs[0][0])
        best_sim = float(sims[0][0])
        if best_sim < min_similarity:
            return None, best_sim
        return self._ids[best_i], best_sim

    @property
    def size(self) -> int:
        return len(self._ids)
