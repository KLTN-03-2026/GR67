// controllers/lessonController.js
const BaiHoc = require("../../models/BaiHoc");
const File = require("../../models/File");
const KhoaHoc = require("../../models/KhoaHoc");

// Lấy danh sách bài học
exports.getLessons = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await KhoaHoc.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khóa học"
            });
        }

        const lessons = await BaiHoc.find({ LoaiKhoaHoc: course.LoaiKhoaHocID })
            .populate("LoaiKhoaHoc", "Tenloai mota")
            .populate("file")
            .sort({ thutu: 1 });

        const data = lessons.map((l) => ({
            id: l._id,
            title: l.tenbai,
            description: l.mota,
            order: l.thutu,
            file: l.file,
            courseName: l.LoaiKhoaHoc?.Tenloai || "",
            courseDescription: l.LoaiKhoaHoc?.mota || "",
            createdAt: l.createdAt,
            updatedAt: l.updatedAt
        }));

        res.status(200).json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};

// Lấy chi tiết bài học
exports.getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await BaiHoc.findById(id)
            .populate("LoaiKhoaHoc", "Tenloai mota")
            .populate("file");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài học"
            });
        }

        const data = {
            id: lesson._id,
            title: lesson.tenbai,
            description: lesson.mota,
            order: lesson.thutu,
            file: lesson.file,
            courseName: lesson.LoaiKhoaHoc?.Tenloai || "",
            courseDescription: lesson.LoaiKhoaHoc?.mota || "",
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt
        };

        res.status(200).json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};

// Tạo bài học
exports.createLesson = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, order } = req.body;

        if (!title || !order) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }

        const course = await KhoaHoc.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khóa học"
            });
        }

        const lesson = new BaiHoc({
            tenbai: title,
            mota: description || "",
            thutu: order,
            LoaiKhoaHoc: course.LoaiKhoaHocID,
            file: req.body.fileId || null
        });

        await lesson.save();
        await lesson.populate("LoaiKhoaHoc", "Tenloai mota");
        await lesson.populate("file");

        res.status(201).json({
            success: true,
            message: "Tạo bài học thành công",
            data: {
                id: lesson._id,
                title: lesson.tenbai,
                description: lesson.mota,
                order: lesson.thutu,
                file: lesson.file,
                courseName: lesson.LoaiKhoaHoc?.Tenloai || ""
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};

// Cập nhật bài học
exports.updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, order } = req.body;

        const lesson = await BaiHoc.findByIdAndUpdate(
            id,
            {
                tenbai: title,
                mota: description,
                thutu: order,
                ...(req.body.fileId && { file: req.body.fileId })
            },
            { new: true }
        ).populate("LoaiKhoaHoc", "Tenloai mota").populate("file");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài học"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật bài học thành công",
            data: {
                id: lesson._id,
                title: lesson.tenbai,
                description: lesson.mota,
                order: lesson.thutu,
                file: lesson.file,
                courseName: lesson.LoaiKhoaHoc?.Tenloai || ""
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};

// Xóa bài học
exports.deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await BaiHoc.findByIdAndDelete(id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài học"
            });
        }

        res.status(200).json({
            success: true,
            message: "Xóa bài học thành công"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};