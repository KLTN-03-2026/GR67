const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// Get all notifications for current user
router.get('/', protect, notificationController.getMyNotifications);

// Mark all as read
router.put('/read-all', protect, notificationController.markAllAsRead);

// Mark a specific notification as read
router.put('/:id/read', protect, notificationController.markAsRead);


module.exports = router;
