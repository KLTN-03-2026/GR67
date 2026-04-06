const BuoiHoc = require('../../models/BuoiHoc');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const ThamGiaBuoiHoc = require('../../models/ThamGiaBuoiHoc');
const HocVien = require('../../models/HocVien');
const NguoiDung = require('../../models/NguoiDung');
const moment = require('moment');
const { encodeImageBuffer } = require('../../services/attendancePythonClient');
const { recognizeFromProbe } = require('../../services/kioskRecognitionService');
const { isWithinCheckInWindow } = require('../../utils/attendanceWindow');

function getIo() {
  try {
    return require('../../socket/io').getIO();
  } catch {
    return null;
  }
}

exports.kioskRecognize = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, message: 'Thiếu ảnh (field: image)' });
    }

    let probe;
    try {
      probe = await encodeImageBuffer(req.file.buffer);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e.message || 'Không trích được đặc trưng khuôn mặt',
      });
    }

    const result = await recognizeFromProbe(probe);
    return res.status(200).json(result);
  } catch (error) {
    console.error('kioskRecognize:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
    });
  }
};

exports.kioskConfirm = async (req, res) => {
  try {
    const { buoiHocId, dangkykhoahocId } = req.body || {};
    if (!buoiHocId || !dangkykhoahocId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu buoiHocId hoặc dangkykhoahocId',
      });
    }

    const buoi = await BuoiHoc.findById(buoiHocId).populate('KhoaHocID', 'tenkhoahoc').lean();
    if (!buoi) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    const dk = await DangKyKhoaHoc.findById(dangkykhoahocId).lean();
    const buoiCourseId =
      buoi.KhoaHocID && buoi.KhoaHocID._id
        ? buoi.KhoaHocID._id.toString()
        : buoi.KhoaHocID.toString();
    if (!dk || dk.KhoaHocID.toString() !== buoiCourseId) {
      return res.status(400).json({ success: false, message: 'Đăng ký khóa không khớp buổi học' });
    }

    const now = new Date();
    if (!isWithinCheckInWindow(now, buoi.giobatdau)) {
      return res.status(400).json({
        success: false,
        message: 'Ngoài khung giờ cho phép điểm danh',
      });
    }

    const late = moment(now).isAfter(moment(buoi.giobatdau));

    const hv = await HocVien.findOne({ _id: dk.hocvienId }).lean();
    const user = hv ? await NguoiDung.findById(hv.userId).select('hovaten email').lean() : null;

    await ThamGiaBuoiHoc.findOneAndUpdate(
      { buoihocID: buoi._id, dangkykhoahocID: dk._id },
      {
        $set: {
          trangthai: 'present',
          thoigian_checkin: now,
        },
      },
      { upsert: true, new: true }
    );

    const payload = {
      buoiHocId: buoi._id.toString(),
      dangkykhoahocId: dk._id.toString(),
      hocvienId: dk.hocvienId.toString(),
      userId: hv?.userId?.toString(),
      hovaten: user?.hovaten || '',
      tenkhoahoc:
        (buoi.KhoaHocID && buoi.KhoaHocID.tenkhoahoc) || '',
      thoigian_checkin: now,
      late,
    };

    const io = getIo();
    if (io) {
      io.to('admin:attendance').emit('attendance:update', payload);
    }

    return res.status(200).json({
      success: true,
      message: 'Điểm danh thành công',
      data: payload,
    });
  } catch (error) {
    console.error('kioskConfirm:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server',
    });
  }
};
