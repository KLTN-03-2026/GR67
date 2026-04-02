var express = require('express');
var router = express.Router();
const { login, register, verifyOTP, resendOTP, forgotPassword, verifyPasswordResetOTP, resetPassword } = require('../controllers/authController');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ message: 'API Server is running' });
});

/* POST login */
router.post('/login', login);

/* POST register */
router.post('/register', register);

/* POST verify OTP */
router.post('/verify-otp', verifyOTP);

/* POST resend OTP */
router.post('/resend-otp', resendOTP);

/* POST forgot password */
router.post('/forgot-password', forgotPassword);

/* POST verify password reset OTP */
router.post('/verify-password-reset-otp', verifyPasswordResetOTP);

/* POST reset password */
router.post('/reset-password', resetPassword);

/* ================== ADMIN ROUTES ================== */
var facilitiesRouter = require('./admin/facilitiesRoutes');
router.use('/admin/facilities', facilitiesRouter);

/* ================== NOTIFICATIONS (ADMIN) ================== */
const notificationsAdminRouter = require("./admin/notificationsRoutes");
router.use("/admin/notifications", notificationsAdminRouter);

/* ================== USER MANAGEMENT ROUTES ================== */
const {
  adminRouter,
  teacherAdminRouter,
  studentAdminRouter,
} = require('./admin/usersRoutes');

// Admin quản lý tài khoản admin
router.use('/admin/users/admins', adminRouter);

// Admin quản lý tài khoản giảng viên
router.use('/admin/users/teachers', teacherAdminRouter);

// Admin quản lý tài khoản học viên
router.use('/admin/users/students', studentAdminRouter);

/* ================== COURSE TYPES + LESSONS ================== */
const courseTypesRouter = require("./admin/courseTypesRoutes");
router.use("/course-types", courseTypesRouter);

/* ================== FILE UPLOAD (ADMIN) ================== */
const filesRouter = require("./admin/filesRoutes");
router.use("/admin/files", filesRouter);

/* ================== COURSES (ADMIN) ================== */
const adminCoursesRouter = require("./admin/coursesRoutes");
router.use("/admin/courses", adminCoursesRouter);

// Giảng viên tự xem & cập nhật thông tin cá nhân
// COMMENT LẠI ĐỂ TRÁNH XUNG ĐỘT: Route này đã được xử lý trong giangvienRoutes (được load ở app.js)
// router.use('/teacher', teacherSelfRouter);

// Học viên tự xem & cập nhật thông tin cá nhân


module.exports = router;
