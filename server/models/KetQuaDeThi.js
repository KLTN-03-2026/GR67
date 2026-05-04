const mongoose = require("mongoose");

const chiTietCauHoiSchema = new mongoose.Schema(
  {
    cauHoiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMauCauHoi",
      required: true,
    },
    loaiCauHoi: {
      type: String,
      required: true,
    },
    // Câu trả lời của học viên
    cauTraLoiIndex: { type: Number, default: null }, // For mcq
    cauTraLoiIndices: { type: [Number], default: [] }, // For multiSelect
    cauTraLoiBoolean: { type: Boolean, default: null }, // For trueFalse
    cauTraLoiText: { type: String, default: "" }, // For shortAnswer
    // Đáp án đúng để dễ dàng truy xuất tại thời điểm làm bài
    dapAnDungIndex: { type: Number, default: null },
    dapAnDungIndices: { type: [Number], default: [] },
    dapAnDungBoolean: { type: Boolean, default: null },
    dapAnDungText: { type: String, default: "" },
    
    ketQua: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const ketQuaDeThiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NguoiDung",
      required: true,
      index: true,
    },
    deThiMauID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMau",
      required: true,
      index: true,
    },
    diemSo: {
      type: Number,
      required: true,
      default: 0,
    },
    tongSoCau: {
      type: Number,
      required: true,
      default: 0,
    },
    soCauDung: {
      type: Number,
      required: true,
      default: 0,
    },
    thoiGianLamBai: {
      type: Number,
      required: true, // in seconds
    },
    chiTiet: [chiTietCauHoiSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("KetQuaDeThi", ketQuaDeThiSchema);
