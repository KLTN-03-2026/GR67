"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import AdminPageTitle from "../components/AdminPageTitle";
import AdminCard from "../components/AdminCard";
import { FiKey, FiLock, FiUnlock, FiRefreshCw, FiTrash2, FiCopy } from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminKioskKeysPage() {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenMoi, setTenMoi] = useState("");
  const [creating, setCreating] = useState(false);
  const [fullKeyModal, setFullKeyModal] = useState({ open: false, value: "", title: "" });
  const [revokeTarget, setRevokeTarget] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/kiosk-keys`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Không tải được danh sách");
      setList(data.data || []);
    } catch (e) {
      setError(e.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = async () => {
    const name = tenMoi.trim();
    if (!name || !token) return;
    setCreating(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/kiosk-keys`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ tenHienThi: name }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Tạo thất bại");
      setTenMoi("");
      await load();
      if (data.fullKey) {
        setFullKeyModal({
          open: true,
          value: data.fullKey,
          title: "Lưu mã kiosk ngay — chỉ hiện một lần",
        });
      }
    } catch (e) {
      setError(e.message || "Lỗi");
    } finally {
      setCreating(false);
    }
  };

  const patchLock = async (id, action) => {
    if (!token) return;
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/kiosk-keys/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Thất bại");
      await load();
    } catch (e) {
      setError(e.message || "Lỗi");
    }
  };

  const doRevoke = async () => {
    if (!revokeTarget || !token) return;
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/kiosk-keys/${revokeTarget}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Thất bại");
      setRevokeTarget(null);
      await load();
    } catch (e) {
      setError(e.message || "Lỗi");
    }
  };

  const rotateSecret = async (id) => {
    if (!token) return;
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/kiosk-keys/${id}/rotate-secret`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Thất bại");
      await load();
      if (data.fullKey) {
        setFullKeyModal({
          open: true,
          value: data.fullKey,
          title: "Mã kiosk mới — chỉ hiện một lần",
        });
      }
    } catch (e) {
      setError(e.message || "Lỗi");
    }
  };

  const copyText = (text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageTitle
        title={
          <span className="inline-flex items-center gap-2">
            <FiKey className="inline shrink-0 text-[color:var(--admin-accent)]" aria-hidden />
            Mã kiosk điểm danh
          </span>
        }
        subtitle={
          <>
            Tạo khóa đặt tên, hiển thị đầy đủ một lần khi tạo hoặc đổi secret. Kiosk nhập{" "}
            <code className="text-xs rounded px-1 py-0.5 bg-[color:var(--admin-sidebar-hover)] text-[color:var(--admin-sidebar-fg)]">
              prefix.suffix
            </code>
            .
          </>
        }
      />

      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 text-sm">
          {error}
        </div>
      ) : null}

      <AdminCard className="p-4 space-y-3">
        <h2 className="font-semibold text-[color:var(--admin-sidebar-fg)]">Tạo khóa mới</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tên hiển thị</label>
            <input
              type="text"
              value={tenMoi}
              onChange={(e) => setTenMoi(e.target.value)}
              placeholder="Ví dụ: Kiosk sảnh A"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            disabled={creating || !tenMoi.trim()}
            onClick={createKey}
            className="admin-btn-accent disabled:opacity-50"
          >
            {creating ? "Đang tạo..." : "Tạo khóa"}
          </button>
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden p-0">
        <div className="admin-card-head">Danh sách khóa</div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Chưa có khóa nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Tên</th>
                  <th className="px-4 py-2 font-medium">Prefix</th>
                  <th className="px-4 py-2 font-medium">Trạng thái</th>
                  <th className="px-4 py-2 font-medium">Tạo lúc</th>
                  <th className="px-4 py-2 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {list.map((row) => (
                  <tr key={row._id} className="text-gray-800 dark:text-gray-200">
                    <td className="px-4 py-3 font-medium">{row.tenHienThi}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.keyPrefix}</td>
                    <td className="px-4 py-3">
                      {row.isRevoked ? (
                        <span className="text-red-600 dark:text-red-400">Đã thu hồi</span>
                      ) : row.isLocked ? (
                        <span className="text-amber-600 dark:text-amber-400">Đang khóa</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">Hoạt động</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {!row.isRevoked ? (
                          <>
                            {row.isLocked ? (
                              <button
                                type="button"
                                title="Mở khóa"
                                onClick={() => patchLock(row._id, "unlock")}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <FiUnlock className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Khóa tạm"
                                onClick={() => patchLock(row._id, "lock")}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <FiLock className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Đổi secret"
                              onClick={() => rotateSecret(row._id)}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <FiRefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Thu hồi"
                              onClick={() => setRevokeTarget(row._id)}
                              className="p-2 rounded-lg border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {fullKeyModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[min(92vh,42rem)] p-6 space-y-4 border dark:border-gray-700 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white">{fullKeyModal.title}</h3>
            <textarea
              readOnly
              value={fullKeyModal.value}
              className="w-full h-24 text-xs font-mono rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-2 text-gray-900 dark:text-gray-100"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => copyText(fullKeyModal.value)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-600 text-sm"
              >
                <FiCopy className="h-4 w-4" /> Sao chép
              </button>
              <button
                type="button"
                onClick={() => setFullKeyModal({ open: false, value: "", title: "" })}
                className="admin-btn-accent text-sm"
              >
                Đã lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={!!revokeTarget}
        title="Thu hồi khóa?"
        message="Khóa sẽ không dùng được nữa. Bạn có chắc?"
        confirmText="Thu hồi"
        onConfirm={doRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
