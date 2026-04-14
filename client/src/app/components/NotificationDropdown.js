"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

// Simple relative time formatter
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const { user } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => 
          n._id === id ? { ...n, readByUserIds: [...n.readByUserIds, user?.id || user?._id] } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({
          ...n,
          readByUserIds: [...n.readByUserIds, user?.id || user?._id]
        })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-800">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Bạn không có thông báo nào.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.slice(0, 10).map((notif) => {
                  const isRead = notif.readByUserIds.includes(user?.id || user?._id);
                  return (
                    <li 
                      key={notif._id} 
                      className={`p-4 transition-colors flex gap-3 ${!isRead ? 'bg-blue-50/50' : 'hover:bg-gray-50'} ${notif.link ? 'cursor-pointer hover:bg-blue-50/80' : ''}`}
                      onClick={async (e) => {
                        if (notif.link) {
                          if (!isRead) await handleMarkAsRead(notif._id, { stopPropagation: ()=>{} });
                          setIsOpen(false);
                          window.location.href = notif.link; // Dùng window.location.href để refresh state
                        }
                      }}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm truncate pr-2 ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.tieuDe || 'Thông báo mới'}
                          </p>
                          <span className="text-[11px] text-gray-500 whitespace-nowrap pt-0.5">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 ${!isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notif.noidung}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 z-10">
                          {notif.link && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!isRead) await handleMarkAsRead(notif._id, { stopPropagation: ()=>{} });
                                setIsOpen(false);
                                window.location.href = notif.link;
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              {(notif.targetType === 'assignment_submit' || notif.link.includes('grade-ass')) ? 'Chấm bài nộp' : 'Xem chi tiết'}
                            </button>
                          )}
                          {!isRead && (
                            <button 
                              onClick={(e) => handleMarkAsRead(notif._id, e)}
                              className="text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {!isRead && (
                        <div className="mt-1 flex-shrink-0 h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
            <Link 
              href={`/${user?.role === 'student' ? 'student' : 'teacher'}/announcements`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 block p-1"
              onClick={() => setIsOpen(false)}
            >
              Xem tất cả
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
