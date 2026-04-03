const mongoose = require("mongoose");

const deThiMauPhanSchema = new mongoose.Schema(
  {
    deThiMauID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeThiMau",
      required: true,
      index: true,
    },
    tenPhan: {
      type: String,
      required: true,
      trim: true,
    },
    thuTu: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

deThiMauPhanSchema.index({ deThiMauID: 1, thuTu: 1 });

module.exports = mongoose.model("DeThiMauPhan", deThiMauPhanSchema);

