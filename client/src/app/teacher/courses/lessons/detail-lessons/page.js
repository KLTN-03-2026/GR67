"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LessonDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [lesson, setLesson] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLessonAndStudents = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                const token = localStorage.getItem("token");
                const courseId = localStorage.getItem("selectedCourseId");
                
                // Fetch Lesson Details
                const lessonRes = await fetch(`${apiUrl}/teacher/lessons/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!lessonRes.ok) {
                    throw new Error("Không thể tải chi tiết bài học");
                }
                const lessonResult = await lessonRes.json();
                setLesson(lessonResult.data);

                // Fetch students if courseId is available (for roll call list mockup)
                if (courseId) {
                   const stdRes = await fetch(`${apiUrl}/teacher/courses/${courseId}/students`, {
                       headers: { Authorization: `Bearer ${token}` }
                   });
                   if (stdRes.ok) {
                       const stdResult = await stdRes.json();
                       setStudents(stdResult.data || []);
                   }
                }
                
                setError(null);
            } catch (err) {
                console.error("Lỗi:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLessonAndStudents();
    }, [id]);

    if (!id) {
         return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
                    <p className="text-gray-600">Không tìm thấy ID bài học.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex mt-10 justify-center">
                <div className="bg-white border-l-4 border-red-500 shadow-sm text-red-700 px-6 py-4 rounded w-full max-w-md">
                    <p className="font-bold">Đã có lỗi xảy ra</p>
                    <p>{error || "Không tìm thấy nội dung bài học."}</p>
                </div>
            </div>
        );
    }

    // Process Mock Data for UI presentation based on requirements
    const totalStudents = students.length || 25;
    // Assume 92% attendance rate for mockup
    const attendedStudents = Math.floor(totalStudents * 0.92);

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                
                {/* TRỤC BÊN TRÁI - CHI TIẾT BÀI HỌC VÀ TÀI LIỆU */}
                <div className="space-y-6">
                    
                    {/* THÔNG TIN BUỔI HỌC CARD */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-lg mb-5 text-gray-800 tracking-tight">Thông tin buổi học</h2>
                        <div className="space-y-4 text-sm text-gray-700">
                            <p className="flex items-center gap-2">
                                <span className="text-base grayscale opacity-80">📅</span> 
                                <strong className="font-semibold w-24">Ngày:</strong> 
                                {lesson.createdAt ? new Date(lesson.createdAt).toISOString().split('T')[0] : "2024-01-15"}
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-base grayscale opacity-80">⏰</span> 
                                <strong className="font-semibold w-24">Thời gian:</strong> 
                                09:00 - 10:30
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-base grayscale opacity-80 mt-0.5">📝</span> 
                                <span className="flex-1">
                                    <strong className="font-semibold block mb-1">Ghi chú:</strong>
                                    {lesson.description || "Học viên tham gia tích cực, cần ôn tập thêm về phát âm."}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* TÀI LIỆU HỌC TẬP CARD */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-lg mb-4 text-gray-800 tracking-tight">Tài liệu học tập</h2>
                        <div className="space-y-0">
                            {lesson.file ? (
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition px-2 -mx-2 rounded-md">
                                    <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                        <span className="text-gray-400">📄</span> 
                                        {lesson.file.name || lesson.file.filename || "Tai-lieu-buoi-hoc.pdf"}
                                    </span>
                                    <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${lesson.file.path}`} 
                                       target="_blank" rel="noopener noreferrer" 
                                       className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors shrink-0">
                                        Tải về
                                    </a>
                                </div>
                            ) : (
                                <>
                                    {/* Mock Documents to strictly match screenshot */}
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition px-2 -mx-2 rounded-md">
                                        <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                            <span className="text-gray-400">📄</span> Bai-giang-co-ban.pdf
                                        </span>
                                        <button className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors shrink-0">
                                            Tải về
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition px-2 -mx-2 rounded-md">
                                        <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                            <span className="text-gray-400">🎬</span> Video-huong-dan-phat-am.mp4
                                        </span>
                                        <button className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors shrink-0">
                                            Xem
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition px-2 -mx-2 rounded-md">
                                        <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                            <span className="text-gray-400">📝</span> Bai-tap-ve-nha.docx
                                        </span>
                                        <button className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors shrink-0">
                                            Tải về
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* TRỤC BÊN PHẢI - DANH SÁCH ĐIỂM DANH */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 min-h-full">
                        <h2 className="font-bold text-xl mb-8 text-gray-800">
                            Danh sách điểm danh ({attendedStudents}/{totalStudents} học viên)
                        </h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className="pb-4 pt-2 text-center text-gray-700 font-bold border-b border-gray-200">Học viên</th>
                                        <th className="pb-4 pt-2 text-center text-gray-700 font-bold border-b border-gray-200">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(students.length === 0 ? [
                                        { id: 1, name: "Nguyễn Văn An", email: "nguyenvana@email.com", present: true },
                                        { id: 2, name: "Minh Tuấn", email: "tuanminh@email.com", present: false }
                                    ] : students.map((s, idx) => ({
                                        // Merge actual fetched students with random mock attendance ratio
                                        ...s,
                                        present: idx < attendedStudents 
                                    }))).map((student) => {
                                        // Create Monogram Avatar
                                        const names = student.name ? student.name.split(" ") : ["U"];
                                        const initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();
                                        
                                        return (
                                        <tr key={student.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="py-4">
                                                {/* Adjusted to heavily match screenshot alignment (nearly centered layout of left column) */}
                                                <div className="flex items-center justify-center gap-4 mx-auto w-max">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0 text-sm">
                                                        {initials}
                                                    </div>
                                                    <div className="text-left w-48">
                                                        <div className="font-bold text-gray-800 text-sm">{student.name}</div>
                                                        <div className="text-gray-500 text-xs">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                {student.present ? (
                                                    <span className="text-green-600 font-bold text-sm">Có mặt</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold text-sm">Vắng mặt</span>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function LessonDetail() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
            <LessonDetailContent />
        </Suspense>
    );
}