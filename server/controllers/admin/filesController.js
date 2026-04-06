const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");
const File = require("../../models/File");

// POST /admin/files/extract-docx (multipart, field: file) — trích văn bản thuần từ .docx
const extractDocxText = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Không có file" });
    }
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ext !== ".docx") {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ success: false, message: "Chỉ hỗ trợ file .docx" });
    }
    const result = await mammoth.extractRawText({ path: file.path });
    fs.unlink(file.path, () => {});
    res.status(200).json({
      success: true,
      text: result.value || "",
      messages: result.messages || [],
    });
  } catch (error) {
    console.error("Lỗi đọc docx (mammoth):", error);
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: "Không đọc được nội dung file docx" });
  }
};

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

const mammothHtmlOptions = {
  convertImage: mammoth.images.imgElement(function (image) {
    return image.read("base64").then(function (imageBuffer) {
      return {
        src: "data:" + image.contentType + ";base64," + imageBuffer,
      };
    });
  }),
};

// POST /admin/files/extract-docx-html — HTML có <img> base64 (giữ ảnh trong Word)
const extractDocxHtml = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Không có file" });
    }
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (ext !== ".docx") {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ success: false, message: "Chỉ hỗ trợ file .docx" });
    }
    const result = await mammoth.convertToHtml({ path: file.path }, mammothHtmlOptions);
    fs.unlink(file.path, () => {});
    res.status(200).json({
      success: true,
      html: result.value || "",
      messages: result.messages || [],
    });
  } catch (error) {
    console.error("Lỗi đọc docx HTML (mammoth):", error);
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ success: false, message: "Không đọc được HTML từ file docx" });
  }
};

module.exports = { uploadFiles, extractDocxText, extractDocxHtml };

