const mongoose = require("mongoose");
const LuyenTap = require("../../models/LuyenTap");
const LuyenTapItem = require("../../models/LuyenTapItem");

const BAI_LOAI_ALLOWED = ["flashcard", "quiz", "trueFalse", "shortAnswer", "multiSelect", "mixedNoFlashcard"];
const ITEM_LOAI_ALL = ["flashcard", "quiz", "trueFalse", "shortAnswer", "multiSelect"];
const ITEM_LOAI_MIXED_NO_FC = ["quiz", "trueFalse", "shortAnswer", "multiSelect"];

function itemLoaiAllowedForExercise(exLoaiBai, loaiItem) {
  if (exLoaiBai === "mixedNoFlashcard") return ITEM_LOAI_MIXED_NO_FC.includes(loaiItem);
  return loaiItem === exLoaiBai;
}

function asObjectId(value) {
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function normalizeEnum(value, allowed) {
  const v = String(value || "").trim();
  if (!v) return null;
  const vv = v;
  if (allowed.includes(vv)) return vv;
  return null;
}

// GET /api/admin/practice-exercises
exports.listPracticeExercises = async (req, res) => {
  try {
    const { khoaHocID, loaiBai, q } = req.query;
    const query = {};

    if (khoaHocID) {
      const id = asObjectId(khoaHocID);
      if (!id) return res.status(400).json({ success: false, message: "khoaHocID không hợp lệ." });
      query.khoaHocID = id;
    }

    if (loaiBai) {
      const lb = normalizeEnum(loaiBai, BAI_LOAI_ALLOWED);
      if (!lb) return res.status(400).json({ success: false, message: "loaiBai không hợp lệ." });
      query.loaiBai = lb;
    }

    if (q && String(q).trim()) {
      const qq = String(q).trim();
      query.$or = [{ tenBai: { $regex: qq, $options: "i" } }, { moTa: { $regex: qq, $options: "i" } }];
    }

    const list = await LuyenTap.find(query).sort({ createdAt: -1 }).populate("khoaHocID", "tenkhoahoc").lean();

    const withStats = await Promise.all(
      list.map(async (ex) => {
        const itemCount = await LuyenTapItem.countDocuments({ luyenTapID: ex._id });
        return { ...ex, itemCount };
      })
    );

    res.status(200).json({ success: true, count: withStats.length, data: withStats });
  } catch (error) {
    console.error("listPracticeExercises error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/practice-exercises
exports.createPracticeExercise = async (req, res) => {
  try {
    const { khoaHocID, tenBai, loaiBai, thoiGianLamBai, moTa } = req.body;
    let courseId = null;
    if (khoaHocID) {
      courseId = asObjectId(khoaHocID);
      if (!courseId) {
        return res.status(400).json({ success: false, message: "khoaHocID không hợp lệ." });
      }
    }
    if (!String(tenBai || "").trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập tên bài." });

    const lb = normalizeEnum(loaiBai, BAI_LOAI_ALLOWED);
    if (!lb) return res.status(400).json({ success: false, message: "loaiBai không hợp lệ." });

    const tg = thoiGianLamBai === undefined || thoiGianLamBai === null || thoiGianLamBai === ""
      ? 0
      : Number(thoiGianLamBai);
    if (!Number.isFinite(tg) || tg < 0) return res.status(400).json({ success: false, message: "thoiGianLamBai không hợp lệ." });

    const payload = {
      tenBai: String(tenBai).trim(),
      loaiBai: lb,
      thoiGianLamBai: tg,
      moTa: String(moTa || "").trim(),
    };
    if (courseId) {
      payload.khoaHocID = courseId;
    }

    const created = await LuyenTap.create(payload);

    res.status(201).json({ success: true, message: "Tạo bài luyện tập thành công!", data: created.toObject ? created.toObject() : created });
  } catch (error) {
    console.error("createPracticeExercise error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/admin/practice-exercises/:id
exports.getPracticeExerciseById = async (req, res) => {
  try {
    const exId = asObjectId(req.params.id);
    if (!exId) return res.status(400).json({ success: false, message: "id không hợp lệ." });

    const ex = await LuyenTap.findById(exId).populate("khoaHocID", "tenkhoahoc").lean();
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy bài." });

    const items = await LuyenTapItem.find({ luyenTapID: exId }).sort({ thuTu: 1 }).lean();
    res.status(200).json({ success: true, data: { ...ex, items } });
  } catch (error) {
    console.error("getPracticeExerciseById error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/admin/practice-exercises/:id
exports.updatePracticeExercise = async (req, res) => {
  try {
    const exId = asObjectId(req.params.id);
    if (!exId) return res.status(400).json({ success: false, message: "id không hợp lệ." });

    const update = {};
    if (req.body.tenBai !== undefined) update.tenBai = String(req.body.tenBai || "").trim();
    if (req.body.moTa !== undefined) update.moTa = String(req.body.moTa || "").trim();
    if (req.body.thoiGianLamBai !== undefined) update.thoiGianLamBai = Number(req.body.thoiGianLamBai);
    if (req.body.khoaHocID !== undefined) {
      if (req.body.khoaHocID === null || req.body.khoaHocID === "") {
        update.khoaHocID = undefined;
      } else {
        const courseId = asObjectId(req.body.khoaHocID);
        if (!courseId) return res.status(400).json({ success: false, message: "khoaHocID không hợp lệ." });
        update.khoaHocID = courseId;
      }
    }
    if (req.body.loaiBai !== undefined) {
      const lb = normalizeEnum(req.body.loaiBai, BAI_LOAI_ALLOWED);
      if (!lb) return res.status(400).json({ success: false, message: "loaiBai không hợp lệ." });
      update.loaiBai = lb;
    }

    if (update.tenBai !== undefined && !update.tenBai) return res.status(400).json({ success: false, message: "tenBai không hợp lệ." });
    if (update.thoiGianLamBai !== undefined && (!Number.isFinite(update.thoiGianLamBai) || update.thoiGianLamBai < 0)) {
      return res.status(400).json({ success: false, message: "thoiGianLamBai không hợp lệ." });
    }

    const updated = await LuyenTap.findByIdAndUpdate(exId, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy bài." });

    res.status(200).json({ success: true, message: "Cập nhật bài luyện tập thành công!", data: updated });
  } catch (error) {
    console.error("updatePracticeExercise error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/admin/practice-exercises/:id
exports.deletePracticeExercise = async (req, res) => {
  try {
    const exId = asObjectId(req.params.id);
    if (!exId) return res.status(400).json({ success: false, message: "id không hợp lệ." });

    await LuyenTapItem.deleteMany({ luyenTapID: exId });
    const deleted = await LuyenTap.findByIdAndDelete(exId);
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy bài." });

    res.status(200).json({ success: true, message: "Xóa bài luyện tập thành công!" });
  } catch (error) {
    console.error("deletePracticeExercise error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/practice-exercises/:exerciseId/items
exports.createPracticeExerciseItem = async (req, res) => {
  try {
    const exId = asObjectId(req.params.exerciseId);
    if (!exId) return res.status(400).json({ success: false, message: "exerciseId không hợp lệ." });

    const ex = await LuyenTap.findById(exId).lean();
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy bài luyện tập." });

    const thuTu = Number(req.body.thuTu);
    const loaiItem = String(req.body.loaiItem || "").trim();

    if (!Number.isFinite(thuTu) || thuTu < 1) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });
    if (!ITEM_LOAI_ALL.includes(loaiItem)) return res.status(400).json({ success: false, message: "loaiItem không hợp lệ." });
    if (!itemLoaiAllowedForExercise(ex.loaiBai, loaiItem)) {
      return res.status(400).json({
        success: false,
        message:
          ex.loaiBai === "mixedNoFlashcard"
            ? "Bài hỗn hợp chỉ cho phép item: quiz, multiSelect, trueFalse, shortAnswer (không flashcard)."
            : "loaiItem phải trùng loaiBai của bài.",
      });
    }

    const rawTf = req.body.dapAnDungBoolean;
    let parsedTf = null;
    if (rawTf === true || rawTf === "true") parsedTf = true;
    else if (rawTf === false || rawTf === "false") parsedTf = false;

    const itemPayload = {
      luyenTapID: exId,
      thuTu,
      loaiItem,
      noiDung: String(req.body.noiDung || ""),
      matTruoc: String(req.body.matTruoc || ""),
      matSau: String(req.body.matSau || ""),
      luaChon: Array.isArray(req.body.luaChon) ? req.body.luaChon : [],
      dapAnDungIndex: req.body.dapAnDungIndex === undefined ? null : Number(req.body.dapAnDungIndex),
      dapAnDungIndices: Array.isArray(req.body.dapAnDungIndices) ? req.body.dapAnDungIndices.map(Number) : [],
      dapAnDungBoolean: parsedTf,
      dapAnDungText: String(req.body.dapAnDungText || ""),
    };

    const created = await LuyenTapItem.create(itemPayload);
    res.status(201).json({ success: true, message: "Tạo item thành công!", data: created.toObject ? created.toObject() : created });
  } catch (error) {
    console.error("createPracticeExerciseItem error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/admin/practice-exercises/:exerciseId/items/:itemId
exports.updatePracticeExerciseItem = async (req, res) => {
  try {
    const exId = asObjectId(req.params.exerciseId);
    const itemId = asObjectId(req.params.itemId);
    if (!exId || !itemId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const ex = await LuyenTap.findById(exId).lean();
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy bài luyện tập." });

    const update = {};
    if (req.body.thuTu !== undefined) update.thuTu = Number(req.body.thuTu);
    if (req.body.noiDung !== undefined) update.noiDung = String(req.body.noiDung || "");
    if (req.body.matTruoc !== undefined) update.matTruoc = String(req.body.matTruoc || "");
    if (req.body.matSau !== undefined) update.matSau = String(req.body.matSau || "");
    if (req.body.luaChon !== undefined) update.luaChon = Array.isArray(req.body.luaChon) ? req.body.luaChon : [];
    if (req.body.dapAnDungIndex !== undefined) update.dapAnDungIndex = req.body.dapAnDungIndex === null ? null : Number(req.body.dapAnDungIndex);
    if (req.body.dapAnDungIndices !== undefined) update.dapAnDungIndices = Array.isArray(req.body.dapAnDungIndices) ? req.body.dapAnDungIndices.map(Number) : [];
    if (req.body.dapAnDungBoolean !== undefined) {
      const rawTf = req.body.dapAnDungBoolean;
      let parsedTf = null;
      if (rawTf === true || rawTf === "true") parsedTf = true;
      else if (rawTf === false || rawTf === "false") parsedTf = false;
      update.dapAnDungBoolean = parsedTf;
    }
    if (req.body.dapAnDungText !== undefined) update.dapAnDungText = String(req.body.dapAnDungText || "");

    if (req.body.loaiItem !== undefined) {
      const loaiItem = String(req.body.loaiItem || "").trim();
      if (!ITEM_LOAI_ALL.includes(loaiItem)) return res.status(400).json({ success: false, message: "loaiItem không hợp lệ." });
      if (!itemLoaiAllowedForExercise(ex.loaiBai, loaiItem)) {
        return res.status(400).json({
          success: false,
          message:
            ex.loaiBai === "mixedNoFlashcard"
              ? "Bài hỗn hợp chỉ cho phép item: quiz, multiSelect, trueFalse, shortAnswer."
              : "loaiItem phải trùng loaiBai của bài.",
        });
      }
      update.loaiItem = loaiItem;
    }

    if (update.thuTu !== undefined && (!Number.isFinite(update.thuTu) || update.thuTu < 1)) {
      return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });
    }

    const updated = await LuyenTapItem.findOneAndUpdate({ _id: itemId, luyenTapID: exId }, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy item." });

    res.status(200).json({ success: true, message: "Cập nhật item thành công!", data: updated });
  } catch (error) {
    console.error("updatePracticeExerciseItem error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/admin/practice-exercises/:exerciseId/items/:itemId
exports.deletePracticeExerciseItem = async (req, res) => {
  try {
    const exId = asObjectId(req.params.exerciseId);
    const itemId = asObjectId(req.params.itemId);
    if (!exId || !itemId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const remaining = await LuyenTapItem.countDocuments({ luyenTapID: exId, _id: { $ne: itemId } });
    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: "Không thể xóa item này vì bài sẽ không còn item." });
    }

    await LuyenTapItem.findOneAndDelete({ _id: itemId, luyenTapID: exId });
    res.status(200).json({ success: true, message: "Xóa item thành công!" });
  } catch (error) {
    console.error("deletePracticeExerciseItem error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

