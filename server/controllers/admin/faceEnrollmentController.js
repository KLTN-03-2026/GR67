const HocVien = require('../../models/HocVien');
const NguoiDung = require('../../models/NguoiDung');
const { encodeImageBuffer } = require('../../services/attendancePythonClient');
const { sanitizeHocVienPublic } = require('../../utils/sanitizeHocVien');

exports.registerStudentFace = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, message: 'Thiếu ảnh (field: image)' });
    }

    const user = await NguoiDung.findOne({ _id: req.params.id, role: 'student' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    let encoding;
    try {
      encoding = await encodeImageBuffer(req.file.buffer);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e.message || 'Không trích được đặc trưng khuôn mặt',
      });
    }

    const hocVienInfo = await HocVien.findOneAndUpdate(
      { userId: user._id },
      { faceDescriptor: encoding },
      { new: true, upsert: true }
    ).lean();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.maOTP;
    delete userObj.hanSuDungOTP;

    return res.status(200).json({
      success: true,
      message: 'Đã lưu khuôn mặt cho học viên',
      data: { ...userObj, hocVienInfo: sanitizeHocVienPublic(hocVienInfo) },
    });
  } catch (error) {
    console.error('registerStudentFace:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
    });
  }
};
