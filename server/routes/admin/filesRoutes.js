const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/multer");
const { uploadFiles, extractDocxText, extractDocxHtml } = require("../../controllers/admin/filesController");

const router = express.Router();

// Trích text từ một file .docx: field name = "file"
router.post("/extract-docx", protect, admin, upload.single("file"), extractDocxText);
router.post("/extract-docx-html", protect, admin, upload.single("file"), extractDocxHtml);

// Upload nhiều file: field name = "files"
router.post("/upload", protect, admin, upload.array("files", 10), uploadFiles);

module.exports = router;

