const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/admin/reportController');
const { protect, admin } = require('../../middlewares/authMiddleware');

// All report routes are protected and for admins only
router.use(protect);
router.use(admin);

router.get('/stats', reportController.getOverallStats);
router.get('/export/students', reportController.exportStudents);
router.get('/export/teachers', reportController.exportTeachers);
router.get('/export/courses', reportController.exportCourses);
router.get('/export/enrollments', reportController.exportEnrollments);
router.get('/export/facilities', reportController.exportFacilities);

module.exports = router;
