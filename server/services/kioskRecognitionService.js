const mongoose = require('mongoose');
const HocVien = require('../models/HocVien');
const NguoiDung = require('../models/NguoiDung');
const DangKyKhoaHoc = require('../models/DangKyKhoaHoc');
const BuoiHoc = require('../models/BuoiHoc');
const moment = require('moment');
const {
  matchEncodingLocally,
  DEFAULT_THRESHOLD,
} = require('./attendancePythonClient');
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

  const rows = buois.map((buoi) => {
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
 * Từ vector probe (128) → cùng payload JSON như kioskRecognize HTTP.
 */
async function recognizeFromProbe(probe) {
  const hocViens = await HocVien.find({
    faceDescriptor: { $exists: true, $not: { $size: 0 } },
  })
    .select('userId faceDescriptor')
    .lean();

  const gallery = hocViens
    .filter((h) => Array.isArray(h.faceDescriptor) && h.faceDescriptor.length === 128)
    .map((h) => ({ id: h._id.toString(), encoding: h.faceDescriptor }));

  if (!gallery.length) {
    return {
      success: true,
      recognized: false,
      message: 'Chưa có học viên nào đăng ký khuôn mặt',
    };
  }

  const match = matchEncodingLocally(probe, gallery, DEFAULT_THRESHOLD);
  if (!match) {
    return {
      success: true,
      recognized: false,
      message: 'Không khớp khuôn mặt đã lưu',
    };
  }

  const hocvienId = match.id;
  const hv = hocViens.find((h) => h._id.toString() === hocvienId);
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
      distance: match.distance,
    },
    session: sessionPayload,
    windowStatus: windowState,
    canConfirm: windowState === 'eligible' && !!sessionPayload,
  };
}

module.exports = {
  recognizeFromProbe,
  findSessionsForHocVienToday,
};
