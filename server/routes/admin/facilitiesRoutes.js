const express = require('express');
const router = express.Router();
const {
    getAllFacilities,
    createFacility,
    updateFacility,
    toggleFacilityStatus,
    addRoomToFacility,
    updateRoom,
    toggleRoomStatus
} = require('../../controllers/admin/facilitiesController');
const { protect, admin } = require('../../middlewares/authMiddleware');

// ================= CƠ SỞ (FACILITIES) =================
// Áp dụng middleware protect và admin cho toàn bộ các route quản lý cơ sở
router.use(protect);
router.use(admin);

// Lấy danh sách cơ sở cùng phòng học
router.get('/', getAllFacilities);

// Tạo mới cơ sở
router.post('/', createFacility);

// Sửa đổi chi tiết Cơ sở
router.put('/:id', updateFacility);

// Đóng cửa/Mở cửa cơ sở (Soft Delete)
router.patch('/:id/status', toggleFacilityStatus);

// ================= PHÒNG HỌC (ROOMS) =================

// Cài đặt phòng học mới vào 1 cơ sở
router.post('/:id/rooms', addRoomToFacility);

// Thay đổi tên / sức chứa của phòng học
router.put('/rooms/:roomId', updateRoom);

// Cất chức/khóa phòng học (Soft Delete)
router.patch('/rooms/:roomId/status', toggleRoomStatus);

module.exports = router;
