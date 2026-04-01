const LoaiKhoaHoc = require("../../models/LoaiKhoaHoc");
const BaiHoc = require("../../models/BaiHoc");

// ===== Loại khóa học (Course Types) =====

// GET /course-types
const getAllCourseTypes = async (req, res) => {
  try {
    const list = await LoaiKhoaHoc.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error("Lỗi lấy danh sách loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// GET /course-types/:id
const getCourseTypeById = async (req, res) => {
  try {
    const item = await LoaiKhoaHoc.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy loại khóa học" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("Lỗi lấy chi tiết loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// POST /course-types
const createCourseType = async (req, res) => {
  try {
    const { Tenloai, mota, ChungChi } = req.body;

    const resolvedName = (Tenloai || "").trim();
    if (!resolvedName) {
      return res.status(400).json({ success: false, message: "Tên loại khóa học là bắt buộc" });
    }

    const created = await LoaiKhoaHoc.create({
      Tenloai: resolvedName,
      mota: (mota || "").trim(),
      ChungChi: (ChungChi || "").trim(),
    });

    res.status(201).json({ success: true, message: "Tạo loại khóa học thành công", data: created });
  } catch (error) {
    console.error("Lỗi tạo loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// PUT /course-types/:id
const updateCourseType = async (req, res) => {
  try {
    const { Tenloai, mota, ChungChi } = req.body;
    const resolvedName = (Tenloai || "").trim();
    if (!resolvedName) {
      return res.status(400).json({ success: false, message: "Tên loại khóa học là bắt buộc" });
    }

    const updated = await LoaiKhoaHoc.findByIdAndUpdate(
      req.params.id,
      {
        Tenloai: resolvedName,
        mota: (mota || "").trim(),
        ChungChi: (ChungChi || "").trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy loại khóa học" });
    res.status(200).json({ success: true, message: "Cập nhật loại khóa học thành công", data: updated });
  } catch (error) {
    console.error("Lỗi cập nhật loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /course-types/:id
const deleteCourseType = async (req, res) => {
  try {
    const item = await LoaiKhoaHoc.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy loại khóa học" });

    // Xóa tất cả bài học thuộc loại
    await BaiHoc.deleteMany({ LoaiKhoaHoc: item._id });
    await item.deleteOne();

    res.status(200).json({ success: true, message: "Đã xóa loại khóa học và toàn bộ bài học liên quan" });
  } catch (error) {
    console.error("Lỗi xóa loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// ===== Bài học (Lessons) bên trong loại khóa học =====

// GET /course-types/:courseTypeId/lessons
const getLessonsByCourseType = async (req, res) => {
  try {
    const courseTypeId = req.params.courseTypeId;
    const lessons = await BaiHoc.find({ LoaiKhoaHoc: courseTypeId })
      .populate("file")
      .populate("files")
      .sort({ thutu: 1, createdAt: 1 })
      .lean();
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
  } catch (error) {
    console.error("Lỗi lấy danh sách bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// POST /course-types/:courseTypeId/lessons
const createLesson = async (req, res) => {
  try {
    const courseTypeId = req.params.courseTypeId;
    const { tenbai, thutu, mota, file, files } = req.body;

    const resolvedName = (tenbai || "").trim();
    if (!resolvedName) return res.status(400).json({ success: false, message: "Tên bài học là bắt buộc" });
    const order = Number(thutu);
    if (!Number.isInteger(order) || order < 1 || order > 9999) {
      return res.status(400).json({ success: false, message: "Thứ tự phải là số nguyên từ 1 đến 9999" });
    }

    const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    const created = await BaiHoc.create({
      LoaiKhoaHoc: courseTypeId,
      tenbai: resolvedName,
      thutu: order,
      mota: (mota || "").trim(),
      file: file || undefined,
      files: normalizedFiles.length > 0 ? normalizedFiles : undefined,
    });

    const populated = await BaiHoc.findById(created._id).populate("file").populate("files").lean();
    res.status(201).json({ success: true, message: "Tạo bài học thành công", data: populated || created });
  } catch (error) {
    console.error("Lỗi tạo bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// PUT /course-types/:courseTypeId/lessons/:lessonId
const updateLesson = async (req, res) => {
  try {
    const { courseTypeId, lessonId } = req.params;
    const { tenbai, thutu, mota, file, files } = req.body;

    const resolvedName = (tenbai || "").trim();
    if (!resolvedName) return res.status(400).json({ success: false, message: "Tên bài học là bắt buộc" });
    const order = Number(thutu);
    if (!Number.isInteger(order) || order < 1 || order > 9999) {
      return res.status(400).json({ success: false, message: "Thứ tự phải là số nguyên từ 1 đến 9999" });
    }

    const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    const updated = await BaiHoc.findOneAndUpdate(
      { _id: lessonId, LoaiKhoaHoc: courseTypeId },
      {
        tenbai: resolvedName,
        thutu: order,
        mota: (mota || "").trim(),
        file: file || undefined,
        files: normalizedFiles.length > 0 ? normalizedFiles : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    const populated = await BaiHoc.findById(updated._id).populate("file").populate("files").lean();
    res.status(200).json({ success: true, message: "Cập nhật bài học thành công", data: populated || updated });
  } catch (error) {
    console.error("Lỗi cập nhật bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /course-types/:courseTypeId/lessons/:lessonId
const deleteLesson = async (req, res) => {
  try {
    const { courseTypeId, lessonId } = req.params;
    const deleted = await BaiHoc.findOneAndDelete({ _id: lessonId, LoaiKhoaHoc: courseTypeId });
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    res.status(200).json({ success: true, message: "Xóa bài học thành công" });
  } catch (error) {
    console.error("Lỗi xóa bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

module.exports = {
  getAllCourseTypes,
  getCourseTypeById,
  createCourseType,
  updateCourseType,
  deleteCourseType,
  getLessonsByCourseType,
  createLesson,
  updateLesson,
  deleteLesson,
};

