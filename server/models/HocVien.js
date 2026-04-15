const mongoose = require("mongoose");

const hocVienSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NguoiDung",
    required: true,
    unique: true,
    note: "Liên kết 1-1 với NguoiDung"
  },
  /** Embedding InsightFace 512 chiều (đã chuẩn hóa khi lưu tùy pipeline). */
  faceEmbedding: {
    type: [Number],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("HocVien", hocVienSchema);
