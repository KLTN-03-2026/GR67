const { formatDateDdMmYyyy } = require("../../utils/dateFormat");
const ThamGiaBuoiHoc = require('../../models/ThamGiaBuoiHoc');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const GiangVien = require('../../models/GiangVien');
const KhoaHoc = require('../../models/KhoaHoc');
const HocVien = require('../../models/HocVien');
const NguoiDung = require('../../models/NguoiDung');

// GET /teacher/courses/leave-requests
exports.getLeaveRequests = async (req, res) => {
  try {
    // 1. Lấy ID giảng viên từ req.user
    const giangVien = await GiangVien.findOne({ userId: req.user._id });
    if (!giangVien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin giảng viên' });
    }


    // Lọc theo courseId nếu có
    const { courseId } = req.query;

    // 2. Tìm tất cả Đăng ký khóa học của các khóa học do giảng viên này dạy
    // Aggregate data hoặc dùng populate deep

    let matchKhoaHoc = { giangvien: giangVien._id };
    if (courseId) {
      matchKhoaHoc._id = courseId; // Giả sử query là courseId hợp lệ
    }

    const leaveRequests = await ThamGiaBuoiHoc.find({ trangthai: 'excused' })
      .populate({
        path: 'dangkykhoahocID',
        populate: [
          {
            path: 'KhoaHocID',
            match: matchKhoaHoc,
            select: 'tenkhoahoc giangvien'
          },
          {
            path: 'hocvienId',
            populate: {
              path: 'userId',
              select: 'hovaten email'
            }
          }
        ]
      })
      .sort({ createdAt: -1 });

    // 3. Lọc ra các request thỏa mãn (do match ở trên chỉ set thành null nếu không khớp)
    const filteredRequests = leaveRequests.filter(req => req.dangkykhoahocID && req.dangkykhoahocID.KhoaHocID);

    // 4. Format lại dữ liệu trả về cho frontend
    const formattedData = await Promise.all(
      filteredRequests.map(async (req) => {
        const hocVien = req.dangkykhoahocID?.hocvienId;
        const nguoiDung = hocVien?.userId;

        // 🔥 ĐẾM SỐ LẦN XIN NGHỈ ĐÃ DUYỆT (THEO HỌC VIÊN + KHÓA HỌC)
        const totalRequests = await ThamGiaBuoiHoc.countDocuments({
          trangthai_duyet: "approved",
          dangkykhoahocID: req.dangkykhoahocID._id
        });

        return {
          id: req._id,
          studentName: nguoiDung?.hovaten || 'Học viên không xác định',
          studentEmail: nguoiDung?.email || 'Chưa cập nhật',
          courseName: req.dangkykhoahocID?.KhoaHocID?.tenkhoahoc || 'Khoá học không xác định',

          requestType:
            req.loai_don === 'om' ? 'medical' :
              req.loai_don === 'viec_rieng' ? 'personal' :
                req.loai_don === 'cong_tac' ? 'other' : 'other',

          reason: req.lydo_nghi,

          startDate: req.ngay_bat_dau ? formatDateDdMmYyyy(req.ngay_bat_dau, "") : "",

          endDate: req.ngay_ket_thuc ? formatDateDdMmYyyy(req.ngay_ket_thuc, "") : "",

          status: req.trangthai_duyet,

          totalRequests, // ✅ CHUẨN

          submittedDate: req.thoigian_nop
            ? formatDateDdMmYyyy(req.thoigian_nop, "")
            : formatDateDdMmYyyy(req.createdAt, ""),
        };
      })
    );

    // Sắp xếp: ưu tiên đơn "pending" (chờ duyệt) lên trên cùng
    formattedData.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0; // Giữ nguyên thứ tự (đã sort theo thời gian mới nhất ở database) nếu cùng trạng thái
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn xin nghỉ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
// PUT /teacher/courses/leave-requests/:id/approve
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await ThamGiaBuoiHoc.findByIdAndUpdate(
      id,
      { trangthai_duyet: "approved" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};


// PUT /teacher/courses/leave-requests/:id/reject
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ThamGiaBuoiHoc.findByIdAndUpdate(
      id,
      { trangthai_duyet: "rejected" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });
    }

    res.json({ success: true, message: "Đã từ chối đơn" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /teacher/courses
exports.getCourses = async (req, res) => {
  try {
    const giangVien = await GiangVien.findOne({ userId: req.user._id });
    if (!giangVien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    }

    const courses = await KhoaHoc.find({ giangvien: giangVien._id });

    const formattedCourses = await Promise.all(
      courses.map(async (course, index) => {
        const studentsCount = await DangKyKhoaHoc.countDocuments({ KhoaHocID: course._id });

        const status = new Date(course.ngaykhaigiang) > new Date() ? "Sắp khai giảng" : "Đang mở";

        let iconBg, iconColor;
        if (status === "Đang mở") {
          iconBg = "bg-blue-100";
          iconColor = "text-blue-500";
        } else {
          iconBg = "bg-green-100";
          iconColor = "text-green-500";
        }

        return {
          id: course._id,
          name: course.tenkhoahoc,
          code: `KH-${course._id.toString().slice(-6).toUpperCase()}`,
          status: status,
          studentsText: `${studentsCount} học viên`,
          schedule: "Đang cập nhật", // Chưa có model cụ thể cho lịch học, tạm thời giữ mockup
          iconBg,
          iconColor
        };
      })
    );

    res.status(200).json({ success: true, data: formattedCourses });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khoá học:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /teacher/courses/:courseId/students
exports.getStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const giangVien = await GiangVien.findOne({ userId: req.user._id });
    if (!giangVien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    }

    const course = await KhoaHoc.findOne({ _id: courseId, giangvien: giangVien._id });
    if (!course) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập khóa học này' });
    }

    const registrations = await DangKyKhoaHoc.find({ KhoaHocID: courseId })
      .populate({
        path: 'hocvienId',
        populate: {
          path: 'userId',
          select: 'hovaten email soDienThoai gioitinh ngaysinh'
        }
      });

    const formattedData = registrations.map(reg => {
      const nguoiDung = reg.hocvienId?.userId || {};
      return {
        id: reg._id, // Sử dụng ID của đăng ký làm primary key để thao tác dễ hơn
        originStudentId: reg.hocvienId?._id,
        name: nguoiDung.hovaten || 'Chưa cập nhật',
        email: nguoiDung.email || 'Chưa cập nhật',
        phone: nguoiDung.soDienThoai || 'Chưa cập nhật',
        gender: nguoiDung.gioitinh ? 'Nam' : 'Nữ',
        registrationDate: reg.createdAt,
        absentDays: reg.so_ngay_nghi || 0
      };
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách học viên theo khóa học:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
exports.deleteStudentFromCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Kiểm tra giảng viên này có phải là giáo viên của khóa học không
    const giangVien = await GiangVien.findOne({ userId: req.user._id });
    if (!giangVien) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    }

    const course = await KhoaHoc.findOne({ _id: courseId, giangvien: giangVien._id });
    if (!course) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên khóa học này' });
    }

    // Xóa đăng ký khóa học dựa vào _id (được gán bằng biến studentId lúc gọi từ frontend lên)
    const deleted = await DangKyKhoaHoc.findOneAndDelete({
      _id: studentId,
      KhoaHocID: courseId
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên trong khóa học"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa học viên khỏi khóa học thành công"
    });

  } catch (error) {
    console.error("Lỗi xóa học viên:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};