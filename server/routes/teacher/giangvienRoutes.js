const express = require("express");
const router = express.Router();

// Import controller
const controller = require("../../controllers/teacher/profileController");

// SỬA TẠI ĐÂY: Lấy đúng hàm 'protect' từ object được export
const { protect } = require("../../middlewares/authMiddleware");

// Sử dụng 'protect' làm middleware thay vì biến 'authMiddleware' chung chung
router.get("/profile", protect, controller.getProfile);
router.put("/profile", protect, controller.updateProfile);
router.put("/doi-mat-khau", protect, controller.changePassword);

module.exports = router;