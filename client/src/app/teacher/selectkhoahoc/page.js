"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Component hiển thị danh sách khóa học, có dùng useSearchParams
function CourseListContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/teacher/courses`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        const data = await res.json();
        if (data.success) {
          setCourses(data.data);
        } else {
          setError(data.message || "Failed to fetch courses");
        }
      } catch (err) {
        console.error("Lỗi tải danh sách khóa học:", err);
        setError("Lõi mạng khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleSelectCourse = (course) => {
    // Lưu thông tin khoá học vừa chọn
    localStorage.setItem("selectedCourseId", course.id);
    localStorage.setItem("selectedCourseName", course.name);

    // Nếu có tham số redirect (ví dụ từ Sidebar link), chuyển hướng về đó
    // Nếu không, chuyển vào trang tổng quan hoặc chi tiết mặc định
    if (redirect) {
      router.push(redirect);
    } else {
      router.push(`/teacher/courses/overview`);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-red-100">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {redirect ? "Vui lòng chọn khóa học để tiếp tục" : "Khóa học đang giảng dạy"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {redirect ? "Bạn cần chọn một khóa học thao tác tính năng này" : "Quản lý nội dung, học viên và theo dõi tiến độ"}
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Courses List Section */}
      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="p-6">
              {/* Card Header */}
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${course.iconBg} ${course.iconColor}`}>
                  {course.status === "Đang mở" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{course.name}</h3>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${course.status === "Đang mở"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-400 text-white"
                      }`}>
                      {course.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body (Details List) */}
              <div className="flex flex-col space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Số lượng học viên:</span>
                  <span className="font-bold text-gray-800 text-sm">{course.studentsText}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Ngày khai giảng:</span>
                  <span className="font-bold text-gray-800 text-sm">{course.startDate}</span>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                <button
                  onClick={() => handleSelectCourse(course)}
                  className="px-6 py-2 border border-blue-400 text-blue-600 font-bold rounded hover:bg-blue-50 transition-colors duration-200 text-sm"
                >
                  {redirect ? "Chọn khóa học này" : "Vào trang khóa học"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredCourses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500">Không tìm thấy khóa học nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Bọc useSearchParams bằng Suspense theo require của Next.js App Router
export default function SelectCoursePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CourseListContent />
    </Suspense>
  );
}
