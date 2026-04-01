const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/multer");
const { uploadFiles } = require("../../controllers/admin/filesController");

const router = express.Router();

// Upload nhiều file: field name = "files"
router.post("/upload", protect, admin, upload.array("files", 10), uploadFiles);

module.exports = router;

