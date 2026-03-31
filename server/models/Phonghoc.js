const mongoose = require('mongoose');

const phonghocSchema = new mongoose.Schema({
  CoSoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coso',
    required: true
  },
  TenPhong: {
    type: String,
    required: true,
    trim: true
  },
  succhua: {
    type: Number,
    required: true
  },
  trangThaiHoatDong: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Phonghoc', phonghocSchema);
