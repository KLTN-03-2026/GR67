"use client";

import { useRouter } from "next/navigation";

export default function GradeAssignment() {
    const router = useRouter();

    return (
        <div className="h-screen flex flex-col bg-gray-100 font-sans">

            {/* HEADER */}
            <div className="h-16 bg-white border-b flex items-center px-6 gap-8">

                {/* Back */}
                <button
                    onClick={() => router.push("/teacher/courses/assignments")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-2 py-2 rounded-lg font-semibold transition"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Quay lại danh sách
                </button>

                {/* Student info */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                        NA
                    </div>
                    <div>
                        <div className="font-semibold text-sm">Nguyễn Văn An</div>
                        <div className="text-xs text-gray-500">Nộp lúc: 20/01/2024 - 09:15</div>
                    </div>
                </div>

                {/* Actions */}

            </div>

            {/* CONTENT */}
            <div className="flex flex-1 p-5 gap-5 overflow-hidden">

                {/* LEFT */}
                <div className="flex-[2] bg-white rounded-xl shadow flex flex-col overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold">Nội dung bài làm</h3>
                        <button className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                            Tải file bài làm
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-600 p-8 overflow-y-auto">
                        <div className="bg-white max-w-3xl mx-auto min-h-[1000px] p-14 shadow-xl relative">

                            <h4 className="font-bold mb-2">Unit 1: Grammar Practice</h4>

                            <p className="font-semibold">1. Present Simple:</p>
                            <p>- I go to school every day. (Correct)</p>
                            <p>- She watches TV in the evening. (Correct)</p>

                            <p className="font-semibold mt-4">2. Family Vocabulary:</p>
                            <p>- My mother is a doctor...</p>

                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex-1 min-w-[350px] bg-white rounded-xl shadow flex flex-col">

                    <div className="p-5 border-b font-semibold">
                        Chấm điểm & Nhận xét
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">

                        <div className="mb-6">
                            <label className="block mb-2 font-semibold text-sm">
                                Điểm số
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    defaultValue={85}
                                    className="w-20 p-2 border-2 border-blue-600 rounded-lg text-lg font-bold text-center"
                                />
                                <span>/ 100</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-2 font-semibold text-sm">
                                Nhận xét
                            </label>
                            <textarea
                                rows="6"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>
                        <div className="flex flex-col gap-2 mt-1 ml-4">
                            <label className="font-semibold text-sm">
                                Nhận xét nhanh
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-600">
                                    Làm bài tốt 👍
                                </span>
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-600">
                                    Cần cố gắng hơn
                                </span>
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-600">
                                    Trình bày đẹp
                                </span>
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-600">
                                    Bài làm chưa tốt
                                </span>
                            </div>
                        </div>


                    </div>

                    <div className="p-5 border-t">
                        <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
                            Hoàn tất chấm bài
                        </button>
                    </div>


                </div>

            </div>
        </div>
    );
}