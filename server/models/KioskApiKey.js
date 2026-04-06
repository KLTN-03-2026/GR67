const mongoose = require('mongoose');

const kioskApiKeySchema = new mongoose.Schema(
  {
    tenHienThi: {
      type: String,
      required: true,
      trim: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secretSuffixHash: {
      type: String,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KioskApiKey', kioskApiKeySchema);
