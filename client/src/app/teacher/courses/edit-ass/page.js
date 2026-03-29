"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
export default function EditAssignment() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">

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
                    Chỉnh Sửa Bài Tập: <span className="text-blue-600">Unit 1</span>
                </h1>

                <div className="w-[100px]"></div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">

                {/* Header banner */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold flex items-center gap-3">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Cập Nhật Thông Tin Bài Tập
                </div>

                {/* Form */}
                <form className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Title */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-sm text-gray-700">Tiêu Đề</label>
                            <input
                                type="text"
                                defaultValue="Bài tập về nhà Unit 1"
                                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Date */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-sm text-gray-700">Hạn Nộp</label>
                            <input
                                type="date"
                                defaultValue="2024-01-20"
                                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Content */}
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="font-semibold text-sm text-gray-700">Nội Dung</label>
                            <textarea
                                rows="5"
                                defaultValue="Hoàn thành bài tập ngữ pháp và từ vựng Unit 1 trong sách bài tập trang 12-15."
                                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            ></textarea>
                        </div>

                        {/* File */}
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="font-semibold text-sm text-gray-700">File Đính Kèm Hiện Tại</label>

                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-md">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                </svg>

                                <span className="text-blue-600 text-sm flex-1">bai_tap_unit_1.pdf</span>

                                <button type="button" className="text-red-500 text-sm font-semibold hover:underline">
                                    Xóa file
                                </button>
                            </div>

                            {/* Upload */}
                            <label className="mt-4 font-semibold text-sm text-gray-700">
                                Thay Đổi File (Nếu có)
                            </label>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                                <input type="file" id="file-edit" className="hidden" />
                                <label htmlFor="file-edit" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Chọn tệp tin mới hoặc kéo thả vào đây</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 flex justify-end gap-4">
                        <Link href="/teacher/courses/assignments">
                            <button
                                type="button"
                                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
                            >
                                Hủy Bỏ
                            </button>

                        </Link>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700"
                        >
                            Lưu Thay Đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}