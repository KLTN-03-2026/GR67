const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");

const {
  listPracticeExercises,
  createPracticeExercise,
  getPracticeExerciseById,
  updatePracticeExercise,
  deletePracticeExercise,
  createPracticeExerciseItem,
  updatePracticeExerciseItem,
  deletePracticeExerciseItem,
} = require("../../controllers/admin/practiceExercisesController");

const router = express.Router();
router.use(protect, admin);

// Exercises CRUD
router.get("/", listPracticeExercises);
router.post("/", createPracticeExercise);
router.get("/:id", getPracticeExerciseById);
router.put("/:id", updatePracticeExercise);
router.delete("/:id", deletePracticeExercise);

// Items CRUD
router.post("/:exerciseId/items", createPracticeExerciseItem);
router.put("/:exerciseId/items/:itemId", updatePracticeExerciseItem);
router.delete("/:exerciseId/items/:itemId", deletePracticeExerciseItem);

module.exports = router;

