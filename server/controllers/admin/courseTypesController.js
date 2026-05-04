const LoaiKhoaHoc = require("../../models/LoaiKhoaHoc");
const BaiHoc = require("../../models/BaiHoc");
const { isResourceInUse } = require("../../utils/checkDependency");
const {
  clampInsertPosition,
  insertShiftsOthers,
  moveShiftsOthers,
  countInsertAffected,
  countMoveAffected,
  applyInsertOrder,
  applyMoveOrder,
  fetchLessonsLean,
} = require("../../utils/lessonOrder");

function isConfirmReorder(body) {
  return body && (body.confirmReorder === true || body.confirmReorder === "true");
}

async function populateLessonsList(courseTypeId) {
  return BaiHoc.find({ LoaiKhoaHoc: courseTypeId })
    .populate("file")
    .populate("files")
    .sort({ thutu: 1, createdAt: 1 })
    .lean();
}

async function populateOneLesson(id) {
  return BaiHoc.findById(id).populate("file").populate("files").lean();
}

// ===== Loại khóa học (Course Types) =====

// GET /course-types
const getAllCourseTypes = async (req, res) => {
  try {
    const query = {};
    if (req.query.active === "true") {
      query.trangThaiHoatDong = true;
    }

    const list = await LoaiKhoaHoc.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Thêm flag inUse cho frontend dễ xử lý
    const enrichedList = await Promise.all(list.map(async (ct) => {
      const inUse = await isResourceInUse('loaikhoahoc', ct._id);
      return { ...ct, inUse };
    }));

    res.status(200).json({ success: true, count: enrichedList.length, data: enrichedList });
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
    
    const inUse = await isResourceInUse('loaikhoahoc', item._id);
    res.status(200).json({ success: true, data: { ...item, inUse } });
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

    const existing = await LoaiKhoaHoc.findOne({ 
      Tenloai: { $regex: new RegExp("^" + resolvedName + "$", "i") } 
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Tên loại khóa học này đã tồn tại" });
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

    const existing = await LoaiKhoaHoc.findOne({ 
      Tenloai: { $regex: new RegExp("^" + resolvedName + "$", "i") },
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Tên loại khóa học này đã tồn tại" });
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

// PATCH /course-types/:id/status
const toggleCourseTypeStatus = async (req, res) => {
  try {
    const { trangThaiHoatDong } = req.body;
    if (typeof trangThaiHoatDong !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const updated = await LoaiKhoaHoc.findByIdAndUpdate(
        req.params.id,
        { trangThaiHoatDong },
        { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy loại khóa học' });
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: updated });
  } catch (error) {
    console.error("Lỗi khóa loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /course-types/:id
const deleteCourseType = async (req, res) => {
  try {
    const id = req.params.id;

    const inUse = await isResourceInUse('loaikhoahoc', id);
    if (inUse) {
      return res.status(400).json({ 
          success: false, 
          message: 'Loại khóa học này đã có khóa học đăng ký, không thể xóa. Vui lòng chuyển sang trạng thái "Khóa" để ngừng hoạt động.' 
      });
    }

    const item = await LoaiKhoaHoc.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy loại khóa học" });

    await BaiHoc.deleteMany({ LoaiKhoaHoc: item._id });
    await item.deleteOne();

    res.status(200).json({ success: true, message: "Đã xóa loại khóa học và toàn bộ bài học liên quan" });
  } catch (error) {
    console.error("Lỗi xóa loại khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// ===== Bài học (Lessons) =====

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

    // KIỂM TRA RÀNG BUỘC: Nếu đã có khóa học, không cho thêm bài học mới
    const inUse = await isResourceInUse('loaikhoahoc', courseTypeId);
    if (inUse) {
      return res.status(400).json({ 
        success: false, 
        message: 'Loại khóa học này đã có lớp học hoạt động. Không thể thêm bài học mới vào curriculum hiện tại.' 
      });
    }

    const resolvedName = (tenbai || "").trim();
    if (!resolvedName) return res.status(400).json({ success: false, message: "Tên bài học là bắt buộc" });
    const order = Number(thutu);
    if (!Number.isInteger(order) || order < 1 || order > 9999) {
      return res.status(400).json({ success: false, message: "Thứ tự phải là số nguyên từ 1 đến 9999" });
    }

    const lessons = await fetchLessonsLean(courseTypeId);
    const validP = clampInsertPosition(lessons, order);
    const needsConfirm = insertShiftsOthers(lessons, validP);

    if (needsConfirm && !isConfirmReorder(req.body)) {
      return res.status(409).json({
        success: false,
        code: "REORDER_REQUIRED",
        message: "Số thứ tự này đã có trong hệ thống — các bài từ vị trí này trở đi sẽ được đẩy về sau (thứ tự +1).",
        affectedCount: countInsertAffected(lessons, validP),
        clampedThuTu: validP,
      });
    }

    const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    const created = await applyInsertOrder(courseTypeId, validP, {
      tenbai: resolvedName,
      mota: (mota || "").trim(),
      file: file || undefined,
      files: normalizedFiles.length > 0 ? normalizedFiles : undefined,
    });
    
    const lesson = await populateOneLesson(created._id);
    const allLessons = await populateLessonsList(courseTypeId);

    res.status(201).json({ success: true, message: "Tạo bài học thành công", data: { lesson: lesson || created, lessons: allLessons } });
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

    const existing = await BaiHoc.findOne({ _id: lessonId, LoaiKhoaHoc: courseTypeId }).lean();
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });

    // KIỂM TRA RÀNG BUỘC: Nếu đã có khóa học, không cho đổi thứ tự
    const inUse = await isResourceInUse('loaikhoahoc', courseTypeId);
    if (inUse) {
      if (thutu !== undefined && Number(thutu) !== Number(existing.thutu)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Loại khóa học này đã có lớp học hoạt động. Không thể thay đổi thứ tự bài học trong curriculum hiện tại.' 
        });
      }
    }

    const resolvedName = (tenbai || "").trim();
    if (!resolvedName) return res.status(400).json({ success: false, message: "Tên bài học là bắt buộc" });
    const order = Number(thutu || existing.thutu);
    if (!Number.isInteger(order) || order < 1 || order > 9999) {
      return res.status(400).json({ success: false, message: "Thứ tự phải là số nguyên từ 1 đến 9999" });
    }

    const lessons = await fetchLessonsLean(courseTypeId);
    const k = lessons.length;
    const newT = Math.min(Math.max(1, order), k);
    const oldT = Number(existing.thutu);

    // Chỉ thực hiện di chuyển nếu thứ tự thay đổi và không bị block bởi inUse
    if (newT !== oldT) {
      const needsConfirm = moveShiftsOthers(lessons, lessonId, oldT, newT);
      if (needsConfirm && !isConfirmReorder(req.body)) {
        return res.status(409).json({
          success: false,
          code: "REORDER_REQUIRED",
          message: "Thay đổi thứ tự sẽ làm dịch các bài học khác trong danh sách.",
          affectedCount: countMoveAffected(lessons, lessonId, oldT, newT),
          clampedThuTu: newT,
        });
      }
      await applyMoveOrder(courseTypeId, lessonId, oldT, newT, {
        tenbai: resolvedName,
        mota: (mota || "").trim(),
        file: file || undefined,
        files: (Array.isArray(files) ? files.filter(Boolean) : []).length > 0 ? files.filter(Boolean) : undefined,
      });
    } else {
      // Chỉ cập nhật nội dung
      await BaiHoc.findByIdAndUpdate(lessonId, {
        tenbai: resolvedName,
        mota: (mota || "").trim(),
        file: file || undefined,
        files: (Array.isArray(files) ? files.filter(Boolean) : []).length > 0 ? files.filter(Boolean) : undefined,
      });
    }

    const lesson = await populateOneLesson(lessonId);
    const allLessons = await populateLessonsList(courseTypeId);

    res.status(200).json({ success: true, message: "Cập nhật bài học thành công", data: { lesson, lessons: allLessons } });
  } catch (error) {
    console.error("Lỗi cập nhật bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// PATCH /course-types/:courseTypeId/lessons/:lessonId/status
const toggleLessonStatus = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { trangThaiHoatDong } = req.body;
    
    const updated = await BaiHoc.findByIdAndUpdate(
      lessonId,
      { trangThaiHoatDong },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    res.status(200).json({ success: true, message: "Cập nhật trạng thái bài học thành công", data: updated });
  } catch (error) {
    console.error("Lỗi khóa bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// DELETE /course-types/:courseTypeId/lessons/:lessonId
const deleteLesson = async (req, res) => {
  try {
    const { courseTypeId, lessonId } = req.params;

    const inUse = await isResourceInUse('loaikhoahoc', courseTypeId);
    if (inUse) {
      return res.status(400).json({ 
          success: false, 
          message: 'Loại khóa học này đang có lớp học hoạt động. Không thể xóa bài học trong curriculum hiện tại. Vui lòng sử dụng tính năng "Khóa" bài học này thay vì xóa.' 
      });
    }

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
  toggleCourseTypeStatus,
  deleteCourseType,
  getLessonsByCourseType,
  createLesson,
  updateLesson,
  toggleLessonStatus,
  deleteLesson,
};
