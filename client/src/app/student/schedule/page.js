"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentSchedule() {
  const router = useRouter();
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const res = await fetch(`${API_URL}/student/schedule`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const result = await res.json();
        
        if (result.success) {
          setScheduleData(result.data || []);
        } else {
          setError(result.message || "Không thể lấy lịch học.");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ.");
        console.error("Fetch schedule error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [router]);

  // Convert "dd/mm/yyyy" -> Date
  const parseDate = (dateStr) => {
    const [d, m, y] = dateStr.split("/");
    return new Date(`${y}-${m}-${d}`);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDisplayDateRange = () => {
    if (view === "day") {
      return `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
    }
    if (view === "week") {
      const firstDay = new Date(currentDate);
      firstDay.setDate(currentDate.getDate() - currentDate.getDay() + 1); // thứ 2
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      return `${firstDay.getDate().toString().padStart(2, '0')}/${(firstDay.getMonth() + 1).toString().padStart(2, '0')} - ${lastDay.getDate().toString().padStart(2, '0')}/${(lastDay.getMonth() + 1).toString().padStart(2, '0')}/${lastDay.getFullYear()}`;
    }
    if (view === "month") {
      return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
    }
    return "";
  };

  // Lọc dữ liệu theo view
  const getFilteredSchedule = () => {
    const now = currentDate;

    if (view === "day") {
      return scheduleData.filter(d => {
        const date = parseDate(d.date);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    }

    if (view === "week") {
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - now.getDay() + 1); // thứ 2

      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);

      return scheduleData.filter(d => {
        const date = parseDate(d.date);
        return date >= firstDay && date <= lastDay;
      });
    }

    if (view === "month") {
      return scheduleData.filter(d => {
        const date = parseDate(d.date);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    }

    return scheduleData;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "upcoming":
        return "Sắp tới";
      case "ongoing":
        return "Đang diễn ra";
      case "completed":
        return "Đã xong";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getAttendanceText = (attendance) => {
    switch (attendance) {
      case "present": return "Có mặt";
      case "absent": return "Vắng mặt";
      case "excused": return "Có phép";
      case "makeup": return "Học bù";
      default: return "";
    }
  };

  const filteredData = getFilteredSchedule();

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch Học Của Tôi</h1>
          <p className="text-gray-500 mt-1">Xem lịch học theo ngày, tuần, hoặc tháng</p>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {["day", "week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setCurrentDate(new Date());
              }}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200
                ${view === v
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-blue-600"
                }`}
            >
              {v === "day" && "Ngày"}
              {v === "week" && "Tuần"}
              {v === "month" && "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-medium text-gray-700 flex items-center justify-between">
          <div>
            {view === "day" && "Lịch học theo ngày"}
            {view === "week" && "Lịch học theo tuần"}
            {view === "month" && "Lịch học theo tháng"}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrev} className="p-1.5 bg-white border shadow-sm rounded hover:bg-blue-100 transition" title="Lùi lại">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm text-gray-700 min-w-[160px] text-center font-medium bg-white py-1.5 px-3 border shadow-sm rounded">
              {getDisplayDateRange()}
            </span>
            <button onClick={handleNext} className="p-1.5 bg-white border shadow-sm rounded hover:bg-blue-100 transition" title="Chuyển tiếp">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Đang tải lịch học...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((day, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">

                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {day.day} - {day.date}
                    </h4>
                    <span className="text-sm font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {day.classes.length} buổi học
                    </span>
                  </div>

                  {day.classes.length > 0 ? (
                    <div className="space-y-4">
                      {day.classes.map((c, i) => (
                        <div key={i} className="bg-white p-5 rounded-lg border border-gray-200 border-l-4 border-l-blue-500 shadow-sm transition-shadow hover:shadow-md">

                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="font-bold text-lg text-gray-900 mb-2">{c.course}</h5>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600">
                                {/* THỜI GIAN */}
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium">{c.time}</span>
                                </div>

                                {/* BÀI HỌC */}
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                  </div>
                                  <span>{c.lesson}</span>
                                </div>

                                {/* PHÒNG HỌC */}
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  </div>
                                  <span>{c.classroom}</span>
                                </div>

                                {/* CƠ SỞ */}
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <span>{c.branch}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                              <span className={`px-3 py-1 text-sm font-semibold rounded-full w-full md:w-auto text-center ${getStatusColor(c.status)}`}>
                                {getStatusText(c.status)}
                              </span>
                              
                              {c.attendance && (
                                <span className={`text-sm w-full md:w-auto text-center ${
                                  c.attendance === 'present' ? 'text-green-600 font-medium' :
                                  c.attendance === 'absent' ? 'text-red-500 font-medium' :
                                  'text-yellow-600 font-medium'
                                }`}>
                                  {getAttendanceText(c.attendance)}
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-6 bg-gray-50 rounded-lg">
                      Không có lớp học
                    </div>
                  )}

                </div>
              ))
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Trống</h3>
                <p className="text-gray-400 mt-1">Không có lịch học nào trong thời gian này</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}