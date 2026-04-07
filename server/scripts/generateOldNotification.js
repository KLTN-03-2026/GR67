require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const NopBai = require('../models/NopBai');
const ThongBao = require('../models/ThongBao');
const BaiTap = require('../models/BaiTap');
const DangKyKhoaHoc = require('../models/DangKyKhoaHoc');
const KhoaHoc = require('../models/KhoaHoc');
const GiangVien = require('../models/GiangVien');

const NOP_BAI_ID = '69d3dafcee216660499cdac7';

async function generateNotificationForPastSubmission() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    const doc = await NopBai.findById(NOP_BAI_ID);
    if (!doc) {
      console.log("Không tìm thấy bài nộp với ID:", NOP_BAI_ID);
      process.exit(1);
    }

    // Lấy tên học viên
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
        
        // Format thời gian
        const submitTime = doc.thoigianNop || doc.thoigian || new Date();
        const timeString = new Date(submitTime).toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', 
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });

        // Tạo thông báo
        const notification = await ThongBao.create({
          tieuDe: 'Học viên nộp bài mới',
          noidung: `Học viên ${studentName} vừa nộp bài tập "${baitap.tieude || 'Khuyết danh'}" thuộc khóa học ${course.tenkhoahoc || ''} vào lúc ${timeString}.`,
          targetType: 'personal',
          khoaHocId: course._id,
          userID: [teacher.userId],
          createdBy: studentUserId,
          createdAt: submitTime
        });

        console.log("Thành công! Đã tạo thông báo với ID:", notification._id);
        console.log("Nội dung:", notification.noidung);
      } else {
        console.log("Không tìm thấy Giảng viên của khóa học này.");
      }
    } else {
      console.log("Không tìm thấy Bài tập hoặc Khóa học liên quan.");
    }

  } catch (error) {
    console.error("====== EXCEPTION ======");
    console.error(error.stack || error);
    setTimeout(() => { process.exit(1); }, 1000);
  }
}

generateNotificationForPastSubmission();
