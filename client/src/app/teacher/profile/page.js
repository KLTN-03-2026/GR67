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
    phone: "",
    dateOfBirth: "",
    experience: ""
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

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
        setErrors(prev => ({ ...prev, phone: "Số điện thoại phải đúng 10 chữ số" }));
      } else {
        setErrors(prev => ({ ...prev, phone: "" }));
      }
    }

    // Validate dateOfBirth
    if (field === "dateOfBirth") {
      let dobError = "";
      if (value) {
        const selectedDate = new Date(value);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate > currentDate) {
          dobError = "Ngày sinh không được lớn hơn hiện tại";
        }
      }
      setErrors(prev => ({ ...prev, dateOfBirth: dobError }));

      // Re-validate experience when dob changes
      if (personalInfo.experience) {
         validateExperience(personalInfo.experience, value);
      }
    }

    // Validate experience
    if (field === "experience") {
      validateExperience(value, personalInfo.dateOfBirth);
    }
  };

  const validateExperience = (expValueString, dobString) => {
    let errorMsg = "";
    if (expValueString) {
      const expValue = parseInt(expValueString, 10);
      if (isNaN(expValue) || expValue <= 0) {
        errorMsg = "Kinh nghiệm phải lớn hơn 0";
      } else if (dobString) {
        const birthYear = new Date(dobString).getFullYear();
        const currentYear = new Date().getFullYear();
        const maxExp = currentYear - birthYear;
        if (maxExp > 0 && expValue > maxExp) {
          errorMsg = `Kinh nghiệm không vượt quá ${maxExp} năm (theo tuổi)`;
        }
      }
    }
    setErrors(prev => ({ ...prev, experience: errorMsg }));
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
      showToast('Cập nhật thông tin thành công!');
    } catch (error) {
      showToast('Có lỗi xảy ra: ' + error.message, 'error');
    }
  };

  const handleChangePassword = async () => {
    // Kiểm tra tính hợp lệ
    if (!passwordRegex.test(passwordData.newPassword)) {
      showToast("Mật khẩu mới phải từ 6 ký tự trở lên, có ít nhất 1 chữ IN HOA và 1 ký tự đặc biệt!", "error");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Xác nhận mật khẩu mới không khớp!", "error");
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

      showToast('Đổi mật khẩu thành công!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast('Có lỗi xảy ra: ' + error.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 md:p-8 animate-slide-in-up">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-emerald-50">
            {personalInfo.fullName ? personalInfo.fullName.charAt(0).toUpperCase() : 'GV'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Hồ Sơ Giảng Viên</h1>
            <p className="text-gray-500">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <div className="p-4 border-b border-gray-100">
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'personal'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : 'bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'password'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : 'bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Đổi mật khẩu
            </button>
          </nav>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'personal' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Chi tiết hồ sơ</h3>
                  <p className="text-sm text-gray-500 mt-1">Các thông tin cơ bản liên hệ và lý lịch</p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`mt-4 sm:mt-0 px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${isEditing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Hủy chỉnh sửa
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      Chỉnh sửa hồ sơ
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Họ và tên */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Họ và tên</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.fullName || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={personalInfo.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed text-gray-500 transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.email || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>

                {/* Số điện thoại */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => {
                          const onlyNumber = e.target.value.replace(/\D/g, "");
                          handlePersonalInfoChange("phone", onlyNumber);
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all text-gray-800
                          ${errors.phone ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500"}`}
                        placeholder="Nhập 10 chữ số"
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0">{errors.phone}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.phone || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>

                {/* Ngày sinh */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày sinh</label>
                  {isEditing ? (
                    <div className="relative">
                      <DateInputField
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => handlePersonalInfoChange("dateOfBirth", e.target.value)}
                        className={`w-full rounded-lg border bg-gray-50 focus-within:ring-2 focus-within:bg-white transition-all
                          ${errors.dateOfBirth ? "border-red-400 focus-within:ring-red-400" : "border-gray-200 focus-within:ring-emerald-500"}`}
                        inputClassName="date-input-field flex-1 px-4 py-2.5 text-gray-800 outline-none border-0 bg-transparent"
                      />
                      {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0">{errors.dateOfBirth}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{formatDateDdMmYyyy(personalInfo.dateOfBirth, { empty: <span className="text-gray-400 italic">Chưa cập nhật</span> })}</p>
                    </div>
                  )}
                </div>

                {/* Giới tính */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Giới tính</label>
                  {isEditing ? (
                    <select
                      value={personalInfo.gender}
                      onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.gender === 'male' ? 'Nam' : personalInfo.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                    </div>
                  )}
                </div>

                {/* Trình độ */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trình độ</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.qualification}
                      onChange={(e) => handlePersonalInfoChange('qualification', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800"
                      placeholder="Ví dụ: Thạc sĩ, Cử nhân..."
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.qualification || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>

                {/* Kinh nghiệm */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kinh nghiệm</label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="number"
                        value={personalInfo.experience}
                        onChange={(e) => handlePersonalInfoChange('experience', e.target.value)}
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all text-gray-800
                          ${errors.experience ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500"}`}
                        placeholder="Số năm kinh nghiệm (VD: 3)"
                      />
                      {errors.experience && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0">{errors.experience}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.experience || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>

                {/* Chuyên môn */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chuyên môn</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={personalInfo.specialization}
                      onChange={(e) => handlePersonalInfoChange('specialization', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800"
                      placeholder="Ví dụ: Lập trình Web..."
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium">{personalInfo.specialization || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="md:col-span-2 group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Địa chỉ</label>
                  {isEditing ? (
                    <textarea
                      value={personalInfo.address}
                      onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800 resize-none"
                      placeholder="Nhập địa chỉ của bạn"
                    />
                  ) : (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-all">
                      <div className="p-2 bg-white rounded-md text-gray-400 group-hover:text-emerald-500 shadow-sm border border-gray-100 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </div>
                      <p className="text-gray-800 font-medium leading-relaxed">{personalInfo.address || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSavePersonalInfo}
                    disabled={!!errors.phone || !!errors.dateOfBirth || !!errors.experience}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md transition-all flex items-center gap-2 ${
                      (errors.phone || errors.dateOfBirth || errors.experience)
                        ? 'bg-emerald-300 cursor-not-allowed shadow-none' 
                        : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Lưu thông tin
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="animate-fade-in max-w-xl mx-auto space-y-8 bg-gray-50 border border-gray-100 p-6 md:p-8 rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white shadow-sm border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Bảo mật tài khoản</h3>
                <p className="text-sm text-gray-500 mt-1">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
              </div>

              <div className="space-y-5">
                {/* Mật khẩu hiện tại */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                    </div>
                    <input
                      type={showPassword.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-800 shadow-sm"
                      placeholder="Nhập mật khẩu đang dùng"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                    >
                      {showPassword.current ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="h-px bg-gray-200"></div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <input
                      type={showPassword.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-800 shadow-sm"
                      placeholder="Mật khẩu từ 6 ký tự, có in hoa & ký tự đặc biệt"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                    >
                      {showPassword.new ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-800 shadow-sm"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                    >
                      {showPassword.confirm ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-bold shadow-md hover:shadow-lg hover:shadow-emerald-200 transition-all flex justify-center items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in-up transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-emerald-200/50' 
            : 'bg-red-50 text-red-700 border border-red-200 shadow-red-200/50'
        }`}>
          {toast.type === 'success' ? (
            <div className="p-1 bg-emerald-100 rounded-full text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
          ) : (
            <div className="p-1 bg-red-100 rounded-full text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}