/**
 * Không trả về vector faceDescriptor cho client; chỉ cờ hasFaceDescriptor.
 */
function sanitizeHocVienPublic(hv) {
  if (!hv) return null;
  const raw = typeof hv.toObject === 'function' ? hv.toObject() : { ...hv };
  const fd = raw.faceDescriptor;
  delete raw.faceDescriptor;
  return {
    ...raw,
    hasFaceDescriptor: Array.isArray(fd) && fd.length === 128,
  };
}

module.exports = { sanitizeHocVienPublic };
