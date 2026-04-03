const mongoose = require("mongoose");

const deThiMauSchema = new mongoose.Schema(
  {
    khoaHocID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KhoaHoc",
      required: false,
    },
    tenDe: {
      type: String,
      required: true,
      trim: true,
    },
    chungChi: {
      type: String,
      required: true,
      enum: ["TOEIC", "IELTS"],
      trim: true,
      uppercase: true,
    },
    capDo: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard", "dễ", "trung bình", "khó"],
      trim: true,
    },
    thoiGianLamBai: {
      type: Number,
      required: true,
      min: 1,
    },
    moTa: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

deThiMauSchema.index({ khoaHocID: 1, chungChi: 1, createdAt: -1 });
deThiMauSchema.index({ chungChi: 1 });

module.exports = mongoose.model("DeThiMau", deThiMauSchema);

