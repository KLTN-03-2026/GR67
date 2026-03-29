"use client";

import Link from "next/link";
import { useState } from "react";

export default function Page() {
    const [students, setStudents] = useState([
        { id: 1, name: "Nguyễn Văn An", code: "HV001", status: "present" },
        { id: 2, name: "Trần Minh Tuấn", code: "HV002", status: "absent" },
    ]);

    const toggleStatus = (id, status) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.id === id ? { ...s, status: status } : s
            )
        );
    };

    const presentCount = students.filter(s => s.status === "present").length;
    const absentCount = students.filter(s => s.status === "absent").length;

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/teacher/schedule">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                        ← Quay lại
                    </button>
                </Link>

                <h1 className="text-2xl font-bold">
                    Điểm danh: <span className="text-green-600">Tiếng Anh Cơ Bản</span>
                </h1>

                <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
                    Xác nhận
                </button>
            </div>

            {/* THÔNG TIN */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">

                {/* PHÒNG */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <i className="fa-solid fa-location-dot text-blue-500"></i>
                    <div>
                        <p className="text-gray-500 text-sm">Phòng</p>
                        <p className="font-bold">Phòng 101</p>
                    </div>
                </div>

                {/* GIỜ */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <i className="fa-regular fa-clock text-green-500"></i>
                    <div>
                        <p className="text-gray-500 text-sm">Giờ</p>
                        <p className="font-bold">09:00 - 10:30</p>
                    </div>
                </div>

                {/* NGÀY */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <i className="fa-solid fa-calendar-days text-red-500"></i>
                    <div>
                        <p className="text-gray-500 text-sm">Ngày</p>
                        <p className="font-bold">23/03/2026</p>
                    </div>
                </div>

            </div>

            {/* STATS */}
            <div className="flex gap-4 mb-4">
                <span className="bg-gray-200 px-3 py-1 rounded">Tổng: {students.length}</span>
                <span className="bg-green-200 px-3 py-1 rounded">Có mặt: {presentCount}</span>
                <span className="bg-red-200 px-3 py-1 rounded">Vắng: {absentCount}</span>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">STT</th>
                            <th className="p-3 text-left">Học viên</th>
                            <th className="p-3 text-center">Trạng thái</th>
                        </tr>
                    </thead>

                    <tbody>
                        {students.map((s, index) => (
                            <tr key={s.id} className="border-t">
                                <td className="p-3">{index + 1}</td>

                                <td className="p-3">
                                    <div className="font-bold">{s.name}</div>
                                    <div className="text-sm text-blue-600">{s.code}</div>
                                </td>

                                <td className="p-3 text-center">
                                    <div className="inline-flex bg-gray-100 rounded">
                                        <button
                                            onClick={() => toggleStatus(s.id, "present")}
                                            className={`px-4 py-1 rounded ${s.status === "present"
                                                ? "bg-green-600 text-white"
                                                : "text-gray-500"
                                                }`}
                                        >
                                            Có mặt
                                        </button>

                                        <button
                                            onClick={() => toggleStatus(s.id, "absent")}
                                            className={`px-4 py-1 rounded ${s.status === "absent"
                                                ? "bg-red-600 text-white"
                                                : "text-gray-500"
                                                }`}
                                        >
                                            Vắng
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}