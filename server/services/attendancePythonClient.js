const DEFAULT_URL = 'http://127.0.0.1:8765';

function getBaseUrl() {
  return (process.env.ATTENDANCE_SERVICE_URL || DEFAULT_URL).replace(/\/$/, '');
}

/**
 * Multipart tới FastAPI: FormData + Blob built-in (Node 18+). fetch + package form-data
 * hay làm Undici gửi body sai → "There was an error parsing the body".
 */
function buildEncodeFormData(buffer, filename, contentType) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  form.append('file', blob, filename);
  return form;
}

/**
 * Gọi Python /encode — trả về mảng 128 số.
 */
async function encodeImageBuffer(buffer) {
  const base = getBaseUrl();
  const form = buildEncodeFormData(buffer, 'face.jpg', 'image/jpeg');
  const r = await fetch(`${base}/encode`, {
    method: 'POST',
    body: form,
  });
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
  if (!data.encoding || !Array.isArray(data.encoding)) {
    throw new Error('Phản hồi encode không hợp lệ');
  }
  return data.encoding;
}

/**
 * Gọi Python /encode-webm — trả về mảng 128 số (embedding gộp từ nhiều frame).
 */
async function encodeWebmBuffer(buffer) {
  const base = getBaseUrl();
  const form = buildEncodeFormData(buffer, 'clip.webm', 'video/webm');
  const r = await fetch(`${base}/encode-webm`, {
    method: 'POST',
    body: form,
  });
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
  if (!data.encoding || !Array.isArray(data.encoding)) {
    throw new Error('Phản hồi encode-webm không hợp lệ');
  }
  return data.encoding;
}

function l2Distance(a, b) {
  if (!a || !b || a.length !== 128 || b.length !== 128) return Infinity;
  let s = 0;
  for (let i = 0; i < 128; i += 1) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

const DEFAULT_THRESHOLD = 0.55;

/**
 * So khớp probe với danh sách { id, encoding } — trả về { id, distance } hoặc null.
 */
function matchEncodingLocally(probe, gallery, threshold = DEFAULT_THRESHOLD) {
  let best = null;
  let bestD = Infinity;
  for (const item of gallery) {
    if (!item.encoding || item.encoding.length !== 128) continue;
    const d = l2Distance(probe, item.encoding);
    if (d < bestD) {
      bestD = d;
      best = item.id;
    }
  }
  if (best === null || bestD > threshold) return null;
  return { id: best, distance: bestD };
}

module.exports = {
  encodeImageBuffer,
  encodeWebmBuffer,
  getBaseUrl,
  l2Distance,
  matchEncodingLocally,
  DEFAULT_THRESHOLD,
};
