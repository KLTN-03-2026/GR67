const mongoose = require("mongoose");

const deThiMauCauHoiSchema = new mongoose.Schema(
  {
    deThiMauID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMau",
      required: true,
      index: true,
    },
    deThiMauPhanID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMauPhan",
      required: true,
      index: true,
    },
    deThiMauPhanNhomID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMauPhanNhom",
      default: null,
      index: true,
    },
    thuTu: {
      type: Number,
      required: true,
      min: 1,
    },
    loaiCauHoi: {
      type: String,
      required: true,
      enum: ["mcq"],
      trim: true,
    },
    noiDung: {
      type: String,
      required: true,
      trim: true,
    },
    luaChon: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === "string" && x.trim().length > 0);
        },
        message: "MCQ phải có đúng 4 lựa chọn (không rỗng).",
      },
    },
    dapAnDungIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    giaiThich: {
      type: String,
      trim: true,
      default: "",
    },

    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
  },
  { timestamps: true }
);

deThiMauCauHoiSchema.index({ deThiMauID: 1, deThiMauPhanID: 1, thuTu: 1 });

module.exports = mongoose.model("DeThiMauCauHoi", deThiMauCauHoiSchema);

