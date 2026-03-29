"use client";

import Link from "next/link";
import { useState } from "react";

export default function Schedule() {

  const [view, setView] = useState("week");

  const scheduleData = [
    {
      day: "Thứ 2",
      date: "23/03/2026",
      classes: [
        {
          time: "09:00 - 10:30",
          course: "Tiếng Anh Cơ Bản",
          classroom: "Phòng 101",
          branch: "Cơ sở 1",
          students: 25,
          status: "completed"
        }
      ]
    },
    {
      day: "Thứ 3",
      date: "24/03/2026",
      classes: [
        {
          time: "10:00 - 11:30",
          course: "Tiếng Anh Giao Tiếp",
          classroom: "Phòng 305",
          branch: "Cơ sở 1",
          students: 18,
          status: "completed"
        }
      ]
    },
    {
      day: "Thứ 4",
      date: "25/03/2026",
      classes: []
    },
    {
      day: "Thứ 5",
      date: "26/03/2026",
      classes: [
        {
          time: "14:00 - 15:30",
          course: "Speaking Club",
          classroom: "Phòng 401",
          branch: "Cơ sở 1",
          students: 30,
          status: "ongoing"
        }
      ]
    },
    {
      day: "Thứ 6",
      date: "27/03/2026",
      classes: [{
        time: "14:00 - 15:30",
        course: "Speaking Club",
        classroom: "Phòng 401",
        branch: "Cơ sở 1",
        students: 30,
        status: "ongoing"
      }]
    },
    {
      day: "Thứ 7",
      date: "28/03/2026",
      classes: []
    },
    {
      day: "Chủ Nhật",
      date: "29/03/2026",
      classes: []
    }
  ];

  // 👉 Convert "dd/mm/yyyy" -> Date
  const parseDate = (dateStr) => {
    const [d, m, y] = dateStr.split("/");
    return new Date(`${y}-${m}-${d}`);
  };

  // 👉 Lọc dữ liệu theo view
  const getFilteredSchedule = () => {
    const now = new Date();

    // ===== DAY =====
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

    // ===== WEEK =====
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

    // ===== MONTH =====
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

  const filteredData = getFilteredSchedule();

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Lịch Dạy Học</h1>
          <p className="text-gray-500">Quản lý lịch theo ngày / tuần / tháng</p>
        </div>

        <div className="flex gap-2">
          {["day", "week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition
                ${view === v
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
      <div className="bg-white rounded-lg shadow">

        <div className="p-4 border-b font-semibold">
          {view === "day" && "Lịch hôm nay"}
          {view === "week" && "Lịch tuần này"}
          {view === "month" && "Lịch tháng này"}
        </div>

        <div className="divide-y">
          {filteredData.length > 0 ? (
            filteredData.map((day, index) => (
              <div key={index} className="p-6">

                <div className="flex justify-between mb-3">
                  <h4 className="font-semibold">
                    {day.day} - {day.date}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {day.classes.length} lớp
                  </span>
                </div>

                {day.classes.length > 0 ? (
                  <div className="space-y-3">
                    {day.classes.map((c, i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">

                        <div className="flex justify-between">
                          <div>
                            <h5 className="font-semibold">{c.course}</h5>
                            <p className="text-sm text-gray-500 flex items-center flex-wrap gap-3">

                              {/* TIME */}
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {c.time}
                              </span>

                              {/* CLASSROOM */}
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M3 7h18M5 7v13h14V7M9 11h6M9 15h6" />
                                </svg>
                                {c.classroom}
                              </span>

                              {/* BRANCH (CƠ SỞ) */}
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M3 21h18M5 21V7l7-4 7 4v14M9 21V9h6v12" />
                                </svg>
                                {c.branch}
                              </span>

                              {/* STUDENTS */}
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m6-2.13a4 4 0 10-8 0 4 4 0 008 0zm6-2a4 4 0 10-8 0 4 4 0 008 0z" />
                                </svg>
                                {c.students} HV
                              </span>

                            </p>
                          </div>

                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(c.status)}`}>
                            {getStatusText(c.status)}
                          </span>
                        </div>
                        <Link href="/teacher/schedule/rollcall">
                          <button className="text-green-600 text-sm mt-2 hover:underline">
                            Điểm danh
                          </button>
                        </Link>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-6">
                    Không có lớp học
                  </div>
                )}

              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400">
              Không có dữ liệu phù hợp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}