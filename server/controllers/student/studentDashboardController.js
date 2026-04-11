const DangKyKhoaHoc = require('../../models/DangKyKhoaHoc');
const HocVien = require('../../models/HocVien');
const BuoiHoc = require('../../models/BuoiHoc');
const BaiTap = require('../../models/BaiTap');
const NopBai = require('../../models/NopBai');

exports.getDashboardOverview = async (req, res) => {
    try {
        const student = await HocVien.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông tin học viên" });
        }

        // 1. Lấy tất cả khóa học đã đăng ký
        const enrollments = await DangKyKhoaHoc.find({ hocvienId: student._id })
            .populate('KhoaHocID', 'tenkhoahoc');

        const courseIds = enrollments.map(en => en.KhoaHocID?._id).filter(id => id);

        // 2. Map qua các khóa học để tính phần trăm buổi học
        const activeCourses = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const enroll of enrollments) {
            if (!enroll.KhoaHocID) continue;
            
            // Tìm tổng số buổi học cho khóa này
            const courseId = enroll.KhoaHocID._id;
            const sessions = await BuoiHoc.find({ KhoaHocID: courseId });
            const totalSessions = sessions.length;
            
            // Tính số buổi đã trôi qua
            let passedSessions = 0;
            sessions.forEach(session => {
                const sessionDate = new Date(session.ngayhoc);
                sessionDate.setHours(0, 0, 0, 0);
                if (sessionDate <= today) {
                    passedSessions++;
                }
            });

            // Tính % tiến độ
            let progress = 0;
            if (totalSessions > 0) {
                progress = Math.round((passedSessions / totalSessions) * 100);
            }

            activeCourses.push({
                id: courseId,
                name: enroll.KhoaHocID.tenkhoahoc,
                progress: progress
            });
        }

        // 3. Xử lý Thống kê Bài tập
        // Tổng bài tập giao
        const totalAssignments = await BaiTap.countDocuments({ khoahocID: { $in: courseIds } });

        // Tìm tất cả phiếu nộp bài của học viên (trong các khóa)
        const mySubmissions = await NopBai.find({
            dangkykhoahocID: { $in: enrollments.map(en => en._id) }
        }).populate('baitapID', 'diem');

        let completedAssignmentsCount = 0;
        let totalScoreAccumulated = 0;
        let gradedCount = 0;

        mySubmissions.forEach(sub => {
            // Count completed
            if (sub.trangthai === 'chờ chấm' || sub.trangthai === 'đã chấm') {
                completedAssignmentsCount++;
            }

            // Tính điểm trung bình (cần chuyển về hệ 10)
            if (sub.trangthai === 'đã chấm' && sub.diem !== undefined && sub.diem !== null && sub.baitapID) {
                // Diểm tối đa của bài
                const maxScore = sub.baitapID.diem > 0 ? sub.baitapID.diem : 100;
                // Điểm theo hệ 10
                const score10 = (sub.diem / maxScore) * 10;
                
                totalScoreAccumulated += score10;
                gradedCount++;
            }
        });

        const averageScore = gradedCount > 0 ? (totalScoreAccumulated / gradedCount).toFixed(1) : "0.0";

        res.json({
            success: true,
            data: {
                activeCourses: activeCourses,
                statistics: {
                    totalCourses: enrollments.length,
                    completedAssignments: `${completedAssignmentsCount}/${totalAssignments}`,
                    averageScore: `${averageScore}/10`
                }
            }
        });

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu tổng quan dashboard:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};
