const HocVien = require('../../models/HocVien');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const BuoiHoc = require('../../models/BuoiHoc');
const ThamGiaBuoiHoc = require('../../models/ThamGiaBuoiHoc');
const KhoaHoc = require('../../models/KhoaHoc');
const GiangVien = require('../../models/GiangVien');
const NguoiDung = require('../../models/NguoiDung');

// GET /student/courses
exports.getMyCourses = async (req, res) => {
    try {
        const student = await HocVien.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học viên" });
        }

        const enrolled = await DangKyKhoaHoc.find({ hocvienId: student._id })
            .populate('KhoaHocID', 'tenkhoahoc ngaykhaigiang giangvien lichHoc')
            .sort({ createdAt: -1 });

        const dayMap = { 0: 'CN', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7' };

        const formatted = await Promise.all(enrolled.map(async (enroll) => {
            const khoahoc = enroll.KhoaHocID;
            if(!khoahoc) return null;
            
            // Lấy tên giảng viên thủ công để tránh bất đồng bộ populate sâu
            let teacherName = "Đang cập nhật";
            if (khoahoc.giangvien) {
                try {
                    const gv = await GiangVien.findById(khoahoc.giangvien);
                    if (gv && gv.userId) {
                        const nd = await NguoiDung.findById(gv.userId);
                        if (nd) teacherName = nd.hovaten;
                    }
                } catch (err) {
                    console.error("Lỗi lấy thông tin giảng viên: ", err);
                }
            }

            // Tóm tắt lịch học
            let scheduleText = "Chưa xếp lịch";
            if (khoahoc.lichHoc && khoahoc.lichHoc.length > 0) {
                scheduleText = khoahoc.lichHoc.map(l => `${dayMap[l.thu] || l.thu} (${l.gioBatDau}-${l.gioKetThuc})`).join(', ');
            }
            
            // Xử lý status và ngày khai giảng
            let status = "Đang mở";
            let startDateText = "Chưa xác định";
            if (khoahoc.ngaykhaigiang) {
                const kgDate = new Date(khoahoc.ngaykhaigiang);
                startDateText = kgDate.toLocaleDateString('vi-VN');
                if(kgDate > new Date()) status = "Sắp khai giảng";
            }

            return {
                id: khoahoc._id,
                tenkhoahoc: khoahoc.tenkhoahoc,
                name: khoahoc.tenkhoahoc, // For frontend backward compatibility
                dangKyKhoaHocId: enroll._id,
                teacherName: teacherName,
                scheduleText: scheduleText,
                startDate: startDateText,
                status: status
            };
        }));
        
        const finalData = formatted.filter(c => c !== null);

        res.json({ success: true, data: finalData });
    } catch (err) {
        console.error("Lỗi getMyCourses:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// GET /student/courses/:courseId/sessions
exports.getUpcomingSessions = async (req, res) => {
    try {
        const { courseId } = req.params;
        // Fetch up coming sessions for this course
        // Optional: filter only sessions >= today so they can't ask for a leave in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessions = await BuoiHoc.find({
            KhoaHocID: courseId,
            ngayhoc: { $gte: today }
        })
            .populate("BaiHocID", "tenbai thutu")
            .sort({ ngayhoc: 1 });

        const formatted = sessions.map(s => ({
            id: s._id,
            tenbai: s.BaiHocID?.tenbai || `Buổi học`,
            thutu: s.BaiHocID?.thutu,
            ngayhoc: s.ngayhoc,
            giobatdau: s.giobatdau,
            gioketthuc: s.gioketthuc
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error("Lỗi getUpcomingSessions:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// POST /student/leave-requests
exports.createLeaveRequest = async (req, res) => {
    try {
        const { dangKyKhoaHocId, buoihocID, loai_don, lydo_nghi } = req.body;

        if (!dangKyKhoaHocId || !buoihocID || !loai_don) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp đủ thông tin khóa học, buổi học và lý do" });
        }

        const student = await HocVien.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học viên" });
        }

        // Check if registration valid
        const enroll = await DangKyKhoaHoc.findById(dangKyKhoaHocId);
        if (!enroll || String(enroll.hocvienId) !== String(student._id)) {
            return res.status(403).json({ success: false, message: "Bạn chưa đăng ký khóa học này" });
        }

        // Check session details to get ngay_bat_dau, ngay_ket_thuc
        const buoihoc = await BuoiHoc.findById(buoihocID);
        if (!buoihoc) {
            return res.status(404).json({ success: false, message: "Buổi học không tồn tại" });
        }

        // Check if there is already a record
        let record = await ThamGiaBuoiHoc.findOne({
            dangkykhoahocID: dangKyKhoaHocId,
            buoihocID: buoihocID
        });

        if (record) {
            if (record.trangthai === 'excused') {
                return res.status(400).json({ success: false, message: "Bạn đã xin nghỉ phép cho buổi học này rồi" });
            }
            // Update existing record
            record.trangthai = 'excused';
            record.loai_don = loai_don;
            record.lydo_nghi = lydo_nghi;
            record.trangthai_duyet = 'pending';
            record.thoigian_nop = new Date();
            record.ngay_bat_dau = buoihoc.giobatdau;
            record.ngay_ket_thuc = buoihoc.gioketthuc;
            await record.save();
        } else {
            // Create new
            record = new ThamGiaBuoiHoc({
                dangkykhoahocID: dangKyKhoaHocId,
                buoihocID: buoihocID,
                trangthai: 'excused',
                thoigian_nop: new Date(),
                loai_don,
                lydo_nghi,
                trangthai_duyet: 'pending',
                ngay_bat_dau: buoihoc.giobatdau,
                ngay_ket_thuc: buoihoc.gioketthuc
            });
            await record.save();
        }

        // Notify only the teacher
        try {
            const course = await KhoaHoc.findById(enroll.KhoaHocID).populate('giangvien');
            if (course && course.giangvien) {
                const teacherUserId = course.giangvien.userId;
                if (teacherUserId) {
                    const ThongBao = require('../../models/ThongBao');
                    const studentUser = await NguoiDung.findById(student.userId);
                    await ThongBao.create({
                        tieuDe: 'Đơn xin nghỉ học mới',
                        noidung: `Học viên ${studentUser?.hovaten || 'Một học viên'} vừa gửi đơn xin phép nghỉ học cho khóa học "${course.tenkhoahoc}".`,
                        targetType: 'personal',
                        khoaHocId: course._id,
                        userID: [teacherUserId],
                        createdBy: req.user._id,
                        link: '/teacher/courses' 
                    });
                }
            }
        } catch (notifyErr) {
            console.error("Lỗi gửi thông báo cho giảng viên:", notifyErr);
        }

        res.status(201).json({ success: true, message: "Đã gửi yêu cầu nghỉ phép" });
    } catch (err) {
        console.error("Lỗi createLeaveRequest:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// GET /student/leave-requests
exports.getLeaveRequests = async (req, res) => {
    try {
        const student = await HocVien.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy học viên" });
        }

        // find all enrolled courses
        const enrolled = await DangKyKhoaHoc.find({ hocvienId: student._id }).select('_id');
        const enrolledIds = enrolled.map(e => e._id);

        const requests = await ThamGiaBuoiHoc.find({
            dangkykhoahocID: { $in: enrolledIds },
            trangthai: 'excused'
        })
            .populate({
                path: 'dangkykhoahocID',
                populate: {
                    path: 'KhoaHocID',
                    select: 'tenkhoahoc'
                }
            })
            .populate('buoihocID', 'ngayhoc giobatdau gioketthuc')
            .sort({ createdAt: -1 });

        const formatted = requests.map(req => ({
            id: req._id,
            tenkhoahoc: req.dangkykhoahocID?.KhoaHocID?.tenkhoahoc,
            lydo_nghi: req.loai_don,
            chi_tiet: req.lydo_nghi,
            ngay_bat_dau: req.ngay_bat_dau,
            ngay_ket_thuc: req.ngay_ket_thuc,
            trangthai_duyet: req.trangthai_duyet,
            thoigian_nop: req.thoigian_nop || req.createdAt
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error("Lỗi getLeaveRequests:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};