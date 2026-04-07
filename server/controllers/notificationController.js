const mongoose = require("mongoose");
const ThongBao = require("../models/ThongBao");

// GET /api/notifications
// Lấy danh sách thông báo của user hiện tại (Role: tất cả)
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm các thông báo mà userID chứa user hiện tại
    const notifications = await ThongBao.find({ userID: userId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "hovaten email role")
      .populate("khoaHocId", "tenkhoahoc")
      .lean();

    // Tính toán số lượng chưa đọc
    const unreadCount = notifications.filter(
      (n) => !n.readByUserIds.some((id) => id.toString() === userId.toString())
    ).length;

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// PUT /api/notifications/:id/read
// Đánh dấu thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID thông báo không hợp lệ." });
    }

    const result = await ThongBao.updateOne(
      { _id: id, readByUserIds: { $ne: userId } },
      { $push: { readByUserIds: userId } }
    );

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu là đã đọc.",
    });
  } catch (error) {
    console.error("Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// PUT /api/notifications/read-all
// Đánh dấu tất cả thông báo của người dùng này là đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
      const userId = req.user._id;
      
      await ThongBao.updateMany(
          { userID: userId, readByUserIds: { $ne: userId } },
          { $push: { readByUserIds: userId } }
      );
      
      res.status(200).json({
          success: true,
          message: "Đã đánh dấu tất cả là đã đọc."
      });
  } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
      res.status(500).json({ success: false, message: "Lỗi server." });
  }
};
