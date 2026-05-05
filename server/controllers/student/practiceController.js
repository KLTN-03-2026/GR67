const LuyenTap = require('../../models/LuyenTap');
const LuyenTapItem = require('../../models/LuyenTapItem');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const HocVien = require('../../models/HocVien');

// Lấy danh sách các bài luyện tập, chỉ thuộc các khóa học mà học viên đã đăng ký
exports.getPracticeList = async (req, res) => {
  try {
    const student = await HocVien.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: "Không tìm thấy học viên" });
    }
    const hocvienId = student._id;

    // Lấy danh sách khóa học mà học viên tham gia
    const dangKyKhoaHocs = await DangKyKhoaHoc.find({ hocvienId }).select('KhoaHocID');
    const khoaHocIds = dangKyKhoaHocs.map((dk) => dk.KhoaHocID);

    // Lấy bài luyện tập thuộc các khóa học này
    const practiceList = await LuyenTap.find({ $or: [{ khoaHocID: { $in: khoaHocIds } }, { khoaHocID: null }] })
      .populate('khoaHocID', 'tenKhoaHoc')
      .sort({ createdAt: -1 });

    res.status(200).json(practiceList);
  } catch (error) {
    console.error('Error in getPracticeList:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách luyện tập' });
  }
};

// Lấy chi tiết 1 bài luyện tập và các câu hỏi bên trong
exports.getPracticeDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const luyenTap = await LuyenTap.findById(id).populate('khoaHocID', 'tenKhoaHoc');

    if (!luyenTap) {
      return res.status(404).json({ message: 'Không tìm thấy bài luyện tập' });
    }

    const items = await LuyenTapItem.find({ luyenTapID: id }).sort({ thuTu: 1 });

    res.status(200).json({ luyenTap, items });
  } catch (error) {
    console.error('Error in getPracticeDetail:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết luyện tập' });
  }
};
