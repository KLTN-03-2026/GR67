const mongoose = require('mongoose');

const thongBaoSchema = new mongoose.Schema({
  tieuDe: {
    type: String,
    trim: true,
  },
  // createdBy dùng cho cả admin và teacher
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NguoiDung',
  },

  // Backward-compat: giữ lại để không làm gãy dữ liệu cũ
  createdByAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NguoiDung',
  },
  // all | class | personal | assignment_submit
  targetType: {
    type: String,
    enum: ['all', 'class', 'personal', 'assignment_submit'],
    default: 'all',
  },
  khoaHocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhoaHoc',
  },
  fileIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
  ],
  // Nhận viên: mảng userID cần target
  userID: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
      index: true,
    },
  ],

  // Backward-compat cho dữ liệu cũ: 1 userID đơn lẻ
  // (không khai báo schema riêng vì Mongoose sẽ cast theo field userID; ở controller sẽ xử lý cả 2 dạng)

  noidung: {
    type: String,
    required: true,
    trim: true
  },
  // Backward-compat: cũ từng lưu boolean
  trangthaidoc: {
    type: Boolean,
    default: false,
  },

  // URL để redirect nếu click vào thông báo
  link: {
    type: String
  },

  // Đã đọc: mảng user đã đọc
  readByUserIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
    },
  ],
}, {
  timestamps: true
});

module.exports = mongoose.model('ThongBao', thongBaoSchema);
