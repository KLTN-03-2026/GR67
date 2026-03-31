const mongoose = require('mongoose');

const cosoSchema = new mongoose.Schema({
  Tencoso: {
    type: String,
    required: true,
    trim: true
  },
  diachi: {
    type: String,
    required: true,
    trim: true
  },
  mota: {
    type: String,
    trim: true
  },
  trangThaiHoatDong: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coso', cosoSchema);
