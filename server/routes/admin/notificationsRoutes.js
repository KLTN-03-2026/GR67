const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/multer");

const {
  sendNotification,
  listNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
} = require("../../controllers/admin/notificationsController");

const router = express.Router();

// POST /api/admin/notifications/send
// multipart/form-data
// field: files[] / files (we use upload.array('files', ...))
router.post("/send", protect, admin, upload.array("files", 10), sendNotification);

// GET /api/admin/notifications
router.get("/", protect, admin, listNotifications);

// GET /api/admin/notifications/:id
router.get("/:id", protect, admin, getNotificationById);

// PATCH /api/admin/notifications/:id
router.patch("/:id", protect, admin, updateNotification);

// DELETE /api/admin/notifications/:id
router.delete("/:id", protect, admin, deleteNotification);

module.exports = router;

