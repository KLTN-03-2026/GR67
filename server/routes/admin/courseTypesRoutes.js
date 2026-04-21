const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");
const {
  getAllCourseTypes,
  getCourseTypeById,
  createCourseType,
  updateCourseType,
  toggleCourseTypeStatus,
  deleteCourseType,
  getLessonsByCourseType,
  createLesson,
  updateLesson,
  toggleLessonStatus,
  deleteLesson,
} = require("../../controllers/admin/courseTypesController");

const router = express.Router();

// Loại khóa học
router.get("/", protect, admin, getAllCourseTypes);
router.get("/:id", protect, admin, getCourseTypeById);
router.post("/", protect, admin, createCourseType);
router.put("/:id", protect, admin, updateCourseType);
router.patch("/:id/status", protect, admin, toggleCourseTypeStatus);
router.delete("/:id", protect, admin, deleteCourseType);

// Bài học trong loại khóa học
router.get("/:courseTypeId/lessons", protect, admin, getLessonsByCourseType);
router.post("/:courseTypeId/lessons", protect, admin, createLesson);
router.put("/:courseTypeId/lessons/:lessonId", protect, admin, updateLesson);
router.patch("/:courseTypeId/lessons/:lessonId/status", protect, admin, toggleLessonStatus);
router.delete("/:courseTypeId/lessons/:lessonId", protect, admin, deleteLesson);

module.exports = router;

