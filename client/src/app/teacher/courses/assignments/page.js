"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDateTimeDdMmYyyy } from "../../../../lib/dateFormat";

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  
  // States cho Modal xóa bài tập
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchAssignments();
    const name = localStorage.getItem("selectedCourseName");
    if (name) setCourseName(name);
  }, []);

  const fetchAssignments = async () => {
    try {
      const courseId = localStorage.getItem("selectedCourseId");
      if (!courseId) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/teacher/courses/${courseId}/assignments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();

      if (data.success) {
        const rawAssignments = data.data;
        const now = new Date();

        let activeCount = 0;
        let upcomingCount = 0;
        let completedCount = 0;
        let overdueCount = 0;

        const processedAssignments = rawAssignments.map(ass => {
          let statusResult = "completed";
          const dueDate = new Date(ass.dueDate);
          const createdAt = new Date(ass.createdAt);

          if (now < createdAt) {
            statusResult = "upcoming";
            upcomingCount++;
          } else if (now >= createdAt && now <= dueDate) {
            statusResult = "active";
            activeCount++;
          } else if (now > dueDate) {
            statusResult = "overdue";
            overdueCount++;
          } else {
            statusResult = "completed";
            completedCount++;
          }

          return {
            ...ass,
            status: statusResult
          };
        });

        setAssignments(processedAssignments);
        setStats({
          total: processedAssignments.length,
          active: activeCount,
          upcoming: upcomingCount,
          completed: completedCount,
          overdue: overdueCount
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách bài tập:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setAssignmentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/teacher/assignments/${assignmentToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setIsDeleteModalOpen(false);
        setAssignmentToDelete(null);
        fetchAssignments(); // reload lại
      } else {
        alert(data.message || "Xóa thất bại");
      }

    } catch (error) {
      console.error("Lỗi xóa:", error);
      alert("Có lỗi xảy ra khi xóa!");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Đang mở';
      case 'upcoming':
        return 'Sắp tới';
      case 'completed':
        return 'Đã kết thúc';
      case 'overdue':
        return 'Quá hạn';
      default:
        return 'Không xác định';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'homework':
        return '📝';
      case 'test':
        return '📋';
      case 'listening':
        return '🎧';
      case 'presentation':
        return '🎤';
      default:
        return '📄';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'homework':
        return 'Bài tập về nhà';
      case 'test':
        return 'Bài kiểm tra';
      case 'listening':
        return 'Bài tập nghe';
      case 'presentation':
        return 'Bài thuyết trình';
      default:
        return 'Khác';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản Lý Bài Tập {courseName && `- ${courseName}`}</h1>
            <p className="text-gray-600">Tạo và theo dõi các bài tập, bài kiểm tra của học viên</p>
          </div>
          <Link href="/teacher/courses/add-ass">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              + Tạo bài tập mới
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 mb-4">Chưa có bài tập nào cho khóa học này.</p>
              <Link href="/teacher/courses/add-ass">
                <button className="text-blue-600 hover:text-blue-800 font-medium">Bấm vào đây để tạo bài tập đầu tiên</button>
              </Link>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getTypeIcon(assignment.type)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{assignment.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Hạn nộp: {formatDateTimeDdMmYyyy(assignment.dueDate)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {assignment.points} điểm
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                    {getStatusText(assignment.status)}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Tiến độ nộp bài:</span>
                    <span className="font-semibold">{assignment.submitted}/{assignment.total} học viên</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${assignment.status === 'completed' ? 'bg-gray-600' :
                        assignment.submitted === assignment.total && assignment.total > 0 ? 'bg-green-600' :
                          assignment.submitted > 0 ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                      style={{ width: assignment.total > 0 ? `${(assignment.submitted / assignment.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{getTypeText(assignment.type)}</span>
                  </div>
                  <div className="flex space-x-10">
                    <button
                      onClick={() => openDeleteModal(assignment.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Xóa
                    </button>
                    <Link href={`/teacher/courses/grade-ass?id=${assignment.id}`}>
                      <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                        Chấm điểm
                      </button>
                    </Link>

                    <Link href={`/teacher/courses/edit-ass?id=${assignment.id}`}>
                      <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                        Chỉnh sửa
                      </button>
                    </Link>
                    <Link href={`/teacher/courses/detail-ass?id=${assignment.id}`}>
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        Xem chi tiết
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê bài tập</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng số bài tập:</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đang hoạt động:</span>
                <span className="font-semibold text-green-600">{stats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sắp tới:</span>
                <span className="font-semibold text-blue-600">{stats.upcoming}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quá hạn:</span>
                <span className="font-semibold text-red-600">{stats.overdue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã kết thúc:</span>
                <span className="font-semibold text-gray-600">{stats.completed}</span>
              </div>
            </div>
          </div>

          {assignments.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỷ lệ nộp bài</h3>
              <div className="space-y-3">
                {assignments.map(ass => {
                  const percentage = ass.total > 0 ? Math.round((ass.submitted / ass.total) * 100) : 0;
                  return (
                    <div key={ass.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate w-3/4">{ass.title}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL XÁC NHẬN XÓA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa bài tập?</h3>
              <p className="text-sm text-gray-500">
                Lưu ý: Hành động này không thể hoàn tác. Các bài nộp và dữ liệu liên quan sẽ bị xóa sạch.
              </p>
            </div>
            
            <div className="flex px-6 pb-6 gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmDeleteAssignment}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 transition-colors"
              >
                Chắc chắn Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}