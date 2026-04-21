const NguoiDung = require('../../models/NguoiDung');
const HocVien = require('../../models/HocVien');
const GiangVien = require('../../models/GiangVien');
const KhoaHoc = require('../../models/KhoaHoc');
const BuoiHoc = require('../../models/BuoiHoc');
const bcrypt = require('bcryptjs');
const { sendOTP } = require('../authController');
const { sanitizeHocVienPublic } = require('../../utils/sanitizeHocVien');
const { isResourceInUse } = require('../../utils/checkDependency');

// ==========================================
//  HELPER: xây dựng đối tượng filter chung
// ==========================================
const buildUserQuery = (queryParams, role) => {
    const query = { role };
    if (queryParams.active !== undefined) {
        query.trangThaiHoatDong = queryParams.active === 'true';
    }
    if (queryParams.search) {
        const regex = new RegExp(queryParams.search, 'i');
        query.$or = [
            { hovaten: regex },
            { email: regex },
            { soDienThoai: regex }
        ];
    }
    return query;
};

const isStrongPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/.test(String(password || ""));
};

const normalizeGenderToBoolean = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (['nam', 'male', 'm', 'true', '1'].includes(v)) return true;
        if (['nu', 'nữ', 'female', 'f', 'false', '0'].includes(v)) return false;
    }
    return undefined;
};

// ==========================================
//  ========== ADMIN MANAGEMENT ==========
// ==========================================

// GET /admin/users/admins  — Lấy danh sách admin
const getAllAdmins = async (req, res) => {
    try {
        const query = buildUserQuery(req.query, 'admin');
        const admins = await NguoiDung.find(query)
            .select('-password -maOTP -hanSuDungOTP')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: admins.length, data: admins });
    } catch (error) {
        console.error('Lỗi lấy danh sách admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// GET /admin/users/admins/:id  — Lấy chi tiết 1 admin
const getAdminById = async (req, res) => {
    try {
        const admin = await NguoiDung.findOne({ _id: req.params.id, role: 'admin' })
            .select('-password -maOTP -hanSuDungOTP')
            .lean();

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy admin' });
        }

        res.status(200).json({ success: true, data: admin });
    } catch (error) {
        console.error('Lỗi lấy chi tiết admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// POST /admin/users/admins  — Tạo tài khoản admin mới
const createAdmin = async (req, res) => {
    try {
        const { email, password, hovaten, soDienThoai, diachi, gioitinh, ngaysinh } = req.body;

        if (!email || !password || !hovaten) {
            return res.status(400).json({ success: false, message: 'Email, mật khẩu và họ tên là bắt buộc' });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
        }

        const exists = await NguoiDung.findOne({ email });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
        }

        const genderValue = normalizeGenderToBoolean(gioitinh);
        const newAdmin = new NguoiDung({
            email,
            password,
            hovaten,
            soDienThoai,
            diachi,
            gioitinh: genderValue,
            ngaysinh,
            role: 'admin',
            daXacThuc: true,
            trangThaiHoatDong: true
        });

        await newAdmin.save();

        const result = newAdmin.toObject();
        delete result.password;
        delete result.maOTP;
        delete result.hanSuDungOTP;

        res.status(201).json({ success: true, message: 'Tạo tài khoản admin thành công', data: result });
    } catch (error) {
        console.error('Lỗi tạo admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PUT /admin/users/admins/:id  — Cập nhật thông tin admin
const updateAdmin = async (req, res) => {
    try {
        const { hovaten, soDienThoai, diachi, gioitinh, ngaysinh, password } = req.body;
        const admin = await NguoiDung.findOne({ _id: req.params.id, role: 'admin' });

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy admin' });
        }

        admin.hovaten = hovaten;
        admin.soDienThoai = soDienThoai;
        admin.diachi = diachi;
        const genderValue = normalizeGenderToBoolean(gioitinh);
        if (genderValue !== undefined) admin.gioitinh = genderValue;
        admin.ngaysinh = ngaysinh;

        if (password !== undefined && password !== null && String(password).trim() !== '') {
            if (!isStrongPassword(password)) {
                return res.status(400).json({ success: false, message: 'Mật khẩu mới phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
            }
            admin.password = String(password);
        }

        await admin.save();
        const adminResult = admin.toObject();
        delete adminResult.password;
        delete adminResult.maOTP;
        delete adminResult.hanSuDungOTP;

        res.status(200).json({ success: true, message: 'Cập nhật thông tin admin thành công', data: adminResult });
    } catch (error) {
        console.error('Lỗi cập nhật admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PATCH /admin/users/admins/:id/status  — Khoá / Mở khoá tài khoản admin
const toggleAdminStatus = async (req, res) => {
    try {
        const { trangThaiHoatDong } = req.body;
        if (typeof trangThaiHoatDong !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        // Không cho phép tự khoá chính mình
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ success: false, message: 'Không thể khoá chính tài khoản của mình' });
        }

        const admin = await NguoiDung.findOneAndUpdate(
            { _id: req.params.id, role: 'admin' },
            { trangThaiHoatDong },
            { new: true }
        ).select('-password -maOTP -hanSuDungOTP');

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy admin' });
        }

        res.status(200).json({
            success: true,
            message: `Tài khoản admin đã ${trangThaiHoatDong ? 'được mở khóa' : 'bị khóa'}`,
            data: admin
        });
    } catch (error) {
        console.error('Lỗi thay đổi trạng thái admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PATCH /admin/users/admins/:id/password  — Đặt lại mật khẩu admin
const resetAdminPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const admin = await NguoiDung.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy admin' });
        }

        admin.password = newPassword; // pre-save hook sẽ hash tự động
        await admin.save();

        res.status(200).json({ success: true, message: 'Đặt lại mật khẩu admin thành công' });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// ==========================================
//  ========== TEACHER MANAGEMENT ==========
// ==========================================

// GET /admin/users/teachers  — Lấy danh sách giảng viên (kèm thông tin GiangVien)
const getAllTeachers = async (req, res) => {
    try {
        const query = buildUserQuery(req.query, 'teacher');
        const users = await NguoiDung.find(query)
            .select('-password -maOTP -hanSuDungOTP')
            .sort({ createdAt: -1 })
            .lean();

        // Lấy thêm thông tin chi tiết giảng viên
        const userIds = users.map(u => u._id);
        const giangVienList = await GiangVien.find({ userId: { $in: userIds } }).lean();
        const giangVienMap = {};
        giangVienList.forEach(gv => { giangVienMap[gv.userId.toString()] = gv; });

        const result = await Promise.all(users.map(async u => {
            const giangVienInfo = giangVienMap[u._id.toString()] || null;
            let inUse = false;
            if (giangVienInfo) {
                inUse = await isResourceInUse('giangvien', giangVienInfo._id);
            }
            return {
                ...u,
                giangVienInfo,
                inUse
            };
        }));

        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        console.error('Lỗi lấy danh sách giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// GET /admin/users/teachers/:id  — Lấy chi tiết 1 giảng viên
const getTeacherById = async (req, res) => {
    try {
        const user = await NguoiDung.findOne({ _id: req.params.id, role: 'teacher' })
            .select('-password -maOTP -hanSuDungOTP')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        const giangVienInfo = await GiangVien.findOne({ userId: user._id }).lean();

        res.status(200).json({ success: true, data: { ...user, giangVienInfo: giangVienInfo || null } });
    } catch (error) {
        console.error('Lỗi lấy chi tiết giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// POST /admin/users/teachers  — Tạo tài khoản giảng viên
const createTeacher = async (req, res) => {
    try {
        const {
            email, password, hovaten, soDienThoai, diachi, gioitinh, ngaysinh,
            TrinhDoHocVan, kinhnghiem, chuyenmon
        } = req.body;

        if (!email || !password || !hovaten) {
            return res.status(400).json({ success: false, message: 'Email, mật khẩu và họ tên là bắt buộc' });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
        }

        const exists = await NguoiDung.findOne({ email });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
        }

        // Tạo NguoiDung
        const genderValue = normalizeGenderToBoolean(gioitinh);
        const newUser = new NguoiDung({
            email, password, hovaten, soDienThoai, diachi, gioitinh: genderValue, ngaysinh,
            role: 'teacher',
            daXacThuc: false,
            trangThaiHoatDong: true
        });
        await newUser.save();

        const otp = await newUser.generateOTP();
        await sendOTP(email, otp);

        // Tạo GiangVien profile
        const newGiangVien = new GiangVien({
            userId: newUser._id,
            TrinhDoHocVan,
            kinhnghiem: kinhnghiem || 0,
            chuyenmon
        });
        await newGiangVien.save();

        const userResult = newUser.toObject();
        delete userResult.password;
        delete userResult.maOTP;
        delete userResult.hanSuDungOTP;

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản giảng viên thành công. OTP xác thực lần đầu đã gửi đến email; giảng viên cần nhập OTP rồi mới đăng nhập được.',
            data: { ...userResult, giangVienInfo: newGiangVien }
        });
    } catch (error) {
        console.error('Lỗi tạo giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PUT /admin/users/teachers/:id  — Cập nhật thông tin giảng viên
const updateTeacher = async (req, res) => {
    try {
        const { hovaten, soDienThoai, diachi, gioitinh, ngaysinh, TrinhDoHocVan, kinhnghiem, chuyenmon, password } = req.body;
        const user = await NguoiDung.findOne({ _id: req.params.id, role: 'teacher' });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        user.hovaten = hovaten;
        user.soDienThoai = soDienThoai;
        user.diachi = diachi;
        const genderValue = normalizeGenderToBoolean(gioitinh);
        if (genderValue !== undefined) user.gioitinh = genderValue;
        user.ngaysinh = ngaysinh;

        if (password !== undefined && password !== null && String(password).trim() !== '') {
            if (!isStrongPassword(password)) {
                return res.status(400).json({ success: false, message: 'Mật khẩu mới phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
            }
            user.password = String(password);
        }
        await user.save();

        const giangVienInfo = await GiangVien.findOneAndUpdate(
            { userId: req.params.id },
            { TrinhDoHocVan, kinhnghiem, chuyenmon },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin giảng viên thành công',
            data: { ...user.toObject(), giangVienInfo }
        });
    } catch (error) {
        console.error('Lỗi cập nhật giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PATCH /admin/users/teachers/:id/status  — Khoá / Mở khoá tài khoản giảng viên
const toggleTeacherStatus = async (req, res) => {
    try {
        const { trangThaiHoatDong } = req.body;
        if (typeof trangThaiHoatDong !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        // ── Kiểm tra khoá giảng viên đang có buổi dạy ──────────────────────────
        if (trangThaiHoatDong === false) {
            const giangVienDoc = await GiangVien.findOne({ userId: req.params.id }).select('_id').lean();
            if (giangVienDoc) {
                // Tìm tất cả khóa học mà giảng viên này đang phụ trách
                const khoaHocList = await KhoaHoc.find({ giangvien: giangVienDoc._id })
                    .select('_id tenkhoahoc')
                    .lean();

                if (khoaHocList.length > 0) {
                    const khoaHocIds = khoaHocList.map(k => k._id);
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);

                    // Kiểm tra có buổi dạy từ hôm nay trở đi không
                    const futureBuoiHoc = await BuoiHoc.findOne({
                        KhoaHocID: { $in: khoaHocIds },
                        ngayhoc: { $gte: todayStart }
                    }).select('_id KhoaHocID').lean();

                    if (futureBuoiHoc) {
                        // Lấy danh sách khóa học bị ảnh hưởng (có buổi dạy tương lai)
                        const affectedIds = await BuoiHoc.distinct('KhoaHocID', {
                            KhoaHocID: { $in: khoaHocIds },
                            ngayhoc: { $gte: todayStart }
                        });
                        const affectedCourses = khoaHocList.filter(k =>
                            affectedIds.some(id => String(id) === String(k._id))
                        );

                        return res.status(409).json({
                            success: false,
                            message: 'Không thể khóa giảng viên vì họ đang có buổi dạy chưa hoàn thành. ' +
                                'Vui lòng thay thế giảng viên trong các khóa học sau trước khi khóa tài khoản.',
                            data: {
                                affectedCourses: affectedCourses.map(k => ({
                                    courseId: k._id,
                                    tenkhoahoc: k.tenkhoahoc
                                }))
                            }
                        });
                    }
                }
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        const user = await NguoiDung.findOneAndUpdate(
            { _id: req.params.id, role: 'teacher' },
            { trangThaiHoatDong },
            { new: true }
        ).select('-password -maOTP -hanSuDungOTP');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        res.status(200).json({
            success: true,
            message: `Tài khoản giảng viên đã ${trangThaiHoatDong ? 'được mở khóa' : 'bị khóa'}`,
            data: user
        });
    } catch (error) {
        console.error('Lỗi thay đổi trạng thái giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// DELETE /admin/users/teachers/:id — Xóa vĩnh viễn giảng viên
const deleteTeacher = async (req, res) => {
    try {
        const teacherUserId = req.params.id;

        const giangVienProfile = await GiangVien.findOne({ userId: teacherUserId }).lean();
        if (!giangVienProfile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin giảng viên' });
        }

        const inUse = await isResourceInUse('giangvien', giangVienProfile._id);
        if (inUse) {
            return res.status(400).json({
                success: false,
                message: 'Giảng viên này đã được phân công dạy khóa học hoặc có lịch dạy, không thể xóa. Vui lòng sử dụng tính năng "Khóa" tài khoản thay vì xóa.'
            });
        }

        await GiangVien.deleteOne({ userId: teacherUserId });
        await NguoiDung.deleteOne({ _id: teacherUserId });

        res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn tài khoản giảng viên' });
    } catch (error) {
        console.error('Lỗi xóa giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PATCH /admin/users/teachers/:id/password  — Đặt lại mật khẩu giảng viên
const resetTeacherPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const teacher = await NguoiDung.findOne({ _id: req.params.id, role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        teacher.password = newPassword;
        await teacher.save();

        res.status(200).json({ success: true, message: 'Đặt lại mật khẩu giảng viên thành công' });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// ==========================================
//  ========== STUDENT MANAGEMENT ==========
// ==========================================

// GET /admin/users/students  — Lấy danh sách học viên (kèm thông tin HocVien)
const getAllStudents = async (req, res) => {
    try {
        const query = buildUserQuery(req.query, 'student');
        const users = await NguoiDung.find(query)
            .select('-password -maOTP -hanSuDungOTP')
            .sort({ createdAt: -1 })
            .lean();

        const userIds = users.map(u => u._id);
        const hocVienList = await HocVien.find({ userId: { $in: userIds } }).lean();
        const hocVienMap = {};
        hocVienList.forEach(hv => { hocVienMap[hv.userId.toString()] = hv; });

        const result = await Promise.all(users.map(async u => {
            const hocVienInfo = hocVienMap[u._id.toString()] || null;
            let inUse = false;
            if (hocVienInfo) {
                inUse = await isResourceInUse('hocvien', hocVienInfo._id);
            }
            return {
                ...u,
                hocVienInfo: sanitizeHocVienPublic(hocVienInfo),
                inUse
            };
        }));

        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        console.error('Lỗi lấy danh sách học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// GET /admin/users/students/:id  — Lấy chi tiết 1 học viên
const getStudentById = async (req, res) => {
    try {
        const user = await NguoiDung.findOne({ _id: req.params.id, role: 'student' })
            .select('-password -maOTP -hanSuDungOTP')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
        }

        const hocVienInfo = await HocVien.findOne({ userId: user._id }).lean();

        res.status(200).json({
            success: true,
            data: { ...user, hocVienInfo: sanitizeHocVienPublic(hocVienInfo) || null }
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// POST /admin/users/students  — Tạo tài khoản học viên
const createStudent = async (req, res) => {
    try {
        const {
            email, password, hovaten, soDienThoai, diachi, gioitinh, ngaysinh,
        } = req.body;

        if (!email || !password || !hovaten) {
            return res.status(400).json({ success: false, message: 'Email, mật khẩu và họ tên là bắt buộc' });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
        }

        const exists = await NguoiDung.findOne({ email });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
        }

        // Tạo NguoiDung
        const genderValue = normalizeGenderToBoolean(gioitinh);
        const newUser = new NguoiDung({
            email, password, hovaten, soDienThoai, diachi, gioitinh: genderValue, ngaysinh,
            role: 'student',
            daXacThuc: false,
            trangThaiHoatDong: true
        });
        await newUser.save();

        const otp = await newUser.generateOTP();
        await sendOTP(email, otp);

        // Tạo HocVien profile
        const newHocVien = new HocVien({
            userId: newUser._id,
            faceEmbedding: []
        });
        await newHocVien.save();

        const userResult = newUser.toObject();
        delete userResult.password;
        delete userResult.maOTP;
        delete userResult.hanSuDungOTP;

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản học viên thành công. OTP xác thực lần đầu đã gửi đến email; học viên cần nhập OTP rồi mới đăng nhập được.',
            data: { ...userResult, hocVienInfo: sanitizeHocVienPublic(newHocVien) }
        });
    } catch (error) {
        console.error('Lỗi tạo học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PUT /admin/users/students/:id  — Cập nhật thông tin học viên
const updateStudent = async (req, res) => {
    try {
        const { hovaten, soDienThoai, diachi, gioitinh, ngaysinh, password } = req.body;
        const user = await NguoiDung.findOne({ _id: req.params.id, role: 'student' });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
        }

        user.hovaten = hovaten;
        user.soDienThoai = soDienThoai;
        user.diachi = diachi;
        const genderValue = normalizeGenderToBoolean(gioitinh);
        if (genderValue !== undefined) user.gioitinh = genderValue;
        user.ngaysinh = ngaysinh;

        if (password !== undefined && password !== null && String(password).trim() !== '') {
            if (!isStrongPassword(password)) {
                return res.status(400).json({ success: false, message: 'Mật khẩu mới phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
            }
            user.password = String(password);
        }
        await user.save();

        const hocVienInfo = await HocVien.findOneAndUpdate(
            { userId: req.params.id },
            {},
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin học viên thành công',
            data: { ...user.toObject(), hocVienInfo: sanitizeHocVienPublic(hocVienInfo) }
        });
    } catch (error) {
        console.error('Lỗi cập nhật học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// DELETE /admin/users/students/:id — Xóa vĩnh viễn học viên
const deleteStudent = async (req, res) => {
    try {
        const studentUserId = req.params.id;

        const hocVienProfile = await HocVien.findOne({ userId: studentUserId }).lean();
        if (!hocVienProfile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin học viên' });
        }

        const inUse = await isResourceInUse('hocvien', hocVienProfile._id);
        if (inUse) {
            return res.status(400).json({
                success: false,
                message: 'Học viên này đã tham gia khóa học, không thể xóa. Vui lòng sử dụng tính năng "Khóa" tài khoản thay vì xóa.'
            });
        }

        await HocVien.deleteOne({ userId: studentUserId });
        await NguoiDung.deleteOne({ _id: studentUserId });

        res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn tài khoản học viên' });
    } catch (error) {
        console.error('Lỗi xóa học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PATCH /admin/users/students/:id/status  — Khoá / Mở khoá tài khoản học viên
const toggleStudentStatus = async (req, res) => {
    try {
        const { trangThaiHoatDong } = req.body;
        if (typeof trangThaiHoatDong !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const user = await NguoiDung.findOneAndUpdate(
            { _id: req.params.id, role: 'student' },
            { trangThaiHoatDong },
            { new: true }
        ).select('-password -maOTP -hanSuDungOTP');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
        }

        res.status(200).json({
            success: true,
            message: `Tài khoản học viên đã ${trangThaiHoatDong ? 'được mở khóa' : 'bị khóa'}`,
            data: user
        });
    } catch (error) {
        console.error('Lỗi thay đổi trạng thái học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PATCH /admin/users/students/:id/password  — Đặt lại mật khẩu học viên
const resetStudentPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const student = await NguoiDung.findOne({ _id: req.params.id, role: 'student' });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
        }

        student.password = newPassword;
        await student.save();

        res.status(200).json({ success: true, message: 'Đặt lại mật khẩu học viên thành công' });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// ==========================================
//  ========== TEACHER SELF-PROFILE =========
// ==========================================
// GET  /teacher/profile  — Giảng viên xem thông tin cá nhân của mình
const getTeacherProfile = async (req, res) => {
    try {
        const user = await NguoiDung.findById(req.user._id)
            .select('-password -maOTP -hanSuDungOTP')
            .lean();

        const giangVienInfo = await GiangVien.findOne({ userId: req.user._id }).lean();

        res.status(200).json({ success: true, data: { ...user, giangVienInfo: giangVienInfo || null } });
    } catch (error) {
        console.error('Lỗi lấy profile giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PUT  /teacher/profile  — Giảng viên cập nhật thông tin cá nhân
const updateTeacherProfile = async (req, res) => {
    try {
        const { hovaten, soDienThoai, diachi, gioitinh, ngaysinh, TrinhDoHocVan, kinhnghiem, chuyenmon } = req.body;

        const genderValue = normalizeGenderToBoolean(gioitinh);
        const userUpdate = { hovaten, soDienThoai, diachi, ngaysinh };
        if (genderValue !== undefined) userUpdate.gioitinh = genderValue;
        const user = await NguoiDung.findByIdAndUpdate(
            req.user._id,
            userUpdate,
            { new: true, runValidators: true }
        ).select('-password -maOTP -hanSuDungOTP');

        const giangVienInfo = await GiangVien.findOneAndUpdate(
            { userId: req.user._id },
            { TrinhDoHocVan, kinhnghiem, chuyenmon },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin cá nhân thành công',
            data: { ...user.toObject(), giangVienInfo }
        });
    } catch (error) {
        console.error('Lỗi cập nhật profile giảng viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// ==========================================
//  ========== STUDENT SELF-PROFILE =========
// ==========================================
// GET  /student/profile  — Học viên xem thông tin cá nhân của mình
const getStudentProfile = async (req, res) => {
    try {
        const user = await NguoiDung.findById(req.user._id)
            .select('-password -maOTP -hanSuDungOTP')
            .lean();

        const hocVienInfo = await HocVien.findOne({ userId: req.user._id }).lean();

        res.status(200).json({
            success: true,
            data: { ...user, hocVienInfo: sanitizeHocVienPublic(hocVienInfo) || null }
        });
    } catch (error) {
        console.error('Lỗi lấy profile học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// PUT  /student/profile  — Học viên cập nhật thông tin cá nhân
const updateStudentProfile = async (req, res) => {
    try {
        const { hovaten, soDienThoai, diachi, gioitinh, ngaysinh } = req.body;

        const genderValue = normalizeGenderToBoolean(gioitinh);
        const userUpdate = { hovaten, soDienThoai, diachi, ngaysinh };
        if (genderValue !== undefined) userUpdate.gioitinh = genderValue;
        const user = await NguoiDung.findByIdAndUpdate(
            req.user._id,
            userUpdate,
            { new: true, runValidators: true }
        ).select('-password -maOTP -hanSuDungOTP');

        const hocVienInfo = await HocVien.findOne({ userId: req.user._id }).lean();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin cá nhân thành công',
            data: { ...user.toObject(), hocVienInfo: sanitizeHocVienPublic(hocVienInfo) || null }
        });
    } catch (error) {
        console.error('Lỗi cập nhật profile học viên:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

module.exports = {
    // Admin CRUD
    getAllAdmins, getAdminById, createAdmin, updateAdmin, toggleAdminStatus, resetAdminPassword,
    // Teacher CRUD (by admin)
    getAllTeachers, getTeacherById, createTeacher, updateTeacher, toggleTeacherStatus, deleteTeacher, resetTeacherPassword,
    // Student CRUD (by admin)
    getAllStudents, getStudentById, createStudent, updateStudent, toggleStudentStatus, deleteStudent, resetStudentPassword,
    // Self-profile
    getTeacherProfile, updateTeacherProfile,
    getStudentProfile, updateStudentProfile,
};
