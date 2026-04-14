"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotification } from "../../../contexts/NotificationContext";
import ConfirmModal from "../../../components/ConfirmModal";
import { toDateInputValue } from "../../../../lib/dateFormat";
import PasswordStrength from "../../../components/PasswordStrength";
import InputField from "../../../components/InputField";
import AdminPageTitle from "../../components/AdminPageTitle";

const PlusIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PencilIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79M10.5 11.25v6m3-6v6M9 5.25h6" /></svg>;

const emptyForm = {
  hovaten: "",
  email: "",
  password: "",
  soDienThoai: "",
  diachi: "",
  gioitinh: "Nam",
  ngaysinh: "",
};

export default function AdminAccountsPage() {
  const { token } = useAuth();
  const { success, error: notifyError, warning } = useNotification();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const API_URL = `${API_BASE}/api/admin/users/admins`;

  const REGEX = useMemo(() => ({
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
    phoneVN: /^(0|\+84)(3|5|7|8|9)\d{8}$/,
    nameVN: /^[A-Za-zÀ-ỹ\s]{2,60}$/u,
    passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/,
  }), []);

  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  useEffect(() => {
    // xl breakpoint = >= 1280px; dưới đó coi là mobile/table
    const mq = window.matchMedia("(max-width: 1279px)");
    const update = () => setIsCompactLayout(Boolean(mq.matches));
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e?.target || {};
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedUser = useMemo(() => users.find((u) => u._id === selectedId) || null, [users, selectedId]);
  const isCreateMode = !selectedUser;

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Failed to fetch admins");
        const list = result.data || [];
        setUsers(list);
        if (list.length) setSelectedId(list[0]._id);
      } catch (err) {
        setError("Không thể tải danh sách quản trị viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!selectedUser) {
      setFormData(emptyForm);
      return;
    }
    setFormData({
      hovaten: selectedUser.hovaten || "",
      email: selectedUser.email || "",
      password: "",
      soDienThoai: selectedUser.soDienThoai || "",
      diachi: selectedUser.diachi || "",
      gioitinh: selectedUser.gioitinh || "Nam",
      ngaysinh: selectedUser.ngaysinh ? toDateInputValue(selectedUser.ngaysinh) : "",
    });
  }, [selectedUser]);

  const filteredUsers = useMemo(() => users.filter((u) => {
    const keyword = searchTerm.toLowerCase();
    return u.hovaten?.toLowerCase().includes(keyword) || u.email?.toLowerCase().includes(keyword) || u.soDienThoai?.includes(searchTerm);
  }), [users, searchTerm]);

  const stats = useMemo(() => ({ total: users.length }), [users]);

  const handleCreateNew = () => {
    setSelectedId(null);
    setFormError("");
    setFormData(emptyForm);
  };

  const openCreateModal = () => {
    handleCreateNew();
    setMobileFormOpen(true);
  };

  const openEditModal = (id) => {
    setSelectedId(id);
    if (isCompactLayout) setMobileFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const hovaten = (formData.hovaten || "").trim();
    const email = (formData.email || "").trim();
    const soDienThoai = (formData.soDienThoai || "").trim();
    const password = formData.password || "";

    if (!REGEX.nameVN.test(hovaten)) {
      setFormError("Họ tên không hợp lệ (2-60 ký tự, chỉ chữ và khoảng trắng).");
      notifyError("Họ tên không hợp lệ.");
      return;
    }
    if (!selectedUser && !REGEX.email.test(email)) {
      setFormError("Email không hợp lệ.");
      notifyError("Email không hợp lệ.");
      return;
    }
    if (soDienThoai && !REGEX.phoneVN.test(soDienThoai)) {
      setFormError("Số điện thoại không đúng định dạng Việt Nam.");
      notifyError("Số điện thoại không đúng định dạng.");
      return;
    }
    if (!selectedUser && !REGEX.passwordStrong.test(password)) {
      setFormError("Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      notifyError("Mật khẩu chưa đủ mạnh.");
      return;
    }
    if (selectedUser && password && !REGEX.passwordStrong.test(password)) {
      setFormError("Mật khẩu mới phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      notifyError("Mật khẩu mới chưa đủ mạnh.");
      return;
    }
    try {
      const isEdit = Boolean(selectedUser);
      const payload = isEdit
        ? { hovaten: formData.hovaten, soDienThoai: formData.soDienThoai, diachi: formData.diachi, gioitinh: formData.gioitinh, ngaysinh: formData.ngaysinh || null, password: formData.password }
        : { ...formData, role: "admin", ngaysinh: formData.ngaysinh || null };
      if (isEdit && !payload.password) delete payload.password;
      const response = await fetch(isEdit ? `${API_URL}/${selectedUser._id}` : API_URL, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to save");
      if (isEdit) {
        setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? result.data : u)));
        success("Cập nhật thông tin admin thành công.");
        if (mobileFormOpen) setMobileFormOpen(false);
      } else {
        setUsers((prev) => [result.data, ...prev]);
        setSelectedId(result.data._id);
        success("Tạo tài khoản admin thành công.");
        if (mobileFormOpen) setMobileFormOpen(false);
      }
    } catch (err) {
      setFormError(err.message);
      notifyError(`Lỗi: ${err.message}`);
    }
  };

  const handleToggleStatus = async () => {
    if (!deletingUserId) return;
    try {
      const response = await fetch(`${API_URL}/${deletingUserId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trangThaiHoatDong: false }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed");
      setUsers((prev) => prev.map((u) => (u._id === deletingUserId ? { ...u, trangThaiHoatDong: false } : u)));
      setIsConfirmModalOpen(false);
      warning("Đã khóa tài khoản admin.");
    } catch (err) {
      setFormError(err.message);
      notifyError(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageTitle
        title="Quản lý Quản trị viên"
        subtitle="Quản lý danh sách và thông tin tài khoản admin hệ thống."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Tổng số quản trị viên" value={stats.total} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="admin-card overflow-hidden xl:col-span-8">
          <div className="admin-card-head flex items-center justify-between">
            <h2 className="font-semibold text-lg text-[color:var(--admin-sidebar-fg)]">Danh sách Admin</h2>
            <button type="button" onClick={openCreateModal} className="admin-btn-accent-sm admin-btn-accent flex items-center gap-1 xl:hidden">
              <PlusIcon /> Thêm Admin
            </button>
          </div>
          <div className="p-4 flex gap-3">
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm theo tên hoặc email..." className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            <button className="px-4 py-2 border rounded-lg text-sm">Lọc</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center py-8">Đang tải...</td></tr>}
              {error && <tr><td colSpan={4} className="text-center py-8 text-red-500">{error}</td></tr>}
              {!loading && !error && filteredUsers.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => {
                    setSelectedId(u._id);
                    if (isCompactLayout) setMobileFormOpen(true);
                  }}
                  className={`cursor-pointer border-t border-[color:var(--admin-border)] ${selectedId === u._id ? "bg-[color:var(--admin-accent-subtle)]" : ""}`}
                >
                  <td className="px-4 py-3"><div className="font-medium">{u.hovaten}</div></td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${u.trangThaiHoatDong ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.trangThaiHoatDong ? "Active" : "Locked"}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(u._id);
                      }}
                      className="text-amber-500"
                    >
                      <PencilIcon />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingUserId(u._id); setIsConfirmModalOpen(true); }} className="text-gray-400"><TrashIcon /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-card hidden p-4 xl:col-span-4 xl:block">
          <h3 className="text-lg font-semibold mb-4">{isCreateMode ? "Thêm Admin" : "Thông tin Admin"}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <InputField label="Họ tên" name="hovaten" value={formData.hovaten} onChange={handleFieldChange} />
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleFieldChange}
              disabled={!isCreateMode}
            />
            <InputField
              label="Số điện thoại"
              name="soDienThoai"
              value={formData.soDienThoai}
              onChange={handleFieldChange}
            />
            <InputField
              label="Địa chỉ"
              name="diachi"
              value={formData.diachi}
              onChange={handleFieldChange}
            />
            <InputField
              label={isCreateMode ? "Mật khẩu" : "Mật khẩu mới (tùy chọn)"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleFieldChange}
            />
            <PasswordStrength password={formData.password} showWhenEmpty={isCreateMode} />
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <button type="submit" className="admin-btn-accent w-full justify-center py-2">{isCreateMode ? "Tạo mới" : "Lưu"}</button>
          </form>
        </section>
      </div>

      {mobileFormOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {isCreateMode ? "Thêm Admin" : "Thông tin Admin"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Điền thông tin rồi bấm lưu</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileFormOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Đóng
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <InputField label="Họ tên" name="hovaten" value={formData.hovaten} onChange={handleFieldChange} />
                <InputField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleFieldChange}
                  disabled={!isCreateMode}
                />
                <InputField
                  label="Số điện thoại"
                  name="soDienThoai"
                  value={formData.soDienThoai}
                  onChange={handleFieldChange}
                />
                <InputField
                  label="Địa chỉ"
                  name="diachi"
                  value={formData.diachi}
                  onChange={handleFieldChange}
                />
                <InputField
                  label={isCreateMode ? "Mật khẩu" : "Mật khẩu mới (tùy chọn)"}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFieldChange}
                />
                <PasswordStrength password={formData.password} showWhenEmpty={isCreateMode} />
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <button type="submit" className="admin-btn-accent w-full justify-center py-2">
                  {isCreateMode ? "Tạo mới" : "Lưu"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Khóa tài khoản"
        message="Bạn có chắc muốn khóa tài khoản này?"
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleToggleStatus}
        confirmText="Khóa"
      />
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div className="admin-card p-4">
    <p className="admin-page-subtitle !mt-0">{title}</p>
    <p className="text-4xl font-bold text-[color:var(--admin-sidebar-fg)]">{value}</p>
  </div>
);
// Không còn Input cục bộ: dùng chung InputField để thống nhất UI
