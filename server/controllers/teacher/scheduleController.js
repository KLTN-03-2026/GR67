// server/controllers/teacher/scheduleController.js
const GiangVien = require('../../models/GiangVien');
const KhoaHoc = require('../../models/KhoaHoc');
const BuoiHoc = require('../../models/BuoiHoc');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');

exports.getSchedule = async (req, res) => {
  try {
    const giangVien = await GiangVien.findOne({ userId: req.user._id });
    if (!giangVien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    }

    const courses = await KhoaHoc.find({ giangvien: giangVien._id });
    const courseIds = courses.map(c => c._id);

    const buoiHocs = await BuoiHoc.find({ KhoaHocID: { $in: courseIds } })
      .populate('KhoaHocID', 'tenkhoahoc')
      .populate({
        path: 'phonghoc',
        select: 'TenPhong CoSoId',
        populate: {
          path: 'CoSoId',
          select: 'Tencoso'
        }
      })
      .sort({ ngayhoc: 1, giobatdau: 1 });

    // Cache student counts for courses to avoid redundant queries
    const studentCountMap = {};

    const formattedData = await Promise.all(buoiHocs.map(async (lesson) => {
      const courseIdStr = lesson.KhoaHocID._id.toString();
      
      if (studentCountMap[courseIdStr] === undefined) {
        const count = await DangKyKhoaHoc.countDocuments({ KhoaHocID: lesson.KhoaHocID._id });
        studentCountMap[courseIdStr] = count;
      }
      const students = studentCountMap[courseIdStr];

      // Determine status
      const now = new Date();
      let status = "upcoming";
      if (now > lesson.gioketthuc) {
        status = "completed";
      } else if (now >= lesson.giobatdau && now <= lesson.gioketthuc) {
        status = "ongoing";
      }

      // Format time (e.g. 09:00 - 10:30)
      const timeFmt = `${new Date(lesson.giobatdau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(lesson.gioketthuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

      return {
        id: lesson._id,
        ngayhoc: lesson.ngayhoc,
        time: timeFmt,
        course: lesson.KhoaHocID?.tenkhoahoc || "Không xác định",
        classroom: lesson.phonghoc?.TenPhong || "Chưa xếp",
        branch: lesson.phonghoc?.CoSoId?.Tencoso || "Chưa xếp",
        students,
        status,
      };
    }));

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch dạy:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
