const ExcelJS = require('exceljs');
const HocVien = require('../../models/HocVien');
const GiangVien = require('../../models/GiangVien');
const KhoaHoc = require('../../models/KhoaHoc');
const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const ThamGiaBuoiHoc = require('../../models/ThamGiaBuoiHoc');
const Coso = require('../../models/Coso');
const NguoiDung = require('../../models/NguoiDung');
const BuoiHoc = require('../../models/BuoiHoc');

// Helper function to export to Excel
const exportToExcel = async (res, filename, columns, data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(filename);

    worksheet.columns = columns;

    data.forEach(item => {
        worksheet.addRow(item);
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
};

// 1. Export Students
const exportStudents = async (req, res) => {
    try {
        const students = await HocVien.find().populate({
            path: 'userId',
            select: 'hovaten email soDienThoai diachi gioitinh ngaysinh'
        });

        const columns = [
            { header: 'Họ và tên', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'Địa chỉ', key: 'address', width: 30 },
            { header: 'Giới tính', key: 'gender', width: 10 },
            { header: 'Ngày sinh', key: 'dob', width: 15 },
            { header: 'Ngày tham gia', key: 'createdAt', width: 20 },
        ];

        const data = students.map(s => ({
            name: s.userId?.hovaten || 'N/A',
            email: s.userId?.email || 'N/A',
            phone: s.userId?.soDienThoai || 'N/A',
            address: s.userId?.diachi || 'N/A',
            gender: s.userId?.gioitinh ? 'Nam' : 'Nữ',
            dob: s.userId?.ngaysinh ? new Date(s.userId.ngaysinh).toLocaleDateString('vi-VN') : 'N/A',
            createdAt: new Date(s.createdAt).toLocaleDateString('vi-VN'),
        }));

        await exportToExcel(res, 'DanhSachHocVien', columns, data);
    } catch (error) {
        console.error('Error exporting students:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất file Excel học viên' });
    }
};

// 2. Export Teachers
const exportTeachers = async (req, res) => {
    try {
        const teachers = await GiangVien.find().populate({
            path: 'userId',
            select: 'hovaten email soDienThoai diachi'
        });

        const columns = [
            { header: 'Họ và tên', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'Địa chỉ', key: 'address', width: 30 },
            { header: 'Bằng cấp', key: 'bangcap', width: 20 },
            { header: 'Mô tả', key: 'mota', width: 30 },
        ];

        const data = teachers.map(t => ({
            name: t.userId?.hovaten || 'N/A',
            email: t.userId?.email || 'N/A',
            phone: t.userId?.soDienThoai || 'N/A',
            address: t.userId?.diachi || 'N/A',
            bangcap: t.bangcap || 'N/A',
            mota: t.mota || 'N/A',
        }));

        await exportToExcel(res, 'DanhSachGiangVien', columns, data);
    } catch (error) {
        console.error('Error exporting teachers:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất file Excel giảng viên' });
    }
};

// 3. Export Courses
const exportCourses = async (req, res) => {
    try {
        const courses = await KhoaHoc.find()
            .populate('CoSoId', 'Tencoso')
            .populate('LoaiKhoaHocID', 'Tenloai')
            .populate({
                path: 'giangvien',
                populate: { path: 'userId', select: 'hovaten' }
            });

        // Get student count for each course
        const enrollments = await DangKyKhoaHoc.aggregate([
            { $group: { _id: '$KhoaHocID', count: { $sum: 1 } } }
        ]);
        const enrollmentMap = {};
        enrollments.forEach(e => enrollmentMap[e._id.toString()] = e.count);

        const columns = [
            { header: 'Tên khóa học', key: 'name', width: 30 },
            { header: 'Loại khóa học', key: 'type', width: 20 },
            { header: 'Cơ sở', key: 'facility', width: 20 },
            { header: 'Giảng viên', key: 'teacher', width: 25 },
            { header: 'Ngày khai giảng', key: 'startDate', width: 15 },
            { header: 'Số học viên hiện tại', key: 'studentCount', width: 20 },
            { header: 'Số học viên tối đa', key: 'maxStudents', width: 20 },
        ];

        const data = courses.map(c => ({
            name: c.tenkhoahoc,
            type: c.LoaiKhoaHocID?.Tenloai || 'N/A',
            facility: c.CoSoId?.Tencoso || 'N/A',
            teacher: c.giangvien?.userId?.hovaten || 'N/A',
            startDate: new Date(c.ngaykhaigiang).toLocaleDateString('vi-VN'),
            studentCount: enrollmentMap[c._id.toString()] || 0,
            maxStudents: c.soHocVienToiDa,
        }));

        await exportToExcel(res, 'DanhSachKhoaHoc', columns, data);
    } catch (error) {
        console.error('Error exporting courses:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất file Excel khóa học' });
    }
};

// 4. Export Enrollments
const exportEnrollments = async (req, res) => {
    try {
        const enrollments = await DangKyKhoaHoc.find()
            .populate({
                path: 'hocvienId',
                populate: { path: 'userId', select: 'hovaten email' }
            })
            .populate('KhoaHocID', 'tenkhoahoc');

        const columns = [
            { header: 'Học viên', key: 'studentName', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Khóa học', key: 'courseName', width: 30 },
            { header: 'Ngày đăng ký', key: 'regDate', width: 20 },
            { header: 'Số ngày nghỉ', key: 'absentDays', width: 15 },
        ];

        const data = enrollments.map(e => ({
            studentName: e.hocvienId?.userId?.hovaten || 'N/A',
            email: e.hocvienId?.userId?.email || 'N/A',
            courseName: e.KhoaHocID?.tenkhoahoc || 'N/A',
            regDate: new Date(e.createdAt).toLocaleDateString('vi-VN'),
            absentDays: e.so_ngay_nghi || 0,
        }));

        await exportToExcel(res, 'DanhSachDangKy', columns, data);
    } catch (error) {
        console.error('Error exporting enrollments:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất file Excel đăng ký' });
    }
};

// 5. Export Facilities
const exportFacilities = async (req, res) => {
    try {
        const facilities = await Coso.find();
        
        const columns = [
            { header: 'Tên cơ sở', key: 'name', width: 30 },
            { header: 'Địa chỉ', key: 'address', width: 40 },
            { header: 'Số điện thoại', key: 'phone', width: 20 },
            { header: 'Trạng thái', key: 'status', width: 20 },
        ];

        const data = facilities.map(f => ({
            name: f.Tencoso,
            address: f.diachi || 'N/A',
            phone: f.sodienthoai || 'N/A',
            status: f.trangThaiHoatDong ? 'Hoạt động' : 'Tạm dừng',
        }));

        await exportToExcel(res, 'DanhSachCoSo', columns, data);
    } catch (error) {
        console.error('Error exporting facilities:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất file Excel cơ sở' });
    }
};

// 6. Get Statistics (JSON for dashboard)
const getOverallStats = async (req, res) => {
    try {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

        const [
            totalStudents,
            totalTeachers,
            totalCourses,
            totalFacilities,
            recentEnrollments,
            facilities,
            courseTypes,
            students
        ] = await Promise.all([
            HocVien.countDocuments(),
            GiangVien.countDocuments(),
            KhoaHoc.countDocuments(),
            Coso.countDocuments(),
            DangKyKhoaHoc.find().sort({ createdAt: -1 }).limit(10).populate({
                path: 'hocvienId',
                populate: { path: 'userId', select: 'hovaten' }
            }).populate('KhoaHocID', 'tenkhoahoc'),
            Coso.find().select('Tencoso'),
            require('../../models/LoaiKhoaHoc').find().select('Tenloai'),
            NguoiDung.find({ role: 'student' }).select('gioitinh')
        ]);

        // 1. Registrations trend
        const registrationsTrend = await DangKyKhoaHoc.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    registrations: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 12 }
        ]);

        // 2. Students by Facility
        const studentDist = await DangKyKhoaHoc.aggregate([
            {
                $lookup: {
                    from: 'khoahocs',
                    localField: 'KhoaHocID',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            {
                $group: {
                    _id: '$course.CoSoId',
                    count: { $sum: 1 }
                }
            }
        ]);

        const studentsByFacility = studentDist.map(item => {
            const fac = facilities.find(f => f._id.toString() === (item._id ? item._id.toString() : ''));
            return {
                name: fac ? fac.Tencoso : 'Chưa gán',
                count: item.count
            };
        });

        // 3. Courses by Type
        const courseDist = await KhoaHoc.aggregate([
            {
                $group: {
                    _id: '$LoaiKhoaHocID',
                    count: { $sum: 1 }
                }
            }
        ]);

        const coursesByType = courseDist.map(item => {
            const type = courseTypes.find(t => t._id.toString() === (item._id ? item._id.toString() : ''));
            return {
                name: type ? type.Tenloai : 'Khác',
                count: item.count
            };
        });

        // 4. Attendance Trends
        const attendanceTrend = await ThamGiaBuoiHoc.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    total: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ["$trangthai", "present"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 12 }
        ]);

        // 5. Course Capacity Utilization
        const courseUsageAgg = await DangKyKhoaHoc.aggregate([
            { $group: { _id: '$KhoaHocID', enrolled: { $sum: 1 } } },
            { $lookup: { from: 'khoahocs', localField: '_id', foreignField: '_id', as: 'course' } },
            { $unwind: '$course' },
            {
                $project: {
                    name: '$course.tenkhoahoc',
                    enrolled: 1,
                    max: '$course.soHocVienToiDa',
                    percentage: { $multiply: [{ $divide: ["$enrolled", { $max: ["$course.soHocVienToiDa", 1] }] }, 100] }
                }
            },
            { $sort: { percentage: -1 } },
            { $limit: 10 }
        ]);

        // 6. Gender Distribution (Students)
        const genderDist = [
            { name: 'Nam', count: students.filter(s => s.gioitinh === true).length },
            { name: 'Nữ', count: students.filter(s => s.gioitinh === false).length }
        ];

        // 7. Teacher Qualifications
        const qualificationAgg = await GiangVien.aggregate([
            {
                $group: {
                    _id: '$TrinhDoHocVan',
                    count: { $sum: 1 }
                }
            }
        ]);
        const qualificationDist = qualificationAgg.map(q => ({
            name: q._id || 'Chưa cập nhật',
            count: q.count
        }));

        // 8. Course Statuses
        // Assuming course duration is 3 months
        const courseStatuses = await KhoaHoc.aggregate([
            {
                $project: {
                    status: {
                        $cond: [
                            { $gt: ["$ngaykhaigiang", now] },
                            "Sắp mở",
                            {
                                $cond: [
                                    { $lt: [{ $add: ["$ngaykhaigiang", 90 * 24 * 60 * 60 * 1000] }, now] },
                                    "Đã kết thúc",
                                    "Đang dạy"
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 9. Facility Size (Rooms)
        const facilitySizeAgg = await require('../../models/Phonghoc').aggregate([
            {
                $group: {
                    _id: '$CoSoId',
                    roomCount: { $sum: 1 }
                }
            }
        ]);
        const facilitySize = facilitySizeAgg.map(f => {
            const fac = facilities.find(facObj => facObj._id.toString() === (f._id ? f._id.toString() : ''));
            return {
                name: fac ? fac.Tencoso : 'Khác',
                count: f.roomCount
            };
        });

        res.status(200).json({
            success: true,
            data: {
                summary: [
                    { label: 'Tổng học viên', value: totalStudents, icon: 'students', color: '#4e73df' },
                    { label: 'Tổng giảng viên', value: totalTeachers, icon: 'teachers', color: '#1cc88a' },
                    { label: 'Tổng khóa học', value: totalCourses, icon: 'courses', color: '#36b9cc' },
                    { label: 'Tổng cơ sở', value: totalFacilities, icon: 'facilities', color: '#f6c23e' },
                ],
                recentEnrollments: recentEnrollments.map(e => ({
                    student: e.hocvienId?.userId?.hovaten || 'N/A',
                    course: e.KhoaHocID?.tenkhoahoc || 'N/A',
                    date: e.createdAt
                })),
                chartData: registrationsTrend.map(r => ({
                    month: r._id,
                    count: r.registrations
                })),
                studentsByFacility,
                coursesByType,
                attendanceTrend: attendanceTrend.map(a => ({
                    month: a._id,
                    rate: Math.round((a.present / (a.total || 1)) * 100)
                })),
                courseUsage: courseUsageAgg,
                genderDist,
                qualificationDist,
                courseStatusDist: courseStatuses.map(s => ({ name: s._id, count: s.count })),
                facilitySize
            }
        });
    } catch (error) {
        console.error('Error getting overall stats:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu thống kê' });
    }
};

module.exports = {
    exportStudents,
    exportTeachers,
    exportCourses,
    exportEnrollments,
    exportFacilities,
    getOverallStats
};
