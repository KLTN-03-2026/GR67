"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function Assignments() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [courseId, setCourseId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Chỉ đọc từ URL
    let currentCourseId = searchParams.get('courseId');

    if (!currentCourseId) {
      // Nếu không có courseId, chuyển hướng về trang chọn khóa học do user yêu cầu
      router.push("/student/selectCourse?redirect=/student/courses/assignments");
      return;
    }
    
    setCourseId(currentCourseId);
    
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const res = await fetch(`${API_URL}/student/courses/${currentCourseId}/assignments`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const result = await res.json();
        
        if (result.success) {
          setAssignments(result.data || []);
        } else {
          setError(result.message || "Không thể lấy danh sách bài tập.");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ.");
        console.error("Fetch assignments error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId, router]);

  if (loading) {
     return <div className="p-12 text-center text-gray-500 animate-pulse">Đang tải bài tập...</div>;
  }

  if (error) {
     return <div className="p-12 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Bài Tập</h1>
        <p className="text-gray-600">Xem và hoàn thành các bài tập của khóa học</p>
      </div>

      <div className="space-y-4">
        {assignments.length > 0 ? assignments.map((assignment) => (
          <div key={assignment._id} className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{assignment.tieude}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.mota}</p>
                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                  <span>Hạn nộp: {new Date(assignment.hannop).toLocaleString('vi-VN')}</span>
                  <span>Loại: <span className="uppercase font-medium">{assignment.loai}</span></span>
                </div>
              </div>
              
              {assignment.trangthai === 'chưa nộp' ? (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium whitespace-nowrap">
                  Chưa nộp
                </span>
              ) : assignment.trangthai === 'chờ chấm' ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium whitespace-nowrap">
                  Chờ chấm
                </span>
              ) : assignment.trangthai === 'yêu cầu làm lại' ? (
                 <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium whitespace-nowrap">
                  Làm lại
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium whitespace-nowrap">
                  Đã chấm
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
               {assignment.diemDatDuoc !== null && assignment.diemDatDuoc !== undefined && (
                 <span className="text-sm font-semibold text-green-600">Điểm: {assignment.diemDatDuoc}/{assignment.diemToiDa}</span>
               )}
               <Link href={`/student/courses/assignments-detail?id=${assignment._id}&courseId=${courseId}`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors text-sm font-medium ml-auto">
                 {assignment.trangthai === 'chưa nộp' || assignment.trangthai === 'yêu cầu làm lại' ? 'Làm bài' : 'Xem chi tiết'}
               </Link>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
             <h3 className="text-xl font-bold text-gray-300">Không có bài tập nào</h3>
          </div>
        )}
      </div>
    </div>
  );
}