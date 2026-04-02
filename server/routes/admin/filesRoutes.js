const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/multer");
const { uploadFiles, extractDocxText } = require("../../controllers/admin/filesController");

const router = express.Router();

// Trích text từ một file .docx: field name = "file"
router.post("/extract-docx", protect, admin, upload.single("file"), extractDocxText);

// Upload nhiều file: field name = "files"
router.post("/upload", protect, admin, upload.array("files", 10), uploadFiles);

module.exports = router;

