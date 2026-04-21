const KhoaHoc = require('../models/KhoaHoc');
const BuoiHoc = require('../models/BuoiHoc');

/**
 * Checks if a resource is being used by any Course or Session.
 * @param {string} type - 'coso' | 'phonghoc' | 'loaikhoahoc' | 'baihoc' | 'giangvien'
 * @param {string} id - The ID of the resource to check
 * @returns {Promise<boolean>} - True if in use, false otherwise
 */
const isResourceInUse = async (type, id) => {
  try {
    switch (type) {
      case 'coso':
        // Check if any course is assigned to this campus
        const courseWithCoso = await KhoaHoc.findOne({ CoSoId: id });
        return !!courseWithCoso;

      case 'phonghoc':
        // Check if any session is assigned to this room
        const sessionWithRoom = await BuoiHoc.findOne({ phonghoc: id });
        return !!sessionWithRoom;

      case 'loaikhoahoc':
        // Check if any course uses this course type
        const courseWithLoai = await KhoaHoc.findOne({ LoaiKhoaHocID: id });
        return !!courseWithLoai;

      case 'giangvien':
        // Check if teacher is assigned to any course or has sessions
        const courseWithTeacher = await KhoaHoc.findOne({ giangvien: id });
        if (courseWithTeacher) return true;
        
        // Also check sessions (as substitute or main teacher)
        const sessionWithTeacher = await BuoiHoc.findOne({ giangvien: id });
        return !!sessionWithTeacher;

      case 'hocvien':
        // Check if student has any enrollments
        const DangKyKhoaHoc = require('../models/DangKyKhoaHoc');
        const enrollment = await DangKyKhoaHoc.findOne({ hocvien: id });
        return !!enrollment;

      case 'baihoc':
        // This is tricky. Usually, if the LoaiKhoaHoc is in use, 
        // we might want to prevent deleting its lessons if they are part of active courses.
        // However, checking individual lessons in BuoiHoc/KhoaHoc depends on how sessions reference lessons.
        // If sessions reference lessons, check there.
        return false; // Default for now, can be expanded if Lesson usage is tracked

      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking dependency for ${type}:`, error);
    return true; // Assume in use on error to be safe
  }
};

module.exports = { isResourceInUse };
