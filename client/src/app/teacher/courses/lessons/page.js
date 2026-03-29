"use client";

import Link from "next/link";

export default function Lessons() {
  const lessons = [
    {
      id: 1,
      title: "Bài học 1: Chào hỏi cơ bản",
      date: "2024-01-15",
      time: "09:00 - 10:30",
      status: "completed",
      attendance: 23,
      totalStudents: 25,
      materials: ["Bài giảng PDF", "Bài tập thực hành", "Video hướng dẫn"],
      notes: "Học viên tham gia tích cực, cần ôn tập thêm về phát âm"
    },
    {
      id: 2,
      title: "Bài học 2: Từ vựng về gia đình",
      date: "2024-01-17",
      time: "09:00 - 10:30",
      status: "completed",
      attendance: 24,
      totalStudents: 25,
      materials: ["Flashcards", "Bài tập nghe", "Bài tập viết"],
      notes: "Bài học diễn ra tốt, học viên nắm vững từ vựng cơ bản"
    },
    {
      id: 3,
      title: "Bài học 3: Thì hiện tại đơn",
      date: "2024-01-22",
      time: "09:00 - 10:30",
      status: "scheduled",
      attendance: null,
      totalStudents: 25,
      materials: ["Bài giảng ngữ pháp", "Bài tập củng cố", "Quiz"],
      notes: ""
    },
    {
      id: 4,
      title: "Bài học 4: Động từ bất quy tắc",
      date: "2024-01-24",
      time: "09:00 - 10:30",
      status: "scheduled",
      attendance: null,
      totalStudents: 25,
      materials: ["Bảng động từ", "Bài tập ôn tập", "Game tương tác"],
      notes: ""
    },
    {
      id: 5,
      title: "Bài học 5: Mô tả người và vật",
      date: "2024-01-29",
      time: "09:00 - 10:30",
      status: "scheduled",
      attendance: null,
      totalStudents: 25,
      materials: ["Bài giảng mô tả", "Bài tập miêu tả", "Video mẫu"],
      notes: ""
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'scheduled':
        return 'Đã lên lịch';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản Lý Bài Học</h1>
            <p className="text-gray-600">Theo dõi và quản lý các bài học trong khóa học</p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Danh sách bài học</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {lesson.date}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {lesson.time}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(lesson.status)}`}>
                      {getStatusText(lesson.status)}
                    </span>
                  </div>

                  {lesson.attendance && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Điểm danh:</span>
                        <span className="font-semibold">{lesson.attendance}/{lesson.totalStudents} học viên</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(lesson.attendance / lesson.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Tài liệu bài học:</h5>
                    <div className="flex flex-wrap gap-2">
                      {lesson.materials.map((material, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>

                  {lesson.notes && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Ghi chú:</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{lesson.notes}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">

                    <Link href="/teacher/courses/lessons/detail-lessons">
                      <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                        Xem chi tiết
                      </button>
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê bài học</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng số bài học:</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã hoàn thành:</span>
                <span className="font-semibold text-green-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã lên lịch:</span>
                <span className="font-semibold text-blue-600">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tỷ lệ điểm danh:</span>
                <span className="font-semibold">92%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bài học sắp tới</h3>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Bài học 3: Thì hiện tại đơn</h4>
                <p className="text-sm text-gray-600">22/01/2024 - 09:00</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Bài học 4: Động từ bất quy tắc</h4>
                <p className="text-sm text-gray-600">24/01/2024 - 09:00</p>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}