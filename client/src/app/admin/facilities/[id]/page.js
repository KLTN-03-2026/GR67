"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotification } from "../../../contexts/NotificationContext";
import ConfirmModal from "../../../components/ConfirmModal";
import { useTheme } from "../../../contexts/ThemeContext";
import InputField from "../../../components/InputField";
import AdminCard from "../../components/AdminCard";
import { FiArrowLeft, FiPlus, FiEdit2, FiToggleLeft } from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE}/api/admin/facilities`;

export default function FacilityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { success, error: notifyError, warning } = useNotification();
  const { darkMode } = useTheme();

  const REGEX = {
    facilityName: /^.{2,80}$/u,
    address: /^.{5,160}$/u,
    roomName: /^.{2,40}$/u,
  };

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    Tencoso: "",
    diachi: "",
    mota: "",
  });

  const [editingRoom, setEditingRoom] = useState(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [roomStatusTarget, setRoomStatusTarget] = useState(null); // roomId, currentStatus

  useEffect(() => {
    if (!token || !id) return;

    const fetchFacility = async () => {
      try {
        setLoading(true);
        // Backend hiện tại chỉ có getAll nên tạm fetch tất cả rồi lọc theo id
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không thể tải thông tin cơ sở");
        const list = await res.json();
        const found = Array.isArray(list) ? list.find((f) => f._id === id) : null;
        if (!found) {
          setError("Không tìm thấy cơ sở");
          return;
        }
        setFacility(found);
        setFormData({
          Tencoso: found.Tencoso || "",
          diachi: found.diachi || "",
          mota: found.mota || "",
        });
      } catch (e) {
        console.error(e);
        setError(e.message || "Lỗi khi tải cơ sở");
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [token, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitFacility = async (e) => {
    e.preventDefault();
    try {
      const Tencoso = (formData.Tencoso || "").trim();
      const diachi = (formData.diachi || "").trim();
      if (!REGEX.facilityName.test(Tencoso)) {
        warning("Tên cơ sở không hợp lệ (2-80 ký tự).");
        return;
      }
      if (!REGEX.address.test(diachi)) {
        warning("Địa chỉ không hợp lệ (tối thiểu 5 ký tự).");
        return;
      }
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật cơ sở thất bại");
      setFacility((prev) => (prev ? { ...prev, ...data } : data));
      success("Đã lưu thay đổi cơ sở.");
    } catch (e) {
      console.error(e);
      notifyError(e.message);
    }
  };

  const openAddRoom = () => {
    setEditingRoom(null);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
  };

  const handleSubmitRoom = async (roomData) => {
    if (!facility) return;
    const isEdit = !!editingRoom?._id;
    const TenPhong = (roomData?.TenPhong || "").trim();
    const succhua = Number(roomData?.succhua || 0);
    if (!REGEX.roomName.test(TenPhong)) {
      warning("Tên phòng không hợp lệ (2-40 ký tự).");
      return;
    }
    if (!Number.isInteger(succhua) || succhua < 1 || succhua > 200) {
      warning("Sức chứa phải là số nguyên từ 1 đến 200.");
      return;
    }
    const url = isEdit
      ? `${API_URL}/rooms/${editingRoom._id}`
      : `${API_URL}/${facility._id}/rooms`;
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...roomData, TenPhong, succhua }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lưu phòng học thất bại");
      setFacility((prev) => {
        if (!prev) return prev;
        const list = prev.phongHocList || [];
        if (isEdit) {
          return {
            ...prev,
            phongHocList: list.map((r) => (r._id === data._id ? data : r)),
          };
        }
        return { ...prev, phongHocList: [data, ...list] };
      });
      setEditingRoom(null);
      success(isEdit ? "Cập nhật phòng học thành công." : "Thêm phòng học thành công.");
    } catch (e) {
      console.error(e);
      notifyError(e.message);
    }
  };

  const openToggleRoomStatus = (room) => {
    setRoomStatusTarget({ roomId: room._id, currentStatus: room.trangThaiHoatDong });
    setStatusConfirmOpen(true);
  };

  const handleConfirmRoomStatus = async () => {
    if (!roomStatusTarget) return;
    try {
      const newStatus = !roomStatusTarget.currentStatus;
      const res = await fetch(`${API_URL}/rooms/${roomStatusTarget.roomId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trangThaiHoatDong: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể đổi trạng thái phòng học");
      setFacility((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          phongHocList: (prev.phongHocList || []).map((r) =>
            r._id === roomStatusTarget.roomId ? { ...r, trangThaiHoatDong: newStatus } : r
          ),
        };
      });
      if (newStatus) {
        success("Đã mở lại phòng học.");
      } else {
        warning("Đã tạm khóa phòng học.");
      }
    } catch (e) {
      console.error(e);
      notifyError(e.message);
    } finally {
      setStatusConfirmOpen(false);
      setRoomStatusTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
        <p className="text-sm">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-3 text-gray-800 dark:text-gray-200">
        <p className="text-sm text-red-500">{error}</p>
        <Link
          href="/admin/facilities"
          className={`text-sm underline ${
            darkMode ? "text-blue-300" : "text-blue-600"
          }`}
        >
          Quay lại danh sách cơ sở
        </Link>
      </div>
    );
  }

  if (!facility) return null;

  const rooms = facility.phongHocList || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-gray-800 dark:text-gray-200">
        <div className="admin-card flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="admin-page-title">Chỉnh sửa cơ sở</h1>
            <p className="admin-page-subtitle !mt-1">Cập nhật thông tin cơ sở và quản lý phòng học.</p>
          </div>
          <button type="button" onClick={() => router.push("/admin/facilities")} className="admin-btn-outline h-fit shrink-0 text-xs">
            <FiArrowLeft className="h-3.5 w-3.5 shrink-0" />
            Quay lại danh sách
          </button>
        </div>

        <AdminCard className="p-5">
        <form onSubmit={handleSubmitFacility} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Tên cơ sở
              </label>
              <InputField
                name="Tencoso"
                type="text"
                value={formData.Tencoso}
                onChange={handleChange}
                required
                inputClassName={`w-full px-3 py-2 border rounded-md text-sm ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
            <div className="space-y-1">
              <label
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Địa chỉ
              </label>
              <InputField
                name="diachi"
                type="text"
                value={formData.diachi}
                onChange={handleChange}
                required
                inputClassName={`w-full px-3 py-2 border rounded-md text-sm ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              className={`text-sm ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Mô tả
            </label>
              <InputField
              name="mota"
                type="textarea"
              rows={3}
              value={formData.mota}
              onChange={handleChange}
                inputClassName={`w-full px-3 py-2 border rounded-md text-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => router.push("/admin/facilities")}
              className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                darkMode
                  ? "border-gray-600 text-gray-200 bg-gray-800 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              Hủy
            </button>
            <button type="submit" className="admin-btn-accent text-sm">
              Lưu thay đổi
            </button>
          </div>
        </form>
        </AdminCard>

        <AdminCard className="space-y-4 p-5 md:grid md:grid-cols-4 md:gap-4 md:space-y-0">
          {/* Bảng phòng học bên trái */}
          <div className="space-y-3 md:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Phòng học ({rooms.length})
              </h2>
              <button type="button" onClick={openAddRoom} className="admin-btn-accent-sm admin-btn-accent inline-flex items-center gap-1.5 text-xs">
                <FiPlus className="h-3.5 w-3.5 shrink-0" />
                Thêm phòng
              </button>
            </div>

            <div
              className={`border rounded-md overflow-hidden ${
                darkMode ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <table className="w-full text-xs">
                <thead
                  className={`${
                    darkMode
                      ? "bg-gray-700 text-gray-200"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <tr>
                    <th className="px-4 py-2 text-left">STT</th>
                    <th className="px-4 py-2 text-left">Tên phòng</th>
                    <th className="px-4 py-2 text-left">Sức chứa</th>
                    <th className="px-4 py-2 text-left">Trạng thái</th>
                    <th className="px-4 py-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    darkMode ? "divide-gray-700" : "divide-gray-100"
                  }`}
                >
                  {rooms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className={`px-4 py-4 text-center ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Chưa có phòng học nào.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room, index) => (
                      <tr key={room._id}>
                        <td
                          className={`px-4 py-2 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-4 py-2 ${
                            darkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {room.TenPhong}
                        </td>
                        <td
                          className={`px-4 py-2 ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {room.succhua}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              room.trangThaiHoatDong
                                ? darkMode
                                  ? "bg-green-900/40 text-green-300"
                                  : "bg-green-100 text-green-700"
                                : darkMode
                                  ? "bg-red-900/40 text-red-300"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {room.trangThaiHoatDong ? "Hoạt động" : "Tạm khóa"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button
                            onClick={() => openEditRoom(room)}
                            className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-yellow-400 text-white text-[11px] hover:bg-yellow-500"
                            title="Chỉnh sửa phòng học"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openToggleRoomStatus(room)}
                            className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] ${
                              darkMode
                                ? "bg-gray-700 text-gray-100 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                            title="Đổi trạng thái hoạt động"
                          >
                            <FiToggleLeft className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form phòng học bên phải */}
          <div className="md:col-span-1">
            <RoomFormPanel
              facility={facility}
              room={editingRoom}
              onCancel={() => setEditingRoom(null)}
              onSubmit={handleSubmitRoom}
            />
          </div>
        </AdminCard>

      <ConfirmModal
        isOpen={statusConfirmOpen}
        title="Xác nhận đổi trạng thái phòng học"
        message="Bạn có chắc chắn muốn đổi trạng thái hoạt động của phòng học này không?"
        onCancel={() => {
          setStatusConfirmOpen(false);
          setRoomStatusTarget(null);
        }}
        onConfirm={handleConfirmRoomStatus}
        confirmText="Xác nhận"
      />
    </div>
  );
}

function RoomFormPanel({ facility, room, onCancel, onSubmit }) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    TenPhong: room?.TenPhong || "",
    succhua: room?.succhua || "",
  });

  const isEdit = !!room?._id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      TenPhong: formData.TenPhong,
      succhua: Number(formData.succhua) || 0,
    });
  };

  // Cập nhật form khi chọn phòng khác
  useEffect(() => {
    setFormData({
      TenPhong: room?.TenPhong || "",
      succhua: room?.succhua || "",
    });
  }, [room]);

  return (
    <div
      className={`h-full rounded-md border p-4 text-sm ${
        darkMode
          ? "border-gray-700 bg-gray-900/40"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <h3 className="text-sm font-semibold mb-3">
        {isEdit ? "Chỉnh sửa phòng học" : "Thêm phòng học mới"}
      </h3>
      <p
        className={`text-xs mb-3 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Cơ sở: {facility?.Tencoso}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label
            className={`text-xs ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Tên phòng
          </label>
          <InputField
            name="TenPhong"
            type="text"
            value={formData.TenPhong}
            onChange={handleChange}
            required
            inputClassName={`w-full px-3 py-2 border rounded-md text-xs ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
        </div>
        <div className="space-y-1">
          <label
            className={`text-xs ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Sức chứa
          </label>
          <InputField
            type="number"
            min={1}
            name="succhua"
            value={formData.succhua}
            onChange={handleChange}
            required
            inputClassName={`w-full px-3 py-2 border rounded-md text-xs ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {isEdit && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-3 py-1.5 rounded-md border text-xs ${
                darkMode
                  ? "border-gray-600 text-gray-200 hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Hủy chỉnh sửa
            </button>
          )}
          <button type="submit" className="admin-btn-accent-sm admin-btn-accent text-xs">
            {isEdit ? "Lưu phòng" : "Thêm phòng"}
          </button>
        </div>
      </form>
    </div>
  );
}

