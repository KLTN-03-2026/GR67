const mongoose = require("mongoose");
const DeThiMau = require("../../models/DeThiMau");
const DeThiMauPhan = require("../../models/DeThiMauPhan");
const DeThiMauPhanNhom = require("../../models/DeThiMauPhanNhom");
const DeThiMauCauHoi = require("../../models/DeThiMauCauHoi");
const FileModel = require("../../models/File");

function asObjectId(value) {
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function normalizeFileIds(files) {
  if (!Array.isArray(files)) return [];
  return files
    .map((f) => {
      if (!f) return null;
      if (typeof f === "string") return asObjectId(f);
      if (typeof f === "object" && f._id) return asObjectId(f._id);
      return null;
    })
    .filter(Boolean);
}

const ALLOWED_LOAI_CAU_HOI = ["mcq", "multiSelect", "trueFalse", "shortAnswer"];

function normalizeLuaChon(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim());
}

function isIndexArrayValid(indices, length) {
  if (!Array.isArray(indices)) return false;
  const uniq = new Set(indices);
  if (uniq.size !== indices.length) return false;
  return indices.every((i) => typeof i === "number" && Number.isInteger(i) && i >= 0 && i < length);
}

// GET /api/admin/sample-tests
exports.listSampleTests = async (req, res) => {
  try {
    const { khoaHocID, chungChi, q } = req.query;

    const query = {};
    if (khoaHocID) {
      const id = asObjectId(khoaHocID);
      if (!id) return res.status(400).json({ success: false, message: "khoaHocID không hợp lệ." });
      query.khoaHocID = id;
    }

    if (chungChi) {
      const cc = String(chungChi || "").trim().toUpperCase();
      if (!["TOEIC", "IELTS"].includes(cc)) {
        return res.status(400).json({ success: false, message: "chungChi chỉ hỗ trợ TOEIC hoặc IELTS." });
      }
      query.chungChi = cc;
    }

    if (q && String(q).trim()) {
      const qq = String(q).trim();
      query.$or = [
        { tenDe: { $regex: qq, $options: "i" } },
        { moTa: { $regex: qq, $options: "i" } },
      ];
    }

    const tests = await DeThiMau.find(query)
      .sort({ createdAt: -1 })
      .populate("khoaHocID", "tenkhoahoc LoaiKhoaHocID")
      .lean();

    const withStats = await Promise.all(
      tests.map(async (t) => {
        const questionCount = await DeThiMauCauHoi.countDocuments({ deThiMauID: t._id });
        return { ...t, questionCount };
      })
    );

    res.status(200).json({ success: true, count: withStats.length, data: withStats });
  } catch (error) {
    console.error("listSampleTests error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/sample-tests
exports.createSampleTest = async (req, res) => {
  try {
    const { khoaHocID, tenDe, chungChi, capDo, thoiGianLamBai, moTa } = req.body;

    const courseId = khoaHocID ? asObjectId(khoaHocID) : null;
    if (khoaHocID && !courseId) return res.status(400).json({ success: false, message: "khoaHocID không hợp lệ." });
    if (!String(tenDe || "").trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập tên đề." });

    const cc = String(chungChi || "").trim().toUpperCase();
    if (!["TOEIC", "IELTS"].includes(cc)) {
      return res.status(400).json({ success: false, message: "chungChi chỉ hỗ trợ TOEIC hoặc IELTS." });
    }

    const tg = Number(thoiGianLamBai);
    if (!Number.isFinite(tg) || tg < 1) return res.status(400).json({ success: false, message: "thoiGianLamBai không hợp lệ." });

    const newItem = await DeThiMau.create({
      khoaHocID: courseId,
      tenDe: String(tenDe).trim(),
      chungChi: cc,
      capDo: String(capDo || "easy").trim(),
      thoiGianLamBai: tg,
      moTa: String(moTa || "").trim(),
    });

    const created = await DeThiMau.findById(newItem._id).lean();
    res.status(201).json({ success: true, message: "Tạo đề thi mẫu thành công!", data: created });
  } catch (error) {
    console.error("createSampleTest error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/admin/sample-tests/:id
exports.getSampleTestById = async (req, res) => {
  try {
    const testId = asObjectId(req.params.id);
    if (!testId) return res.status(400).json({ success: false, message: "id không hợp lệ." });

    const test = await DeThiMau.findById(testId)
      .populate("khoaHocID", "tenkhoahoc LoaiKhoaHocID")
      .lean();

    if (!test) return res.status(404).json({ success: false, message: "Không tìm thấy đề." });

    const parts = await DeThiMauPhan.find({ deThiMauID: testId }).sort({ thuTu: 1 }).lean();

    const partsWithGroupsAndQuestions = await Promise.all(
      parts.map(async (p) => {
        const groups = await DeThiMauPhanNhom.find({ deThiMauPhanID: p._id })
          .sort({ thuTu: 1 })
          .populate("files", "originalName url type size")
          .lean();

        const allQuestions = await DeThiMauCauHoi.find({ deThiMauID: testId, deThiMauPhanID: p._id })
          .sort({ thuTu: 1 })
          .populate("files", "originalName url type size")
          .lean();

        const ungroupedQuestions = allQuestions.filter((q) => !q.deThiMauPhanNhomID);

        const groupQuestions = await Promise.all(
          groups.map(async (g) => {
            const questions = allQuestions.filter((q) => String(q.deThiMauPhanNhomID || "") === String(g._id));
            return { ...g, questions, questionCount: questions.length };
          })
        );

        return {
          ...p,
          groups: groupQuestions,
          ungroupedQuestions,
          questions: allQuestions, // giữ để UI v1 vẫn tương thích
          questionCount: allQuestions.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { ...test, parts: partsWithGroupsAndQuestions },
    });
  } catch (error) {
    console.error("getSampleTestById error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/admin/sample-tests/:id
exports.updateSampleTest = async (req, res) => {
  try {
    const testId = asObjectId(req.params.id);
    if (!testId) return res.status(400).json({ success: false, message: "id không hợp lệ." });

    const update = {};
    if (req.body.tenDe !== undefined) update.tenDe = String(req.body.tenDe).trim();
    if (req.body.moTa !== undefined) update.moTa = String(req.body.moTa || "").trim();
    if (req.body.thoiGianLamBai !== undefined) update.thoiGianLamBai = Number(req.body.thoiGianLamBai);
    if (req.body.capDo !== undefined) update.capDo = String(req.body.capDo).trim();
    if (req.body.chungChi !== undefined) update.chungChi = String(req.body.chungChi || "").trim().toUpperCase();
    if (req.body.khoaHocID !== undefined) {
      const raw = req.body.khoaHocID;
      if (!raw) {
        update.khoaHocID = null;
      } else {
        const courseId = asObjectId(raw);
        if (!courseId) return res.status(400).json({ success: false, message: "khoaHocID không hợp lệ." });
        update.khoaHocID = courseId;
      }
    }

    if (update.tenDe !== undefined && !update.tenDe) return res.status(400).json({ success: false, message: "Vui lòng nhập tên đề." });
    if (update.thoiGianLamBai !== undefined && (!Number.isFinite(update.thoiGianLamBai) || update.thoiGianLamBai < 1)) {
      return res.status(400).json({ success: false, message: "thoiGianLamBai không hợp lệ." });
    }
    if (update.chungChi !== undefined && !["TOEIC", "IELTS"].includes(update.chungChi)) {
      return res.status(400).json({ success: false, message: "chungChi chỉ hỗ trợ TOEIC hoặc IELTS." });
    }

    const updated = await DeThiMau.findByIdAndUpdate(testId, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy đề." });

    res.status(200).json({ success: true, message: "Cập nhật đề thi mẫu thành công!", data: updated });
  } catch (error) {
    console.error("updateSampleTest error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/admin/sample-tests/:id
exports.deleteSampleTest = async (req, res) => {
  try {
    const testId = asObjectId(req.params.id);
    if (!testId) return res.status(400).json({ success: false, message: "id không hợp lệ." });

    const parts = await DeThiMauPhan.find({ deThiMauID: testId }).lean();
    const partIds = parts.map((p) => p._id);

    await DeThiMauCauHoi.deleteMany({ deThiMauID: testId });
    await DeThiMauPhan.deleteMany({ deThiMauID: testId });
    const deleted = await DeThiMau.findByIdAndDelete(testId);

    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy đề." });

    res.status(200).json({ success: true, message: "Xóa đề thi mẫu thành công!" });
  } catch (error) {
    console.error("deleteSampleTest error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/sample-tests/:testId/parts
exports.createSampleTestPart = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    if (!testId) return res.status(400).json({ success: false, message: "testId không hợp lệ." });

    const tenPhan = String(req.body.tenPhan || "").trim();
    const thuTu = Number(req.body.thuTu);
    if (!tenPhan) return res.status(400).json({ success: false, message: "Vui lòng nhập tên phần." });
    if (!Number.isFinite(thuTu) || thuTu < 1) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });

    const part = await DeThiMauPhan.create({ deThiMauID: testId, tenPhan, thuTu });
    res.status(201).json({ success: true, message: "Tạo phần thành công!", data: part.toObject ? part.toObject() : part });
  } catch (error) {
    console.error("createSampleTestPart error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/admin/sample-tests/:testId/parts/:partId
exports.updateSampleTestPart = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    if (!testId || !partId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const update = {};
    if (req.body.tenPhan !== undefined) update.tenPhan = String(req.body.tenPhan || "").trim();
    if (req.body.thuTu !== undefined) update.thuTu = Number(req.body.thuTu);

    if (update.tenPhan !== undefined && !update.tenPhan) return res.status(400).json({ success: false, message: "tenPhan không hợp lệ." });
    if (update.thuTu !== undefined && (!Number.isFinite(update.thuTu) || update.thuTu < 1)) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });

    const updated = await DeThiMauPhan.findOneAndUpdate({ _id: partId, deThiMauID: testId }, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy phần." });

    res.status(200).json({ success: true, message: "Cập nhật phần thành công!", data: updated });
  } catch (error) {
    console.error("updateSampleTestPart error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/admin/sample-tests/:testId/parts/:partId
exports.deleteSampleTestPart = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    if (!testId || !partId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    await DeThiMauCauHoi.deleteMany({ deThiMauID: testId, deThiMauPhanID: partId });
    await DeThiMauPhanNhom.deleteMany({ deThiMauPhanID: partId });
    await DeThiMauPhan.findOneAndDelete({ _id: partId, deThiMauID: testId });

    res.status(200).json({ success: true, message: "Xóa phần thành công!" });
  } catch (error) {
    console.error("deleteSampleTestPart error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/sample-tests/:testId/parts/:partId/groups
exports.createSampleTestGroup = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    if (!testId || !partId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const part = await DeThiMauPhan.findOne({ _id: partId, deThiMauID: testId }).lean();
    if (!part) return res.status(404).json({ success: false, message: "Không tìm thấy part." });

    const tenNhom = String(req.body.tenNhom || "").trim();
    const thuTu = Number(req.body.thuTu);
    if (!tenNhom) return res.status(400).json({ success: false, message: "Vui lòng nhập tên nhóm." });
    if (!Number.isFinite(thuTu) || thuTu < 1) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });

    const files = normalizeFileIds(req.body.files);
    // Nếu muốn validate tồn tại file: uncomment
    // if (files.length) await FileModel.countDocuments({ _id: { $in: files } });

    const created = await DeThiMauPhanNhom.create({
      deThiMauPhanID: partId,
      tenNhom,
      thuTu,
      files,
    });

    const populated = await DeThiMauPhanNhom.findById(created._id).populate("files", "originalName url type size").lean();
    res.status(201).json({ success: true, message: "Tạo nhóm thành công!", data: populated || created });
  } catch (error) {
    console.error("createSampleTestGroup error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/admin/sample-tests/:testId/parts/:partId/groups/:groupId
exports.updateSampleTestGroup = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    const groupId = asObjectId(req.params.groupId);
    if (!testId || !partId || !groupId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const group = await DeThiMauPhanNhom.findOne({ _id: groupId, deThiMauPhanID: partId });
    if (!group) return res.status(404).json({ success: false, message: "Không tìm thấy nhóm." });

    const update = {};
    if (req.body.tenNhom !== undefined) {
      const tenNhom = String(req.body.tenNhom || "").trim();
      if (!tenNhom) return res.status(400).json({ success: false, message: "tenNhom không hợp lệ." });
      update.tenNhom = tenNhom;
    }
    if (req.body.thuTu !== undefined) {
      const thuTu = Number(req.body.thuTu);
      if (!Number.isFinite(thuTu) || thuTu < 1) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });
      update.thuTu = thuTu;
    }
    if (req.body.files !== undefined) update.files = normalizeFileIds(req.body.files);

    const updated = await DeThiMauPhanNhom.findOneAndUpdate(
      { _id: groupId, deThiMauPhanID: partId },
      update,
      { new: true }
    )
      .populate("files", "originalName url type size")
      .lean();

    res.status(200).json({ success: true, message: "Cập nhật nhóm thành công!", data: updated });
  } catch (error) {
    console.error("updateSampleTestGroup error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/admin/sample-tests/:testId/parts/:partId/groups/:groupId
exports.deleteSampleTestGroup = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    const groupId = asObjectId(req.params.groupId);
    if (!testId || !partId || !groupId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const partExists = await DeThiMauPhan.findOne({ _id: partId, deThiMauID: testId }).lean();
    if (!partExists) return res.status(404).json({ success: false, message: "Không tìm thấy part." });

    const countInGroup = await DeThiMauCauHoi.countDocuments({ deThiMauID: testId, deThiMauPhanID: partId, deThiMauPhanNhomID: groupId });
    if (countInGroup > 0) {
      return res.status(400).json({ success: false, message: "Không thể xóa nhóm vì vẫn còn câu hỏi thuộc nhóm này." });
    }

    await DeThiMauPhanNhom.findOneAndDelete({ _id: groupId, deThiMauPhanID: partId });
    res.status(200).json({ success: true, message: "Xóa nhóm thành công!" });
  } catch (error) {
    console.error("deleteSampleTestGroup error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/sample-tests/:testId/parts/:partId/questions
exports.createSampleTestQuestion = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    if (!testId || !partId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const part = await DeThiMauPhan.findOne({ _id: partId, deThiMauID: testId }).lean();
    if (!part) return res.status(404).json({ success: false, message: "Không tìm thấy phần." });

    const thuTu = Number(req.body.thuTu);
    const noiDung = String(req.body.noiDung || "").trim();
    const giaiThich = String(req.body.giaiThich || "").trim();
    const loaiCauHoi = String(req.body.loaiCauHoi || "mcq").trim();
    const deThiMauPhanNhomID = req.body.deThiMauPhanNhomID ? asObjectId(req.body.deThiMauPhanNhomID) : null;
    if (req.body.deThiMauPhanNhomID && !deThiMauPhanNhomID) {
      return res.status(400).json({ success: false, message: "deThiMauPhanNhomID không hợp lệ." });
    }

    if (deThiMauPhanNhomID) {
      const nhom = await DeThiMauPhanNhom.findOne({ _id: deThiMauPhanNhomID, deThiMauPhanID: partId }).lean();
      if (!nhom) return res.status(400).json({ success: false, message: "Nhóm không thuộc part này." });
    }

    const files = normalizeFileIds(req.body.files);
    const luaChonNorm = normalizeLuaChon(req.body.luaChon);

    if (!Number.isFinite(thuTu) || thuTu < 1) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });
    if (!noiDung) return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung câu hỏi." });
    if (!ALLOWED_LOAI_CAU_HOI.includes(loaiCauHoi)) {
      return res.status(400).json({ success: false, message: "loaiCauHoi không hợp lệ." });
    }

    const base = {
      deThiMauID: testId,
      deThiMauPhanID: partId,
      deThiMauPhanNhomID: deThiMauPhanNhomID || null,
      thuTu,
      loaiCauHoi,
      noiDung,
      giaiThich,
      files,
      luaChon: [],
      dapAnDungIndex: null,
      dapAnDungIndices: [],
      dapAnDungBoolean: null,
      dapAnDungText: "",
    };

    if (loaiCauHoi === "mcq") {
      if (luaChonNorm.length !== 4 || luaChonNorm.some((s) => !s)) {
        return res.status(400).json({ success: false, message: "mcq cần đúng 4 lựa chọn (không rỗng)." });
      }
      const dapAnDungIndex = Number(req.body.dapAnDungIndex);
      if (!Number.isInteger(dapAnDungIndex) || dapAnDungIndex < 0 || dapAnDungIndex > 3) {
        return res.status(400).json({ success: false, message: "dapAnDungIndex phải từ 0 đến 3." });
      }
      base.luaChon = luaChonNorm;
      base.dapAnDungIndex = dapAnDungIndex;
    } else if (loaiCauHoi === "multiSelect") {
      if (luaChonNorm.length !== 4 || luaChonNorm.some((s) => !s)) {
        return res.status(400).json({ success: false, message: "multiSelect cần đúng 4 lựa chọn (không rỗng)." });
      }
      const dapAnDungIndices = Array.isArray(req.body.dapAnDungIndices) ? req.body.dapAnDungIndices.map(Number) : [];
      if (!isIndexArrayValid(dapAnDungIndices, 4) || dapAnDungIndices.length === 0) {
        return res.status(400).json({ success: false, message: "dapAnDungIndices không hợp lệ hoặc rỗng." });
      }
      base.luaChon = luaChonNorm;
      base.dapAnDungIndices = dapAnDungIndices;
    } else if (loaiCauHoi === "trueFalse") {
      if (typeof req.body.dapAnDungBoolean !== "boolean") {
        return res.status(400).json({ success: false, message: "trueFalse cần dapAnDungBoolean (boolean)." });
      }
      base.dapAnDungBoolean = req.body.dapAnDungBoolean;
      base.luaChon = [];
    } else if (loaiCauHoi === "shortAnswer") {
      const dapAnDungText = String(req.body.dapAnDungText || "").trim();
      if (!dapAnDungText) {
        return res.status(400).json({ success: false, message: "shortAnswer cần dapAnDungText." });
      }
      base.dapAnDungText = dapAnDungText;
      base.luaChon = [];
    }

    const question = await DeThiMauCauHoi.create(base);

    res.status(201).json({ success: true, message: "Tạo câu hỏi thành công!", data: question.toObject ? question.toObject() : question });
  } catch (error) {
    console.error("createSampleTestQuestion error:", error);
    if (error?.name === "ValidationError" && error.errors) {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(" ");
      return res.status(400).json({ success: false, message: msg || "Dữ liệu không hợp lệ." });
    }
    const msg = error?.message && String(error.message).includes("cần") ? error.message : "Lỗi máy chủ.";
    res.status(500).json({ success: false, message: msg });
  }
};

// PUT /api/admin/sample-tests/:testId/parts/:partId/questions/:questionId
exports.updateSampleTestQuestion = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    const questionId = asObjectId(req.params.questionId);
    if (!testId || !partId || !questionId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const q = await DeThiMauCauHoi.findOne({ _id: questionId, deThiMauID: testId, deThiMauPhanID: partId });
    if (!q) return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi." });

    if (req.body.thuTu !== undefined) {
      const t = Number(req.body.thuTu);
      if (!Number.isFinite(t) || t < 1) return res.status(400).json({ success: false, message: "thuTu không hợp lệ." });
      q.thuTu = t;
    }
    if (req.body.noiDung !== undefined) {
      const nd = String(req.body.noiDung || "").trim();
      if (!nd) return res.status(400).json({ success: false, message: "noiDung không hợp lệ." });
      q.noiDung = nd;
    }
    if (req.body.giaiThich !== undefined) q.giaiThich = String(req.body.giaiThich || "").trim();
    if (req.body.loaiCauHoi !== undefined) {
      const lt = String(req.body.loaiCauHoi || "").trim();
      if (!ALLOWED_LOAI_CAU_HOI.includes(lt)) return res.status(400).json({ success: false, message: "loaiCauHoi không hợp lệ." });
      q.loaiCauHoi = lt;
    }
    if (req.body.deThiMauPhanNhomID !== undefined) {
      const next = req.body.deThiMauPhanNhomID ? asObjectId(req.body.deThiMauPhanNhomID) : null;
      if (req.body.deThiMauPhanNhomID && !next) return res.status(400).json({ success: false, message: "deThiMauPhanNhomID không hợp lệ." });
      if (next) {
        const nhom = await DeThiMauPhanNhom.findOne({ _id: next, deThiMauPhanID: partId }).lean();
        if (!nhom) return res.status(400).json({ success: false, message: "Nhóm không thuộc part này." });
      }
      q.deThiMauPhanNhomID = next;
    }
    if (req.body.files !== undefined) {
      q.files = normalizeFileIds(req.body.files);
    }
    if (req.body.luaChon !== undefined) {
      q.luaChon = normalizeLuaChon(req.body.luaChon);
    }
    if (req.body.dapAnDungIndex !== undefined) {
      const di = Number(req.body.dapAnDungIndex);
      q.dapAnDungIndex = Number.isInteger(di) ? di : null;
    }
    if (req.body.dapAnDungIndices !== undefined) {
      q.dapAnDungIndices = Array.isArray(req.body.dapAnDungIndices) ? req.body.dapAnDungIndices.map(Number) : [];
    }
    if (req.body.dapAnDungBoolean !== undefined) {
      if (req.body.dapAnDungBoolean === null) q.dapAnDungBoolean = null;
      else q.dapAnDungBoolean = Boolean(req.body.dapAnDungBoolean);
    }
    if (req.body.dapAnDungText !== undefined) {
      q.dapAnDungText = String(req.body.dapAnDungText || "").trim();
    }

    await q.save();
    const updated = q.toObject ? q.toObject() : q;
    res.status(200).json({ success: true, message: "Cập nhật câu hỏi thành công!", data: updated });
  } catch (error) {
    console.error("updateSampleTestQuestion error:", error);
    if (error?.name === "ValidationError" && error.errors) {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(" ");
      return res.status(400).json({ success: false, message: msg || "Dữ liệu không hợp lệ." });
    }
    const msg = error?.message && String(error.message).includes("cần") ? error.message : "Lỗi máy chủ.";
    res.status(500).json({ success: false, message: msg });
  }
};

// DELETE /api/admin/sample-tests/:testId/parts/:partId/questions/:questionId
exports.deleteSampleTestQuestion = async (req, res) => {
  try {
    const testId = asObjectId(req.params.testId);
    const partId = asObjectId(req.params.partId);
    const questionId = asObjectId(req.params.questionId);
    if (!testId || !partId || !questionId) return res.status(400).json({ success: false, message: "Tham số không hợp lệ." });

    const remaining = await DeThiMauCauHoi.countDocuments({
      deThiMauID: testId,
      _id: { $ne: questionId },
    });

    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: "Không thể xóa câu hỏi này vì đề sẽ không còn câu hỏi." });
    }

    await DeThiMauCauHoi.findOneAndDelete({ _id: questionId, deThiMauID: testId, deThiMauPhanID: partId });
    res.status(200).json({ success: true, message: "Xóa câu hỏi thành công!" });
  } catch (error) {
    console.error("deleteSampleTestQuestion error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

