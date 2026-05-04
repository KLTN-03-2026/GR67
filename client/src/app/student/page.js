"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function StudentDashboard() {
  const { user, loading, isAuthenticated, isStudent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !isStudent) {
      router.push('/'); 
    }
  }, [loading, isAuthenticated, isStudent, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStudent) {
    return null; 
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Banner Chào Mừng */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl shadow-xl border border-blue-400 p-8 sm:p-10 text-white animate-slide-in-up">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute right-1/4 top-1/4 w-32 h-32 rounded-full bg-cyan-300 opacity-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white drop-shadow-md tracking-tight">Không gian học tập</h1>
            <p className="text-blue-50 text-lg font-medium">
              Xin chào, <span className="font-bold text-white text-xl">{user?.hovaten || user?.name || "Học viên"}</span>! Sẵn sàng chinh phục tri thức hôm nay chưa?
            </p>
          </div>
          <div className="hidden md:flex p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </div>

      {/* Lưới Bento (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        
        {/* Khóa Học Của Tôi - Nổi bật (span 2 cols) */}
        <div 
          onClick={() => router.push('/student/courses/overview')}
          className="group relative md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          {/* Decorative Background */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-in-out opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">Khóa Học Của Tôi</h3>
            <p className="text-gray-500 font-medium max-w-[80%]">Quản lý bài tập, theo dõi tiến độ và điểm số các môn học bạn đang tham gia.</p>
          </div>
        </div>

        {/* Lịch Học - Nổi bật (span 2 cols) */}
        <div 
          onClick={() => router.push('/student/schedule')}
          className="group relative md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          {/* Decorative Background */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-in-out opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">Lịch học</h3>
            <p className="text-gray-500 font-medium max-w-[80%]">Lên kế hoạch học tập, xem phòng học và thời gian bắt đầu chính xác.</p>
          </div>
        </div>

        {/* Luyện Đề (Square card) */}
        <div 
          onClick={() => router.push('/student/practice-tests')}
          className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">Luyện Đề</h3>
            <p className="text-sm text-gray-500 font-medium leading-snug">Thi thử TOEIC/IELTS tính thời gian thật.</p>
          </div>
          <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </div>

        {/* Luyện Tập (Square card) */}
        <div 
          onClick={() => router.push('/student/practice')}
          className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">Luyện Tập</h3>
            <p className="text-sm text-gray-500 font-medium leading-snug">Rèn luyện kỹ năng qua từng dạng bài nhỏ.</p>
          </div>
          <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </div>

        {/* Thông Báo (Square card) */}
        <div 
          onClick={() => router.push('/student/announcements')}
          className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div>
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors">Thông Báo</h3>
            <p className="text-sm text-gray-500 font-medium leading-snug">Cập nhật tin tức và thông báo mới nhất.</p>
          </div>
          <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </div>

        {/* Thông Tin Cá Nhân (Square card) */}
        <div 
          onClick={() => router.push('/student/profile')}
          className="group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">Thông tin cá nhân</h3>
            <p className="text-sm text-gray-500 font-medium leading-snug">Chỉnh sửa thông tin, bảo mật tài khoản.</p>
          </div>
          <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </div>
        
      </div>
    </div>
  );
}