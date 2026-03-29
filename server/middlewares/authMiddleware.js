const jwt = require('jsonwebtoken');
const User = require('../models/NguoiDung');

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

module.exports = { protect, admin };