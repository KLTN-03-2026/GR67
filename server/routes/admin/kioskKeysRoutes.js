const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/authMiddleware');
const {
  listKioskKeys,
  createKioskKey,
  lockKioskKey,
  unlockKioskKey,
  revokeKioskKey,
  rotateKioskSecret,
} = require('../../controllers/admin/kioskKeysController');

router.use(protect);
router.use(admin);

router.get('/', listKioskKeys);
router.post('/', createKioskKey);
router.patch('/:id/lock', lockKioskKey);
router.patch('/:id/unlock', unlockKioskKey);
router.post('/:id/revoke', revokeKioskKey);
router.post('/:id/rotate-secret', rotateKioskSecret);

module.exports = router;
