const GiangVien = require("../../models/GiangVien");
const User = require("../../models/NguoiDung");
const bcrypt = require("bcryptjs");

// GET PROFILE
const getProfile = async (req, res) => {
    try {
        // req.user được gán từ authMiddleware (protect)
        const gv = await GiangVien.findOne({
            userId: req.user._id
        }).populate("userId", "email hovaten soDienThoai diachi ngaysinh gioiTinh role");

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
        const { hoTen, soDienThoai, ngaySinh, diaChi, gioiTinh, trinhDo, kinhNghiem, chuyenMon } = req.body;

        // Cập nhật NguoiDung (User)
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { hovaten: hoTen, soDienThoai: soDienThoai, ngaysinh: ngaySinh, diachi: diaChi, gioitinh: gioiTinh === 'male' },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        // Cập nhật GiangVien
        const gv = await GiangVien.findOneAndUpdate(
            { userId: req.user._id },
            { TrinhDoHocVan: trinhDo, kinhnghiem: kinhNghiem, chuyenmon: chuyenMon },
            { new: true, runValidators: true }
        ).populate("userId");

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

        // Compare
        const isMatch = await bcrypt.compare(matKhauHienTai, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
        }

        // Đổi mật khẩu - hook pre-save của model NguoiDung sẽ tự hash
        user.password = matKhauMoi;
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