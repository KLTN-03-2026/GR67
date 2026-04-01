const mongoose = require('mongoose');

const baiHocSchema = new mongoose.Schema({
  LoaiKhoaHoc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoaiKhoaHoc',
    required: true
  },
  tenbai: {
    type: String,
    required: true,
    trim: true
  },
  thutu: {
    type: Number,
    required: true
  },
  mota: {
    type: String,
    trim: true
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  // Hỗ trợ nhiều tài liệu đính kèm (phục vụ UI danh sách file)
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('BaiHoc', baiHocSchema);
