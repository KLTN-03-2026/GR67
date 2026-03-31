"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

// Icons
const PlusIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SearchIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const PencilIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0l-8.932 8.931m0 0l-1.688-1.688m1.688 1.688l-8.932-8.931" /></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033C6.913 2.345 6 3.255 6 4.375v.916m7.5 0" /></svg>;

export default function CourseTypesPage() {
  const { token } = useAuth();
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCertificate, setFilterCertificate] = useState("all");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingCourseType, setEditingCourseType] = useState(null);
  const [deletingCourseTypeId, setDeletingCourseTypeId] = useState(null);

  const API_URL = "/api/course-types";

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
          setCourseTypes(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filteredCourseTypes = useMemo(() => {
    return courseTypes.filter(ct => {
      const matchesCertificate = filterCertificate === 'all' || ct.certificateType === filterCertificate;
      const matchesSearch = ct.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCertificate && matchesSearch;
    });
  }, [courseTypes, searchTerm, filterCertificate]);

  const stats = useMemo(() => {
    const total = courseTypes.length;
    const toeic = courseTypes.filter(ct => ct.certificateType === 'TOEIC').length;
    const ielts = courseTypes.filter(ct => ct.certificateType === 'IELTS').length;
    return { total, toeic, ielts };
  }, [courseTypes]);

  const handleOpenAddModal = () => {
    setEditingCourseType(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (courseType) => {
    setEditingCourseType(courseType);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (id) => {
    setDeletingCourseTypeId(id);
    setIsConfirmModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsConfirmModalOpen(false);
    setEditingCourseType(null);
    setDeletingCourseTypeId(null);
  };

  const handleFormSubmit = async (formData) => {
    const url = editingCourseType ? `${API_URL}/${editingCourseType._id}` : API_URL;
    const method = editingCourseType ? 'PUT' : 'POST';

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

      if (editingCourseType) {
        setCourseTypes(courseTypes.map(ct => ct._id === editingCourseType._id ? result.data : ct));
      } else {
        setCourseTypes([result.data, ...courseTypes]);
      }
      handleCloseModals();
    } catch (err) {
      console.error("Failed to save course type", err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourseTypeId) return;
    try {
      const response = await fetch(`${API_URL}/${deletingCourseTypeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete');
      }

      setCourseTypes(courseTypes.filter(ct => ct._id !== deletingCourseTypeId));
      handleCloseModals();
    } catch (err) {
      console.error("Failed to delete course type", err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6  min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold light:text-gray-900 dark:text-white text-gray-900 ">Quản lý Loại Khóa Học</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Thêm, sửa, xóa và tìm kiếm các loại khóa học trong hệ thống.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Tổng số" value={stats.total} />
          <StatCard title="TOEIC" value={stats.toeic} />
          <StatCard title="IELTS" value={stats.ielts} />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="relative w-full md:w-1/3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select
              value={filterCertificate}
              onChange={(e) => setFilterCertificate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả chứng chỉ</option>
              <option value="TOEIC">TOEIC</option>
              <option value="IELTS">IELTS</option>
            </select>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm mới
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">STT</th>
                  <th scope="col" className="px-6 py-3">Tên loại khóa học</th>
                  <th scope="col" className="px-6 py-3">Loại chứng chỉ</th>
                  <th scope="col" className="px-6 py-3">Mô tả</th>
                  <th scope="col" className="px-6 py-3">Ngày tạo</th>
                  <th scope="col" className="px-6 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8 dark:text-gray-400">Đang tải...</td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="text-center py-8 text-red-500 dark:text-red-400">{error}</td></tr>
                ) : filteredCourseTypes.length > 0 ? (
                  filteredCourseTypes.map((ct, index) => (
                    <tr key={ct._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4">{index + 1}</td>
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{ct.name}</th>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ct.certificateType === 'TOEIC' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {ct.certificateType}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm truncate">{ct.description}</td>
                      <td className="px-6 py-4">{new Date(ct.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenEditModal(ct)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400" title="Chỉnh sửa">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(ct._id)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400" title="Xóa">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-8 dark:text-gray-400">Không tìm thấy loại khóa học nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isFormModalOpen && (
        <CourseTypeFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSubmit={handleFormSubmit}
          initialData={editingCourseType}
        />
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa loại khóa học này không? Hành động này không thể hoàn tác."
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
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

function CourseTypeFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    certificateType: 'TOEIC',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        certificateType: initialData.certificateType || 'TOEIC',
        description: initialData.description || ''
      });
    } else {
      setFormData({ name: '', certificateType: 'TOEIC', description: '' });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialData ? 'Chỉnh sửa Loại Khóa Học' : 'Thêm Loại Khóa Học Mới'}
            </h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên loại khóa học</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="certificateType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại chứng chỉ</label>
              <select name="certificateType" id="certificateType" value={formData.certificateType} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="TOEIC">TOEIC</option>
                <option value="IELTS">IELTS</option>
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
              <textarea name="description" id="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
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