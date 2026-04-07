"use client";

import { useState, useEffect } from "react";

export default function LeaveRequest() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [formData, setFormData] = useState({
    courseId: '',
    sessionId: '',
    reason: '',
    description: ''
  });

  const [message, setMessage] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/student/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách khóa học:", err);
    }
  };

  const fetchSessions = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/student/courses/${courseId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách buổi học:", err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/student/leave-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLeaveRequests(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử nghỉ phép:", err);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchCourses();
    fetchLeaveRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch sessions when course changes
  useEffect(() => {
    if (formData.courseId) {
      fetchSessions(formData.courseId);
    } else {
      setSessions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Tìm dangKyKhoaHocId từ khóa học đã chọn
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      if (!selectedCourse) {
        setMessage("Vui lòng chọn khóa học hợp lệ.");
        return;
      }

      const payload = {
        dangKyKhoaHocId: selectedCourse.dangKyKhoaHocId,
        buoihocID: formData.sessionId,
        loai_don: formData.reason,
        lydo_nghi: formData.description
      };

      const response = await fetch(`${apiUrl}/student/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Yêu cầu nghỉ phép đã được gửi!");
        setFormData({ courseId: '', sessionId: '', reason: '', description: '' });
        fetchLeaveRequests(); // Reload
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Lỗi gửi yêu cầu!');
      }
    } catch (error) {
      console.error(error);
      setMessage("Lỗi kết nối máy chủ.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Xin Nghỉ Phép (Theo Buổi)</h1>
        <p className="text-gray-600">Gửi yêu cầu nghỉ phép cho các buổi học cụ thể</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('thành công') || message.includes('được gửi') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khóa học *
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Chọn khóa học --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.tenkhoahoc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buổi học *
              </label>
              <select
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.courseId || sessions.length === 0}
              >
                <option value="">-- Chọn buổi học --</option>
                {sessions.map(s => {
                  const dateStr = new Date(s.ngayhoc).toLocaleDateString('vi-VN');
                  const startHour = new Date(s.giobatdau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <option key={s.id} value={s.id}>
                      {s.tenbai} (Thứ {s.thutu}) - {dateStr} lúc {startHour}
                    </option>
                  );
                })}
              </select>
              {formData.courseId && sessions.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Không có buổi học nào sắp mở cho khóa học này</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do chính *
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Chọn lý do</option>
              <option value="om">Ốm đau</option>
              <option value="viec_rieng">Việc gia đình / cá nhân</option>
              <option value="cong_tac">Công tác</option>
            </select>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết (Tùy chọn)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả lý do rõ hơn..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
          >
            Gửi Yêu Cầu
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch Sử Yêu Cầu Gần Đây</h3>
        <div className="space-y-3">
          {leaveRequests.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có yêu cầu nghỉ phép nào.</p>
          ) : leaveRequests.map(req => (
            <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{req.tenkhoahoc || 'Khóa học không xác định'}</p>
                <p className="text-sm text-gray-600">
                  Lý do: {req.lydo_nghi === 'om' ? 'Ốm đau' : req.lydo_nghi === 'viec_rieng' ? 'Việc riêng' : req.lydo_nghi === 'cong_tac' ? 'Công tác' : 'Khác'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Nghỉ ngày: {req.ngay_bat_dau ? new Date(req.ngay_bat_dau).toLocaleDateString('vi-VN') : 'N/A'}
                  {' - '} Ngày gửi: {new Date(req.thoigian_nop).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${req.trangthai_duyet === 'approved' ? 'bg-green-100 text-green-800' :
                req.trangthai_duyet === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                {req.trangthai_duyet === 'approved' ? 'Đã duyệt' : req.trangthai_duyet === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
