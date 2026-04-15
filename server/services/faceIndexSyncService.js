const HocVien = require('../models/HocVien');
const { pushReloadToPython } = require('./attendancePythonClient');

const EMB_DIM = 512;

/**
 * Đọc Mongo và gọi Python /reload. Không throw — log lỗi (khởi động / sau enroll).
 */
async function syncFaceIndexFromDatabase() {
  try {
    const rows = await HocVien.find({
      faceEmbedding: { $exists: true, $not: { $size: 0 } },
    })
      .select('_id faceEmbedding')
      .lean();

    const items = rows
      .filter((r) => Array.isArray(r.faceEmbedding) && r.faceEmbedding.length === EMB_DIM)
      .map((r) => ({
        hocvienId: r._id.toString(),
        embedding: r.faceEmbedding,
      }));

    const result = await pushReloadToPython(items);
    console.log(
      `[faceIndex] Python reload OK: ${result.count ?? items.length} embeddings`
    );
    return result;
  } catch (e) {
    console.warn('[faceIndex] Python reload failed (service chưa chạy?):', e.message || e);
    return null;
  }
}

module.exports = { syncFaceIndexFromDatabase, EMB_DIM };
