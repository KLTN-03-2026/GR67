const express = require("express");
const router = express.Router();

const { protect, admin } = require("../../middlewares/authMiddleware");
const {
  listCourses,
  getCourseById,
  validateSchedule,
  createCourse,
  updateCourse,
  deleteCourse,
  listCourseStudents,
  addStudentToCourse,
  removeStudentFromCourse,
  addCourseSession,
  updateCourseSession,
  deleteCourseSession,
} = require("../../controllers/admin/coursesController");

router.use(protect, admin);

router.get("/", listCourses);
router.get("/:id", getCourseById);
router.get("/:id/students", listCourseStudents);
router.post("/:id/sessions", addCourseSession);
router.post("/validate-schedule", validateSchedule);
router.post("/", createCourse);
router.post("/:id/students", addStudentToCourse);
router.put("/:id/sessions/:sessionId", updateCourseSession);
router.put("/:id", updateCourse);
router.delete("/:id/sessions/:sessionId", deleteCourseSession);
router.delete("/:id", deleteCourse);
router.delete("/:id/students/:enrollmentId", removeStudentFromCourse);

module.exports = router;

