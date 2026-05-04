"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define some colors for different types of tests
const BADGE_COLORS = {
  TOEIC: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400",
  IELTS: "bg-red-50 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400",
  DEFAULT: "bg-green-50 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-400"
};

export default function PracticeTests() {
  const router = useRouter();
  const [mockTests, setMockTests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        // Fetch Mock Tests list
        const testsRes = await fetch(`${apiUrl}/student/mock-tests`, { headers });
        // Fetch History
        const histRes = await fetch(`${apiUrl}/student/mock-tests/history`, { headers });

        if (testsRes.ok && histRes.ok) {
          const testsData = await testsRes.json();
          const histData = await histRes.json();
          setMockTests(testsData.data || []);
          setHistory(histData.data || []);
        } else {
          setError("Không thể tải dữ liệu.");
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Lỗi kết nối mạng.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Group mock tests by Chung Chi
  const groupedMockTests = mockTests.reduce((acc, test) => {
    const cert = test.chungChi || "Khác";
    if (!acc[cert]) acc[cert] = [];
    acc[cert].push(test);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Luyện Đề</h1>
        <p className="text-gray-600 dark:text-gray-400">Thực hiện các bài luyện đề để ôn tập và kiểm tra kiến thức.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Mock Tests grouped */}
        <div className="lg:col-span-2 space-y-8">
          {Object.keys(groupedMockTests).length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8 text-center border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Chưa có đề thi mẫu nào.</p>
            </div>
          ) : (
            Object.entries(groupedMockTests).map(([cert, tests]) => (
              <div key={cert}>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center border-b dark:border-gray-800 pb-2">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    {cert === "TOEIC" ? "📑" : cert === "IELTS" ? "🎓" : "📄"}
                  </span>
                  Đề thi {cert}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tests.map(test => {
                    const badgeColor = BADGE_COLORS[test.chungChi] || BADGE_COLORS.DEFAULT;
                    return (
                      <div key={test._id} className="bg-white dark:bg-gray-900 border rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white leading-tight pr-10">{test.tenDe}</h3>
                          <span className={`px-2 py-1 border text-xs font-semibold rounded-full absolute top-5 right-4 ${badgeColor}`}>
                            {test.capDo}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10 line-clamp-2">{test.moTa || "Không có mô tả"}</p>

                        <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {test.thoiGianLamBai} phút
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/student/practice-tests/${test._id}`)}
                          className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-medium py-2 rounded-lg transition-colors border border-blue-100 hover:border-blue-600"
                        >
                          Bắt đầu thi
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: History */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Kết Quả Gần Đây
          </h3>

          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Bạn chưa làm bài thi nào.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map(item => (
                <div
                  key={item._id}
                  onClick={() => router.push(`/student/practice-tests/history/${item._id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors gap-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{item.deThiMauID?.tenDe || "Đề thi đã bị xóa"}</p>
                    <p className="text-xs text-gray-500 mt-1">Ngày thi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <span className="block text-xs text-gray-500">Điểm</span>
                      <span className="font-bold text-blue-600">{item.diemSo}/10</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="text-center">
                      <span className="block text-xs text-gray-500">Đúng</span>
                      <span className="font-bold text-green-600">{item.soCauDung}/{item.tongSoCau}</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="text-center">
                      <span className="block text-xs text-gray-500">Thời gian</span>
                      <span className="font-bold text-orange-500">{Math.floor(item.thoiGianLamBai / 60)}m {item.thoiGianLamBai % 60}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}