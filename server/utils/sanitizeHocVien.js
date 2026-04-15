/**
 * Không trả về vector faceEmbedding cho client; chỉ cờ hasFaceEmbedding.
 */
function sanitizeHocVienPublic(hv) {
  if (!hv) return null;
  const raw = typeof hv.toObject === "function" ? hv.toObject() : { ...hv };
  const fe = raw.faceEmbedding;
  delete raw.faceEmbedding;
  return {
    ...raw,
    hasFaceEmbedding: Array.isArray(fe) && fe.length === 512,
  };
}

module.exports = { sanitizeHocVienPublic };
