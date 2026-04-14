const express = require("express");
const router = express.Router();

const profileController = require("../../controllers/teacher/profileController");
const courseController = require("../../controllers/teacher/courseController");
const assignmentController = require("../../controllers/teacher/assignmentController");
const lessonController = require("../../controllers/teacher/lessonController")
const scheduleController = require("../../controllers/teacher/scheduleController");
const dashboardController = require("../../controllers/teacher/dashboardController");
const { protect } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/multer");

// dashboard
router.get("/dashboard", protect, dashboardController.getDashboardStats);

// thông tin cá nhân
router.get("/profile", protect, profileController.getProfile);
router.put("/profile", protect, profileController.updateProfile);
router.put("/change-password", protect, profileController.changePassword);


//thông tin lịch dạy
router.get("/schedule", protect, scheduleController.getSchedule);
router.get("/schedule/rollcall/:lessonId", protect, scheduleController.getRollcallData);
router.post("/schedule/rollcall/:lessonId", protect, scheduleController.submitRollcall);

//KHÓA HỌC
//hien thi khoa hoc
router.get("/courses", protect, courseController.getCourses);

//hien thi hoc vien trong khoa hoc
router.get("/courses/:courseId/students", protect, courseController.getStudentsByCourse);

//xoahoc vien khoi khoa hoc
router.delete("/courses/:courseId/students/:studentId", protect, courseController.deleteStudentFromCourse);

//hien thi don xin nghi
router.get("/courses/leave-requests", protect, courseController.getLeaveRequests);

//bài tập
router.get("/courses/:courseId/assignments", protect, assignmentController.getAssignments);
router.post("/courses/:courseId/assignments", protect, upload.single("file"), assignmentController.createAssignment);
router.get("/assignments/:id", protect, assignmentController.getAssignmentById);
router.put("/assignments/:id", protect, upload.single("file"), assignmentController.updateAssignment);
router.get("/assignments/:id/submissions", protect, assignmentController.getSubmissionsForAssignment);
router.post("/assignments/:id/remind", protect, assignmentController.remindStudent);
router.delete("/assignments/:id", protect, assignmentController.deleteAssignment);

// nộp bài / chấm điểm
router.get("/submissions/:id", protect, assignmentController.getSubmissionById);
router.put("/submissions/:id/grade", protect, upload.array("files", 10), assignmentController.gradeSubmission);
// duyệt đơn
router.put("/courses/leave-requests/:id/approve", protect, courseController.approveLeaveRequest);

// từ chối đơn
router.put("/courses/leave-requests/:id/reject", protect, courseController.rejectLeaveRequest);

//BaiHoc

//hienthibaihoc
router.get("/courses/:courseId/lessons", protect, lessonController.getLessons);
router.get("/lessons/:id", protect, lessonController.getLessonById);
router.post("/courses/:courseId/lessons", protect, lessonController.createLesson);
router.put("/lessons/:id", protect, lessonController.updateLesson);
router.delete("/lessons/:id", protect, lessonController.deleteLesson);

module.exports = router;