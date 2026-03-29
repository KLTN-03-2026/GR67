"use client";
import Link from "next/link";
export default function Assignments() {
  const assignments = [
    {
      id: 1,
      title: "Bài tập về nhà Unit 1",
      description: "Hoàn thành bài tập ngữ pháp và từ vựng Unit 1",
      dueDate: "2024-01-20",
      status: "active",
      submitted: 20,
      total: 25,
      type: "homework",
      points: 100
    },
    {
      id: 2,
      title: "Bài kiểm tra giữa kỳ",
      description: "Kiểm tra kiến thức từ Unit 1 đến Unit 3",
      dueDate: "2024-01-25",
      status: "upcoming",
      submitted: 0,
      total: 25,
      type: "test",
      points: 200
    },
    {
      id: 3,
      title: "Bài tập nghe Unit 2",
      description: "Luyện tập kỹ năng nghe hiểu",
      dueDate: "2024-01-18",
      status: "completed",
      submitted: 23,
      total: 25,
      type: "listening",
      points: 50
    },
    {
      id: 4,
      title: "Bài thuyết trình nhóm",
      description: "Thuyết trình về chủ đề gia đình",
      dueDate: "2024-01-30",
      status: "active",
      submitted: 5,
      total: 5,
      type: "presentation",
      points: 150
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Đang mở';
      case 'upcoming':
        return 'Sắp tới';
      case 'completed':
        return 'Đã kết thúc';
      case 'overdue':
        return 'Quá hạn';
      default:
        return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'homework':
        return '📝';
      case 'test':
        return '📋';
      case 'listening':
        return '🎧';
      case 'presentation':
        return '🎤';
      default:
        return '📄';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'homework':
        return 'Bài tập về nhà';
      case 'test':
        return 'Bài kiểm tra';
      case 'listening':
        return 'Bài tập nghe';
      case 'presentation':
        return 'Bài thuyết trình';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản Lý Bài Tập</h1>
            <p className="text-gray-600">Tạo và theo dõi các bài tập, bài kiểm tra của học viên</p>
          </div>
          <Link href="/teacher/courses/add-ass">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              + Tạo bài tập mới
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getTypeIcon(assignment.type)}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Hạn nộp: {assignment.dueDate}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {assignment.points} điểm
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                  {getStatusText(assignment.status)}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Tiến độ nộp bài:</span>
                  <span className="font-semibold">{assignment.submitted}/{assignment.total} học viên</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${assignment.status === 'completed' ? 'bg-gray-600' :
                      assignment.submitted === assignment.total ? 'bg-green-600' :
                        assignment.submitted > 0 ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                    style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{getTypeText(assignment.type)}</span>
                </div>
                <div className="flex space-x-10">
                  <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Xóa
                  </button>
                  <Link href="/teacher/courses/grade-ass">
                    <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                      Chấm điểm
                    </button>
                  </Link>

                  <Link href="/teacher/courses/edit-ass">
                    <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                      Chỉnh sửa
                    </button>
                  </Link>
                  <Link href="/teacher/courses/detail-ass">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      Xem chi tiết
                    </button>
                  </Link>



                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê bài tập</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng số bài tập:</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đang hoạt động:</span>
                <span className="font-semibold text-green-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sắp tới:</span>
                <span className="font-semibold text-blue-600">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã kết thúc:</span>
                <span className="font-semibold text-gray-600">1</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỷ lệ nộp bài</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bài tập Unit 1</span>
                  <span>80%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bài tập nghe Unit 2</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bài thuyết trình</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}