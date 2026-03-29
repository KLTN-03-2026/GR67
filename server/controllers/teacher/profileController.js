const GiangVien = require("../../models/GiangVien");
const User = require("../../models/NguoiDung");
const bcrypt = require("bcryptjs");

// GET PROFILE
const getProfile = async (req, res) => {
    try {
        // req.user được gán từ authMiddleware (protect)
        const gv = await GiangVien.findOne({
            MaTaiKhoan: req.user._id
        }).populate("MaTaiKhoan", "email");

        if (!gv) {
            return res.status(404).json({ message: "Không tìm thấy thông tin giảng viên" });
        }

        res.json(gv);
    } catch (err) {
        console.error("Lỗi Get Profile:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        // Lấy dữ liệu từ body và map lại cho đúng Schema
        const updateData = {
            hoTen: req.body.hoTen,
            soDienThoai: req.body.soDienThoai,
            ngaySinh: req.body.ngaySinh,
            diaChi: req.body.diaChi,
            gioiTinh: req.body.gioiTinh,
            trinhDo: req.body.trinhDo,
            kinhNghiem: req.body.kinhNghiem,
            chuyenMon: req.body.chuyenMon
        };

        const gv = await GiangVien.findOneAndUpdate(
            { MaTaiKhoan: req.user._id },
            updateData, // Sử dụng object đã map đúng tên trường
            { new: true, runValidators: true }
        );

        if (!gv) {
            return res.status(404).json({ message: "Không tìm thấy để cập nhật" });
        }

        res.json(gv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi update" });
    }
};
// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const { matKhauHienTai, matKhauMoi } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const isMatch = await bcrypt.compare(matKhauHienTai, user.hashpassword);

        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
        }

        // Mã hóa mật khẩu mới trước khi lưu (Quan trọng!)
        const salt = await bcrypt.genSalt(10);
        user.hashpassword = await bcrypt.hash(matKhauMoi, salt);

        await user.save();
        res.json({ message: "Đổi mật khẩu thành công" });

    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi đổi mật khẩu" });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};