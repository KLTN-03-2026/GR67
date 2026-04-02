const mongoose = require('mongoose');

const lichHocItemSchema = new mongoose.Schema(
  {
    thu: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    gioBatDau: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    gioKetThuc: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    phonghoc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Phonghoc',
      required: true,
    },
  },
  { _id: false }
);

const khoaHocSchema = new mongoose.Schema({
  LoaiKhoaHocID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoaiKhoaHoc',
    required: true
  },
  tenkhoahoc: {
    type: String,
    required: true,
    trim: true
  },
  ngaykhaigiang: {
    type: Date,
    required: true
  },
  giangvien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GiangVien',
    required: true
  },
  soHocVienToiDa: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  lichHoc: {
    type: [lichHocItemSchema],
    default: [],
    validate: [
      {
        validator: function (items) {
          if (!Array.isArray(items) || items.length === 0) return false;
          return items.every((it) => {
            if (!it) return false;
            if (typeof it.gioBatDau !== 'string' || typeof it.gioKetThuc !== 'string') return false;
            return it.gioBatDau < it.gioKetThuc; // HH:mm lexicographic ok
          });
        },
        message: 'Lịch khóa phải có ít nhất một ca; trong mỗi ca, giờ bắt đầu phải sớm hơn giờ kết thúc.',
      },
      {
        validator: function (items) {
          if (!Array.isArray(items)) return false;
          const seen = new Set();
          for (const it of items) {
            const key = String(it.thu);
            if (seen.has(key)) return false; // tránh trùng thứ trong cùng khóa
            seen.add(key);
          }
          return true;
        },
        message: 'Trong một khóa học, không được đặt hai ca trùng cùng một thứ trong tuần.',
      },
    ],
  },
}, {
  timestamps: true
});

khoaHocSchema.index({ LoaiKhoaHocID: 1 });
khoaHocSchema.index({ giangvien: 1 });
khoaHocSchema.index({ ngaykhaigiang: 1 });

module.exports = mongoose.model('KhoaHoc', khoaHocSchema);
