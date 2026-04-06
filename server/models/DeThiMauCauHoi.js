const mongoose = require("mongoose");

const LOAI_CAU_HOI = ["mcq", "multiSelect", "trueFalse", "shortAnswer"];

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
      enum: LOAI_CAU_HOI,
      trim: true,
      default: "mcq",
    },
    noiDung: {
      type: String,
      required: true,
      trim: true,
    },
    luaChon: {
      type: [String],
      default: [],
    },
    dapAnDungIndex: {
      type: Number,
      default: null,
    },
    dapAnDungIndices: {
      type: [Number],
      default: [],
    },
    dapAnDungBoolean: {
      type: Boolean,
      default: null,
    },
    dapAnDungText: {
      type: String,
      trim: true,
      default: "",
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

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function isStringArray4(v) {
  return Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === "string" && isNonEmptyString(x));
}

function isIndexArrayValid(indices, length) {
  if (!Array.isArray(indices)) return false;
  const uniq = new Set(indices);
  if (uniq.size !== indices.length) return false;
  return indices.every((i) => typeof i === "number" && Number.isInteger(i) && i >= 0 && i < length);
}

// Mongoose 8+ không còn truyền next() cho pre validate — dùng throw
deThiMauCauHoiSchema.pre("validate", function () {
  const q = this;
  const type = String(q.loaiCauHoi || "mcq");
  switch (type) {
    case "mcq": {
      if (!isStringArray4(q.luaChon)) {
        throw new Error("mcq cần luaChon gồm đúng 4 lựa chọn (không rỗng).");
      }
      if (typeof q.dapAnDungIndex !== "number" || !Number.isInteger(q.dapAnDungIndex) || q.dapAnDungIndex < 0 || q.dapAnDungIndex > 3) {
        throw new Error("mcq cần dapAnDungIndex từ 0 đến 3.");
      }
      break;
    }
    case "multiSelect": {
      if (!isStringArray4(q.luaChon)) {
        throw new Error("multiSelect cần luaChon gồm đúng 4 lựa chọn (không rỗng).");
      }
      const idx = Array.isArray(q.dapAnDungIndices) ? q.dapAnDungIndices : [];
      if (!isIndexArrayValid(idx, 4) || idx.length === 0) {
        throw new Error("multiSelect cần dapAnDungIndices hợp lệ và không rỗng.");
      }
      break;
    }
    case "trueFalse": {
      if (typeof q.dapAnDungBoolean !== "boolean") {
        throw new Error("trueFalse cần dapAnDungBoolean là true hoặc false.");
      }
      break;
    }
    case "shortAnswer": {
      if (!isNonEmptyString(q.dapAnDungText)) {
        throw new Error("shortAnswer cần dapAnDungText (không rỗng).");
      }
      break;
    }
    default:
      throw new Error("loaiCauHoi không hợp lệ.");
  }
});

deThiMauCauHoiSchema.index({ deThiMauID: 1, deThiMauPhanID: 1, thuTu: 1 });

module.exports = mongoose.model("DeThiMauCauHoi", deThiMauCauHoiSchema);
