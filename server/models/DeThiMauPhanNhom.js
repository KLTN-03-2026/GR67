const mongoose = require("mongoose");

const deThiMauPhanNhomSchema = new mongoose.Schema(
  {
    deThiMauPhanID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMauPhan",
      required: true,
      index: true,
    },
    tenNhom: {
      type: String,
      required: true,
      trim: true,
    },
    thuTu: {
      type: Number,
      required: true,
      min: 1,
      index: true,
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

deThiMauPhanNhomSchema.index({ deThiMauPhanID: 1, thuTu: 1 });

module.exports = mongoose.model("DeThiMauPhanNhom", deThiMauPhanNhomSchema);

