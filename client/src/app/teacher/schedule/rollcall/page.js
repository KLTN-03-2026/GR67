"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function RollcallContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const lessonId = searchParams.get("lessonId");
    const viewMode = searchParams.get("viewMode") === "true";

    const [students, setStudents] = useState([]);
    const [lessonInfo, setLessonInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!lessonId) {
            setError("Không tìm thấy mã buổi học.");
            setLoading(false);
            return;
        }
        const fetchRollcall = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                const res = await fetch(`${apiUrl}/teacher/schedule/rollcall/${lessonId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Cache-Control": "no-cache"
                    }
                });
                const result = await res.json();
                if (result.success) {
                    setLessonInfo(result.data.lesson);
                    // Dữ liệu API trả về có property status, nếu null thì api set mặc định là absent
                    setStudents(result.data.students);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError("Lỗi khi tải dữ liệu điểm danh.");
            } finally {
                setLoading(false);
            }
        };
        fetchRollcall();
    }, [lessonId]);

    const toggleStatus = (dangkykhoahocID, status) => {
        if (viewMode) return;
        setStudents((prev) =>
            prev.map((s) =>
                s.dangkykhoahocID === dangkykhoahocID ? { ...s, status: status } : s
            )
        );
    };

    const handleSubmit = async () => {
        if (viewMode) return;
        try {
            setSubmitting(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const attendanceList = students.map(s => ({
                dangkykhoahocID: s.dangkykhoahocID,
                status: s.status
            }));

            const res = await fetch(`${apiUrl}/teacher/schedule/rollcall/${lessonId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ attendanceList })
            });

            const result = await res.json();
            if (result.success) {
                alert("Lưu điểm danh thành công!");
                router.push("/teacher/schedule");
            } else {
                alert("Có lỗi xảy ra: " + result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối khi lưu");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center pt-20">
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
                <Link href="/teacher/schedule">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        Quay lại lịch dạy
                    </button>
                </Link>
            </div>
        );
    }

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presentCount = students.filter(s => s.status === "present").length;
    const absentCount = students.filter(s => s.status !== "present").length;

    const parseDate = (dString) => {
        const d = new Date(dString);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const parseTime = (dateObj) => {
        const d = new Date(dateObj);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/teacher/schedule">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        ← Quay lại
                    </button>
                </Link>

                <h1 className="text-2xl font-bold">
                    {viewMode ? "Xem Điểm danh: " : "Điểm danh: "}
                    <span className="text-green-600">{lessonInfo?.course}</span>
                </h1>

                {!viewMode && (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                        {submitting ? "Đang lưu..." : "Xác nhận"}
                    </button>
                )}
            </div>

            {/* THÔNG TIN BUỔI HỌC */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <i className="fa-solid fa-location-dot text-blue-500 w-5"></i>
                    <div>
                        <p className="text-gray-500 text-sm">Phòng</p>
                        <p className="font-bold">{lessonInfo?.room}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <i className="fa-regular fa-clock text-green-500 w-5"></i>
                    <div>
                        <p className="text-gray-500 text-sm">Giờ</p>
                        <p className="font-bold">
                            {lessonInfo ? `${parseTime(lessonInfo.startTime)} - ${parseTime(lessonInfo.endTime)}` : "--:-- - --:--"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <i className="fa-solid fa-calendar-days text-red-500 w-5"></i>
                    <div>
                        <p className="text-gray-500 text-sm">Ngày</p>
                        <p className="font-bold">{lessonInfo ? parseDate(lessonInfo.date) : "--/--/----"}</p>
                    </div>
                </div>
            </div>

            {/* TÌM KIẾM & THỐNG KÊ */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                {/* Search */}
                <div className="w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên học viên..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <span className="bg-gray-200 px-4 py-2 rounded-lg font-medium text-sm">Tổng: {students.length}</span>
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium text-sm">Có mặt: {presentCount}</span>
                    <span className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium text-sm">Vắng: {absentCount}</span>
                </div>
            </div>

            {/* BẢNG ĐIỂM DANH */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left w-20">STT</th>
                            <th className="p-3 text-left">Học viên</th>
                            <th className="p-3 text-center w-64">Trạng thái</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((s, index) => (
                                <tr key={s.dangkykhoahocID} className="border-t hover:bg-gray-50">
                                    <td className="p-4">{index + 1}</td>

                                    <td className="p-4">
                                        <div className="font-bold">{s.name}</div>
                                        <div className="text-sm text-blue-600">{s.code}</div>
                                    </td>

                                    <td className="p-4 text-center">
                                        <div className="inline-flex bg-gray-200 rounded p-1">
                                            <button
                                                disabled={viewMode}
                                                onClick={() => toggleStatus(s.dangkykhoahocID, "present")}
                                                className={`px-4 py-1.5 rounded text-sm font-medium transition ${s.status === "present"
                                                    ? "bg-green-600 text-white shadow"
                                                    : "text-gray-600 hover:bg-gray-300"
                                                    } ${viewMode ? 'cursor-default' : ''}`}
                                            >
                                                Có mặt
                                            </button>

                                            <button
                                                disabled={viewMode}
                                                onClick={() => toggleStatus(s.dangkykhoahocID, s.hasApprovedLeave ? "excused" : "absent")}
                                                className={`px-4 py-1.5 rounded text-sm font-medium transition ${s.status !== "present"
                                                    ? "bg-red-600 text-white shadow"
                                                    : "text-gray-600 hover:bg-gray-300"
                                                    } ${viewMode ? 'cursor-default' : ''}`}
                                            >
                                                {s.hasApprovedLeave ? "Vắng (Có phép)" : "Vắng"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-6 text-center text-gray-500">
                                    Không tìm thấy học viên nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        }>
            <RollcallContent />
        </Suspense>
    );
}