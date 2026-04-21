const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect, admin } = require('../../middlewares/authMiddleware');
const { registerStudentFace } = require('../../controllers/admin/faceEnrollmentController');

const faceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const {
    // Admin CRUD
    getAllAdmins, getAdminById, createAdmin, updateAdmin, toggleAdminStatus, resetAdminPassword,
    // Teacher CRUD (by admin)
    getAllTeachers, getTeacherById, createTeacher, updateTeacher, toggleTeacherStatus, resetTeacherPassword, deleteTeacher,
    // Student CRUD (by admin)
    getAllStudents, getStudentById, createStudent, updateStudent, toggleStudentStatus, resetStudentPassword,
} = require('../../controllers/admin/usersControler');

// ============================================================
//  NHÓM 1: ADMIN quản lý tài khoản ADMIN (yêu cầu role admin)
// ============================================================
const adminRouter = express.Router();
adminRouter.use(protect, admin);

adminRouter.get('/', getAllAdmins);                          // Lấy danh sách admin
adminRouter.get('/:id', getAdminById);                      // Lấy chi tiết 1 admin
adminRouter.post('/', createAdmin);                         // Tạo admin mới
adminRouter.put('/:id', updateAdmin);                       // Cập nhật thông tin admin
adminRouter.patch('/:id/status', toggleAdminStatus);        // Khoá / Mở khoá admin
adminRouter.patch('/:id/password', resetAdminPassword);     // Đặt lại mật khẩu admin

// ============================================================
//  NHÓM 2: ADMIN quản lý tài khoản GIẢNG VIÊN
// ============================================================
const teacherAdminRouter = express.Router();
teacherAdminRouter.use(protect, admin);

teacherAdminRouter.get('/', getAllTeachers);                         // Lấy danh sách giảng viên
teacherAdminRouter.get('/:id', getTeacherById);                     // Lấy chi tiết 1 giảng viên
teacherAdminRouter.post('/', createTeacher);                        // Tạo tài khoản giảng viên
teacherAdminRouter.put('/:id', updateTeacher);                      // Cập nhật thông tin giảng viên
teacherAdminRouter.patch('/:id/status', toggleTeacherStatus);       // Khoá / Mở khoá giảng viên
teacherAdminRouter.patch('/:id/password', resetTeacherPassword);    // Đặt lại mật khẩu giảng viên
teacherAdminRouter.delete('/:id', deleteTeacher);                   // Xóa vĩnh viễn giảng viên

// ============================================================
//  NHÓM 3: ADMIN quản lý tài khoản HỌC VIÊN
// ============================================================
const studentAdminRouter = express.Router();
studentAdminRouter.use(protect, admin);

studentAdminRouter.post(
  '/:id/face',
  faceUpload.single('image'),
  registerStudentFace
);
studentAdminRouter.get('/', getAllStudents);                         // Lấy danh sách học viên
studentAdminRouter.get('/:id', getStudentById);                     // Lấy chi tiết 1 học viên
studentAdminRouter.post('/', createStudent);                        // Tạo tài khoản học viên
studentAdminRouter.put('/:id', updateStudent);                      // Cập nhật thông tin học viên
studentAdminRouter.patch('/:id/status', toggleStudentStatus);       // Khoá / Mở khoá học viên
studentAdminRouter.patch('/:id/password', resetStudentPassword);    // Đặt lại mật khẩu học viên

// Export các sub-router quản trị
module.exports = {
    adminRouter,
    teacherAdminRouter,
    studentAdminRouter,
};
