const mongoose = require("mongoose");

const luyenTapSchema = new mongoose.Schema(
  {
    khoaHocID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KhoaHoc",
      required: false,
      index: true,
    },
    tenBai: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    loaiBai: {
      type: String,
      required: true,
      enum: ["flashcard", "quiz", "trueFalse", "shortAnswer", "multiSelect", "mixedNoFlashcard"],
      trim: true,
    },
    thoiGianLamBai: {
      type: Number,
      min: 1,
      default: 0,
    },
    moTa: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

luyenTapSchema.index({ khoaHocID: 1, loaiBai: 1, createdAt: -1 });

module.exports = mongoose.model("LuyenTap", luyenTapSchema);

