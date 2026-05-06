"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Students() {
  const [studentsData, setStudentsData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleDeleteStudent = async (studentId) => {
    const confirmDelete = confirm("Bạn có chắc muốn xóa học viên này?");
    if (!confirmDelete) return;

    try {
      const courseId = localStorage.getItem("selectedCourseId");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/teacher/courses/${courseId}/students/${studentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Xóa khỏi UI luôn
        setStudentsData(prev => prev.filter(s => s.id !== studentId));
      } else {
        alert(data.message || "Xóa thất bại");
      }
    } catch (err) {
      console.error("Lỗi xóa học viên:", err);
      alert("Lỗi server");
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const courseId = localStorage.getItem("selectedCourseId");
        const storedCourseName = localStorage.getItem("selectedCourseName");

        if (!courseId) {
          router.push("/teacher/selectkhoahoc?redirect=/teacher/courses/students");
          return;
        }

        setCourseName(storedCourseName || "Tiếng Anh Cơ Bản"); // Fallback

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/teacher/courses/${courseId}/students`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });


        const data = await res.json();
        if (data.success) {
          // Map dữ liệu thật về format của giao diện cũ
          const mappedData = data.data.map(student => {
            const totalRecordedDays = student.attendedDays + student.absentDays;
            const attendancePercentage = totalRecordedDays > 0 
                ? Math.round((student.attendedDays / totalRecordedDays) * 100) 
                : 0; // Nếu chưa học buổi nào thì mặc định 0%

            return {
              id: student.id,
              name: student.name,
              fullName: student.name,
              email: student.email,
              phone: student.phone,
              status: student.status === "Đã hủy" ? "inactive" : "active",
              attendance: attendancePercentage
            };
          });
          setStudentsData(mappedData);
        } else {
          setError(data.message || "Không thể tải danh sách học viên");
        }
      } catch (err) {
        console.error("Lỗi tải danh sách học viên:", err);
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [router]);

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

  // Tính toán số liệu thống kê
  const totalStudents = studentsData.length;
  const activeStudents = studentsData.filter(s => s.status === 'active').length;
  const inactiveStudents = totalStudents - activeStudents;
  const avgAttendance = totalStudents > 0
    ? Math.round(studentsData.reduce((acc, curr) => acc + curr.attendance, 0) / totalStudents)
    : 0;

  // Lấy top 3 học viên xuất sắc (điểm danh cao nhất)
  const topStudents = [...studentsData].sort((a, b) => b.attendance - a.attendance).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Danh Sách Học Viên</h1>
        <p className="text-gray-600">Quản lý và theo dõi học viên trong các khóa học</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Học viên khóa {courseName}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Học viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm danh (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentsData.length > 0 ? (
                studentsData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-sm text-gray-500">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                      <div className="text-sm text-gray-500">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {student.status === 'active' ? 'Đang học' : 'Tạm nghỉ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">{student.attendance}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${student.attendance >= 90 ? 'bg-green-600' :
                              student.attendance >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                            style={{ width: `${student.attendance}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có học viên nào trong khóa học này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê lớp học</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số học viên:</span>
              <span className="font-semibold">{totalStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đang học:</span>
              <span className="font-semibold text-green-600">{activeStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm nghỉ:</span>
              <span className="font-semibold text-red-600">{inactiveStudents}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Điểm danh trung bình</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{avgAttendance}%</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${avgAttendance}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Dựa trên dữ liệu hệ thống</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Học viên xuất sắc</h3>
          <div className="space-y-2">
            {topStudents.length > 0 ? topStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between">
                <span className="text-sm">{student.fullName}</span>
                <span className="text-sm font-semibold text-green-600">{student.attendance}%</span>
              </div>
            )) : (
              <span className="text-sm text-gray-500">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}