// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { getStudentProfile, updateProfile, changePassword } = require('../../controllers/student/studentProfileController');
const leaveRequestController = require('../../controllers/student/leaveRequestController');
const scheduleController = require('../../controllers/student/scheduleController');
const { protect } = require('../../middlewares/authMiddleware'); // Middleware xác thực

// Profile routes
router.get('/profile', protect, getStudentProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Leave request routes
router.get('/courses', protect, leaveRequestController.getMyCourses);
router.get('/courses/:courseId/sessions', protect, leaveRequestController.getUpcomingSessions);
router.get('/leave-requests', protect, leaveRequestController.getLeaveRequests);
router.post('/leave-requests', protect, leaveRequestController.createLeaveRequest);

// Assignment submit route
const assignmentController = require('../../controllers/student/assignmentController');
const upload = require('../../middlewares/multer');
router.get('/courses/:courseId/assignments', protect, assignmentController.getAssignmentsByCourse);
router.get('/assignments/:id', protect, assignmentController.getAssignmentDetail);
router.post('/assignments/submit', protect, upload.single('file'), assignmentController.submitAssignment);

// Schedule routes
router.get('/schedule', protect, scheduleController.getStudentSchedule);

// Dashboard routes
const studentDashboardController = require('../../controllers/student/studentDashboardController');
router.get('/overview', protect, studentDashboardController.getDashboardOverview);

module.exports = router;