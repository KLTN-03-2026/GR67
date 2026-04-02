const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục uploads tồn tại ở thư mục gốc server
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu file tạm
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // sử dụng đường dẫn tuyệt đối
  },
  filename: (req, file, cb) => {
    // Xử lý lỗi font tiếng Việt (do multer mặc định là latin1)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    
    // Lưu với tên file gốc có kèm tiền tố để tránh trùng lặp
    cb(null, uniqueSuffix + "-" + originalName);
  },
});

// Bộ lọc chỉ cho phép các loại file cụ thể
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".mp3",
    ".mp4",
    ".webm",
    ".mov",
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file: ảnh (jpg/jpeg/png/gif/webp), pdf, word, excel, ppt, txt, mp3, video (mp4/webm/mov)"), false);
  }
};

// Khởi tạo multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // tối đa 25MB
});

module.exports = upload;