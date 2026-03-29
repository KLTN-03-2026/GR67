"use client";

export default function LeaveRequests() {
  const leaveRequests = [
    {
      id: 1,
      studentName: "Nguyễn Văn An",
      studentEmail: "nguyenvana@email.com",
      courseName: "Tiếng Anh Cơ Bản",
      requestType: "personal",
      reason: "Gia đình có việc riêng",
      startDate: "2024-01-25",
      endDate: "2024-01-27",
      status: "pending",
      submittedDate: "2024-01-20",
      attachments: ["Giấy xác nhận.pdf"]
    },
    {
      id: 2,
      studentName: "Trần Thị Bình",
      studentEmail: "tranthib@email.com",
      courseName: "Tiếng Anh Cơ Bản",
      requestType: "medical",
      reason: "Ốm đau",
      startDate: "2024-01-22",
      endDate: "2024-01-23",
      status: "approved",
      submittedDate: "2024-01-19",
      attachments: ["Giấy khám bệnh.jpg", "Đơn thuốc.pdf"]
    },
    {
      id: 3,
      studentName: "Lê Văn Cường",
      studentEmail: "levanc@email.com",
      courseName: "Tiếng Anh Trung Cấp",
      requestType: "exam",
      reason: "Thi cuối kỳ",
      startDate: "2024-01-30",
      endDate: "2024-01-31",
      status: "rejected",
      submittedDate: "2024-01-18",
      attachments: ["Lịch thi.pdf"]
    },
    {
      id: 4,
      studentName: "Phạm Thị Dung",
      studentEmail: "phamthid@email.com",
      courseName: "Tiếng Anh Cơ Bản",
      requestType: "personal",
      reason: "Đi công tác",
      startDate: "2024-02-05",
      endDate: "2024-02-07",
      status: "pending",
      submittedDate: "2024-01-21",
      attachments: []
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const getRequestTypeText = (type) => {
    switch (type) {
      case 'personal':
        return 'Việc riêng';
      case 'medical':
        return 'Ốm đau';
      case 'exam':
        return 'Thi cử';
      case 'other':
        return 'Khác';
      default:
        return type;
    }
  };

  const getRequestTypeColor = (type) => {
    switch (type) {
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'exam':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đơn Xin Nghỉ Học</h1>
        <p className="text-gray-600">Xem xét và phê duyệt các đơn xin nghỉ học của học viên</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">2</div>
            <div className="text-sm text-gray-600">Chờ duyệt</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">1</div>
            <div className="text-sm text-gray-600">Đã duyệt</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">1</div>
            <div className="text-sm text-gray-600">Từ chối</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-sm text-gray-600">Tổng số</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Danh sách đơn xin nghỉ</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {leaveRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {request.studentName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{request.studentName}</h4>
                      <p className="text-sm text-gray-600">{request.studentEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Khóa học:</span>
                      <p className="text-sm text-gray-900">{request.courseName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Loại đơn:</span>
                      <p className={`text-sm inline-flex px-2 py-1 rounded-full ${getRequestTypeColor(request.requestType)}`}>
                        {getRequestTypeText(request.requestType)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Thời gian nghỉ:</span>
                      <p className="text-sm text-gray-900">
                        {request.startDate} - {request.endDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Ngày nộp:</span>
                      <p className="text-sm text-gray-900">{request.submittedDate}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Lý do:</span>
                    <p className="text-sm text-gray-900 mt-1">{request.reason}</p>
                  </div>

                  {request.attachments.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500">Tài liệu đính kèm:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {request.attachments.map((file, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                        Duyệt
                      </button>
                      <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Số ngày nghỉ: {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1} ngày
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                    Xem chi tiết
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                    Liên hệ học viên
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}