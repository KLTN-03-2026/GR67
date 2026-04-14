"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DocxViewer from "@/app/components/DocxViewer";

function LessonDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [lesson, setLesson] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Force download behavior using fetch to overcome cross-origin issues
    const handleDownload = async (url, fileName) => {
        try {
            setIsDownloading(true);
            const res = await fetch(url);
            if (!res.ok) throw new Error("Chưa thể tải file");
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Lỗi tải file:", error);
            // Fallback
            window.open(url, "_blank");
        } finally {
            setIsDownloading(false);
        }
    };

    const isPreviewable = (url) => {
        if (!url) return false;
        const extMatch = url.match(/\.(pdf|jpe?g|png|gif|txt|csv|mp4|webm)(\?.*)?$/i);
        return !!extMatch;
    };

    const isDocx = (url) => {
        if (!url) return false;
        return !!url.match(/\.docx(\?.*)?$/i);
    };

    useEffect(() => {
        const fetchLessonAndStudents = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                const token = localStorage.getItem("token");
                const courseId = localStorage.getItem("selectedCourseId");
                
                // Fetch Lesson Details
                const lessonUrl = courseId ? `${apiUrl}/teacher/lessons/${id}?courseId=${courseId}` : `${apiUrl}/teacher/lessons/${id}`;
                const lessonRes = await fetch(lessonUrl, {
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

    // Process Real Data 
    let finalStudents = students;
    if (lesson && lesson.rollcallMap) {
        finalStudents = students.map(s => {
            const status = lesson.rollcallMap[s.id];
            // "present" or "lated" are considered Present
            const present = status === "present" || status === "lated";
            return {
                ...s,
                present
            }
        });
    } else {
        // Fallback or empty if not rolled call yet
        finalStudents = students.map(s => ({...s, present: false}));
    }

    const totalStudents = finalStudents.length;
    const attendedStudents = finalStudents.filter(s => s.present).length;

    return (
    <>
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
                                {lesson.ngayhoc ? new Date(lesson.ngayhoc).toISOString().split('T')[0] : (lesson.createdAt ? new Date(lesson.createdAt).toISOString().split('T')[0] : "Chưa xác định")}
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-base grayscale opacity-80">⏰</span> 
                                <strong className="font-semibold w-24">Thời gian:</strong> 
                                {lesson.giobatdau && lesson.gioketthuc ? 
                                    `${new Date(lesson.giobatdau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(lesson.gioketthuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` 
                                    : "Chưa phân bổ"}
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-base grayscale opacity-80 mt-0.5">📝</span> 
                                <span className="flex-1">
                                    <strong className="font-semibold block mb-1">Ghi chú:</strong>
                                    {lesson.description || "Không có ghi chú"}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* TÀI LIỆU HỌC TẬP CARD */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-lg mb-4 text-gray-800 tracking-tight">Tài liệu học tập</h2>
                        <div className="space-y-0">
                            {lesson.files && lesson.files.length > 0 ? (
                                lesson.files.map((file, idx) => {
                                    const pathUrl = file.url || file.path || '';
                                    const fileUrl = pathUrl ? (pathUrl.startsWith('http') ? pathUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${pathUrl.startsWith('/') ? '' : '/'}${pathUrl}`) : '';
                                    return (
                                    <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition px-2 -mx-2 rounded-md">
                                        <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                            <span className="text-gray-400">📄</span> 
                                            {file.originalName || file.name || file.filename || `Tai-lieu-${idx+1}`}
                                        </span>
                                        {fileUrl ? (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button 
                                                   onClick={(e) => { e.preventDefault(); setSelectedDocument({ url: fileUrl, name: file.originalName || file.name || file.filename || `Tai-lieu-${idx+1}` }); }}
                                                   className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 border border-blue-100 transition-colors">
                                                    Xem
                                                </button>
                                                <button 
                                                   onClick={(e) => { e.preventDefault(); handleDownload(fileUrl, file.originalName || file.name || file.filename || `Tai-lieu-${idx+1}`); }}
                                                   disabled={isDownloading}
                                                   className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed">
                                                    Tải xuống
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Không có file</span>
                                        )}
                                    </div>
                                )})
                            ) : lesson.file ? (
                                (() => {
                                    const pathUrl = lesson.file.url || lesson.file.path || '';
                                    const fileUrl = pathUrl ? (pathUrl.startsWith('http') ? pathUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${pathUrl.startsWith('/') ? '' : '/'}${pathUrl}`) : '';
                                    return (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition px-2 -mx-2 rounded-md">
                                        <span className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                            <span className="text-gray-400">📄</span> 
                                            {lesson.file.originalName || lesson.file.name || lesson.file.filename || "Tai-lieu-buoi-hoc"}
                                        </span>
                                        {fileUrl ? (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button 
                                                   onClick={(e) => { e.preventDefault(); setSelectedDocument({ url: fileUrl, name: lesson.file.originalName || lesson.file.name || lesson.file.filename || "Tai-lieu-buoi-hoc" }); }}
                                                   className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-100 border border-blue-100 transition-colors">
                                                    Xem
                                                </button>
                                                <button 
                                                   onClick={(e) => { e.preventDefault(); handleDownload(fileUrl, lesson.file.originalName || lesson.file.name || lesson.file.filename || "Tai-lieu-buoi-hoc"); }}
                                                   disabled={isDownloading}
                                                   className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed">
                                                    Tải xuống
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Không có file</span>
                                        )}
                                    </div>
                                )})()
                            ) : (
                                <div className="py-3 text-sm text-gray-500 italic">
                                    Không có tài liệu đính kèm
                                </div>
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
                                    {finalStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="2" className="py-4 text-center text-gray-500 text-sm">Chưa có học viên nào</td>
                                        </tr>
                                    ) : finalStudents.map((student) => {
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

        {/* Document View Modal */}
        {selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/80">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                <span className="text-blue-500">📄</span> 
                <span className="truncate max-w-xl">{selectedDocument.name}</span>
                </h3>
                <button onClick={() => setSelectedDocument(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>
            
            {/* Content Preview */}
            <div className="flex-1 bg-gray-100 p-2 lg:p-4 relative overflow-hidden flex flex-col items-center justify-center">
                {isDocx(selectedDocument.url) ? (
                    <DocxViewer fileUrl={selectedDocument.url} />
                ) : isPreviewable(selectedDocument.url) ? (
                    <iframe 
                        src={selectedDocument.url} 
                        className="w-full h-full rounded-xl border border-gray-200 shadow-inner bg-white" 
                        title={selectedDocument.name}
                    />
                ) : (
                    <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm w-full max-w-md">
                        <span className="text-4xl block mb-4">📁</span>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Định dạng không khả dụng cho xem trước</h4>
                        <p className="text-gray-500 text-sm mb-6">Trình duyệt không hỗ trợ xem trực tiếp định dạng tệp này. Vui lòng tải xuống để xem nội dung.</p>
                        <button 
                            onClick={() => handleDownload(selectedDocument.url, selectedDocument.name)}
                            disabled={isDownloading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow mx-auto flex items-center justify-center gap-2 border-0 focus:outline-none"
                        >
                            {isDownloading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                            {isDownloading ? "Đang xử lý tải xuống..." : "Tải xuống ngay"}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                <button 
                onClick={() => setSelectedDocument(null)} 
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                Đóng
                </button>
                <button 
                onClick={() => handleDownload(selectedDocument.url, selectedDocument.name)}
                disabled={isDownloading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {isDownloading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                    {isDownloading ? "Đang tải..." : "Tải xuống"}
                </button>
            </div>
            </div>
        </div>
        )}
    </>
    );
}

export default function LessonDetail() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
            <LessonDetailContent />
        </Suspense>
    );
}