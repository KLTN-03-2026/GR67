"use client";
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddAssignment() {
    const router = useRouter();
    const [courseName, setCourseName] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        tieude: "",
        hannop: "",
        loai: "homework",
        diem: 100,
        mota: ""
    });
    
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const name = localStorage.getItem("selectedCourseName");
        if (name) setCourseName(name);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!formData.tieude || !formData.hannop) {
            setError("Vui lòng nhập đầy đủ tiêu đề và hạn nộp.");
            return;
        }

        const deadlineDate = new Date(formData.hannop);
        const now = new Date();
        if (deadlineDate <= now) {
            setError("Hạn nộp phải diễn ra trong tương lai.");
            return;
        }

        setLoading(true);

        try {
            const courseId = localStorage.getItem("selectedCourseId");
            const token = localStorage.getItem("token");

            const submissionData = new FormData();
            submissionData.append("tieude", formData.tieude);
            submissionData.append("hannop", formData.hannop);
            submissionData.append("loai", formData.loai);
            submissionData.append("diem", formData.diem);
            submissionData.append("mota", formData.mota);
            
            if (file) {
                submissionData.append("file", file);
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(`${apiUrl}/teacher/courses/${courseId}/assignments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                    // Bỏ Content-Type vì FormData sẽ tự động set đúng dạng boundary
                },
                body: submissionData
            });

            const data = await response.json();

            if (data.success) {
                alert("Tạo bài tập thành công!");
                router.push("/teacher/courses/assignments");
            } else {
                setError(data.message || "Có lỗi xảy ra.");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Lỗi kết nối máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <Link href="/teacher/courses/assignments">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Quay Lại
                    </button>
                </Link>

                <h1 className="text-2xl font-bold text-gray-800">
                    Thêm Bài Tập Mới {courseName && `- Khóa: ${courseName}`}
                </h1>
                <div className="w-[100px]"></div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-green-700 to-green-500 px-6 py-4 flex items-center gap-2 text-white font-bold">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo Bài Tập Mới
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Tiêu Đề <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="tieude"
                                value={formData.tieude}
                                onChange={handleChange}
                                placeholder="Nhập tiêu đề..." 
                                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                                required
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Hạn Nộp <span className="text-red-500">*</span></label>
                            <input 
                                type="datetime-local" 
                                name="hannop"
                                value={formData.hannop}
                                onChange={handleChange}
                                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Loại Bài Tập</label>
                            <select 
                                name="loai"
                                value={formData.loai}
                                onChange={handleChange}
                                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                            >
                                <option value="homework">Bài tập về nhà</option>
                                <option value="test">Bài kiểm tra</option>
                                <option value="listening">Bài tập nghe</option>
                                <option value="presentation">Bài thuyết trình</option>
                            </select>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Điểm số tối đa</label>
                            <input 
                                type="number" 
                                name="diem"
                                value={formData.diem}
                                onChange={handleChange}
                                min="1"
                                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                            />
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Nội Dung Mô Tả</label>
                            <textarea 
                                rows="4" 
                                name="mota"
                                value={formData.mota}
                                onChange={handleChange}
                                placeholder="Mô tả chi tiết yêu cầu bài tập..." 
                                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            ></textarea>
                        </div>
                        
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">File Đính Kèm (Không bắt buộc)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                <input 
                                    type="file" 
                                    id="file-upload" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-600 w-full h-full">
                                    <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>{file ? file.name : "Nhấn để mọn tệp tin từ máy tính"}</span>
                                    {file && <span className="text-xs text-green-600 font-medium">Đã chọn 1 file ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>}
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`mt-8 bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-lg font-bold transition-all w-full md:w-auto flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        Thêm Bài Tập
                    </button>
                </form>
            </div>
        </div>
    );
}