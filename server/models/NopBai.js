const mongoose = require('mongoose');

const nopBaiSchema = new mongoose.Schema({
  baitapID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BaiTap',
    required: true
  },
  dangkykhoahocID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DangKyKhoaHoc',
    required: true
  },
  filenop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  thoigian: {
    type: Date,
    default: Date.now
  },
  trangthai: {
    type: String,
    enum: ["chờ chấm", "đã chấm", "yêu cầu làm lại"],
    default: "chờ chấm"
  },
  nhanxet: {
    type: String,
    trim: true
  },
  diem: {
    type: Number,
    min: 0
  },
  filedapan: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }]
}, {
  timestamps: true
});

nopBaiSchema.pre('save', function() {
  this.wasNew = this.isNew;
});

nopBaiSchema.post('save', async function(doc) {
  if (this.wasNew) {
    try {
      const mongoose = require('mongoose');
      const BaiTap = mongoose.model('BaiTap');
      const DangKyKhoaHoc = mongoose.model('DangKyKhoaHoc');
      const GiangVien = mongoose.model('GiangVien');
      const ThongBao = mongoose.model('ThongBao');

      // Lấy thông tin học viên
      const dkkh = await DangKyKhoaHoc.findById(doc.dangkykhoahocID).populate({
        path: 'hocvienId',
        populate: { path: 'userId' }
      });
      
      const studentName = dkkh?.hocvienId?.userId?.hovaten || 'Một học viên';
      const studentUserId = dkkh?.hocvienId?.userId?._id;

      // Lấy thông tin bài tập và khóa học
      const baitap = await BaiTap.findById(doc.baitapID).populate('khoahocID');
      const course = baitap?.khoahocID;
      
      if (course && course.giangvien) {
        // Tìm userId của giảng viên
        const teacher = await GiangVien.findById(course.giangvien);
        if (teacher && teacher.userId) {
          // Format thời gian nộp
          const submitTime = doc.thoigian ? new Date(doc.thoigian) : new Date();
          const timeString = submitTime.toLocaleString('vi-VN', { 
              hour: '2-digit', minute: '2-digit', 
              day: '2-digit', month: '2-digit', year: 'numeric' 
          });

          // Tạo thông báo cho giảng viên
          await ThongBao.create({
            tieuDe: 'Học viên nộp bài mới',
            noidung: `Học viên ${studentName} vừa nộp bài tập "${baitap.tieude}" thuộc khóa học ${course.tenkhoahoc} vào lúc ${timeString}.`,
            targetType: 'assignment_submit',
            khoaHocId: course._id,
            userID: [teacher.userId],
            createdBy: studentUserId,
            link: `/teacher/courses/grade-ass?id=${baitap._id}&submissionId=${doc._id}`
          });
        }
      }
    } catch (err) {
      console.error("Lỗi khi tạo thông báo nộp bài qua hook:", err);
    }
  }
});

module.exports = mongoose.model('NopBai', nopBaiSchema);
