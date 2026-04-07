// server/controllers/teacher/scheduleController.js
const GiangVien = require('../../models/GiangVien');
const KhoaHoc = require('../../models/KhoaHoc');
const BuoiHoc = require('../../models/BuoiHoc');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const ThamGiaBuoiHoc = require('../../models/ThamGiaBuoiHoc');
const NguoiDung = require('../../models/NguoiDung');
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

      // Merge lesson.ngayhoc date with lesson.giobatdau time to ignore DB date mismatches
      const realStartDate = new Date(lesson.ngayhoc);
      const startObj = new Date(lesson.giobatdau);
      realStartDate.setHours(startObj.getHours(), startObj.getMinutes(), 0);

      const realEndDate = new Date(lesson.ngayhoc);
      const endObj = new Date(lesson.gioketthuc);
      realEndDate.setHours(endObj.getHours(), endObj.getMinutes(), 0);

      // Determine status
      const now = new Date();
      let status = "upcoming";
      if (now > realEndDate) {
        status = "completed";
      } else if (now >= realStartDate && now <= realEndDate) {
        status = "ongoing";
      }

      // Format time (e.g. 09:00 - 10:30)
      const timeFmt = `${startObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

      return {
        id: lesson._id,
        ngayhoc: lesson.ngayhoc,
        time: timeFmt,
        course: lesson.KhoaHocID?.tenkhoahoc || "Không xác định",
        classroom: lesson.phonghoc?.TenPhong || "Chưa xếp",
        branch: lesson.phonghoc?.CoSoId?.Tencoso || "Chưa xếp",
        students,
        status,
        rawStartTime: realStartDate,
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

exports.getRollcallData = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Lấy thông tin buổi học
    const buoiHoc = await BuoiHoc.findById(lessonId)
      .populate('KhoaHocID', 'tenkhoahoc')
      .populate('phonghoc', 'TenPhong');

    if (!buoiHoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    // Lấy danh sách đăng ký khóa học (Học viên trong khóa)
    const danhSachDangKy = await DangKyKhoaHoc.find({ KhoaHocID: buoiHoc.KhoaHocID._id })
      .populate({
        path: 'hocvienId',
        populate: {
          path: 'userId', // NguoiDung
          select: 'hovaten email'
        }
      });

    // Lấy trạng thái điểm danh hiện tại nếu đã lưu
    const diemDanhDaLuu = await ThamGiaBuoiHoc.find({ buoihocID: lessonId });
    const diemDanhMap = {};
    const leaveRequestMap = {};
    diemDanhDaLuu.forEach(dd => {
      diemDanhMap[dd.dangkykhoahocID.toString()] = dd.trangthai;
      if (dd.trangthai_duyet === 'approved') {
        leaveRequestMap[dd.dangkykhoahocID.toString()] = true;
      }
    });

    const studentList = danhSachDangKy.map(dk => {
      const isApprovedLeave = leaveRequestMap[dk._id.toString()];
      let defaultStatus = diemDanhMap[dk._id.toString()] || "absent";
      // Nếu trạng thái mặc định là absent mà có đơn xin nghỉ phép được duyệt thì chuyển thành excused
      if (isApprovedLeave && defaultStatus === "absent") {
        defaultStatus = "excused";
      }

      return {
        dangkykhoahocID: dk._id,
        studentId: dk.hocvienId?._id,
        userId: dk.hocvienId?.userId?._id,
        name: dk.hocvienId?.userId?.hovaten || dk.hocvienId?.userId?.email || "Thiếu tên",
        code: dk.hocvienId?.userId?.email?.split('@')[0] || "HV",
        status: defaultStatus,
        hasApprovedLeave: isApprovedLeave || false
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        lesson: {
          id: buoiHoc._id,
          course: buoiHoc.KhoaHocID.tenkhoahoc,
          room: buoiHoc.phonghoc?.TenPhong || "Chưa xếp",
          date: buoiHoc.ngayhoc,
          startTime: buoiHoc.giobatdau,
          endTime: buoiHoc.gioketthuc
        },
        students: studentList
      }
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu điểm danh:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.submitRollcall = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { attendanceList } = req.body; // Array: [{ dangkykhoahocID, status }]

    if (!Array.isArray(attendanceList)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    const bulkOps = attendanceList.map(item => ({
      updateOne: {
        filter: { 
          buoihocID: lessonId, 
          dangkykhoahocID: item.dangkykhoahocID 
        },
        update: { 
          $set: { trangthai: item.status } 
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await ThamGiaBuoiHoc.bulkWrite(bulkOps);
    }

    return res.status(200).json({ success: true, message: 'Đã lưu điểm danh thành công' });
  } catch (error) {
    console.error('Lỗi khi lưu điểm danh:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
