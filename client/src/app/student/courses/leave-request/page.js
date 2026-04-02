"use client";

import { useState } from "react";
import DateInputField from "../../../components/DateInputField";

export default function LeaveRequest() {
  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý gửi yêu cầu nghỉ phép
    alert('Yêu cầu nghỉ phép đã được gửi!');
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Xin Nghỉ Phép</h1>
        <p className="text-gray-600">Gửi yêu cầu nghỉ phép cho các buổi học</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do nghỉ phép *
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Chọn lý do</option>
              <option value="sick">Ốm đau</option>
              <option value="family">Việc gia đình</option>
              <option value="work">Công việc</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu *
              </label>
              <DateInputField
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300"
                inputClassName="date-input-field min-w-0 flex-1 px-3 py-2 text-sm outline-none border-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc *
              </label>
              <DateInputField
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300"
                inputClassName="date-input-field min-w-0 flex-1 px-3 py-2 text-sm outline-none border-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết về lý do nghỉ phép..."
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch Sử Yêu Cầu</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Nghỉ ốm</p>
              <p className="text-sm text-gray-600">15/12/2024 - 16/12/2024</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Đã duyệt
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Việc gia đình</p>
              <p className="text-sm text-gray-600">20/11/2024 - 20/11/2024</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Đang xử lý
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}