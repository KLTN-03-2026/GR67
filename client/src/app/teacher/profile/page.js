"use client";

import { useState, useEffect } from "react";
import DateInputField from "../../components/DateInputField";
import { formatDateDdMmYyyy, toDateInputValue } from "../../../lib/dateFormat";

export default function Profile() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  // State thông tin cá nhân
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: 'male',
    qualification: '',
    experience: '',
    specialization: ''
  });

  // State mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({
    phone: ""
  });

  // Regex kiểm tra mật khẩu: >= 6 ký tự, 1 chữ HOA, 1 ký tự đặc biệt
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{6,})/;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/teacher/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        const data = await res.json();

        setPersonalInfo({
          fullName: data.userId?.hovaten || '',
          email: data.userId?.email || '',
          phone: data.userId?.soDienThoai || '',
          dateOfBirth: data.userId?.ngaysinh ? toDateInputValue(data.userId.ngaysinh) : "",
          address: data.userId?.diachi || '',
          gender: data.userId?.gioitinh ? 'male' : 'female',
          qualification: data.TrinhDoHocVan || '',
          experience: data.kinhnghiem || '',
          specialization: data.chuyenmon || ''
        });

      } catch (err) {
        console.error("Lỗi load profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate phone realtime
    if (field === "phone") {
      const phoneRegex = /^\d{10}$/;

      if (!phoneRegex.test(value)) {
        setErrors(prev => ({
          ...prev,
          phone: "Số điện thoại phải đúng 10 chữ số"
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          phone: ""
        }));
      }
    }
  };
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSavePersonalInfo = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/teacher/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(personalInfo)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Cập nhật thất bại");
      }

      setIsEditing(false);
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleChangePassword = async () => {
    // Kiểm tra tính hợp lệ
    if (!passwordRegex.test(passwordData.newPassword)) {
      alert("Mật khẩu mới phải từ 6 ký tự trở lên, có ít nhất 1 chữ IN HOA và 1 ký tự đặc biệt!");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/teacher/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không thể đổi mật khẩu");
      }

      alert('Đổi mật khẩu thành công!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thông Tin Cá Nhân</h1>
        <p className="text-gray-600">Quản lý thông tin cá nhân và tài khoản của bạn</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'personal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'password'
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${isEditing
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{personalInfo.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{personalInfo.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>

                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => {
                          const onlyNumber = e.target.value.replace(/\D/g, ""); // chỉ cho nhập số
                          handlePersonalInfoChange("phone", onlyNumber);
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
          ${errors.phone
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                          }`}
                        placeholder="Nhập 10 chữ số"
                      />

                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {personalInfo.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                  {isEditing ? (
                    <DateInputField
                      value={personalInfo.dateOfBirth}
                      onChange={(e) => handlePersonalInfoChange("dateOfBirth", e.target.value)}
                      className="w-full rounded-md border border-gray-300"
                      inputClassName="date-input-field min-w-0 flex-1 px-3 py-2 text-sm outline-none border-0"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {formatDateDdMmYyyy(personalInfo.dateOfBirth, { empty: "" })}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                  {isEditing ? (
                    <textarea
                      value={personalInfo.address}
                      onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{personalInfo.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                  {isEditing ? (
                    <select
                      value={personalInfo.gender}
                      onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {personalInfo.gender === 'male' ? 'Nam' : personalInfo.gender === 'female' ? 'Nữ' : 'Khác'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trình độ</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.qualification}
                      onChange={(e) => handlePersonalInfoChange('qualification', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{personalInfo.qualification}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kinh nghiệm</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.experience}
                      onChange={(e) => handlePersonalInfoChange('experience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{personalInfo.experience}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chuyên môn</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.specialization}
                      onChange={(e) => handlePersonalInfoChange('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{personalInfo.specialization}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSavePersonalInfo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Đổi mật khẩu</h3>

              <div className="max-w-md space-y-4">
                {/* Mật khẩu hiện tại */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <span
                    onClick={() => togglePassword('current')}
                    className="absolute right-3 top-10 cursor-pointer select-none opacity-50 hover:opacity-100"
                  >
                    {showPassword.current ? "🙈" : "👁"}
                  </span>
                </div>

                {/* Mật khẩu mới */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Nhập mật khẩu mới"
                  />
                  <span
                    onClick={() => togglePassword('new')}
                    className="absolute right-3 top-10 cursor-pointer select-none opacity-50 hover:opacity-100"
                  >
                    {showPassword.new ? "🙈" : "👁"}
                  </span>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <span
                    onClick={() => togglePassword('confirm')}
                    className="absolute right-3 top-10 cursor-pointer select-none opacity-50 hover:opacity-100"
                  >
                    {showPassword.confirm ? "🙈" : "👁"}
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}