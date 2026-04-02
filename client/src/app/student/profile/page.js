"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DateInputField from "../../components/DateInputField";
import { formatDateDdMmYyyy, toDateInputValue } from "../../../lib/dateFormat";

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    FullName: '',
    Numberphone: '',
    dateOfBirth: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        FullName: user.FullName || '',
        Numberphone: user.Numberphone || '',
        dateOfBirth: user.dateOfBirth ? toDateInputValue(user.dateOfBirth) : "",
        address: user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          FullName: formData.FullName,
          Numberphone: formData.Numberphone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Thông tin cá nhân đã được cập nhật thành công!');
        setIsEditing(false);
        // Update user context if needed
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
      }
    } catch (error) {
      setMessage('Có lỗi xảy ra khi cập nhật thông tin!');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Mật khẩu đã được thay đổi thành công!');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Có lỗi xảy ra khi thay đổi mật khẩu!');
      }
    } catch (error) {
      setMessage('Có lỗi xảy ra khi thay đổi mật khẩu!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Thông Tin Cá Nhân</h1>
        <p className="text-gray-600">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('thành công') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'personal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Đổi mật khẩu
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên đầy đủ *
                  </label>
                  <input
                    type="text"
                    name="FullName"
                    value={formData.FullName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''
                      }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="Numberphone"
                    value={formData.Numberphone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <DateInputField
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-md border border-gray-300 ${!isEditing ? "opacity-80" : ""}`}
                    inputClassName="date-input-field min-w-0 flex-1 px-3 py-2 text-sm outline-none border-0 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''
                      }`}
                    placeholder="Nhập địa chỉ của bạn"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-800">Thay đổi mật khẩu</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                Thay đổi mật khẩu
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin tài khoản</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Trạng thái tài khoản:</span>
            <span className="font-medium text-green-600">Đã kích hoạt</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vai trò:</span>
            <span className="font-medium">Học viên</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email xác thực:</span>
            <span className="font-medium text-green-600">Đã xác thực</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ngày tham gia:</span>
            <span className="font-medium">{formatDateDdMmYyyy(new Date())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}