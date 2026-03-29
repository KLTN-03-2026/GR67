"use client";

import React from 'react';

import Link from "next/link";
export default function AddAssignment() {
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
                    Danh Sách Bài Tập Của Khóa: <span className="text-green-700">Cơ bản 1</span>
                </h1>
                <div className="w-[100px]"></div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-green-700 to-green-500 px-6 py-4 flex items-center gap-2 text-white font-bold">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm Bài Tập Mới
                </div>

                <form className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Tiêu Đề</label>
                            <input type="text" placeholder="Nhập tiêu đề..." className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Hạn Nộp</label>
                            <input type="date" className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">Nội Dung</label>
                            <textarea rows="3" placeholder="Mô tả chi tiết..." className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"></textarea>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 text-sm">File Đính Kèm</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                <input type="file" id="file-upload" className="hidden" />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-600">
                                    <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Chọn tệp tin hoặc kéo thả vào đây</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="mt-6 bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-lg font-bold transition-all w-full md:w-auto">
                        Thêm Bài Tập
                    </button>
                </form>
            </div>

            {/* Table Section */}

        </div>
    );
}