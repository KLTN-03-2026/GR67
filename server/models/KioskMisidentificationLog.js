const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    hocvienId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HocVien',
      required: true,
      index: true,
    },
    kioskKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KioskApiKey',
      default: null,
    },
    legacyKiosk: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KioskMisidentificationLog', schema);
