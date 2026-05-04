"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LOAI_BAI_MAP = {
  flashcard: { label: "Flashcard", icon: "🎴", color: "bg-blue-50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200" },
  quiz: { label: "Trắc nghiệm (Quiz)", icon: "📋", color: "bg-green-50 text-green-800 dark:bg-green-500/20 dark:text-green-200" },
  trueFalse: { label: "Đúng/Sai", icon: "⚖️", color: "bg-purple-50 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200" },
  shortAnswer: { label: "Trả lời ngắn", icon: "✍️", color: "bg-orange-50 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200" },
  multiSelect: { label: "Chọn nhiều đáp án", icon: "☑️", color: "bg-teal-50 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200" },
  mixedNoFlashcard: { label: "Hỗn hợp", icon: "🎲", color: "bg-yellow-50 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200" }
};

export default function PracticeList() {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    const fetchPractices = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/student/practice`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setPractices(Array.isArray(data) ? data : []);
        } else {
          setError("Không thể tải danh sách bài luyện tập.");
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Lỗi kết nối mạng.");
      } finally {
        setLoading(false);
      }
    };

    fetchPractices();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-red-100">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Filter exercises
  const filteredPractices = practices.filter((practice) => {
    const pType = practice.loaiBai || "other";
    const mappedInfo = LOAI_BAI_MAP[pType];
    const typeLabel = mappedInfo ? mappedInfo.label : pType;
    const courseName = practice.khoaHocID?.tenkhoahoc || practice.khoaHocID?.tenKhoaHoc || "";
    const title = practice.tenBai || "";

    // Lọc theo keyword
    const matchSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      typeLabel.toLowerCase().includes(searchTerm.toLowerCase());

    // Lọc theo drop-down option
    const matchType = selectedType === "all" || pType === selectedType;

    return matchSearch && matchType;
  });

  // Nhóm các bài luyện tập đã lọc
  const groupedPractices = filteredPractices.reduce((acc, practice) => {
    const type = practice.loaiBai || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(practice);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Luyện Tập Tổng Hợp</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Chọn bài luyện tập để rèn luyện kỹ năng. Các bài tập được phân loại theo hình thức làm bài.</p>
        
        {/* Thanh công cụ tìm kiếm & lọc */}
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên bài, Khóa học, hoặc Thể loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer font-medium text-gray-700 dark:text-gray-300"
            >
              <option value="all">Tất cả thể loại</option>
              {Object.entries(LOAI_BAI_MAP).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {Object.keys(groupedPractices).length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8 text-center border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Không tìm thấy bài luyện tập nào phù hợp với tìm kiếm của bạn.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedPractices).map(([type, items]) => {
            const typeInfo = LOAI_BAI_MAP[type] || { label: type, icon: "📄", color: "bg-gray-50 text-gray-800" };

            return (
              <div key={type} className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b dark:border-gray-800 pb-2">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{typeInfo.label}</h2>
                  <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {items.length} bài
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((practice) => (
                    <div key={practice._id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                      <div className={`px-4 py-2 ${typeInfo.color} font-medium text-sm border-b dark:border-gray-800`}>
                        {typeInfo.label}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2 line-clamp-2">{practice.tenBai}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                          {practice.moTa || "Không có mô tả"}
                        </p>

                        <div className="mt-auto space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {practice.thoiGianLamBai > 0 ? `${practice.thoiGianLamBai} phút` : "Không giới hạn TG"}
                          </div>
                          {practice.khoaHocID && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                              <span className="truncate">{practice.khoaHocID.tenkhoahoc || practice.khoaHocID.tenKhoaHoc}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            Tạo lúc: {new Date(practice.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/student/practice/${practice._id}`)}
                          className="mt-5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Làm bài <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}