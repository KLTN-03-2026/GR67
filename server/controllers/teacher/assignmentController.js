const mongoose = require("mongoose");
const { formatDateDdMmYyyy } = require("../../utils/dateFormat");
const BaiTap = require("../../models/BaiTap");
const DangKyKhoaHoc = require("../../models/DangKyKhoaHoc");
const NopBai = require("../../models/NopBai");
const FileModel = require("../../models/File"); // Đổi tên để không bị trùng File toàn cục

// Lấy danh sách bài tập của một khóa học (dành cho giảng viên)
exports.getAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Course ID không hợp lệ." });
    }

    // Lấy tất cả bài tập thuộc khóa học
    const assignments = await BaiTap.find({ khoahocID: courseId }).sort({ ngaytao: -1 });

    // Lấy tổng số học viên trong khóa học
    const totalStudentsCount = await DangKyKhoaHoc.countDocuments({ KhoaHocID: courseId });

    // Map qua từng bài tập để lấy số lượng đã nộp bài
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const submittedCount = await NopBai.countDocuments({ baitapID: assignment._id });

        return {
          id: assignment._id,
          title: assignment.tieude,
          description: assignment.mota,
          dueDate: assignment.hannop,
          createdAt: assignment.ngaytao,
          type: assignment.loai,
          points: assignment.diem,
          submitted: submittedCount,
          total: totalStudentsCount,
          file: assignment.file
        };
      })
    );

    res.status(200).json({
      success: true,
      data: assignmentsWithStats,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách bài tập:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi lấy danh sách bài tập." });
  }
};

// Tạo bài tập mới
exports.createAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { tieude, mota, hannop, loai, diem } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Course ID không hợp lệ." });
    }

    if (!tieude || !hannop) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ Tiêu đề và Hạn nộp." });
    }

    let fileId = null;

    // Nếu có file upload
    if (req.file) {
      // Lưu thông tin file vào bảng File
      const newFile = await FileModel.create({
        url: req.file.path, // Sử dụng đường dẫn local từ multer
        type: req.file.mimetype,
        size: req.file.size
      });
      fileId = newFile._id;
    }

    // Tạo bài tập mới
    const newAssignment = await BaiTap.create({
      khoahocID: courseId,
      tieude,
      mota,
      hannop: new Date(hannop),
      loai: loai || "homework",
      diem: Number(diem) || 100,
      file: fileId || null
    });

    res.status(201).json({
      success: true,
      data: newAssignment,
      message: "Tạo bài tập thành công!"
    });
  } catch (error) {
    console.error("Lỗi tạo bài tập:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi tạo bài tập." });
  }
};

// Lấy chi tiết bài tập
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Assignment ID không hợp lệ." });
    }

    const assignment = await BaiTap.findById(id).populate("file");

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài tập." });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bài tập:", error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// Cập nhật bài tập
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tieude, mota, hannop, loai, diem, removeFile } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Assignment ID không hợp lệ." });
    }

    const assignment = await BaiTap.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài tập." });
    }

    // Cập nhật các trường thông tin
    if (tieude) assignment.tieude = tieude;
    if (mota !== undefined) assignment.mota = mota;
    if (hannop) assignment.hannop = new Date(hannop);
    if (loai) assignment.loai = loai;
    if (diem) assignment.diem = Number(diem);

    // Xử lý file
    if (removeFile === 'true' && assignment.file) {
      // Nếu có yêu cầu xóa file từ client
      assignment.file = null;
    }

    if (req.file) {
      // Có upload file mới -> tạo record File mới (hoặc update existing File)
      const newFile = await FileModel.create({
        url: req.file.path,
        type: req.file.mimetype,
        size: req.file.size
      });
      assignment.file = newFile._id;
    }

    await assignment.save();

    // Nạp thêm thông tin file để trả về client (nếu có)
    const updatedAssignment = await BaiTap.findById(id).populate("file");

    res.status(200).json({
      success: true,
      message: "Cập nhật bài tập thành công!",
      data: updatedAssignment
    });
  } catch (error) {
    console.error("Lỗi cập nhật bài tập:", error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// Lấy danh sách nộp bài của một bài tập
exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Assignment ID không hợp lệ." });
    }

    const assignment = await BaiTap.findById(id).populate("file");
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài tập." });
    }

    // 1. Lấy danh sách học viên đăng ký khóa học này
    const registrations = await DangKyKhoaHoc.find({ KhoaHocID: assignment.khoahocID })
      .populate({
        path: "hocvienId",
        populate: {
          path: "userId",
          select: "hovaten email"
        }
      });

    // 2. Lấy danh sách đã nộp bài cho bài tập này
    const submissions = await NopBai.find({ baitapID: id }).populate("filenop filedapan");

    // Tạo map để tra cứu nhanh submission bằng dangkykhoahocID
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.dangkykhoahocID.toString()] = sub;
    });

    // 3. Kết hợp dữ liệu
    const studentsList = registrations.map(reg => {
      const nguoiDung = reg.hocvienId?.userId || {};
      const submission = submissionMap[reg._id.toString()];

      return {
        registrationId: reg._id,
        studentId: reg.hocvienId?._id,
        name: nguoiDung.hovaten || "Học viên không xác định",
        email: nguoiDung.email || "Chưa cập nhật",
        status: submission ? (submission.trangthai === "đã chấm" ? "graded" : "submitted") : "notSubmitted",
        date: submission ? formatDateDdMmYyyy(submission.thoigian, "--") : "--",
        score: submission && submission.diem !== undefined ? `${submission.diem}/${assignment.diem}` : "--",
        submissionId: submission ? submission._id : null,
        fileNop: submission ? submission.filenop : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        assignment,
        students: studentsList
      }
    });

  } catch (error) {
    console.error("Lỗi lấy danh sách nộp bài:", error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};
//Xoa Bai Tap
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID không hợp lệ."
      });
    }

    const assignment = await BaiTap.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài tập."
      });
    }

    // Xóa tất cả bài nộp liên quan (nếu muốn)
    await NopBai.deleteMany({ baitapID: id });

    // (Optional) Xóa file nếu có
    if (assignment.file) {
      await FileModel.findByIdAndDelete(assignment.file);
    }

    // Xóa bài tập
    await BaiTap.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Xóa bài tập thành công!"
    });

  } catch (error) {
    console.error("Lỗi xóa bài tập:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa bài tập."
    });
  }
};