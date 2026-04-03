const mongoose = require("mongoose");

const LOAI_BAI = ["flashcard", "quiz", "trueFalse", "shortAnswer", "multiSelect"];

const luyenTapItemSchema = new mongoose.Schema(
  {
    luyenTapID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LuyenTap",
      required: true,
      index: true,
    },
    thuTu: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    loaiItem: {
      type: String,
      required: true,
      enum: LOAI_BAI,
      trim: true,
    },

    // Common
    noiDung: {
      type: String,
      default: "",
      trim: true,
    },

    // flashcard
    matTruoc: {
      type: String,
      default: "",
      trim: true,
    },
    matSau: {
      type: String,
      default: "",
      trim: true,
    },

    // quiz (mcq)
    luaChon: {
      type: [String],
      default: [],
    },
    dapAnDungIndex: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },

    // multiSelect
    dapAnDungIndices: {
      type: [Number],
      default: [],
    },

    // trueFalse
    dapAnDungBoolean: {
      type: Boolean,
      default: null,
    },

    // shortAnswer
    dapAnDungText: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function isStringArray4(v) {
  return Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === "string" && x.trim().length > 0);
}

function isIndexArrayValid(indices, length) {
  if (!Array.isArray(indices)) return false;
  const uniq = new Set(indices);
  if (uniq.size !== indices.length) return false;
  return indices.every((i) => typeof i === "number" && i >= 0 && i < length);
}

luyenTapItemSchema.index({ luyenTapID: 1, thuTu: 1 });

luyenTapItemSchema.pre("validate", function (next) {
  const item = this;
  switch (item.loaiItem) {
    case "flashcard":
      if (!isNonEmptyString(item.matTruoc) || !isNonEmptyString(item.matSau)) {
        return next(new Error("flashcard cần có matTruoc và matSau."));
      }
      return next();
    case "quiz": {
      if (!isStringArray4(item.luaChon)) {
        return next(new Error("quiz cần luaChon gồm đúng 4 lựa chọn (không rỗng)."));
      }
      if (typeof item.dapAnDungIndex !== "number") {
        return next(new Error("quiz cần dapAnDungIndex (0-3)."));
      }
      return next();
    }
    case "multiSelect": {
      // Cho phép multiSelect dùng chung 4 lựa chọn như quiz
      if (!isStringArray4(item.luaChon)) {
        return next(new Error("multiSelect cần luaChon gồm đúng 4 lựa chọn (không rỗng)."));
      }
      if (!isIndexArrayValid(item.dapAnDungIndices, 4) || item.dapAnDungIndices.length === 0) {
        return next(new Error("multiSelect cần dapAnDungIndices là mảng chỉ số đúng và không rỗng."));
      }
      return next();
    }
    case "trueFalse":
      if (typeof item.dapAnDungBoolean !== "boolean") {
        return next(new Error("trueFalse cần dapAnDungBoolean là true/false."));
      }
      return next();
    case "shortAnswer":
      if (!isNonEmptyString(item.dapAnDungText)) {
        return next(new Error("shortAnswer cần dapAnDungText (không rỗng)."));
      }
      return next();
    default:
      return next(new Error("loaiItem không hợp lệ."));
  }
});

module.exports = mongoose.model("LuyenTapItem", luyenTapItemSchema);

