const jwt = require('jsonwebtoken');
const User = require('../models/NguoiDung');

/**
 * Giảng viên / học viên phải có daXacThuc === true mới được gọi API có JWT (tránh token cũ hoặc bất thường).
 */
const isStudentOrTeacherVerified = (user) => {
  if (!user) return true;
  if (user.role !== 'student' && user.role !== 'teacher') return true;
  return user.daXacThuc === true;
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ token và gắn vào request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Không được phép, user không tồn tại' });
      }

      if (!isStudentOrTeacherVerified(req.user)) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_NOT_VERIFIED',
          message: 'Tài khoản chưa xác thực OTP. Vui lòng đăng nhập và hoàn tất xác thực email.'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Không được phép, token không hợp lệ' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không được phép, không có token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Không được phép, yêu cầu quyền admin' });
  }
};

const teacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Không được phép, yêu cầu quyền giảng viên' });
  }
};

const student = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Không được phép, yêu cầu quyền học viên' });
  }
};

module.exports = { protect, admin, teacher, student, isStudentOrTeacherVerified };