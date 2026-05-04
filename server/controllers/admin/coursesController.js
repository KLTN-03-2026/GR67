const mongoose = require("mongoose");

const KhoaHoc = require("../../models/KhoaHoc");
const LoaiKhoaHoc = require("../../models/LoaiKhoaHoc");
const BaiHoc = require("../../models/BaiHoc");
const BuoiHoc = require("../../models/BuoiHoc");
const Phonghoc = require("../../models/Phonghoc");
const GiangVien = require("../../models/GiangVien");
const ThamGiaBuoiHoc = require("../../models/ThamGiaBuoiHoc");
const HocBuDeXuat = require("../../models/HocBuDeXuat");
const DangKyKhoaHoc = require("../../models/DangKyKhoaHoc");
const HocVien = require("../../models/HocVien");
const Coso = require("../../models/Coso");

function asObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "object" && value !== null) {
    // Accept payloads like { _id: "..." } from inconsistent clients.
    if (value._id) return asObjectId(value._id);
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

async function resolveTeacherId(teacherInput) {
  const rawId = asObjectId(teacherInput);
  if (!rawId) return null;

  // 1) Preferred: input is GiangVien._id
  const byTeacherId = await GiangVien.findById(rawId).select("_id").lean();
  if (byTeacherId?._id) return byTeacherId._id;

  // 2) Compatibility: input is NguoiDung._id (teacher account)
  const byUserId = await GiangVien.findOne({ userId: rawId }).select("_id").lean();
  if (byUserId?._id) return byUserId._id;

  return null;
}

function startOfDayLocal(d) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
}

function parseHHmm(hhmm) {
  if (typeof hhmm !== "string") return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  return { hh: Number(m[1]), mm: Number(m[2]) };
}

function combineDateAndTime(dateOnly, hhmm) {
  const p = parseHHmm(hhmm);
  if (!p) return null;
  return new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    p.hh,
    p.mm,
    0,
    0
  );
}

const THU_TEN_VI = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

function formatHHmmFromDate(dateObj) {
  const d = new Date(dateObj);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatNgayDdMmYyyy(dateVal) {
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeLichHoc(lichHoc) {
  const items = Array.isArray(lichHoc) ? lichHoc : [];
  return items
    .filter(Boolean)
    .map((it) => ({
      thu: Number(it.thu),
      gioBatDau: String(it.gioBatDau || ""),
      gioKetThuc: String(it.gioKetThuc || ""),
      phonghoc: it.phonghoc,
    }));
}

function validateLichHocBasic(lichHoc) {
  const items = normalizeLichHoc(lichHoc);
  if (items.length === 0) return { ok: false, message: "Cần có ít nhất một ca học trong lịch khóa." };

  const seenThu = new Set();
  for (const it of items) {
    if (!Number.isInteger(it.thu) || it.thu < 0 || it.thu > 6) {
      return { ok: false, message: "Thứ trong tuần phải từ 0 (Chủ nhật) đến 6 (Thứ bảy)." };
    }
    if (seenThu.has(it.thu)) {
      return { ok: false, message: "Trong một khóa học, mỗi thứ chỉ được đặt một ca học." };
    }
    seenThu.add(it.thu);

    const startTime = parseHHmm(it.gioBatDau);
    const endTime = parseHHmm(it.gioKetThuc);
    if (!startTime || !endTime) {
      return { ok: false, message: "Giờ bắt đầu và giờ kết thúc phải đúng dạng 24 giờ (ví dụ 18:30)." };
    }
    const startMinutes = startTime.hh * 60 + startTime.mm;
    const endMinutes = endTime.hh * 60 + endTime.mm;
    if (startMinutes >= endMinutes) {
      return { ok: false, message: "Giờ bắt đầu phải sớm hơn giờ kết thúc trong cùng một ca." };
    }

    const roomId = asObjectId(it.phonghoc);
    if (!roomId) {
      return { ok: false, message: "Vui lòng chọn phòng học hợp lệ cho mỗi ca trong lịch." };
    }
  }

  return { ok: true, items };
}

function normalizeLichHocForCompare(items) {
  return (Array.isArray(items) ? items : [])
    .map((it) => ({
      thu: Number(it.thu),
      gioBatDau: String(it.gioBatDau || ""),
      gioKetThuc: String(it.gioKetThuc || ""),
      phonghoc: String(asObjectId(it.phonghoc) || ""),
    }))
    .sort((a, b) => a.thu - b.thu);
}

function isSameLichHoc(a, b) {
  const na = normalizeLichHocForCompare(a);
  const nb = normalizeLichHocForCompare(b);
  if (na.length !== nb.length) return false;
  for (let i = 0; i < na.length; i += 1) {
    if (
      na[i].thu !== nb[i].thu ||
      na[i].gioBatDau !== nb[i].gioBatDau ||
      na[i].gioKetThuc !== nb[i].gioKetThuc ||
      na[i].phonghoc !== nb[i].phonghoc
    ) {
      return false;
    }
  }
  return true;
}

function generateProposedSessions({ ngaykhaigiang, lichHocItems, lessons }) {
  const startDate = startOfDayLocal(ngaykhaigiang);
  const byThu = new Map();
  for (const it of lichHocItems) byThu.set(it.thu, it);

  const sessions = [];
  let cursor = new Date(startDate);
  let i = 0;

  // Duyệt ngày cho tới khi tạo đủ số buổi = số bài
  while (i < lessons.length) {
    const thu = cursor.getDay(); // 0=CN ... 6=T7
    const cfg = byThu.get(thu);
    if (cfg) {
      const giobatdau = combineDateAndTime(cursor, cfg.gioBatDau);
      const gioketthuc = combineDateAndTime(cursor, cfg.gioKetThuc);
      sessions.push({
        ngayhoc: startOfDayLocal(cursor),
        giobatdau,
        gioketthuc,
        phonghoc: asObjectId(cfg.phonghoc),
        BaiHocID: lessons[i]._id,
        meta: {
          thu,
          gioBatDau: cfg.gioBatDau,
          gioKetThuc: cfg.gioKetThuc,
        },
      });
      i += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return sessions;
}

async function ensureRefsExist({ LoaiKhoaHocID, giangvien, lichHocItems }) {
  const [ct, gv] = await Promise.all([
    LoaiKhoaHoc.findById(LoaiKhoaHocID).select("_id").lean(),
    GiangVien.findById(giangvien).select("_id").lean(),
  ]);
  if (!ct) return { ok: false, message: "Loại khóa học được chọn không tồn tại trong hệ thống." };
  if (!gv) return { ok: false, message: "Giảng viên được chọn không tồn tại trong hệ thống." };

  const roomIds = [...new Set(lichHocItems.map((it) => String(asObjectId(it.phonghoc))))].map((s) =>
    new mongoose.Types.ObjectId(s)
  );
  const roomsCount = await Phonghoc.countDocuments({ _id: { $in: roomIds } });
  if (roomsCount !== roomIds.length) return { ok: false, message: "Có ít nhất một phòng học trong lịch không tồn tại hoặc đã bị xóa." };

  return { ok: true };
}

/** Mọi phòng trong lịch phải thuộc đúng cơ sở đã chọn; cơ sở phải tồn tại và đang hoạt động. */
async function ensureCoSoAndRoomsMatch(coSoId, lichHocItems) {
  const cid = asObjectId(coSoId);
  if (!cid) {
    return { ok: false, message: "Vui lòng chọn cơ sở cho khóa học." };
  }
  const coso = await Coso.findById(cid).select("_id trangThaiHoatDong").lean();
  if (!coso) return { ok: false, message: "Cơ sở được chọn không tồn tại." };
  if (coso.trangThaiHoatDong === false) {
    return { ok: false, message: "Cơ sở đã ngừng hoạt động, không thể dùng cho khóa học." };
  }

  const roomIds = [...new Set(lichHocItems.map((it) => String(asObjectId(it.phonghoc))))].map(
    (s) => new mongoose.Types.ObjectId(s)
  );
  const rooms = await Phonghoc.find({ _id: { $in: roomIds } }).select("_id CoSoId").lean();
  if (rooms.length !== roomIds.length) {
    return { ok: false, message: "Có ít nhất một phòng học trong lịch không tồn tại hoặc đã bị xóa." };
  }
  const expect = String(cid);
  for (const r of rooms) {
    if (String(r.CoSoId) !== expect) {
      return { ok: false, message: "Mọi phòng trong lịch phải thuộc cơ sở đã chọn." };
    }
  }
  return { ok: true };
}

async function inferCoSoFromLichHocItems(lichHocItems) {
  if (!Array.isArray(lichHocItems) || lichHocItems.length === 0) return null;
  const roomIds = [...new Set(lichHocItems.map((it) => String(asObjectId(it.phonghoc))))].map(
    (s) => new mongoose.Types.ObjectId(s)
  );
  if (roomIds.length === 0) return null;
  const rooms = await Phonghoc.find({ _id: { $in: roomIds } }).select("CoSoId").lean();
  if (rooms.length !== roomIds.length) return null;
  const first = String(rooms[0].CoSoId);
  if (rooms.some((r) => String(r.CoSoId) !== first)) return null;
  return asObjectId(first);
}

async function resolveCourseCoSoIdForSession(courseLean) {
  const direct = asObjectId(courseLean.CoSoId);
  if (direct) return direct;
  return inferCoSoFromLichHocItems(courseLean.lichHoc || []);
}

async function ensureSessionRoomMatchesCourseCoSo(courseLean, roomId) {
  const expectedCoSo = await resolveCourseCoSoIdForSession(courseLean);
  if (!expectedCoSo) {
    return {
      ok: false,
      message:
        "Khóa học chưa gán cơ sở — hãy cập nhật khóa học, chọn cơ sở và lưu lịch trước khi thêm/sửa buổi học.",
    };
  }
  const room = await Phonghoc.findById(roomId).select("CoSoId").lean();
  if (!room) return { ok: false, message: "Phòng học không tồn tại." };
  if (String(room.CoSoId) !== String(expectedCoSo)) {
    return { ok: false, message: "Phòng học phải thuộc cùng cơ sở với khóa học." };
  }
  return { ok: true };
}

async function attachInferredCoSoToCourseLean(item) {
  if (!item || item.CoSoId) return item;
  const lh = item.lichHoc;
  if (!Array.isArray(lh) || lh.length === 0) return item;
  const phId = asObjectId(lh[0].phonghoc);
  if (!phId) return item;
  const ph = await Phonghoc.findById(phId).select("CoSoId").lean();
  if (!ph?.CoSoId) return item;
  const inf = await Coso.findById(ph.CoSoId).select("Tencoso").lean();
  if (inf) {
    item.CoSoId = { _id: inf._id, Tencoso: inf.Tencoso };
  } else {
    item.CoSoId = ph.CoSoId;
  }
  return item;
}

async function computeCourseCapacityFromSchedule(lichHocItems) {
  const roomIds = [...new Set(lichHocItems.map((it) => String(asObjectId(it.phonghoc))))].map(
    (s) => new mongoose.Types.ObjectId(s)
  );
  const rooms = await Phonghoc.find({ _id: { $in: roomIds } }).select("_id succhua").lean();
  if (rooms.length !== roomIds.length) return null;
  const capacities = rooms.map((r) => Number(r.succhua)).filter((n) => Number.isFinite(n) && n > 0);
  if (capacities.length !== rooms.length) return null;
  return Math.min(...capacities);
}

async function fetchLessonsForCourseType(LoaiKhoaHocID) {
  return BaiHoc.find({ LoaiKhoaHoc: LoaiKhoaHocID })
    .sort({ thutu: 1, createdAt: 1 })
    .select("_id thutu tenbai")
    .lean();
}

function overlapsStrict(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

async function findScheduleConflicts({ proposedSessions, giangvienId, ignoreCourseId }) {
  if (proposedSessions.length === 0) return [];

  const minStart = proposedSessions.reduce(
    (min, s) => (s.giobatdau < min ? s.giobatdau : min),
    proposedSessions[0].giobatdau
  );
  const maxEnd = proposedSessions.reduce(
    (max, s) => (s.gioketthuc > max ? s.gioketthuc : max),
    proposedSessions[0].gioketthuc
  );

  const roomIds = [...new Set(proposedSessions.map((s) => String(s.phonghoc)))].map(
    (s) => new mongoose.Types.ObjectId(s)
  );

  const matchTime = {
    giobatdau: { $lt: maxEnd },
    gioketthuc: { $gt: minStart },
  };

  const pipeline = [
    { $match: matchTime },
    {
      $lookup: {
        from: "khoahocs",
        localField: "KhoaHocID",
        foreignField: "_id",
        as: "khoaHoc",
      },
    },
    { $unwind: "$khoaHoc" },
  ];

  if (ignoreCourseId) {
    pipeline.push({ $match: { "khoaHoc._id": { $ne: ignoreCourseId } } });
  }

  pipeline.push({
    $match: {
      $or: [{ phonghoc: { $in: roomIds } }, { "khoaHoc.giangvien": giangvienId }],
    },
  });

  pipeline.push({
    $project: {
      _id: 1,
      KhoaHocID: 1,
      BaiHocID: 1,
      ngayhoc: 1,
      giobatdau: 1,
      gioketthuc: 1,
      phonghoc: 1,
      "khoaHoc.giangvien": 1,
    },
  });

  const existing = await BuoiHoc.aggregate(pipeline);

  // Map về conflicts cụ thể từng proposed session để UI báo rõ
  const conflicts = [];
  for (const p of proposedSessions) {
    for (const e of existing) {
      if (!overlapsStrict(p.giobatdau, p.gioketthuc, e.giobatdau, e.gioketthuc)) continue;
      const sameRoom = String(p.phonghoc) === String(e.phonghoc);
      const sameTeacher = String(giangvienId) === String(e.khoaHoc.giangvien);
      if (!(sameRoom || sameTeacher)) continue;

      const lyDo =
        sameRoom && sameTeacher
          ? "Trùng phòng học và trùng giảng viên"
          : sameRoom
          ? "Trùng phòng học"
          : "Trùng lịch giảng viên";
      const thuTen = THU_TEN_VI[p.meta.thu] ?? `Thứ (mã ${p.meta.thu})`;
      const ngayDeXuat = formatNgayDdMmYyyy(p.ngayhoc);
      const gioBd = formatHHmmFromDate(p.giobatdau);
      const gioKt = formatHHmmFromDate(p.gioketthuc);
      const ngayDaCo = formatNgayDdMmYyyy(e.ngayhoc);
      const gioBdB = formatHHmmFromDate(e.giobatdau);
      const gioKtB = formatHHmmFromDate(e.gioketthuc);
      const tomTat = `${lyDo}. Ca đang đăng ký: ${thuTen}, ngày ${ngayDeXuat}, từ ${gioBd} đến ${gioKt}. Ca đã có trong hệ thống: ngày ${ngayDaCo}, từ ${gioBdB} đến ${gioKtB}.`;

      conflicts.push({
        lyDo,
        tomTat,
        caDangKy: {
          thuTrongTuan: thuTen,
          ngay: ngayDeXuat,
          tuGio: gioBd,
          denGio: gioKt,
        },
        buoiTrung: {
          ngay: ngayDaCo,
          tuGio: gioBdB,
          denGio: gioKtB,
        },
        proposed: {
          ngayhoc: p.ngayhoc,
          giobatdau: p.giobatdau,
          gioketthuc: p.gioketthuc,
          phonghoc: p.phonghoc,
          thu: p.meta.thu,
        },
        existing: {
          buoiHocId: e._id,
          khoaHocId: e.KhoaHocID,
          ngayhoc: e.ngayhoc,
          giobatdau: e.giobatdau,
          gioketthuc: e.gioketthuc,
          phonghoc: e.phonghoc,
          giangvien: e.khoaHoc.giangvien,
        },
      });
    }
  }

  return conflicts;
}

/**
 * Kiểm tra khi đổi giảng viên cho khóa học:
 * Với mỗi buổi học tương lai của khóa, xét giảng viên mới có buổi dạy nào
 * ở cơ sở KHÁC trong khoảng 1 tiếng trước / sau không.
 * (gọi là "trung chuyển không kịp").
 * @returns {{ ok: boolean, conflicts: Array }}
 */
async function checkTeacherCrossLocationConflict({ newTeacherId, courseId, courseCoSoId }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Lấy tất cả buổi tương lai của khóa hiện tại
  const upcomingSessions = await BuoiHoc.find({
    KhoaHocID: courseId,
    ngayhoc: { $gte: todayStart },
  })
    .select("_id ngayhoc giobatdau gioketthuc phonghoc")
    .lean();

  if (upcomingSessions.length === 0) return { ok: true, conflicts: [] };

  const oneHour = 60 * 60 * 1000; // ms

  const minStart = upcomingSessions.reduce((m, s) => (s.giobatdau < m ? s.giobatdau : m), upcomingSessions[0].giobatdau);
  const maxEnd   = upcomingSessions.reduce((m, s) => (s.gioketthuc > m ? s.gioketthuc : m), upcomingSessions[0].gioketthuc);

  // Mở rộng window thêm 1h mỗi phía để bắt các buổi kề cạnh
  const searchFrom = new Date(minStart.getTime() - oneHour);
  const searchTo   = new Date(maxEnd.getTime()   + oneHour);

  const otherSessions = await BuoiHoc.aggregate([
    {
      $match: {
        KhoaHocID: { $ne: courseId },
        giobatdau: { $lt: searchTo },
        gioketthuc: { $gt: searchFrom },
      },
    },
    {
      $lookup: {
        from: "khoahocs",
        localField: "KhoaHocID",
        foreignField: "_id",
        as: "khoaHoc",
      },
    },
    { $unwind: "$khoaHoc" },
    // Chỉ lấy buổi có giảng viên là giảng viên mới
    { $match: { "khoaHoc.giangvien": newTeacherId } },
    {
      $lookup: {
        from: "phonghocs",
        localField: "phonghoc",
        foreignField: "_id",
        as: "phongDoc",
      },
    },
    { $unwind: { path: "$phongDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        KhoaHocID: 1,
        "khoaHoc.tenkhoahoc": 1,
        ngayhoc: 1,
        giobatdau: 1,
        gioketthuc: 1,
        phonghoc: 1,
        "phongDoc.CoSoId": 1,
      },
    },
  ]);

  const targetCoSoStr = String(courseCoSoId);
  const crossConflicts = [];

  for (const upSess of upcomingSessions) {
    for (const other of otherSessions) {
      const otherCoSoStr = String(other.phongDoc?.CoSoId || "");
      // Chỉ cảnh báo khi cơ sở KHÁC
      if (otherCoSoStr === targetCoSoStr) continue;

      // Khoảng cách giữa 2 buổi < 1 tiếng?
      const gap = Math.min(
        Math.abs(new Date(upSess.giobatdau).getTime() - new Date(other.gioketthuc).getTime()),
        Math.abs(new Date(other.giobatdau).getTime() - new Date(upSess.gioketthuc).getTime())
      );

      if (gap < oneHour) {
        crossConflicts.push({
          buoiHocKhoaHienTai: {
            _id: upSess._id,
            ngayhoc: formatNgayDdMmYyyy(upSess.ngayhoc),
            tuGio: formatHHmmFromDate(upSess.giobatdau),
            denGio: formatHHmmFromDate(upSess.gioketthuc),
          },
          buoiHocKhoaKhac: {
            _id: other._id,
            khoaHocId: other.KhoaHocID,
            tenkhoahoc: other.khoaHoc?.tenkhoahoc || "",
            ngayhoc: formatNgayDdMmYyyy(other.ngayhoc),
            tuGio: formatHHmmFromDate(other.giobatdau),
            denGio: formatHHmmFromDate(other.gioketthuc),
          },
          gapMinutes: Math.round(gap / 60000),
        });
      }
    }
  }

  if (crossConflicts.length > 0) {
    return { ok: false, conflicts: crossConflicts };
  }
  return { ok: true, conflicts: [] };
}

async function suggestStartDates({ baseStartDate, lichHocItems, lessons, giangvienId, ignoreCourseId, limit = 5 }) {
  const suggestions = [];
  const maxLookaheadDays = 90;

  let cursor = startOfDayLocal(baseStartDate);
  for (let step = 0; step <= maxLookaheadDays && suggestions.length < limit; step++) {
    if (step > 0) cursor.setDate(cursor.getDate() + 1);
    const proposed = generateProposedSessions({ ngaykhaigiang: cursor, lichHocItems, lessons });
    const conflicts = await findScheduleConflicts({ proposedSessions: proposed, giangvienId, ignoreCourseId });
    if (conflicts.length === 0) {
      suggestions.push(new Date(cursor));
    }
  }

  return suggestions;
}

async function getLockedSessionIds(courseId) {
  const sessions = await BuoiHoc.find({ KhoaHocID: courseId }).select("_id ngayhoc").lean();
  const sessionIds = sessions.map((s) => s._id);
  if (sessionIds.length === 0) return new Set();

  const todayStart = startOfDayLocal(new Date());
  const lockedByPast = sessions
    .filter((s) => new Date(s.ngayhoc) < todayStart)
    .map((s) => String(s._id));

  const leaveOrRequestRows = await ThamGiaBuoiHoc.find({
    $and: [
      { $or: [{ buoihocID: { $in: sessionIds } }, { buoihoc_hocbu: { $in: sessionIds } }] },
      { $or: [{ trangthai: { $in: ["excused", "makeup"] } }, { trangthai_duyet: { $in: ["pending", "approved"] } }] },
    ],
  })
    .select("buoihocID buoihoc_hocbu")
    .lean();

  const lockedByRequests = leaveOrRequestRows.flatMap((r) => [
    r.buoihocID ? String(r.buoihocID) : null,
    r.buoihoc_hocbu ? String(r.buoihoc_hocbu) : null,
  ]);

  const hocBuRows = await HocBuDeXuat.find({ buoihocID: { $in: sessionIds } }).select("buoihocID").lean();
  const lockedByHocBu = hocBuRows.map((r) => String(r.buoihocID));

  return new Set([...lockedByPast, ...lockedByRequests, ...lockedByHocBu].filter(Boolean));
}

async function getSessionLockReasonMap(courseId) {
  const sessions = await BuoiHoc.find({ KhoaHocID: courseId }).select("_id ngayhoc BaiHocID giobatdau gioketthuc phonghoc").sort({ giobatdau: 1 }).lean();
  const sessionIds = sessions.map((s) => s._id);
  const todayStart = startOfDayLocal(new Date());
  const reasonMap = new Map();

  for (const s of sessions) {
    if (new Date(s.ngayhoc) < todayStart) reasonMap.set(String(s._id), "before_today");
  }
  if (sessionIds.length === 0) return { sessions, reasonMap };

  const requestRows = await ThamGiaBuoiHoc.find({
    $and: [
      { $or: [{ buoihocID: { $in: sessionIds } }, { buoihoc_hocbu: { $in: sessionIds } }] },
      { $or: [{ trangthai: { $in: ["excused", "makeup"] } }, { trangthai_duyet: { $in: ["pending", "approved"] } }] },
    ],
  })
    .select("buoihocID buoihoc_hocbu")
    .lean();

  for (const row of requestRows) {
    const a = row.buoihocID ? String(row.buoihocID) : null;
    const b = row.buoihoc_hocbu ? String(row.buoihoc_hocbu) : null;
    if (a && !reasonMap.has(a)) reasonMap.set(a, "has_request");
    if (b && !reasonMap.has(b)) reasonMap.set(b, "has_request");
  }

  const hocBuRows = await HocBuDeXuat.find({ buoihocID: { $in: sessionIds } }).select("buoihocID").lean();
  for (const row of hocBuRows) {
    const sid = String(row.buoihocID);
    if (!reasonMap.has(sid)) reasonMap.set(sid, "has_request");
  }

  return { sessions, reasonMap };
}

function getNextDateForThu(afterDate, thu) {
  const d = startOfDayLocal(afterDate);
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== thu) d.setDate(d.getDate() + 1);
  return d;
}

function buildProposedSessionForConflict({ ngayhoc, gioBatDau, gioKetThuc, phonghoc, BaiHocID }) {
  const dateOnly = startOfDayLocal(ngayhoc);
  const giobatdau = combineDateAndTime(dateOnly, gioBatDau);
  const gioketthuc = combineDateAndTime(dateOnly, gioKetThuc);
  return {
    ngayhoc: dateOnly,
    giobatdau,
    gioketthuc,
    phonghoc: asObjectId(phonghoc),
    BaiHocID,
    meta: { thu: dateOnly.getDay(), gioBatDau, gioKetThuc },
  };
}

// GET /api/admin/courses
exports.listCourses = async (req, res) => {
  try {
    const { LoaiKhoaHocID, giangvien, from, to, CoSoId, year, month } = req.query;
    const query = {};
    if (LoaiKhoaHocID && mongoose.Types.ObjectId.isValid(LoaiKhoaHocID)) query.LoaiKhoaHocID = LoaiKhoaHocID;
    if (giangvien && mongoose.Types.ObjectId.isValid(giangvien)) query.giangvien = giangvien;
    if (CoSoId && mongoose.Types.ObjectId.isValid(CoSoId)) query.CoSoId = new mongoose.Types.ObjectId(CoSoId);

    const yearNum = year !== undefined && String(year).trim() !== "" ? parseInt(String(year), 10) : NaN;
    const monthNum = month !== undefined && String(month).trim() !== "" ? parseInt(String(month), 10) : NaN;

    if (Number.isFinite(yearNum) && yearNum >= 1970 && yearNum <= 2100) {
      query.ngaykhaigiang = {};
      if (Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const start = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
        const end = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);
        query.ngaykhaigiang.$gte = start;
        query.ngaykhaigiang.$lt = end;
      } else {
        const start = new Date(yearNum, 0, 1, 0, 0, 0, 0);
        const end = new Date(yearNum + 1, 0, 1, 0, 0, 0, 0);
        query.ngaykhaigiang.$gte = start;
        query.ngaykhaigiang.$lt = end;
      }
    } else if (from || to) {
      query.ngaykhaigiang = {};
      if (from) query.ngaykhaigiang.$gte = new Date(from);
      if (to) query.ngaykhaigiang.$lte = new Date(to);
    }

    const list = await KhoaHoc.find(query)
      .sort({ createdAt: -1 })
      .populate("CoSoId", "Tencoso")
      .populate("LoaiKhoaHocID", "Tenloai")
      .populate({
        path: "giangvien",
        select: "_id userId",
        populate: { path: "userId", select: "hovaten email" },
      })
      .lean();

    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// GET /api/admin/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });
    const item = await KhoaHoc.findById(courseId)
      .populate("CoSoId", "Tencoso")
      .populate("LoaiKhoaHocID", "Tenloai mota ChungChi")
      .populate({
        path: "giangvien",
        select: "_id userId",
        populate: { path: "userId", select: "hovaten email" },
      })
      .lean();
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    await attachInferredCoSoToCourseLean(item);

    const buoiCount = await BuoiHoc.countDocuments({ KhoaHocID: item._id });
    const { sessions, reasonMap } = await getSessionLockReasonMap(item._id);
    const buoiHoc = sessions.map((s) => ({
      ...s,
      isLocked: reasonMap.has(String(s._id)),
      lockReason: reasonMap.get(String(s._id)) || null,
    }));
    res.status(200).json({ success: true, data: { ...item, buoiCount, buoiHoc } });
  } catch (error) {
    console.error("Lỗi lấy chi tiết khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// POST /api/admin/courses/validate-schedule
exports.validateSchedule = async (req, res) => {
  try {
    const { LoaiKhoaHocID, ngaykhaigiang, giangvien, lichHoc, ignoreCourseId, CoSoId: bodyCoSoId } = req.body;

    const courseTypeId = asObjectId(LoaiKhoaHocID);
    const teacherId = await resolveTeacherId(giangvien);
    const ignoreId = asObjectId(ignoreCourseId);
    if (!courseTypeId) return res.status(400).json({ success: false, message: "Mã loại khóa học không hợp lệ hoặc thiếu." });
    if (!teacherId) return res.status(400).json({ success: false, message: "Giảng viên được chọn không hợp lệ hoặc không tồn tại." });
    const start = new Date(ngaykhaigiang);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ success: false, message: "Ngày khai giảng không hợp lệ." });

    const lichCheck = validateLichHocBasic(lichHoc);
    if (!lichCheck.ok) return res.status(400).json({ success: false, message: lichCheck.message });
    const lichHocItems = lichCheck.items;

    const refs = await ensureRefsExist({ LoaiKhoaHocID: courseTypeId, giangvien: teacherId, lichHocItems });
    if (!refs.ok) return res.status(400).json({ success: false, message: refs.message });

    let coSoForValidate = asObjectId(bodyCoSoId);
    if (!coSoForValidate) coSoForValidate = await inferCoSoFromLichHocItems(lichHocItems);
    if (!coSoForValidate) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn cơ sở cho khóa học." });
    }
    const cosoCheck = await ensureCoSoAndRoomsMatch(coSoForValidate, lichHocItems);
    if (!cosoCheck.ok) return res.status(400).json({ success: false, message: cosoCheck.message });
    const soHocVienToiDa = await computeCourseCapacityFromSchedule(lichHocItems);
    if (!soHocVienToiDa) {
      return res.status(400).json({ success: false, message: "Không thể xác định sức chứa tối đa từ danh sách phòng học" });
    }

    const lessons = await fetchLessonsForCourseType(courseTypeId);
    if (lessons.length === 0) {
      return res.status(400).json({ success: false, message: "Loại khóa học chưa có bài học, không thể tạo lịch" });
    }

    const proposed = generateProposedSessions({ ngaykhaigiang: start, lichHocItems, lessons });
    const conflicts = await findScheduleConflicts({
      proposedSessions: proposed,
      giangvienId: teacherId,
      ignoreCourseId: ignoreId,
    });

    const suggestedStartDates =
      conflicts.length === 0
        ? []
        : await suggestStartDates({
            baseStartDate: start,
            lichHocItems,
            lessons,
            giangvienId: teacherId,
            ignoreCourseId: ignoreId,
          });

    res.status(200).json({
      success: true,
      data: {
        lessonCount: lessons.length,
        soHocVienToiDa,
        conflicts,
        suggestedStartDates,
      },
    });
  } catch (error) {
    console.error("Lỗi validate lịch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// POST /api/admin/courses
exports.createCourse = async (req, res) => {
  try {
    const { LoaiKhoaHocID, tenkhoahoc, ngaykhaigiang, giangvien, lichHoc, CoSoId: bodyCoSoId } = req.body;

    const courseTypeId = asObjectId(LoaiKhoaHocID);
    const teacherId = await resolveTeacherId(giangvien);
    if (!courseTypeId) return res.status(400).json({ success: false, message: "Mã loại khóa học không hợp lệ hoặc thiếu." });
    if (!teacherId) return res.status(400).json({ success: false, message: "Giảng viên được chọn không hợp lệ hoặc không tồn tại." });
    const name = (tenkhoahoc || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Vui lòng nhập tên khóa học." });

    const existingName = await KhoaHoc.findOne({ 
      tenkhoahoc: { $regex: new RegExp("^" + name + "$", "i") } 
    });
    if (existingName) {
      return res.status(400).json({ success: false, message: "Tên khóa học đã tồn tại" });
    }

    const start = new Date(ngaykhaigiang);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ success: false, message: "Ngày khai giảng không hợp lệ." });

    const lichCheck = validateLichHocBasic(lichHoc);
    if (!lichCheck.ok) return res.status(400).json({ success: false, message: lichCheck.message });
    const lichHocItems = lichCheck.items;

    const refs = await ensureRefsExist({ LoaiKhoaHocID: courseTypeId, giangvien: teacherId, lichHocItems });
    if (!refs.ok) return res.status(400).json({ success: false, message: refs.message });

    const coSoOid = asObjectId(bodyCoSoId);
    if (!coSoOid) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn cơ sở cho khóa học." });
    }
    const cosoCheckCreate = await ensureCoSoAndRoomsMatch(coSoOid, lichHocItems);
    if (!cosoCheckCreate.ok) return res.status(400).json({ success: false, message: cosoCheckCreate.message });

    const soHocVienToiDa = await computeCourseCapacityFromSchedule(lichHocItems);
    if (!soHocVienToiDa) {
      return res.status(400).json({ success: false, message: "Không thể xác định sức chứa tối đa từ danh sách phòng học" });
    }

    const lessons = await fetchLessonsForCourseType(courseTypeId);
    if (lessons.length === 0) {
      return res.status(400).json({ success: false, message: "Loại khóa học chưa có bài học, không thể tạo khóa học" });
    }

    const proposed = generateProposedSessions({ ngaykhaigiang: start, lichHocItems, lessons });
    const conflicts = await findScheduleConflicts({ proposedSessions: proposed, giangvienId: teacherId });
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Lịch học bị trùng: phòng hoặc giảng viên đã có buổi trùng khung giờ. Vui lòng đổi phòng, giờ học hoặc ngày khai giảng.",
        data: { conflicts },
      });
    }

    // ── Kiểm tra trung chuyển không kịp (< 1 tiếng, cơ sở khác) ───────────────
    {
      const oneHour = 60 * 60 * 1000;
      const minStart = proposed.reduce((m, s) => (s.giobatdau < m ? s.giobatdau : m), proposed[0].giobatdau);
      const maxEnd   = proposed.reduce((m, s) => (s.gioketthuc > m ? s.gioketthuc : m), proposed[0].gioketthuc);
      const searchFrom = new Date(minStart.getTime() - oneHour);
      const searchTo   = new Date(maxEnd.getTime()   + oneHour);

      const otherSessionsCreate = await BuoiHoc.aggregate([
        {
          $match: {
            giobatdau: { $lt: searchTo },
            gioketthuc: { $gt: searchFrom },
          },
        },
        {
          $lookup: {
            from: "khoahocs",
            localField: "KhoaHocID",
            foreignField: "_id",
            as: "khoaHoc",
          },
        },
        { $unwind: "$khoaHoc" },
        { $match: { "khoaHoc.giangvien": teacherId } },
        {
          $lookup: {
            from: "phonghocs",
            localField: "phonghoc",
            foreignField: "_id",
            as: "phongDoc",
          },
        },
        { $unwind: { path: "$phongDoc", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            KhoaHocID: 1,
            "khoaHoc.tenkhoahoc": 1,
            ngayhoc: 1,
            giobatdau: 1,
            gioketthuc: 1,
            "phongDoc.CoSoId": 1,
          },
        },
      ]);

      const coSoStr = String(coSoOid);
      const crossConflictsCreate = [];

      for (const p of proposed) {
        for (const other of otherSessionsCreate) {
          const otherCoSoStr = String(other.phongDoc?.CoSoId || "");
          if (otherCoSoStr === coSoStr) continue; // cùng cơ sở — không cần lo

          const gap = Math.min(
            Math.abs(new Date(p.giobatdau).getTime() - new Date(other.gioketthuc).getTime()),
            Math.abs(new Date(other.giobatdau).getTime() - new Date(p.gioketthuc).getTime())
          );

          if (gap < oneHour) {
            crossConflictsCreate.push({
              buoiDuKien: {
                ngayhoc: formatNgayDdMmYyyy(p.ngayhoc),
                tuGio: formatHHmmFromDate(p.giobatdau),
                denGio: formatHHmmFromDate(p.gioketthuc),
              },
              buoiHocKhoaKhac: {
                _id: other._id,
                khoaHocId: other.KhoaHocID,
                tenkhoahoc: other.khoaHoc?.tenkhoahoc || "",
                ngayhoc: formatNgayDdMmYyyy(other.ngayhoc),
                tuGio: formatHHmmFromDate(other.giobatdau),
                denGio: formatHHmmFromDate(other.gioketthuc),
              },
              gapMinutes: Math.round(gap / 60000),
            });
          }
        }
      }

      if (crossConflictsCreate.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Không thể tạo khóa học: trong vòng 1 tiếng trước hoặc sau một số buổi học dự kiến, " +
            "giảng viên được chọn đang phải dạy ở cơ sở khác — không đủ thời gian di chuyển.",
          data: { crossLocationConflicts: crossConflictsCreate },
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────────────

    const created = await KhoaHoc.create({
      CoSoId: coSoOid,
      LoaiKhoaHocID: courseTypeId,
      tenkhoahoc: name,
      ngaykhaigiang: start,
      giangvien: teacherId,
      soHocVienToiDa,
      lichHoc: lichHocItems,
    });

    const conflictsBeforeInsert = await findScheduleConflicts({ proposedSessions: proposed, giangvienId: teacherId });
    if (conflictsBeforeInsert.length > 0) {
      await KhoaHoc.findByIdAndDelete(created._id);
      return res.status(409).json({
        success: false,
        message:
          "Lịch học bị trùng: phòng hoặc giảng viên đã có buổi trùng khung giờ. Vui lòng đổi phòng, giờ học hoặc ngày khai giảng.",
        data: { conflicts: conflictsBeforeInsert },
      });
    }

    try {
      const buoiDocs = proposed.map((p) => ({
        KhoaHocID: created._id,
        BaiHocID: p.BaiHocID,
        ngayhoc: p.ngayhoc,
        giobatdau: p.giobatdau,
        gioketthuc: p.gioketthuc,
        phonghoc: p.phonghoc,
      }));

      await BuoiHoc.insertMany(buoiDocs, { ordered: true });
    } catch (e) {
      await KhoaHoc.findByIdAndDelete(created._id);
      throw e;
    }

    const populated = await KhoaHoc.findById(created._id)
      .populate("CoSoId", "Tencoso")
      .populate("LoaiKhoaHocID", "Tenloai")
      .populate({
        path: "giangvien",
        select: "_id userId",
        populate: { path: "userId", select: "hovaten email" },
      })
      .lean();

    res.status(201).json({ success: true, message: "Tạo khóa học thành công", data: populated || created });
  } catch (error) {
    console.error("Lỗi tạo khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// PUT /api/admin/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const existingCourse = await KhoaHoc.findById(courseId);
    if (!existingCourse) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    const {
      LoaiKhoaHocID = existingCourse.LoaiKhoaHocID,
      tenkhoahoc = existingCourse.tenkhoahoc,
      ngaykhaigiang = existingCourse.ngaykhaigiang,
      giangvien = existingCourse.giangvien,
      lichHoc = existingCourse.lichHoc,
      CoSoId: bodyCoSoId,
    } = req.body || {};

    const courseTypeId = asObjectId(LoaiKhoaHocID);
    const teacherId = await resolveTeacherId(giangvien);
    if (!courseTypeId) return res.status(400).json({ success: false, message: "Mã loại khóa học không hợp lệ hoặc thiếu." });
    if (!teacherId) return res.status(400).json({ success: false, message: "Giảng viên được chọn không hợp lệ hoặc không tồn tại." });

    const name = (tenkhoahoc || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Vui lòng nhập tên khóa học." });

    const existingName = await KhoaHoc.findOne({ 
      tenkhoahoc: { $regex: new RegExp("^" + name + "$", "i") },
      _id: { $ne: courseId }
    });
    if (existingName) {
      return res.status(400).json({ success: false, message: "Tên khóa học đã tồn tại" });
    }

    const start = new Date(ngaykhaigiang);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ success: false, message: "Ngày khai giảng không hợp lệ." });

    const lichCheck = validateLichHocBasic(lichHoc);
    if (!lichCheck.ok) return res.status(400).json({ success: false, message: lichCheck.message });
    const lichHocItems = lichCheck.items;

    const refs = await ensureRefsExist({ LoaiKhoaHocID: courseTypeId, giangvien: teacherId, lichHocItems });
    if (!refs.ok) return res.status(400).json({ success: false, message: refs.message });

    let resolvedCoSoId = asObjectId(bodyCoSoId) || asObjectId(existingCourse.CoSoId);
    if (!resolvedCoSoId) {
      resolvedCoSoId = await inferCoSoFromLichHocItems(lichHocItems);
    }
    if (!resolvedCoSoId) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn cơ sở cho khóa học." });
    }
    const cosoCheckUpdate = await ensureCoSoAndRoomsMatch(resolvedCoSoId, lichHocItems);
    if (!cosoCheckUpdate.ok) return res.status(400).json({ success: false, message: cosoCheckUpdate.message });

    const soHocVienToiDa = await computeCourseCapacityFromSchedule(lichHocItems);
    if (!soHocVienToiDa) {
      return res.status(400).json({ success: false, message: "Không thể xác định sức chứa tối đa từ danh sách phòng học" });
    }
    const currentStudentCount = await DangKyKhoaHoc.countDocuments({ KhoaHocID: courseId });
    if (currentStudentCount > soHocVienToiDa) {
      return res.status(409).json({
        success: false,
        message: `Không thể cập nhật: số học viên hiện tại (${currentStudentCount}) vượt quá sức chứa tối đa mới (${soHocVienToiDa}).`,
      });
    }

    // ── Kiểm tra khi đổi giảng viên ────────────────────────────────────────────
    const teacherChanged = String(existingCourse.giangvien) !== String(teacherId);
    if (teacherChanged) {
      // 1) Lấy các buổi tương lai của khóa này để kiểm tra trùng lịch
      const todayStartCheck = new Date();
      todayStartCheck.setHours(0, 0, 0, 0);
      const futureSessions = await BuoiHoc.find({
        KhoaHocID: courseId,
        ngayhoc: { $gte: todayStartCheck },
      })
        .select("_id ngayhoc giobatdau gioketthuc phonghoc BaiHocID")
        .lean();

      if (futureSessions.length > 0) {
        // Dựng proposed sessions từ các buổi thực tế (không phải lịch đề xuất)
        const proposedFromExisting = futureSessions.map((s) => ({
          ngayhoc: s.ngayhoc,
          giobatdau: s.giobatdau,
          gioketthuc: s.gioketthuc,
          phonghoc: s.phonghoc,
          BaiHocID: s.BaiHocID,
          meta: {
            thu: new Date(s.ngayhoc).getDay(),
            gioBatDau: formatHHmmFromDate(s.giobatdau),
            gioKetThuc: formatHHmmFromDate(s.gioketthuc),
          },
        }));

        // 1a) Kiểm tra trùng lịch giảng viên mới (trùng giờ với khóa khác)
        const teacherConflicts = await findScheduleConflicts({
          proposedSessions: proposedFromExisting,
          giangvienId: teacherId,
          ignoreCourseId: courseId,
        });
        if (teacherConflicts.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              "Không thể đổi giảng viên: giảng viên mới đã có lịch dạy trùng với các buổi học của khóa này.",
            data: { conflicts: teacherConflicts },
          });
        }

        // 1b) Kiểm tra trong vòng 1 tiếng — giảng viên mới dạy ở cơ sở khác
        const crossCheck = await checkTeacherCrossLocationConflict({
          newTeacherId: teacherId,
          courseId,
          courseCoSoId: resolvedCoSoId,
        });
        if (!crossCheck.ok) {
          return res.status(409).json({
            success: false,
            message:
              "Không thể đổi giảng viên: trong vòng 1 tiếng trước hoặc sau một số buổi học của khóa này, " +
              "giảng viên được chọn đang phải dạy ở cơ sở khác — không đủ thời gian di chuyển.",
            data: { crossLocationConflicts: crossCheck.conflicts },
          });
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────────

    const scheduleChanged =
      String(startOfDayLocal(existingCourse.ngaykhaigiang)) !== String(startOfDayLocal(start)) ||
      !isSameLichHoc(existingCourse.lichHoc || [], lichHocItems) ||
      String(existingCourse.LoaiKhoaHocID) !== String(courseTypeId);

    if (scheduleChanged) {
      const lessons = await fetchLessonsForCourseType(courseTypeId);
      if (lessons.length === 0) {
        return res.status(400).json({ success: false, message: "Loại khóa học chưa có bài học, không thể tạo lịch" });
      }

      const existingSessions = await BuoiHoc.find({ KhoaHocID: courseId }).select("_id BaiHocID").lean();
      const lockedSessionIds = await getLockedSessionIds(courseId);
      const hasLockedSessions = lockedSessionIds.size > 0;
      if (hasLockedSessions && String(existingCourse.LoaiKhoaHocID) !== String(courseTypeId)) {
        return res.status(409).json({
          success: false,
          message: "Không thể đổi loại khóa học khi đã có buổi học quá khứ hoặc phát sinh đơn xin nghỉ/học bù/xin vào học.",
        });
      }

      const proposed = generateProposedSessions({ ngaykhaigiang: start, lichHocItems, lessons });
      const mutableProposed = hasLockedSessions
        ? proposed.filter((p) => {
            const existed = existingSessions.find((e) => String(e.BaiHocID) === String(p.BaiHocID));
            return existed && !lockedSessionIds.has(String(existed._id));
          })
        : proposed;

      const conflicts = await findScheduleConflicts({ proposedSessions: mutableProposed, giangvienId: teacherId, ignoreCourseId: courseId });
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Lịch học bị trùng: phòng hoặc giảng viên đã có buổi trùng khung giờ. Vui lòng đổi phòng, giờ học hoặc ngày khai giảng.",
          data: { conflicts },
        });
      }

      // Cập nhật khóa học
      existingCourse.CoSoId = resolvedCoSoId;
      existingCourse.LoaiKhoaHocID = courseTypeId;
      existingCourse.tenkhoahoc = name;
      existingCourse.ngaykhaigiang = start;
      existingCourse.giangvien = teacherId;
      existingCourse.soHocVienToiDa = soHocVienToiDa;
      existingCourse.lichHoc = lichHocItems;
      await existingCourse.save();

      if (!hasLockedSessions) {
        await BuoiHoc.deleteMany({ KhoaHocID: courseId });
        const buoiDocs = proposed.map((p) => ({
          KhoaHocID: courseId,
          BaiHocID: p.BaiHocID,
          ngayhoc: p.ngayhoc,
          giobatdau: p.giobatdau,
          gioketthuc: p.gioketthuc,
          phonghoc: p.phonghoc,
        }));
        await BuoiHoc.insertMany(buoiDocs, { ordered: true });
      } else {
        const proposedByLessonId = new Map(proposed.map((p) => [String(p.BaiHocID), p]));
        const mutableSessionIds = [];
        const bulkOps = [];
        for (const existingSession of existingSessions) {
          const id = String(existingSession._id);
          if (lockedSessionIds.has(id)) continue;
          const next = proposedByLessonId.get(String(existingSession.BaiHocID));
          if (!next) {
            return res.status(409).json({
              success: false,
              message: "Không thể cập nhật lịch vì cấu trúc buổi học hiện tại không còn tương thích.",
            });
          }
          mutableSessionIds.push(id);
          bulkOps.push({
            updateOne: {
              filter: { _id: existingSession._id },
              update: {
                $set: {
                  ngayhoc: next.ngayhoc,
                  giobatdau: next.giobatdau,
                  gioketthuc: next.gioketthuc,
                  phonghoc: next.phonghoc,
                },
              },
            },
          });
        }
        if (bulkOps.length > 0) await BuoiHoc.bulkWrite(bulkOps, { ordered: true });
      }
    } else {
      existingCourse.CoSoId = resolvedCoSoId;
      existingCourse.tenkhoahoc = name;
      existingCourse.giangvien = teacherId;
      existingCourse.soHocVienToiDa = soHocVienToiDa;
      await existingCourse.save();
    }

    const populated = await KhoaHoc.findById(courseId)
      .populate("CoSoId", "Tencoso")
      .populate("LoaiKhoaHocID", "Tenloai")
      .populate({
        path: "giangvien",
        select: "_id userId",
        populate: { path: "userId", select: "hovaten email" },
      })
      .lean();

    res.status(200).json({ success: true, message: "Cập nhật khóa học thành công", data: populated || existingCourse });
  } catch (error) {
    console.error("Lỗi cập nhật khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// GET /api/admin/courses/:id/students
exports.listCourseStudents = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const course = await KhoaHoc.findById(courseId).select("_id tenkhoahoc").lean();
    if (!course) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    const rows = await DangKyKhoaHoc.find({ KhoaHocID: courseId })
      .populate({
        path: "hocvienId",
        select: "_id userId",
        populate: { path: "userId", select: "hovaten email soDienThoai" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = rows.map((r) => ({
      enrollmentId: r._id,
      hocvienId: r.hocvienId?._id || null,
      userId: r.hocvienId?.userId?._id || null,
      hovaten: r.hocvienId?.userId?.hovaten || "",
      email: r.hocvienId?.userId?.email || "",
      soDienThoai: r.hocvienId?.userId?.soDienThoai || "",
      so_ngay_nghi: r.so_ngay_nghi || 0,
      createdAt: r.createdAt,
    }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Lỗi lấy danh sách học viên theo khóa:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// POST /api/admin/courses/:id/students
exports.addStudentToCourse = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });
    const { hocvienId, userId } = req.body || {};

    const course = await KhoaHoc.findById(courseId).select("_id soHocVienToiDa").lean();
    if (!course) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    let hocVien = null;
    if (hocvienId) hocVien = await HocVien.findById(hocvienId).select("_id userId").lean();
    if (!hocVien && userId) hocVien = await HocVien.findOne({ userId: asObjectId(userId) }).select("_id userId").lean();
    if (!hocVien)
      return res.status(400).json({
        success: false,
        message: "Mã học viên hoặc tài khoản người dùng không hợp lệ.",
      });

    const existed = await DangKyKhoaHoc.findOne({ hocvienId: hocVien._id, KhoaHocID: courseId }).select("_id").lean();
    if (existed) return res.status(409).json({ success: false, message: "Học viên đã có trong khóa học" });
    const currentCount = await DangKyKhoaHoc.countDocuments({ KhoaHocID: courseId });
    const maxCount = Number(course.soHocVienToiDa || 0);
    if (maxCount > 0 && currentCount >= maxCount) {
      return res.status(409).json({
        success: false,
        message: `Khóa học đã đạt số học viên tối đa (${maxCount}).`,
      });
    }

    const created = await DangKyKhoaHoc.create({ hocvienId: hocVien._id, KhoaHocID: courseId });
    const populated = await DangKyKhoaHoc.findById(created._id).populate({
      path: "hocvienId",
      select: "_id userId",
      populate: { path: "userId", select: "hovaten email soDienThoai" },
    });

    res.status(201).json({
      success: true,
      message: "Thêm học viên vào khóa học thành công",
      data: {
        enrollmentId: populated._id,
        hocvienId: populated.hocvienId?._id || null,
        userId: populated.hocvienId?.userId?._id || null,
        hovaten: populated.hocvienId?.userId?.hovaten || "",
        email: populated.hocvienId?.userId?.email || "",
        soDienThoai: populated.hocvienId?.userId?.soDienThoai || "",
        so_ngay_nghi: populated.so_ngay_nghi || 0,
      },
    });
  } catch (error) {
    console.error("Lỗi thêm học viên vào khóa:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /api/admin/courses/:id/students/:enrollmentId
exports.removeStudentFromCourse = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    const enrollmentId = asObjectId(req.params.enrollmentId);
    if (!courseId || !enrollmentId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const deleted = await DangKyKhoaHoc.findOneAndDelete({ _id: enrollmentId, KhoaHocID: courseId });
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy học viên trong khóa học" });

    res.status(200).json({ success: true, message: "Gỡ học viên khỏi khóa học thành công" });
  } catch (error) {
    console.error("Lỗi gỡ học viên khỏi khóa:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// POST /api/admin/courses/:id/sessions
exports.addCourseSession = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const course = await KhoaHoc.findById(courseId).select("_id giangvien CoSoId lichHoc").lean();
    if (!course) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    const { ngayhoc, gioBatDau, gioKetThuc, phonghoc, BaiHocID } = req.body || {};
    const p = parseHHmm(gioBatDau);
    const e = parseHHmm(gioKetThuc);
    if (!p || !e)
      return res.status(400).json({ success: false, message: "Giờ bắt đầu hoặc giờ kết thúc không hợp lệ." });
    if (p.hh * 60 + p.mm >= e.hh * 60 + e.mm) {
      return res.status(400).json({ success: false, message: "Giờ bắt đầu phải sớm hơn giờ kết thúc." });
    }
    const roomId = asObjectId(phonghoc);
    const lessonId = asObjectId(BaiHocID);
    if (!roomId || !lessonId)
      return res.status(400).json({
        success: false,
        message: "Phòng học hoặc bài học được chọn không hợp lệ.",
      });
    const dateOnly = startOfDayLocal(ngayhoc);
    if (Number.isNaN(dateOnly.getTime())) return res.status(400).json({ success: false, message: "Ngày diễn ra buổi học không hợp lệ." });

    const roomCoSoCheck = await ensureSessionRoomMatchesCourseCoSo(course, roomId);
    if (!roomCoSoCheck.ok) return res.status(400).json({ success: false, message: roomCoSoCheck.message });

    const proposed = buildProposedSessionForConflict({ ngayhoc: dateOnly, gioBatDau, gioKetThuc, phonghoc: roomId, BaiHocID: lessonId });
    const conflicts = await findScheduleConflicts({ proposedSessions: [proposed], giangvienId: asObjectId(course.giangvien), ignoreCourseId: courseId });
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Không thể thêm buổi học vì bị trùng lịch phòng hoặc giảng viên.",
        data: { conflicts },
      });
    }

    const created = await BuoiHoc.create({
      KhoaHocID: courseId,
      BaiHocID: lessonId,
      ngayhoc: proposed.ngayhoc,
      giobatdau: proposed.giobatdau,
      gioketthuc: proposed.gioketthuc,
      phonghoc: roomId,
    });
    res.status(201).json({ success: true, message: "Thêm buổi học thành công", data: created });
  } catch (error) {
    console.error("Lỗi thêm buổi học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// PUT /api/admin/courses/:id/sessions/:sessionId
exports.updateCourseSession = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    const sessionId = asObjectId(req.params.sessionId);
    if (!courseId || !sessionId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const course = await KhoaHoc.findById(courseId).select("_id giangvien CoSoId lichHoc").lean();
    if (!course) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    const lockMap = await getSessionLockReasonMap(courseId);
    if (lockMap.reasonMap.has(String(sessionId))) {
      return res.status(409).json({ success: false, message: "Buổi học này đang bị khóa chỉnh sửa" });
    }

    const existing = await BuoiHoc.findOne({ _id: sessionId, KhoaHocID: courseId });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy buổi học" });

    const { ngayhoc, gioBatDau, gioKetThuc, phonghoc } = req.body || {};
    const nextDate = ngayhoc ? startOfDayLocal(ngayhoc) : startOfDayLocal(existing.ngayhoc);
    const startStr = gioBatDau || formatHHmmFromDate(existing.giobatdau);
    const endStr = gioKetThuc || formatHHmmFromDate(existing.gioketthuc);
    const roomId = asObjectId(phonghoc) || existing.phonghoc;

    const p = parseHHmm(startStr);
    const e = parseHHmm(endStr);
    if (!p || !e)
      return res.status(400).json({ success: false, message: "Giờ bắt đầu hoặc giờ kết thúc không hợp lệ." });
    if (p.hh * 60 + p.mm >= e.hh * 60 + e.mm) {
      return res.status(400).json({ success: false, message: "Giờ bắt đầu phải sớm hơn giờ kết thúc." });
    }

    const roomCoSoCheckUpd = await ensureSessionRoomMatchesCourseCoSo(course, roomId);
    if (!roomCoSoCheckUpd.ok) return res.status(400).json({ success: false, message: roomCoSoCheckUpd.message });

    const proposed = buildProposedSessionForConflict({
      ngayhoc: nextDate,
      gioBatDau: startStr,
      gioKetThuc: endStr,
      phonghoc: roomId,
      BaiHocID: existing.BaiHocID,
    });
    const conflicts = await findScheduleConflicts({ proposedSessions: [proposed], giangvienId: asObjectId(course.giangvien), ignoreCourseId: courseId });
    const selfOnly = conflicts.filter((c) => String(c.existing?.buoiHocId) !== String(sessionId));
    if (selfOnly.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Không thể cập nhật buổi học vì bị trùng lịch phòng hoặc giảng viên.",
        data: { conflicts: selfOnly },
      });
    }

    existing.ngayhoc = proposed.ngayhoc;
    existing.giobatdau = proposed.giobatdau;
    existing.gioketthuc = proposed.gioketthuc;
    existing.phonghoc = roomId;
    await existing.save();
    res.status(200).json({ success: true, message: "Cập nhật buổi học thành công", data: existing });
  } catch (error) {
    console.error("Lỗi cập nhật buổi học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /api/admin/courses/:id/sessions/:sessionId
exports.deleteCourseSession = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    const sessionId = asObjectId(req.params.sessionId);
    if (!courseId || !sessionId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const course = await KhoaHoc.findById(courseId).select("_id giangvien lichHoc").lean();
    if (!course) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    const { sessions, reasonMap } = await getSessionLockReasonMap(courseId);
    const ordered = [...sessions].sort((a, b) => new Date(a.giobatdau) - new Date(b.giobatdau));
    const idx = ordered.findIndex((s) => String(s._id) === String(sessionId));
    if (idx < 0) return res.status(404).json({ success: false, message: "Không tìm thấy buổi học" });
    if (reasonMap.has(String(sessionId))) return res.status(409).json({ success: false, message: "Buổi học này đang bị khóa, không thể xóa" });
    if (idx === ordered.length - 1) return res.status(400).json({ success: false, message: "Không thể xóa buổi cuối cùng" });

    for (let i = idx + 1; i < ordered.length; i += 1) {
      if (reasonMap.has(String(ordered[i]._id))) {
        return res.status(409).json({
          success: false,
          message: "Không thể xóa vì có buổi phía sau đang bị khóa, không thể dồn bài học.",
        });
      }
    }

    const lastSession = ordered[ordered.length - 1];
    const deletedLessonId = ordered[idx].BaiHocID;
    const lastLessonId = lastSession.BaiHocID;

    // Shift lesson forward: next sessions inherit previous lesson
    let carryLessonId = deletedLessonId;
    const bulkOps = [];
    for (let i = idx + 1; i < ordered.length; i += 1) {
      const current = ordered[i];
      bulkOps.push({
        updateOne: { filter: { _id: current._id }, update: { $set: { BaiHocID: carryLessonId } } },
      });
      carryLessonId = current.BaiHocID;
    }
    if (bulkOps.length > 0) await BuoiHoc.bulkWrite(bulkOps, { ordered: true });

    // append new session at the end with old last lesson
    const sortedLichHoc = (course.lichHoc || []).map((l) => ({
      thu: Number(l.thu),
      gioBatDau: l.gioBatDau,
      gioKetThuc: l.gioKetThuc,
      phonghoc: asObjectId(l.phonghoc),
    }));
    const byThu = new Map(sortedLichHoc.map((x) => [x.thu, x]));
    const afterLast = new Date(lastSession.ngayhoc);
    let candidateDate = null;
    let candidateCfg = null;
    for (let step = 1; step <= 14; step += 1) {
      const d = startOfDayLocal(afterLast);
      d.setDate(d.getDate() + step);
      const cfg = byThu.get(d.getDay());
      if (cfg) {
        candidateDate = d;
        candidateCfg = cfg;
        break;
      }
    }
    if (!candidateDate || !candidateCfg) {
      return res.status(400).json({
        success: false,
        message: "Không thể tạo buổi bù cuối vì lịch cố định của khóa học không hợp lệ.",
      });
    }
    const appendedProposed = buildProposedSessionForConflict({
      ngayhoc: candidateDate,
      gioBatDau: candidateCfg.gioBatDau,
      gioKetThuc: candidateCfg.gioKetThuc,
      phonghoc: candidateCfg.phonghoc,
      BaiHocID: lastLessonId,
    });
    const conflicts = await findScheduleConflicts({
      proposedSessions: [appendedProposed],
      giangvienId: asObjectId(course.giangvien),
      ignoreCourseId: courseId,
    });
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Không thể xóa buổi học vì buổi bù cuối bị trùng lịch.",
        data: { conflicts },
      });
    }

    await BuoiHoc.deleteOne({ _id: sessionId, KhoaHocID: courseId });
    await BuoiHoc.create({
      KhoaHocID: courseId,
      BaiHocID: lastLessonId,
      ngayhoc: appendedProposed.ngayhoc,
      giobatdau: appendedProposed.giobatdau,
      gioketthuc: appendedProposed.gioketthuc,
      phonghoc: appendedProposed.phonghoc,
    });

    res.status(200).json({ success: true, message: "Xóa buổi học thành công, đã dồn bài học và thêm buổi mới cuối" });
  } catch (error) {
    console.error("Lỗi xóa buổi học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = asObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ success: false, message: "Tham số định danh không hợp lệ." });

    const existingCourse = await KhoaHoc.findById(courseId).select("_id").lean();
    if (!existingCourse) return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });

    const buoiIds = await BuoiHoc.find({ KhoaHocID: courseId }).distinct("_id");
    if (buoiIds.length > 0) {
      const count = await ThamGiaBuoiHoc.countDocuments({ buoihocID: { $in: buoiIds } });
      if (count > 0) {
        return res.status(409).json({
          success: false,
          message: "Khóa học đã phát sinh điểm danh/xin nghỉ. Không thể xóa khóa học.",
        });
      }
    }

    await BuoiHoc.deleteMany({ KhoaHocID: courseId });
    await KhoaHoc.findByIdAndDelete(courseId);

    res.status(200).json({ success: true, message: "Xóa khóa học thành công" });
  } catch (error) {
    console.error("Lỗi xóa khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

