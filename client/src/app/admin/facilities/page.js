"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiPlus, FiEdit2, FiToggleLeft } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../contexts/ThemeContext";
import InputField from "../../components/InputField";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const API_URL = `${API_BASE}/api/admin/facilities`;

const SearchIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || "w-6 h-6"}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

export default function FacilitiesPage() {
  const { token } = useAuth();
  const { success, error: notifyError, warning } = useNotification();
  const { darkMode } = useTheme();
  const router = useRouter();

  const REGEX = useMemo(() => ({
    facilityName: /^.{2,80}$/u,
    address: /^.{5,160}$/u,
  }), []);

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [creatingFacility, setCreatingFacility] = useState(false);

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null); // { type: 'facility' | 'room', facilityId?, roomId?, currentStatus }

  useEffect(() => {
    if (!token) return;

    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Không thể tải danh sách cơ sở");
        }

        const data = await res.json();
        setFacilities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách cơ sở. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [token]);

  const filteredFacilities = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return facilities.filter((f) => {
      return (
        f.Tencoso?.toLowerCase().includes(term) ||
        f.diachi?.toLowerCase().includes(term) ||
        f.mota?.toLowerCase().includes(term)
      );
    });
  }, [facilities, searchTerm]);

  const stats = useMemo(() => {
    const total = facilities.length;
    const active = facilities.filter((f) => f.trangThaiHoatDong).length;
    return { total, active };
  }, [facilities]);

  const openToggleFacilityStatus = (facility) => {
    setStatusTarget({
      type: "facility",
      facilityId: facility._id,
      currentStatus: facility.trangThaiHoatDong,
    });
    setStatusConfirmOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    try {
      const newStatus = !statusTarget.currentStatus;
      const res = await fetch(`${API_URL}/${statusTarget.facilityId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trangThaiHoatDong: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể cập nhật trạng thái cơ sở");

      setFacilities((prev) =>
        prev.map((f) =>
          f._id === statusTarget.facilityId ? { ...f, trangThaiHoatDong: newStatus } : f
        )
      );
      if (newStatus) {
        success("Đã mở lại trạng thái hoạt động của cơ sở.");
      } else {
        warning("Đã tạm khóa cơ sở.");
      }
    } catch (err) {
      console.error(err);
      notifyError(err.message);
    } finally {
      setStatusConfirmOpen(false);
      setStatusTarget(null);
    }
  };

  const handleCreateAndEditFacility = async () => {
    if (!token || creatingFacility) return;
    try {
      setCreatingFacility(true);
      const Tencoso = "Cơ sở mới";
      const diachi = "Chưa cập nhật";
      if (!REGEX.facilityName.test(Tencoso)) {
        warning("Tên cơ sở không hợp lệ.");
        return;
      }
      if (!REGEX.address.test(diachi)) {
        warning("Địa chỉ cơ sở không hợp lệ.");
        return;
      }
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Tencoso,
          diachi,
          mota: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tạo cơ sở mới");
      if (!data?._id) throw new Error("Không nhận được ID cơ sở mới");
      success("Tạo cơ sở mới thành công.");
      router.push(`/admin/facilities/${data._id}`);
    } catch (err) {
      console.error(err);
      notifyError(err.message);
    } finally {
      setCreatingFacility(false);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-full bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Danh sách cơ sở</h1>
        </div>

        <div
          className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg shadow-sm ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="relative w-full md:w-1/3 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <InputField
              type="text"
              name="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, địa chỉ..."
              inputClassName={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button
              onClick={handleCreateAndEditFacility}
              disabled={creatingFacility}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiPlus className="h-5 w-5" />
              {creatingFacility ? "Đang tạo..." : "Thêm cơ sở"}
            </button>
          </div>
        </div>

        <div
          className={`rounded-lg shadow-sm overflow-hidden ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="overflow-x-auto">
            <table
              className={`w-full text-sm text-left ${
                darkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <thead
                className={`text-xs uppercase ${
                  darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                <tr>
                  <th className="px-6 py-3">STT</th>
                  <th className="px-6 py-3">Tên cơ sở</th>
                  <th className="px-6 py-3">Địa chỉ</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Số phòng</th>
                  <th className="px-6 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className={`text-center py-8 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : filteredFacilities.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className={`text-center py-8 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Không có cơ sở nào.
                    </td>
                  </tr>
                ) : (
                  filteredFacilities.map((facility, index) => (
                    <tr
                      key={facility._id}
                      className={`border-b hover:bg-gray-50 ${
                        darkMode
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-700/70"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <td className="px-6 py-4">{index + 1}</td>
                      <td
                        className={`px-6 py-4 font-medium whitespace-nowrap ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {facility.Tencoso}
                      </td>
                      <td className="px-6 py-4">{facility.diachi}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            facility.trangThaiHoatDong
                              ? darkMode
                                ? "bg-green-900/40 text-green-300"
                                : "bg-green-100 text-green-700"
                              : darkMode
                                ? "bg-red-900/40 text-red-300"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {facility.trangThaiHoatDong
                            ? "Đang hoạt động"
                            : "Ngừng hoạt động"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {facility.phongHocList?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Link href={`/admin/facilities/${facility._id}`}>
                          <button
                            className={`inline-flex items-center justify-center p-2 rounded-md ${
                              darkMode
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-blue-600 hover:text-blue-800"
                            }`}
                            title="Chỉnh sửa cơ sở & phòng học"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => openToggleFacilityStatus(facility)}
                          className={`inline-flex items-center justify-center p-2 rounded-md ${
                            darkMode
                              ? "text-gray-400 hover:text-gray-200"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                          title="Đổi trạng thái hoạt động"
                        >
                          <FiToggleLeft className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={statusConfirmOpen}
        title={
          statusTarget?.type === "facility"
            ? "Xác nhận đổi trạng thái cơ sở"
            : "Xác nhận đổi trạng thái phòng học"
        }
        message={
          statusTarget?.type === "facility"
            ? "Bạn có chắc chắn muốn đổi trạng thái hoạt động của cơ sở này không?"
            : "Bạn có chắc chắn muốn đổi trạng thái hoạt động của phòng học này không?"
        }
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setStatusConfirmOpen(false);
          setStatusTarget(null);
        }}
        confirmText="Xác nhận"
      />
    </div>
  );
}

// (Form CRUD cơ sở & phòng học được tách sang trang /admin/facilities/[id])

