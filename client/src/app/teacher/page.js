"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";


export default function TeacherDashboard() {
  const { user, loading, isAuthenticated, isTeacher, token } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalCourses: 0,
      totalStudents: 0,
      pendingSubmissions: 0,
      pendingLeaveRequests: 0,
      pendingAssignmentsDetail: []
    },
    upcomingClasses: []
  });
  const [loadingData, setLoadingData] = useState(true);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !isTeacher) {
      router.push('/'); // Redirect to login if not authenticated or not teacher
    }
  }, [loading, isAuthenticated, isTeacher, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/teacher/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setDashboardData(data);
        } else {
          alert(data.message || "Không thể tải dữ liệu dashboard");
        }
      } catch (err) {
        console.error("Lỗi fetch dashboard data:", err);
        alert("Đã xảy ra lỗi khi tải dữ liệu");
      } finally {
        setLoadingData(false);
      }
    };

    if (isAuthenticated && isTeacher) {
      fetchDashboardData();
    }
  }, [token, isAuthenticated, isTeacher]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isTeacher) {
    return null; // Không hiển thị gì nếu không có quyền
  }

  const { stats, upcomingClasses } = dashboardData;

  const getDayOfWeek = (dateString) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tổng Quan Giảng Dạy</h1>
            <p className="text-gray-500 text-lg">Chào mừng trở lại, <span className="font-semibold text-blue-600">{user?.hovaten}</span>. Chúc bạn một ngày làm việc hiệu quả!</p>
          </div>
        </div>
      </div>

      {/* Thống kê Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => router.push('/teacher/courses/overview')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-blue-600 transition-colors">Khóa Học Đang Dạy</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalCourses}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
          </div>
        </div>

        <div
          onClick={() => router.push('')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-indigo-600 transition-colors">Tổng Số Học Viên</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalStudents}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
        </div>

        <div
          onClick={() => setShowPendingModal(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-amber-300 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-amber-600 transition-colors">Bài Tập Chờ Chấm</p>
              <h3 className="text-3xl font-bold text-amber-600">{stats.pendingSubmissions}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
        </div>

        <div
          onClick={() => router.push('/teacher/courses/leave-requests')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-red-300 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-red-600 transition-colors">Đơn Nghỉ Chờ Duyệt</p>
              <h3 className="text-3xl font-bold text-red-600">{stats.pendingLeaveRequests}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 group-hover:bg-red-100 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lịch dạy sắp tới */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Lịch Dạy Sắp Tới</h2>
            <Link href="/teacher/schedule" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Xem tất cả
            </Link>
          </div>
          <div className="p-6">
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Không có buổi học nào sắp tới.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((cls) => (
                  <div key={cls._id} className="flex items-start p-4 border border-gray-50 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-16 text-center mr-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase">{getDayOfWeek(cls.ngayhoc)}</p>
                      <p className="text-lg font-bold text-blue-600">{formatDate(cls.ngayhoc).substring(0, 5)}</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{cls.KhoaHocID?.tenkhoahoc || "Khóa học không tồn tại"}</h4>
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatTime(cls.giobatdau)} - {formatTime(cls.gioketthuc)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end gap-2">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Phòng: {cls.phonghoc?.TenPhong || "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Truy cập nhanh */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Truy Cập Nhanh</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full" style={{ maxHeight: "400px" }}>
            <button
              onClick={() => router.push('/teacher/courses/overview')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-blue-700">Quản Lý Khóa Học</span>
            </button>

            <button
              onClick={() => router.push('/teacher/schedule')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-green-700">Lịch Dạy</span>
            </button>

            <button
              onClick={() => router.push('/teacher/announcements')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-red-700">Thông Báo</span>
            </button>

            <button
              onClick={() => router.push('/teacher/profile')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-indigo-700">Trang Cá Nhân</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL BÀI TẬP CHỜ CHẤM */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4 transition-all duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h3 className="font-bold text-xl text-gray-800">Danh sách bài tập chờ chấm</h3>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                title="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {stats.pendingAssignmentsDetail && stats.pendingAssignmentsDetail.length > 0 ? (
                <div className="space-y-4">
                  {stats.pendingAssignmentsDetail.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => router.push(`/teacher/courses/detail-ass?id=${item.assignmentId}`)}
                      className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all bg-white group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase mb-1">{item.courseName}</p>
                        <h4 className="text-lg font-bold text-gray-800 group-hover:text-amber-600 transition-colors">{item.assignmentTitle}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold text-sm">
                          {item.pendingCount} nộp
                        </span>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Không có bài tập nào cần chấm.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setShowPendingModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}