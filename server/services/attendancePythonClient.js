const DEFAULT_URL = 'http://127.0.0.1:8765';

function getBaseUrl() {
  return (process.env.ATTENDANCE_SERVICE_URL || DEFAULT_URL).replace(/\/$/, '');
}

/**
 * Multipart tới FastAPI — Node 18+ FormData + Blob.
 */
function buildEncodeFormData(buffer, filename, contentType) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  form.append('file', blob, filename);
  return form;
}

async function parseJsonResponse(r) {
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${r.status}`);
  }
  if (!r.ok) {
    const msg = data.detail || data.message || text || `HTTP ${r.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

/**
 * Đăng ký khuôn mặt — trả embedding 512 chiều.
 */
async function enrollImageBuffer(buffer) {
  const base = getBaseUrl();
  const form = buildEncodeFormData(buffer, 'face.jpg', 'image/jpeg');
  const r = await fetch(`${base}/enroll`, {
    method: 'POST',
    body: form,
  });
  const data = await parseJsonResponse(r);
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Phản hồi enroll không hợp lệ');
  }
  return data.embedding;
}

/**
 * Nhận diện từ clip WebM (kiosk WS).
 */
async function recognizeWebmBuffer(buffer) {
  const base = getBaseUrl();
  const form = buildEncodeFormData(buffer, 'clip.webm', 'video/webm');
  const r = await fetch(`${base}/recognize`, {
    method: 'POST',
    body: form,
  });
  const data = await parseJsonResponse(r);
  return data;
}

/**
 * Nhận diện từ một ảnh (HTTP kiosk).
 */
async function recognizeImageBuffer(buffer) {
  const base = getBaseUrl();
  const form = buildEncodeFormData(buffer, 'face.jpg', 'image/jpeg');
  const r = await fetch(`${base}/recognize-image`, {
    method: 'POST',
    body: form,
  });
  const data = await parseJsonResponse(r);
  return data;
}

/**
 * Node đẩy toàn bộ embedding lên Python (FAISS reload).
 */
async function pushReloadToPython(items) {
  const base = getBaseUrl();
  const r = await fetch(`${base}/reload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return parseJsonResponse(r);
}

/**
 * Thêm / cập nhật một học viên trên index Python.
 */
async function pushAddUserToPython(hocvienId, embedding) {
  const base = getBaseUrl();
  const r = await fetch(`${base}/add-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hocvienId, embedding }),
  });
  return parseJsonResponse(r);
}

module.exports = {
  getBaseUrl,
  enrollImageBuffer,
  recognizeWebmBuffer,
  recognizeImageBuffer,
  pushReloadToPython,
  pushAddUserToPython,
};
