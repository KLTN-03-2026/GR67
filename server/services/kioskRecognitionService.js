const mongoose = require('mongoose');
const HocVien = require('../models/HocVien');
const NguoiDung = require('../models/NguoiDung');
const DangKyKhoaHoc = require('../models/DangKyKhoaHoc');
const BuoiHoc = require('../models/BuoiHoc');
const moment = require('moment');
const {
  isWithinCheckInWindow,
  windowStatus,
  pickBestEligibleSession,
} = require('../utils/attendanceWindow');

function displayMaHocVien(hocvienId) {
  const s = hocvienId.toString();
  return s.slice(-6).toUpperCase();
}

async function findSessionsForHocVienToday(hocvienId, now) {
  const dangKys = await DangKyKhoaHoc.find({ hocvienId }).lean();
  if (!dangKys.length) {
    return { dangKys: [], rows: [], eligibleRows: [] };
  }

  const courseIds = dangKys.map((d) => d.KhoaHocID);
  const dayStart = moment(now).startOf('day').toDate();
  const dayEnd = moment(now).endOf('day').toDate();

  const buois = await BuoiHoc.find({
    KhoaHocID: { $in: courseIds },
    ngayhoc: { $gte: dayStart, $lte: dayEnd },
  })
    .populate('KhoaHocID', 'tenkhoahoc')
    .lean();

  const dkByCourse = {};
  dangKys.forEach((dk) => {
    dkByCourse[dk.KhoaHocID.toString()] = dk;
  });

  const rows = buois
    .map((buoi) => {
      const cid =
        buoi.KhoaHocID && buoi.KhoaHocID._id
          ? buoi.KhoaHocID._id.toString()
          : buoi.KhoaHocID.toString();
      const dk = dkByCourse[cid];
      if (!dk) return null;
      const ws = windowStatus(now, buoi.giobatdau);
      const eligible = isWithinCheckInWindow(now, buoi.giobatdau);
      return {
        buoi,
        dangkykhoahoc: dk,
        windowStatus: ws,
        eligible,
      };
    })
    .filter(Boolean);

  const eligibleRows = rows.filter((r) => r.eligible);
  return { dangKys, rows, eligibleRows };
}

/**
 * Từ kết quả Python (hoặc hocvienId đã biết) → payload JSON như kioskRecognize HTTP.
 * @param {string} hocvienId
 * @param {{ distance?: number }} [meta]
 */
async function buildRecognizePayloadFromHocVienId(hocvienId, meta = {}) {
  const hv = await HocVien.findById(hocvienId).select('userId').lean();
  if (!hv) {
    return {
      success: true,
      recognized: false,
      message: 'Không tìm thấy học viên',
    };
  }

  const user = await NguoiDung.findById(hv.userId).select('hovaten email').lean();

  const { rows, eligibleRows } = await findSessionsForHocVienToday(
    new mongoose.Types.ObjectId(hocvienId),
    new Date()
  );

  const best = pickBestEligibleSession(eligibleRows, new Date());

  let sessionPayload = null;
  let windowState = 'no_class_today';

  if (best) {
    const late = moment().isAfter(moment(best.buoi.giobatdau));
    sessionPayload = {
      buoiHocId: best.buoi._id.toString(),
      dangkykhoahocId: best.dangkykhoahoc._id.toString(),
      tenkhoahoc:
        (best.buoi.KhoaHocID && best.buoi.KhoaHocID.tenkhoahoc) || '',
      giobatdau: best.buoi.giobatdau,
      gioketthuc: best.buoi.gioketthuc,
      late,
    };
    windowState = 'eligible';
  } else if (rows.length) {
    const future = rows.filter((r) => r.windowStatus === 'too_early');
    const past = rows.filter((r) => r.windowStatus === 'too_late');
    if (future.length) windowState = 'too_early';
    else if (past.length) windowState = 'too_late';
    else windowState = 'no_class_today';
  }

  return {
    success: true,
    recognized: true,
    match: {
      hocvienId,
      userId: hv.userId.toString(),
      hovaten: user?.hovaten || '',
      email: user?.email || '',
      maHocVienDisplay: displayMaHocVien(hv._id),
      distance: meta.distance != null ? meta.distance : 0,
    },
    session: sessionPayload,
    windowStatus: windowState,
    canConfirm: windowState === 'eligible' && !!sessionPayload,
  };
}

/**
 * Map phản hồi Python → payload kiosk.
 */
async function mapPythonRecognizeToKioskPayload(py) {
  if (!py || py.success === false) {
    return {
      success: false,
      recognized: false,
      message: py?.message || 'Lỗi dịch vụ nhận diện',
    };
  }

  if (!py.liveness_ok) {
    const msg =
      py.reason === 'insufficient_face_frames'
        ? 'Đứng yên trước camera — cần thấy rõ khuôn mặt'
        : py.reason === 'liveness_low_texture'
          ? 'Không xác nhận được người thật — thử chỗ sáng hơn'
          : 'Không xác nhận được người thật';
    return {
      success: true,
      recognized: false,
      message: msg,
    };
  }

  if (py.reason === 'cooldown') {
    return {
      success: true,
      recognized: false,
      message: 'Đang xử lý — đợi vài giây',
    };
  }

  if (!py.recognized || !py.hocvienId) {
    return {
      success: true,
      recognized: false,
      message: 'Không khớp khuôn mặt đã đăng ký',
    };
  }

  return buildRecognizePayloadFromHocVienId(py.hocvienId, {
    distance: py.distance,
  });
}

module.exports = {
  buildRecognizePayloadFromHocVienId,
  mapPythonRecognizeToKioskPayload,
  findSessionsForHocVienToday,
};
