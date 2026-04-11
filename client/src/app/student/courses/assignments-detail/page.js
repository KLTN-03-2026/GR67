"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AssignmentDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const courseId = searchParams.get('courseId');
  const router = useRouter();

  const [data, setData] = useState({ assignment: null, submission: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseIdState, setCourseIdState] = useState(courseId);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let currentCourseId = courseId;

    if (!id || !currentCourseId) {
      router.push("/student/courses/assignments");
      return;
    }

    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const res = await fetch(`${API_URL}/student/assignments/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const result = await res.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Không thể lấy thông tin chi tiết bài tập.");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ.");
        console.error("Fetch detail error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, courseId, router]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setSubmitError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setSubmitError("");
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
       setSubmitError("Vui lòng chọn file để nộp.");
       return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      
      const formData = new FormData();
      formData.append("baitapID", id);
      formData.append("file", selectedFile);

      const res = await fetch(`${API_URL}/student/assignments/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const result = await res.json();

      if (result.success) {
        // Cập nhật lại state submission
        setData(prev => ({
          ...prev,
          submission: result.data
        }));
        setSelectedFile(null);
        alert("Nộp bài thành công!");
      } else {
        setSubmitError(result.message || "Không thể nộp bài.");
      }
    } catch (err) {
      console.error("Lỗi khi nộp bài:", err);
      setSubmitError("Lỗi kết nối khi nộp bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Đang tải chi tiết bài tập...</div>;
  }

  if (error || !data.assignment) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-500">{error || "Không tìm thấy bài tập."}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Quay lại</button>
      </div>
    );
  }

  const { assignment, submission } = data;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const getStatusBadge = () => {
    if (!submission || submission.trangthai === "chưa nộp") {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Chưa nộp</span>;
    }
    if (submission.trangthai === "chờ chấm") {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Chờ chấm</span>;
    }
    if (submission.trangthai === "yêu cầu làm lại") {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Yêu cầu làm lại</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Đã chấm</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link href={`/student/courses/assignments?courseId=${courseIdState}`} className="hover:text-blue-600 transition-colors">
          Bài tập
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {assignment.tieude}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Assignment Info */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-start mb-6 gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.tieude}</h1>
              <p className="text-gray-600 mt-2">Khóa học: <span className="font-medium">{assignment.khoahocID?.tenkhoahoc}</span></p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {getStatusBadge()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 bg-gray-50 rounded-lg p-5">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Hạn nộp</p>
              <p className="text-gray-900 font-medium mt-1">
                {new Date(assignment.hannop).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Loại bài</p>
              <p className="text-gray-900 font-medium mt-1 uppercase">{assignment.loai}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Điểm tối đa</p>
              <p className="text-gray-900 font-medium mt-1">{assignment.diem} điểm</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hướng dẫn từ giáo viên</h3>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {assignment.mota || "Không có hướng dẫn thêm."}
            </div>
          </div>

          {assignment.file && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tài liệu đính kèm</h3>
              <a 
                href={assignment.file.url?.startsWith('http') ? assignment.file.url : API_URL + assignment.file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải xuống: {assignment.file.originalName || "Tài liệu"}
              </a>
            </div>
          )}
        </div>
        
        {/* Lịch sử nộp bài & Chấm điểm */}
        {submission && (
          <div className="p-8 border-b border-gray-100 bg-blue-50/30">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kết Quả Nộp Bài</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <p className="text-sm text-gray-500 font-semibold mb-1">Thời gian nộp:</p>
                 <p className="text-gray-900">{new Date(submission.thoigian).toLocaleString("vi-VN")}</p>
                 
                 <div className="mt-4">
                   <p className="text-sm text-gray-500 font-semibold mb-2">File đã nộp:</p>
                   {submission.filenop ? (
                     <a 
                        href={submission.filenop.url?.startsWith('http') ? submission.filenop.url : API_URL + submission.filenop.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 break-all"
                      >
                       <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                       </svg>
                       {submission.filenop.originalName || "File bài làm"}
                     </a>
                   ) : (
                     <p className="text-gray-500 italic">Không có file đính kèm</p>
                   )}
                 </div>
              </div>
              
              <div className="bg-white p-4 justify-center flex flex-col rounded-md shadow-sm border border-gray-100">
                 {submission.trangthai === 'đã chấm' ? (
                   <>
                     <div className="text-center mb-2">
                       <span className="text-3xl font-extrabold text-blue-600">{submission.diem}</span>
                       <span className="text-gray-500 text-lg"> /{assignment.diem}</span>
                     </div>
                     {submission.nhanxet && (
                       <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded italic">
                         <span className="font-semibold block mb-1">Nhận xét:</span>
                         {submission.nhanxet}
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="text-center text-gray-500 py-4">
                      Bài làm đang chờ giáo viên chấm điểm
                   </div>
                 )}
              </div>
            </div>
            
            {submission.filedapan && submission.filedapan.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 font-semibold mb-2">File bài sửa / đáp án:</p>
                <div className="flex flex-col gap-2">
                  {submission.filedapan.map((fd, idx) => (
                    <a 
                      key={idx}
                      href={fd.url?.startsWith('http') ? fd.url : API_URL + fd.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-800"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {fd.originalName || "Đáp án đính kèm"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nộp bài mới (Cho phép nộp nếu chưa chấm) */}
        {(!submission || submission.trangthai !== 'đã chấm') && (
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {submission ? "Nộp Lại Bài" : "Nộp Bài"}
            </h3>
            
            {new Date() > new Date(assignment.hannop) ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-md mb-4 border border-red-100 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bạn đã quá hạn nộp bài. Nếu bạn vẫn nộp, bài của bạn sẽ được đánh dấu là nộp muộn.
              </div>
            ) : null}

            <div 
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
                ${selectedFile ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {!selectedFile ? (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600 cursor-pointer hover:text-blue-500">Tải file lên</span>
                    {" "}hoặc kéo thả vào đây
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Mọi định dạng có thể nén thành ZIP hoặc nộp file tài liệu.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center space-x-3 text-blue-800">
                  <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-lg truncate max-w-full">{selectedFile.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="ml-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>

            {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isSubmitting}
                className={`inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white transition-colors
                  ${!selectedFile || isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  "Xác nhận nộp bài"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
