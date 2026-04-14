"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DocxViewer from "@/app/components/DocxViewer";

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [courseName, setCourseName] = useState("");
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
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseId = localStorage.getItem("selectedCourseId");
        
        if (!courseId) {
          setError("Vui lòng chọn khóa học");
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const token = localStorage.getItem("token");

        // Fetch lessons and students in parallel
        const [lessonsRes, studentsRes] = await Promise.all([
          fetch(`${apiUrl}/teacher/courses/${courseId}/lessons`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiUrl}/teacher/courses/${courseId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!lessonsRes.ok || !studentsRes.ok) {
          throw new Error("Không thể tải dữ liệu");
        }

        const lessonsResult = await lessonsRes.json();
        const studentsResult = await studentsRes.json();

        setLessons(lessonsResult.data || []);
        setStudents(studentsResult.data || []);
        
        // Try to get course name from the first lesson
        if (lessonsResult.data && lessonsResult.data.length > 0) {
           setCourseName(lessonsResult.data[0].courseName || "Khóa Học");
        }

      } catch (err) {
        console.error("Lỗi:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
          </div>
      );
  }

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(l => l.status === "Đã hoàn thành").length; 
  const scheduledLessons = totalLessons - completedLessons;

  return (
    <div className="space-y-6">
      {/* HEADER TỔNG */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản Lý Bài Học</h1>
          <p className="text-gray-500 text-sm">Theo dõi và quản lý các bài học trong khóa học</p>
        </div>
      </div>

      {/* BODY - grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI - DANH SÁCH BÀI HỌC */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Danh sách bài học</h3>
            </div>

            <div className="divide-y divide-gray-100">
              {lessons.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Chưa có bài học nào</div>
              ) : (
                lessons.map((lesson, idx) => {
                  const isCompleted = lesson.status === "Đã hoàn thành";
                  const statusText = lesson.status || "Sắp tới";
                  const statusBg = isCompleted ? "bg-green-50 text-green-700" : lesson.status === "Đang diễn ra" ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700";
                  const totalStudents = lesson.totalStudents || students.length || 0;
                  const attendedStudents = lesson.attendedStudents || 0;
                  const attendancePct = totalStudents > 0 ? (attendedStudents / totalStudents) * 100 : 0;

                  return (
                  <div key={lesson.id} className="p-6 transition-colors">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          Bài học {lesson.order}: {lesson.title}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
                          {statusText}
                        </span>
                    </div>

                    {/* Date Time Row */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4 font-medium">
                        <span className="flex items-center">
                          📅 {lesson.ngayhoc ? new Date(lesson.ngayhoc).toISOString().split('T')[0] : (lesson.createdAt ? new Date(lesson.createdAt).toISOString().split('T')[0] : "Chưa lên lịch")}
                        </span>
                        {lesson.giobatdau && lesson.gioketthuc && (
                          <span className="flex items-center">
                            🕒 {new Date(lesson.giobatdau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(lesson.gioketthuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                    </div>

                    {/* Attendance Progress Row */}
                    <div className="mb-5">
                       <div className="flex justify-between text-sm mb-1 font-medium text-gray-700">
                           <span>Điểm danh:</span>
                           <span>{attendedStudents}/{totalStudents} học viên</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${attendancePct === 100 ? 'bg-green-500' : attendancePct > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{width: `${attendancePct}%`}}></div>
                       </div>
                    </div>

                    {/* Materials Row */}
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-gray-800 mb-2">Tài liệu bài học:</h5>
                      <div className="flex flex-wrap gap-2">
                         {lesson.files && lesson.files.length > 0 ? (
                             lesson.files.map((file, i) => {
                               const pathUrl = file.url || file.path || '';
                               const fileUrl = pathUrl ? (pathUrl.startsWith('http') ? pathUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${pathUrl.startsWith('/') ? '' : '/'}${pathUrl}`) : '#';
                               return (
                                 <a key={i} href={fileUrl} onClick={(e) => { e.preventDefault(); setSelectedDocument({ url: fileUrl, name: file.originalName || file.name || file.filename || "Bài giảng" }); }} title="Nhấn để xem trực tiếp hoặc tải về" className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 cursor-pointer transition-colors shadow-sm">
                                   📄 {file.originalName || file.name || file.filename || "Bài giảng"}
                                 </a>
                               );
                             })
                         ) : lesson.file ? (
                             (() => {
                               const pathUrl = lesson.file.url || lesson.file.path || '';
                               const fileUrl = pathUrl ? (pathUrl.startsWith('http') ? pathUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${pathUrl.startsWith('/') ? '' : '/'}${pathUrl}`) : '#';
                               return (
                                 <a href={fileUrl} onClick={(e) => { e.preventDefault(); setSelectedDocument({ url: fileUrl, name: lesson.file.originalName || lesson.file.name || lesson.file.filename || "Bài giảng" }); }} title="Nhấn để xem trực tiếp hoặc tải về" className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 cursor-pointer transition-colors shadow-sm">
                                   📄 {lesson.file.originalName || lesson.file.name || lesson.file.filename || "Bài giảng"}
                                 </a>
                               );
                             })()
                         ) : (
                             <span className="text-gray-500 text-sm italic">Không có tài liệu đính kèm</span>
                         )}
                      </div>
                    </div>

                    {/* Note Row */}
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-gray-800 mb-1">Ghi chú:</h5>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-inner">
                          {lesson.description || "Học viên tham gia tích cực, cần ôn tập thêm về phát âm"}
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-2">
                      <Link href={`/teacher/courses/lessons/detail-lessons?id=${lesson.id}`}>
                        <button className="text-green-600 hover:text-green-800 text-sm font-semibold hover:underline">
                          Xem chi tiết
                        </button>
                      </Link>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI - THỐNG KÊ */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Thống kê bài học</h3>
            <div className="space-y-3 text-base text-gray-700">
              <div className="flex justify-between items-center">
                <span>Tổng số:</span>
                <span className="font-bold text-xl text-gray-900">{totalLessons}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Đã hoàn thành:</span>
                <span className="font-bold text-xl text-green-600">{completedLessons}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Đã lên lịch:</span>
                <span className="font-bold text-xl text-blue-600">{scheduledLessons}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH HỌC VIÊN SECTION */}
      
      {/* SECTION TITLE */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Danh Sách Học Viên</h2>
        <p className="text-gray-500 text-sm">Quản lý và theo dõi học viên trong các khóa học</p>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100">
           <h3 className="text-md font-bold text-gray-800">Học viên khóa {courseName || "Tiếng Anh Cơ Bản"}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase">
              <tr>
                <th className="px-6 py-4">HỌC VIÊN</th>
                <th className="px-6 py-4">LIÊN HỆ</th>
                <th className="px-6 py-4">TRẠNG THÁI</th>
                <th className="px-6 py-4">ĐIỂM DANH (%)</th>
                <th className="px-6 py-4">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">Không có học viên</td>
                  </tr>
               ) : (
                  students.map((student) => {
                     // Generate initials for avatar
                     const names = student.name ? student.name.split(" ") : ["U"];
                     const initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();
                     
                     // Calculate real attendance based purely on actual explicitly rolled-call records
                     let attendancePct = 0;
                     let displayAttendance = "Chưa có";
                     let barColor = "bg-gray-300";

                     const attended = student.attendedDays || 0;
                     const absent = student.absentDays || 0;
                     const totalRolledCall = attended + absent;

                     if (totalRolledCall > 0) {
                         attendancePct = Math.round((attended / totalRolledCall) * 100);
                         displayAttendance = `${attendancePct}%`;
                         barColor = attendancePct < 50 ? 'bg-red-500' : attendancePct < 80 ? 'bg-yellow-500' : 'bg-green-500';
                     }

                     return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{student.name}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-gray-900">{student.email}</div>
                           <div className="text-gray-500 text-xs">{student.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                             Đang học
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold text-gray-900 mb-1">{displayAttendance}</div>
                           <div className="w-16 bg-gray-200 rounded-full h-1.5">
                             <div className={`h-1.5 rounded-full ${barColor}`} style={{width: `${attendancePct}%`}}></div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <button className="text-blue-600 font-semibold hover:underline text-sm">
                             Xem chi tiết
                           </button>
                        </td>
                      </tr>
                     )
                  })
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document View Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-opacity">
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
                     <p className="text-gray-500 text-sm mb-6">Trình duyệt không hỗ trợ xem trực tiếp định dạng tệp này (Ví dụ: Word, Excel, PowerPoint...). Vui lòng tải xuống để xem nội dung.</p>
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
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

    </div>
  );
}