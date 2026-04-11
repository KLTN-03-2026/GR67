"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CourseOverview() {
  const router = useRouter();
  const [data, setData] = useState({ activeCourses: [], statistics: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const res = await fetch(`${API_URL}/student/overview`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const result = await res.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Không thể tải tổng quan khóa học.");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ.");
        console.error("Fetch overview error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [router]);

  if (loading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Đang tải bảng điều khiển...</div>;
  }

  if (error) {
    return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  const { activeCourses, statistics } = data;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Tổng Quan Khóa Học</h1>
        <p className="text-gray-600">Theo dõi tiến độ học tập và thành tích của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khóa học đang học */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
             <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             Khóa Học Của Tôi
          </h3>
          
          <div className="space-y-4">
            {activeCourses && activeCourses.length > 0 ? (
              activeCourses.map((course, idx) => (
                <div key={idx} className="flex flex-col p-4 bg-gray-50 rounded-lg hover:shadow-sm transition-shadow border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <Link href={`/student/courses/assignments?courseId=${course.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                      {course.name}
                    </Link>
                    <span className="text-sm font-semibold text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tiến độ được tính theo tỷ lệ các buổi học đã diễn ra</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic py-4 text-center">Bạn chưa tham gia khóa học nào.</p>
            )}
          </div>
        </div>

        {/* Thống kê chung */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
             <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Thống Kê Tổng Hợp
          </h3>
          
          {statistics && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <span className="text-gray-700 font-medium">Khóa học đăng ký:</span>
                </div>
                <span className="text-xl font-bold text-indigo-700">{statistics.totalCourses}</span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 text-green-600 rounded-md mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-gray-700 font-medium">BTVN đã hoàn thành:</span>
                </div>
                <span className="text-xl font-bold text-green-700">{statistics.completedAssignments}</span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-md mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </div>
                  <span className="text-gray-700 font-medium">Điểm số trung bình:</span>
                </div>
                <span className="text-xl font-bold text-amber-700">{statistics.averageScore}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}