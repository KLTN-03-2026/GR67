"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const { user } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cập nhật lại local state
      setAnnouncements(prev => prev.map(a =>
        a._id === id ? { ...a, readByUserIds: [...a.readByUserIds, user?.id || user?._id] } : a
      ));
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'class': return 'bg-orange-100 text-orange-600';
      case 'personal': return 'bg-purple-100 text-purple-600';
      case 'assignment_submit': return 'bg-green-100 text-green-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'all': return 'Hệ thống';
      case 'class': return 'Lớp học';
      case 'personal': return 'Cá nhân';
      case 'assignment_submit': return 'Nộp bài';
      default: return 'Thông báo chung';
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thông Báo</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Danh sách thông báo</h3>
          <button
            onClick={fetchAnnouncements}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải thông báo...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có thông báo nào.</div>
          ) : announcements.map((item) => {
            const isRead = item.readByUserIds?.includes(user?.id || user?._id);
            return (
              <div
                key={item._id}
                className={`p-6 transition-colors ${!isRead ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'} ${item.link ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (!isRead) markAsRead(item._id);
                  if (item.link) {
                    let finalLink = item.link;
                    if (finalLink.includes("/student/courses/detail-ass")) {
                      finalLink = finalLink.replace("/student/courses/detail-ass", "/student/courses/assignments-detail");
                      if (item.khoaHocId && item.khoaHocId._id && !finalLink.includes("courseId=")) {
                        finalLink += `&courseId=${item.khoaHocId._id}`;
                      }
                    }
                    window.location.href = finalLink;
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className={`text-lg ${!isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                      {item.tieuDe || 'Thông báo mới'}
                    </h4>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(item.targetType)}`}>
                      {getTypeText(item.targetType)}
                    </span>
                    {!isRead && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-600 text-white">Mới</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">
                  {item.noidung}
                </p>

                <div className="flex justify-between items-center mb-2">
                  <div className="flex space-x-6 text-sm text-gray-400">
                    {item.createdBy && (
                      <div><span className="font-semibold text-gray-500">Người gửi:</span> {item.createdBy?.hovaten || item.createdBy?.name || 'Admin'}</div>
                    )}
                    {item.khoaHocId && (
                      <div><span className="font-semibold text-gray-500">Khóa học:</span> {item.khoaHocId?.tenkhoahoc}</div>
                    )}
                  </div>

                  <button
                    className="px-4 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isRead) markAsRead(item._id);
                      setSelectedAnnouncement(item);
                    }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal chi tiết thông báo */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl ring-opacity-5 border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 pr-8">
                {selectedAnnouncement.tieuDe || 'Chi tiết thông báo'}
              </h3>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(selectedAnnouncement.targetType)}`}>
                  {getTypeText(selectedAnnouncement.targetType)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(selectedAnnouncement.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                {selectedAnnouncement.noidung}
              </div>

              {selectedAnnouncement.fileIds && selectedAnnouncement.fileIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Tệp đính kèm:</h4>
                  <ul className="space-y-2">
                    {selectedAnnouncement.fileIds.map((file, index) => (
                      <li key={index}>
                        <a
                          href={file.url?.startsWith('http') ? file.url : `${apiUrl}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                          {file.originalName || file.url?.split('/').pop()}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
                {selectedAnnouncement.createdBy && (
                  <div><span className="font-semibold text-gray-600">Người gửi:</span> {selectedAnnouncement.createdBy?.hovaten || selectedAnnouncement.createdBy?.name || 'Admin'}</div>
                )}
                {selectedAnnouncement.khoaHocId && (
                  <div><span className="font-semibold text-gray-600">Khóa học:</span> {selectedAnnouncement.khoaHocId?.tenkhoahoc}</div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              {selectedAnnouncement.link && (
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  onClick={() => {
                    let finalLink = selectedAnnouncement.link;
                    if (finalLink.includes("/student/courses/detail-ass")) {
                      finalLink = finalLink.replace("/student/courses/detail-ass", "/student/courses/assignments-detail");
                      if (selectedAnnouncement.khoaHocId && selectedAnnouncement.khoaHocId._id && !finalLink.includes("courseId=")) {
                        finalLink += `&courseId=${selectedAnnouncement.khoaHocId._id}`;
                      }
                    }
                    window.location.href = finalLink;
                  }}
                >
                  Đi tới
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
                onClick={() => setSelectedAnnouncement(null)}
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