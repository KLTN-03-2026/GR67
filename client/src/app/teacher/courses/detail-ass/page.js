"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AssignmentDetail() {
    const router = useRouter();

    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");

    const students = [
        {
            name: "Nguyễn Văn An",
            email: "an@student.com",
            status: "submitted",
            date: "20/01/2024",
            score: "85/100"
        },
        {
            name: "Trần Thị Bình",
            email: "binh@student.com",
            status: "notSubmitted",
            date: "--",
            score: "--"
        },
        {
            name: "Lê Văn C",
            email: "c@student.com",
            status: "submitted",
            date: "19/01/2024",
            score: "90/100"
        }
    ];

    // FILTER
    const filteredStudents = students.filter((s) => {
        const matchTab = tab === "all" || s.status === tab;
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-100 min-h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => router.push("/teacher/courses/assignments")}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
                >
                    ← Quay lại
                </button>
            </div>

            {/* INFO */}
            <div className="bg-white rounded-xl shadow border p-8 mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-blue-600 text-sm font-bold uppercase">
                            Bài tập về nhà
                        </span>
                        <h1 className="text-2xl font-extrabold mt-1">
                            Bài tập Unit 1: Ngữ pháp & Từ vựng
                        </h1>
                    </div>

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Đang mở
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-6 py-6 border-y">
                    <div>
                        <p className="text-sm text-gray-500">📅 Hạn nộp</p>
                        <p className="font-semibold">23:59 - 20/01/2024</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">🎯 Thang điểm</p>
                        <p className="font-semibold">100 điểm</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">📎 File</p>
                        <a href="#" className="text-blue-600 hover:underline">
                            huong_dan_unit1.pdf
                        </a>
                    </div>
                </div>

                <div className="mt-6">
                    <h5 className="font-semibold mb-2">Nội dung hướng dẫn</h5>
                    <p className="text-gray-600">
                        Học viên hoàn thành bài tập trong file đính kèm.
                    </p>
                </div>
            </div>

            {/* STUDENTS */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">

                {/* TABS */}
                <div className="flex justify-between items-center px-6 border-b">
                    <div className="flex gap-2">

                        <button
                            onClick={() => setTab("all")}
                            className={`px-5 py-4 font-semibold border-b-2 ${tab === "all"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent"
                                }`}
                        >
                            Tất cả
                        </button>

                        <button
                            onClick={() => setTab("submitted")}
                            className={`px-5 py-4 font-semibold border-b-2 ${tab === "submitted"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent"
                                }`}
                        >
                            Đã nộp
                        </button>

                        <button
                            onClick={() => setTab("notSubmitted")}
                            className={`px-5 py-4 font-semibold border-b-2 ${tab === "notSubmitted"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent"
                                }`}
                        >
                            Chưa nộp
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Tìm học viên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* TABLE */}
                <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left">Học viên</th>
                            <th className="px-6 py-3 text-left">Trạng thái</th>
                            <th className="px-6 py-3 text-left">Thời gian</th>
                            <th className="px-6 py-3 text-left">Điểm</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredStudents.map((s, index) => (
                            <tr key={index} className="border-t">

                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                            {s.name.split(" ").slice(-2).map(n => n[0]).join("")}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{s.name}</div>
                                            <div className="text-xs text-gray-500">{s.email}</div>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    {s.status === "submitted" ? (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                                            Đã nộp
                                        </span>
                                    ) : (
                                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                                            Chưa nộp
                                        </span>
                                    )}
                                </td>

                                <td>{s.date}</td>

                                <td className={s.status === "submitted"
                                    ? "text-blue-600 font-bold"
                                    : "text-gray-400"}>
                                    {s.score}
                                </td>

                                <td className="px-6 py-4 flex justify-end gap-2">
                                    {s.status === "submitted" ? (
                                        <>
                                            <button className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white">
                                                Xem
                                            </button>
                                            <button className="px-3 py-1 text-sm rounded bg-green-100 text-green-600 hover:bg-green-600 hover:text-white">
                                                Sửa
                                            </button>
                                        </>
                                    ) : (
                                        <button className="px-3 py-1 text-sm rounded bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white">
                                            Nhắc nhở
                                        </button>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}