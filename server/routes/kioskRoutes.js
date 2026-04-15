const express = require('express');
const multer = require('multer');
const { kioskAuth } = require('../middlewares/kioskAuth');
const {
  kioskRecognize,
  kioskConfirm,
  kioskMisidentification,
} = require('../controllers/attendance/kioskController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.post('/recognize', kioskAuth, upload.single('image'), kioskRecognize);
router.post('/confirm', kioskAuth, kioskConfirm);
router.post('/misidentification', kioskAuth, kioskMisidentification);

module.exports = router;
