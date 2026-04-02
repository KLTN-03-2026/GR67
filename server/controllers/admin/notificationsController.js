const mongoose = require("mongoose");

const NguoiDung = require("../../models/NguoiDung");
const KhoaHoc = require("../../models/KhoaHoc");
const GiangVien = require("../../models/GiangVien");
const HocVien = require("../../models/HocVien");
const DangKyKhoaHoc = require("../../models/DangKyKhoaHoc");

const ThongBao = require("../../models/ThongBao");
const File = require("../../models/File");

function toRoleArray(input) {
  if (!input) return ["student", "teacher"];
  if (Array.isArray(input)) return input;
  // Accept comma-separated string: "student,teacher"
  if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
  return ["student", "teacher"];
}

function normalizeTargetType(value) {
  const v = String(value || "").trim();
  if (v === "all" || v === "class" || v === "personal") return v;
  return null;
}

// POST /api/admin/notifications/send
// Supports multipart/form-data with attachments field name: "files"
exports.sendNotification = async (req, res) => {
  try {
    const {
      targetType,
      khoaHocId,
      recipientQuery,
      roles,
      tieuDe,
      noidung,
    } = req.body || {};

    const normalizedTargetType = normalizeTargetType(targetType);
    if (!normalizedTargetType) {
      return res.status(400).json({ success: false, message: "targetType không hợp lệ" });
    }
    if (!noidung || !String(noidung).trim()) {
      return res.status(400).json({ success: false, message: "noidung là bắt buộc" });
    }

    const roleList = toRoleArray(roles);
    const allowedRoles = new Set(["student", "teacher"]);
    const finalRoles = roleList.filter((r) => allowedRoles.has(r));
    if (finalRoles.length === 0) {
      return res.status(400).json({ success: false, message: "roles không hợp lệ" });
    }

    // 1) Upload attachments -> File docs
    const reqFiles = Array.isArray(req.files) ? req.files : [];
    const fileDocs = reqFiles.length
      ? await File.insertMany(
          reqFiles.map((f) => ({
            url: `/uploads/${f.filename}`,
            originalName: f.originalname,
            type: f.mimetype,
            size: f.size,
          })),
        )
      : [];

    const fileIds = fileDocs.length ? fileDocs.map((f) => f._id) : undefined;

    // 2) Resolve recipients (userIds)
    const userIdSet = new Set();
    const addUsers = (ids) => {
      for (const id of ids || []) {
        if (!id) continue;
        userIdSet.add(String(id));
      }
    };

    if (normalizedTargetType === "all") {
      const users = await NguoiDung.find({
        role: { $in: finalRoles },
        trangThaiHoatDong: true,
      })
        .select("_id")
        .lean();
      addUsers(users.map((u) => u._id));
    }

    if (normalizedTargetType === "class") {
      if (!khoaHocId || !mongoose.Types.ObjectId.isValid(khoaHocId)) {
        return res.status(400).json({ success: false, message: "khoaHocId không hợp lệ" });
      }

      // students: enrollments -> HocVien -> userId
      const enrollRows = await DangKyKhoaHoc.find({ KhoaHocID: khoaHocId })
        .populate({
          path: "hocvienId",
          select: "userId",
          populate: { path: "userId", select: "_id role" },
        })
        .select("hocvienId")
        .lean();

      const studentUserIds = enrollRows
        .map((r) => r.hocvienId?.userId?._id)
        .filter(Boolean);

      // teacher: KhoaHoc.giangvien -> GiangVien.userId
      let teacherUserIds = [];
      if (finalRoles.includes("teacher")) {
        const course = await KhoaHoc.findById(khoaHocId)
          .populate({
            path: "giangvien",
            select: "userId",
            populate: { path: "userId", select: "_id role" },
          })
          .select("giangvien")
          .lean();

        teacherUserIds = [course?.giangvien?.userId?._id].filter(Boolean);
      }

      if (finalRoles.includes("student")) addUsers(studentUserIds);
      if (finalRoles.includes("teacher")) addUsers(teacherUserIds);
    }

    if (normalizedTargetType === "personal") {
      if (!recipientQuery || !String(recipientQuery).trim()) {
        return res
          .status(400)
          .json({ success: false, message: "recipientQuery là bắt buộc khi targetType=personal" });
      }

      const q = String(recipientQuery).trim();
      const email = q.includes("@") ? q.toLowerCase() : null;
      const regex = new RegExp(q, "i");

      const users = await NguoiDung.find({
        role: { $in: finalRoles },
        trangThaiHoatDong: true,
        $or: email
          ? [{ email }, { hovaten: regex }]
          : [{ hovaten: regex }],
      })
        .select("_id")
        .lean();

      addUsers(users.map((u) => u._id));
    }

    const recipientUserIds = [...userIdSet].map((id) => new mongoose.Types.ObjectId(id));
    if (recipientUserIds.length === 0) {
      return res.status(200).json({ success: true, message: "Không có người nhận phù hợp", count: 0 });
    }

    const payload = {
      userID: recipientUserIds,
      noidung: String(noidung).trim(),
      // Backward-compat: boolean cũ
      trangthaidoc: false,
      readByUserIds: [],
      tieuDe: tieuDe ? String(tieuDe).trim() : undefined,
      createdBy: req.user?._id,
      createdByAdminId: req.user?._id,
      targetType: normalizedTargetType,
      khoaHocId: normalizedTargetType === "class" ? new mongoose.Types.ObjectId(khoaHocId) : undefined,
      fileIds,
    };

    await ThongBao.create(payload);

    return res.status(201).json({
      success: true,
      message: "Gửi thông báo thành công (lưu nội bộ)",
      count: recipientUserIds.length,
    });
  } catch (error) {
    console.error("sendNotification error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/admin/notifications
// List notifications (receipt-level, one row per recipient)
exports.listNotifications = async (req, res) => {
  try {
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;
    const page = Number.isFinite(Number(pageRaw)) ? Math.max(1, Number(pageRaw)) : 1;
    const limit = Number.isFinite(Number(limitRaw)) ? Math.max(1, Math.min(100, Number(limitRaw))) : 20;

    const targetType = req.query.targetType ? String(req.query.targetType) : undefined;
    const khoaHocId = req.query.khoaHocId ? String(req.query.khoaHocId) : undefined;
    const q = req.query.q ? String(req.query.q).trim() : "";

    const onlyMine = req.query.onlyMine !== "false";

    const filter = {};
    const andConditions = [];
    if (onlyMine) {
      andConditions.push({ $or: [{ createdBy: req.user?._id }, { createdByAdminId: req.user?._id }] });
    }
    if (targetType && ["all", "class", "personal"].includes(targetType)) filter.targetType = targetType;
    if (khoaHocId && mongoose.Types.ObjectId.isValid(khoaHocId)) filter.khoaHocId = new mongoose.Types.ObjectId(khoaHocId);
    if (q) {
      const regex = new RegExp(q, "i");
      andConditions.push({ $or: [{ noidung: regex }, { tieuDe: regex }] });
    }
    if (andConditions.length > 0) filter.$and = andConditions;

    const [count, rows] = await Promise.all([
      ThongBao.countDocuments(filter),
      ThongBao.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        // Không populate userID để response nhẹ; frontend chỉ cần số lượng
        .populate("createdBy", "hovaten email role")
        .populate("khoaHocId", "tenkhoahoc")
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      count,
      data: rows,
    });
  } catch (error) {
    console.error("listNotifications error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/admin/notifications/:id
exports.getNotificationById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "id không hợp lệ" });
    }

    const onlyMine = req.query.onlyMine !== "false";
    const filter = { _id: new mongoose.Types.ObjectId(id) };
    if (onlyMine) filter.$or = [{ createdBy: req.user?._id }, { createdByAdminId: req.user?._id }];

    const row = await ThongBao.findOne(filter)
      .populate("createdBy", "hovaten email role")
      .populate("khoaHocId", "tenkhoahoc")
      .lean();

    if (!row) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    return res.status(200).json({ success: true, data: row });
  } catch (error) {
    console.error("getNotificationById error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PATCH /api/admin/notifications/:id
exports.updateNotification = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "id không hợp lệ" });
    }

    const { tieuDe, noidung } = req.body || {};

    const update = {};
    if (tieuDe !== undefined) update.tieuDe = tieuDe ? String(tieuDe).trim() : undefined;
    if (noidung !== undefined) {
      const content = String(noidung).trim();
      if (!content) return res.status(400).json({ success: false, message: "noidung không được rỗng" });
      update.noidung = content;
    }
    // Không cập nhật trạng thái đã đọc ở phần admin CRUD hiện tại.

    const updated = await ThongBao.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), $or: [{ createdBy: req.user?._id }, { createdByAdminId: req.user?._id }] },
      update,
      { new: true }
    )
      .populate("createdBy", "hovaten email role")
      .populate("khoaHocId", "tenkhoahoc")
      .lean();

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateNotification error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /api/admin/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "id không hợp lệ" });
    }

    const deleted = await ThongBao.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      $or: [{ createdBy: req.user?._id }, { createdByAdminId: req.user?._id }],
    });
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });

    return res.status(200).json({ success: true, message: "Đã xóa thông báo" });
  } catch (error) {
    console.error("deleteNotification error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

