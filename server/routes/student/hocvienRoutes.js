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

// Routes Luyện tập
const practiceController = require('../../controllers/student/practiceController');
router.get('/practice', protect, practiceController.getPracticeList);
router.get('/practice/:id', protect, practiceController.getPracticeDetail);

// Routes Luyện Đề (Mock Tests)
const mockTestController = require('../../controllers/student/mockTestController');
router.get('/mock-tests', protect, mockTestController.getMockTests);
router.get('/mock-tests/history', protect, mockTestController.getTestHistory);
router.get('/mock-tests/history/:resultId', protect, mockTestController.getTestResultDetail);
router.get('/mock-tests/:id', protect, mockTestController.getMockTestDetail);
router.post('/mock-tests/submit', protect, mockTestController.submitMockTest);

module.exports = router;