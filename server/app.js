require("dotenv").config();
const http = require('http');
var createError = require('http-errors');
var express = require('express');
const connectDB = require("./config/db");
const { initSocket } = require("./socket/io");
const { initKioskWs } = require("./socket/kioskWs");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

var indexRouter = require('./routes/index');
const profileRoutes = require("./routes/teacher/giangvienRoutes");
const studentRoutes = require('./routes/student/hocvienRoutes');

var app = express();

// Port mặc định 3000 (có thể override bằng env PORT)
const PORT = process.env.PORT || 3000;

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// Sử dụng thư viện `cors` để xử lý chuyên nghiệp hơn.
// Cấu hình này sẽ cho phép các request từ origin được khai báo trong biến môi trường
// hoặc từ `http://localhost:3001` (port mặc định của Next.js nếu port 3000 đã bị dùng).
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
};
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, 'public')));
// Public serve các file upload trong server/uploads qua URL /uploads/...
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes (prefix /api cho toàn bộ REST API)
app.use('/api', indexRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use("/teacher", profileRoutes);
app.use("/student", studentRoutes);

// catch 404
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message
  });
});

// chạy server
// Chỉ chạy server khi kết nối DB thành công để tránh treo request
const startServer = async () => {
  try {
    // Kiểm tra các biến môi trường quan trọng
    if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
      process.exit(1); // Dừng ứng dụng nếu thiếu
    }

    await connectDB();
    const httpServer = http.createServer(app);
    initSocket(httpServer);
    initKioskWs(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
      const apiPaths = Object.keys(swaggerSpec.paths || {});
      console.log("Danh sach API da khai bao trong Swagger:");
      apiPaths.forEach((p) => console.log(`- ${p}`));
    });
  } catch (error) {
    console.error("Failed to connect to Database. Server not started.", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;