"use client";

import { useState, useEffect } from 'react';

export default function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      // If course logic needs selectedCourseId from localStorage in the future, handle it here.
      // For now, we fetch all leave requests for the teacher's courses as default.
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      let url = `${apiUrl}/teacher/courses/leave-requests`;


      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (result.success) {
        setLeaveRequests(result.data);
      } else {
        setError(result.message || 'Error fetching data');
      }
    } catch (err) {
      console.error("Lỗi khi fetch đơn xin nghỉ:", err);
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;
  const totalCount = leaveRequests.length;

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
  //phe duyet don
  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/teacher/courses/leave-requests/${id}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Duyệt thất bại");
        return;
      }

      // 🔥 gọi lại API để lấy dữ liệu mới nhất từ server
      await fetchLeaveRequests();

    } catch (err) {
      console.error(err);
      alert("Lỗi khi duyệt đơn");
    }
  };
  //tuchoi don

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/teacher/courses/leave-requests/${id}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (result.success) {
        // 🔥 gọi lại API để lấy dữ liệu mới nhất từ server
        await fetchLeaveRequests();
      } else {
        alert(result.message || "Từ chối thất bại");
      }
    } catch (err) {
      console.error(err);
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
            <div className="text-2xl font-bold text-yellow-600 mb-2">{pendingCount}</div>
            <div className="text-sm text-gray-600">Chờ duyệt</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{approvedCount}</div>
            <div className="text-sm text-gray-600">Đã duyệt</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">{rejectedCount}</div>
            <div className="text-sm text-gray-600">Từ chối</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{totalCount}</div>
            <div className="text-sm text-gray-600">Tổng số</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center py-6 text-red-500">{error}</div>
      ) : leaveRequests.length === 0 ? (
        <div className="text-center py-6 text-gray-500">Không có đơn xin nghỉ nào.</div>
      ) : (


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


                  </div>

                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Số lần xin nghỉ: {request.totalRequests || 0} lần               </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}