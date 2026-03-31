"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import ConfirmModal from "../../../components/ConfirmModal";

// Icons
const PlusIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SearchIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const PencilIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0l-8.932 8.931m0 0l-1.688-1.688m1.688 1.688l-8.932-8.931" /></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033C6.913 2.345 6 3.255 6 4.375v.916m7.5 0" /></svg>;
const EyeIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-4.43a1.012 1.012 0 011.43 0l4.43 4.43a1.012 1.012 0 010 .639l-4.43 4.43a1.012 1.012 0 01-1.43 0l-4.43-4.43z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MailIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const PhoneIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>;

export default function StudentAccountsPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  // Cập nhật API_URL để khớp với controller admin/usersControler.js
  const API_URL = "/api/admin/users/students";

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        if (result.success) {
          setUsers(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError("Không thể tải danh sách học viên. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.hovaten?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.soDienThoai?.includes(searchTerm));
      return matchesSearch;
    });
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    const total = users.length;

    // "Đăng ký mới" được tính là các tài khoản tạo trong 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newlyRegistered = users.filter(u => new Date(u.createdAt) > sevenDaysAgo).length;

    // TODO: "Đang học" cần logic riêng để đếm số học viên có trong các khóa học đang hoạt động.
    const studying = 0;

    return { total, newlyRegistered, studying };
  }, [users]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (user) => {
    setViewingUser(user);
    setIsDetailModalOpen(true);
  };

  const handleEditFromDetail = (user) => {
    setIsDetailModalOpen(false);
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (id) => {
    setDeletingUserId(id);
    setIsConfirmModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsDetailModalOpen(false);
    setIsFormModalOpen(false);
    setIsConfirmModalOpen(false);
    setEditingUser(null);
    setViewingUser(null);
    setDeletingUserId(null);
  };

  const handleFormSubmit = async (formData) => {
    const url = editingUser ? `${API_URL}/${editingUser._id}` : API_URL;
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save data');
      }

      if (editingUser) {
        setUsers(users.map(u => u._id === editingUser._id ? result.data : u));
      } else {
        setUsers([result.data, ...users]);
      }
      handleCloseModals();
    } catch (err) {
      console.error("Failed to save user", err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;
    try {
      // Backend sử dụng toggleStatus thay vì DELETE hoàn toàn
      const response = await fetch(`${API_URL}/${deletingUserId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ trangThaiHoatDong: false })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to deactivate account');
      }

      setUsers(users.map(u => u._id === deletingUserId ? { ...u, trangThaiHoatDong: false } : u));
      handleCloseModals();
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Học viên</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý danh sách và thông tin tài khoản học viên.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Tổng số Học viên" value={stats.total} />
          <StatCard title="Đăng ký mới (7 ngày)" value={stats.newlyRegistered} />
          <StatCard title="Đang học" value={stats.studying} />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="relative w-full md:w-1/3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm Học viên
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 dark:text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xl border border-green-200">
                        {user.hovaten?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{user.hovaten}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.role === 'student' ? 'Học viên' : user.role}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.gioitinh === 'Nam' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 
                      user.gioitinh === 'Nữ' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' : 
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.gioitinh || 'Khác'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300 mt-4">
                    <div className="flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-gray-400" />
                      <span className="truncate" title={user.email}>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span>{user.soDienThoai || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 rounded-b-xl flex justify-end gap-2">
                  <button onClick={() => handleOpenDetailModal(user)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Xem chi tiết">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleOpenEditModal(user)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400" title="Chỉnh sửa">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleOpenDeleteModal(user._id)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400" title="Khóa tài khoản">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 dark:text-gray-400">Không tìm thấy học viên nào.</div>
        )}
      </div>

      {isDetailModalOpen && (
        <StudentDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseModals}
          user={viewingUser}
          onEdit={handleEditFromDetail}
        />
      )}
      {isFormModalOpen && (
        <UserFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          initialData={editingUser}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Xác nhận xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản học viên này không? Hành động này không thể hoàn tác."
        onConfirm={handleDeleteConfirm}
        onCancel={handleCloseModals}
        confirmText="Xóa"
      />
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

function UserFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    hovaten: '',
    email: '',
    password: '',
    role: 'student',
    soDienThoai: '',
    gioitinh: 'Nam',
    ngaysinh: '',
    diachi: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        hovaten: initialData.hovaten || '',
        email: initialData.email || '',
        password: '',
        role: 'student',
        soDienThoai: initialData.soDienThoai || '',
        gioitinh: initialData.gioitinh || 'Nam',
        ngaysinh: initialData.ngaysinh ? new Date(initialData.ngaysinh).toISOString().split('T')[0] : '',
        diachi: initialData.diachi || '',
      });
    } else {
      setFormData({ 
        hovaten: '',
        email: '', 
        password: '', 
        role: 'student',
        soDienThoai: '',
        gioitinh: 'Nam',
        ngaysinh: '',
        diachi: '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    if (initialData && !dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialData ? 'Chỉnh sửa Thông tin Học viên' : 'Thêm Học viên Mới'}
            </h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="hovaten" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                <input type="text" name="hovaten" id="hovaten" value={formData.hovaten} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="soDienThoai" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                <input type="tel" name="soDienThoai" id="soDienThoai" value={formData.soDienThoai} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="gioitinh" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
                <select name="gioitinh" id="gioitinh" value={formData.gioitinh} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label htmlFor="ngaysinh" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
                <input type="date" name="ngaysinh" id="ngaysinh" value={formData.ngaysinh} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="diachi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ</label>
                <input type="text" name="diachi" id="diachi" value={formData.diachi} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {initialData ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
                </label>
                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!initialData} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">{initialData ? 'Lưu thay đổi' : 'Tạo mới'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentDetailModal({ isOpen, onClose, user, onEdit }) {
  if (!isOpen || !user) return null;

  const DetailItem = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value || 'Chưa cập nhật'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chi tiết Học viên
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-4xl border-2 border-green-200">
              {user.hovaten?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{user.hovaten}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Học viên</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Số điện thoại" value={user.soDienThoai} />
            <DetailItem label="Giới tính" value={user.gioitinh} />
            <DetailItem label="Ngày sinh" value={user.ngaysinh ? new Date(user.ngaysinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} />
            <div className="md:col-span-2">
              <DetailItem label="Địa chỉ" value={user.diachi} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Đóng</button>
          <button type="button" onClick={() => onEdit(user)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm"><PencilIcon className="w-4 h-4" /> Chỉnh sửa thông tin</button>
        </div>
      </div>
    </div>
  );
}