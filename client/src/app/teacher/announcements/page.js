"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createPortal } from "react-dom";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    setIsMounted(true);
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Modal chi tiết thông báo */}
      {isMounted && selectedAnnouncement && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all opacity-100"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-xl font-bold text-gray-800 pr-8">
                {selectedAnnouncement.tieuDe || 'Chi tiết thông báo'}
              </h3>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(selectedAnnouncement.targetType)}`}>
                  {getTypeText(selectedAnnouncement.targetType)}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {new Date(selectedAnnouncement.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base bg-blue-50/30 rounded-xl p-5 border border-blue-50/50 shadow-inner">
                {selectedAnnouncement.noidung}
              </div>
              
              {selectedAnnouncement.fileIds && selectedAnnouncement.fileIds.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Tệp đính kèm:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedAnnouncement.fileIds.map((file, index) => (
                      <li key={index}>
                        <a 
                          href={file.url?.startsWith('http') ? file.url : `${apiUrl}${file.url}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-sm hover:shadow"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate">
                            {file.originalName || file.url?.split('/').pop()}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-8 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedAnnouncement.createdBy && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Người gửi</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm">
                        {(selectedAnnouncement.createdBy?.hovaten || selectedAnnouncement.createdBy?.name || 'A').charAt(0)}
                      </div>
                      {selectedAnnouncement.createdBy?.hovaten || selectedAnnouncement.createdBy?.name || 'Admin'}
                    </span>
                  </div>
                )}
                {selectedAnnouncement.khoaHocId && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Khóa học</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <span className="truncate">{selectedAnnouncement.khoaHocId?.tenkhoahoc}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-all shadow-sm"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Đóng
              </button>
              {selectedAnnouncement.link && (
                <button
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  onClick={() => {
                    window.location.href = selectedAnnouncement.link;
                  }}
                >
                  <span>Đi tới liên kết</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}