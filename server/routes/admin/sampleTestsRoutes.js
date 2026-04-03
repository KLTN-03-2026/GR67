const express = require("express");
const { protect, admin } = require("../../middlewares/authMiddleware");

const {
  listSampleTests,
  createSampleTest,
  getSampleTestById,
  updateSampleTest,
  deleteSampleTest,
  createSampleTestPart,
  updateSampleTestPart,
  deleteSampleTestPart,
  createSampleTestGroup,
  updateSampleTestGroup,
  deleteSampleTestGroup,
  createSampleTestQuestion,
  updateSampleTestQuestion,
  deleteSampleTestQuestion,
} = require("../../controllers/admin/sampleTestsController");

const router = express.Router();

router.use(protect, admin);

// Sample tests CRUD (metadata)
router.get("/", listSampleTests);
router.post("/", createSampleTest);
router.get("/:id", getSampleTestById);
router.put("/:id", updateSampleTest);
router.delete("/:id", deleteSampleTest);

// Parts CRUD
router.post("/:testId/parts", createSampleTestPart);
router.put("/:testId/parts/:partId", updateSampleTestPart);
router.delete("/:testId/parts/:partId", deleteSampleTestPart);

// Questions CRUD (MCQ)
router.post("/:testId/parts/:partId/questions", createSampleTestQuestion);
router.put("/:testId/parts/:partId/questions/:questionId", updateSampleTestQuestion);
router.delete("/:testId/parts/:partId/questions/:questionId", deleteSampleTestQuestion);

// Groups CRUD
router.post("/:testId/parts/:partId/groups", createSampleTestGroup);
router.put("/:testId/parts/:partId/groups/:groupId", updateSampleTestGroup);
router.delete("/:testId/parts/:partId/groups/:groupId", deleteSampleTestGroup);

module.exports = router;

