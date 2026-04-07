const mongoose = require("mongoose");
const NopBai = require("../../models/NopBai");

exports.submitAssignment = async (req, res) => {
  try {
    const { baitapID, dangkykhoahocID } = req.body;

    if (!mongoose.Types.ObjectId.isValid(baitapID) || !mongoose.Types.ObjectId.isValid(dangkykhoahocID)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    // Nếu giả sử bạn muốn cho gửi file có form-data: (Bỏ qua xử lý file chi tiết cho đơn giản test)
    
    // Lưu NopBai để trigger Mongoose hook gửi thông báo cho teacher
    const newNopBai = await NopBai.create({
      baitapID,
      dangkykhoahocID,
      thoigian: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Nộp bài thành công (thông báo đã được tự động trigger cho giảng viên)",
      data: newNopBai
    });
  } catch (error) {
    console.error("Lỗi khi nộp bài:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
