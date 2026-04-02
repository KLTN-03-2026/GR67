const User = require('../models/NguoiDung');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // So sánh mật khẩu
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có active không
    if (!user.trangThaiHoatDong) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Nếu là student hoặc teacher và chưa verify, gửi OTP và redirect
    if ((user.role === 'student' || user.role === 'teacher') && !user.daXacThuc) {
      // Generate and send OTP
      const otp = await user.generateOTP();
      await sendOTP(email, otp);

      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. OTP đã được gửi đến email của bạn.',
        redirectToVerify: true,
        email: user.email
      });
    }

    // Tạo token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d' // Token hết hạn sau 30 ngày
    });

    // Đăng nhập thành công
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        hovaten: user.hovaten,
        soDienThoai: user.soDienThoai
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/.test(String(password || ""));
};

const register = async (req, res) => {
  try {
    const { email, password, hovaten, soDienThoai } = req.body;
    console.log(`Register attempt for: ${email}`);

    // Validate input
    const resolvedFullName = (hovaten || "").trim();
    const resolvedPhone = (soDienThoai || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      });
    }
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Create new user
    const newUser = new User({
      email,
      password: password, // Sẽ được hash tự động bởi middleware
      hovaten: resolvedFullName || undefined,
      soDienThoai: resolvedPhone || undefined,
      role: 'student', // Đăng ký mặc định là học viên
      daXacThuc: false,
      trangThaiHoatDong: true
    });

    await newUser.save();
    console.log('User registered successfully');

    const otp = await newUser.generateOTP();
    await sendOTP(email, otp);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng nhập mã OTP đã gửi đến email để hoàn tất xác thực trước khi đăng nhập.',
      requireVerification: true,
      email: newUser.email,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        hovaten: newUser.hovaten,
        soDienThoai: newUser.soDienThoai
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Xác thực tài khoản - Mã OTP',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #f4f7fa; padding: 30px 20px; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
          <h1 style="color: #1a73b5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">EMC</h1>
          <p style="color: #7f8c8d; font-size: 13px; margin-top: 5px; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px;">English Center</p>
          
          <hr style="border: none; border-top: 2px solid #f0f3f6; margin-bottom: 30px;">
          
          <h2 style="color: #2c3e50; font-size: 22px; margin-bottom: 15px;">Xác Thực Tài Khoản</h2>
          <p style="color: #555; font-size: 16px; margin-bottom: 5px;">Chào bạn,</p>
          <p style="color: #555; font-size: 16px; margin-bottom: 25px;">Mã OTP dùng cho việc xác thực tài khoản của bạn là:</p>
          
          <div style="margin: 0 auto 30px; padding: 20px; background-color: #e8f4fd; border: 2px dashed #8ec3ea; border-radius: 8px; max-width: 250px;">
            <strong style="font-size: 38px; color: #1a73b5; letter-spacing: 8px; font-family: monospace;">${otp}</strong>
          </div>
          
          <p style="color: #7f8c8d; font-size: 15px; margin-bottom: 10px;">Mã này sẽ hết hạn tự động sau <strong>10 phút</strong>.</p>
          <p style="color: #95a5a6; font-size: 13px;">Nếu bạn không có yêu cầu tạo tài khoản tại EMC, vui lòng xóa hoặc bỏ qua email này.</p>
          
          <hr style="border: none; border-top: 1px solid #f0f3f6; margin-top: 35px; margin-bottom: 20px;">
          
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Trân trọng,</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 5px 0 0; font-weight: bold;">Đội ngũ Hỗ trợ EMC</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP sent to:', email);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Không thể gửi email OTP');
  }
};

const sendPasswordResetOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Đặt lại mật khẩu - Mã OTP',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #f4f7fa; padding: 30px 20px; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
          <h1 style="color: #e74c3c; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">EMC</h1>
          <p style="color: #7f8c8d; font-size: 13px; margin-top: 5px; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px;">English Center</p>
          
          <hr style="border: none; border-top: 2px solid #f0f3f6; margin-bottom: 30px;">
          
          <h2 style="color: #2c3e50; font-size: 22px; margin-bottom: 15px;">Khôi Phục Mật Khẩu</h2>
          <p style="color: #555; font-size: 16px; margin-bottom: 5px;">Chào bạn,</p>
          <p style="color: #555; font-size: 16px; margin-bottom: 25px;">Bạn đã gửi yêu cầu thay đổi mật khẩu. Mã OTP của bạn là:</p>
          
          <div style="margin: 0 auto 30px; padding: 20px; background-color: #fcebeb; border: 2px dashed #f5b7b1; border-radius: 8px; max-width: 250px;">
            <strong style="font-size: 38px; color: #e74c3c; letter-spacing: 8px; font-family: monospace;">${otp}</strong>
          </div>
          
          <p style="color: #7f8c8d; font-size: 15px; margin-bottom: 10px;">Mã này sẽ hết hạn tự động sau <strong>10 phút</strong>.</p>
          <p style="color: #95a5a6; font-size: 13px;">Vì lý do bảo mật, vui lòng không cung cấp mã này cho ai. Nếu bạn không yêu cầu, vui lòng đổi mật khẩu ngay lập tức.</p>
          
          <hr style="border: none; border-top: 1px solid #f0f3f6; margin-top: 35px; margin-bottom: 20px;">
          
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Trân trọng,</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 5px 0 0; font-weight: bold;">Đội ngũ Hỗ trợ EMC Bản Mật</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset OTP sent to:', email);
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw new Error('Không thể gửi email OTP');
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email và OTP là bắt buộc'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    if (user.daXacThuc) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã được xác thực'
      });
    }

    if (user.role !== 'student' && user.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Loại tài khoản này không dùng xác thực OTP đăng nhập lần đầu'
      });
    }

    const isValidOTP = await user.verifyOTP(otp, { markVerified: true });
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP không hợp lệ hoặc đã hết hạn'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xác thực tài khoản thành công'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    if (user.daXacThuc) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã được xác thực'
      });
    }

    if (user.role !== 'student' && user.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Loại tài khoản này không dùng gửi lại OTP xác thực đăng nhập'
      });
    }

    // Generate and send new OTP
    const otp = await user.generateOTP();
    await sendOTP(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP mới đã được gửi đến email của bạn'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Kiểm tra tài khoản có active không
    if (!user.trangThaiHoatDong) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Generate and send OTP for password reset
    const otp = await user.generateOTP();
    await sendPasswordResetOTP(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP đã được gửi đến email của bạn'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email và OTP là bắt buộc'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    const isValidOTP = await user.verifyOTP(otp, { markVerified: false });
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP không hợp lệ hoặc đã hết hạn'
      });
    }

    // Tạo token tạm thời cho việc reset password
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Token hết hạn sau 15 phút
    );

    res.status(200).json({
      success: true,
      message: 'OTP hợp lệ',
      resetToken
    });

  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả các trường là bắt buộc'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    // Update password
    user.password = newPassword; // Sẽ được hash bởi middleware
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

module.exports = {
  login,
  register,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  sendOTP
};
