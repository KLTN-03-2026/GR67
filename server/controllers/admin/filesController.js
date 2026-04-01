const File = require("../../models/File");

// POST /admin/files/upload (multipart/form-data)
// field name: files (multiple)
const uploadFiles = async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: "Không có file nào được upload" });
    }

    const created = await File.insertMany(
      files.map((f) => ({
        url: `/uploads/${f.filename}`,
        originalName: f.originalname,
        type: f.mimetype,
        size: f.size,
      }))
    );

    res.status(201).json({
      success: true,
      message: "Upload file thành công",
      data: created,
    });
  } catch (error) {
    console.error("Lỗi upload file:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

module.exports = { uploadFiles };

