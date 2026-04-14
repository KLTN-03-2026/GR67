"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { FiPaperclip } from "react-icons/fi";
import InputField from "../../components/InputField";
import AdminPageTitle from "../components/AdminPageTitle";
import AdminCard from "../components/AdminCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminAnnouncementsPage() {
  const { token } = useAuth();
  const notify = useNotification();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("list"); // send | list (crud only)

  const [courses, setCourses] = useState([]);

  const [targetType, setTargetType] = useState("all"); // all | class | personal
  const [khoaHocId, setKhoaHocId] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [roles, setRoles] = useState(["student", "teacher"]);

  const [tieuDe, setTieuDe] = useState("");
  const [noidung, setNoidung] = useState("");
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const [docxPreviewLoading, setDocxPreviewLoading] = useState(false);
  const [docxPreviewText, setDocxPreviewText] = useState("");
  const [docxPreviewError, setDocxPreviewError] = useState("");
  const [docxPreviewFileName, setDocxPreviewFileName] = useState("");

  const [listLoading, setListLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listLimit, setListLimit] = useState(20);
  const [listQ, setListQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({
    tieuDe: "",
    noidung: "",
  });

  const headers = useMemo(() => {
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const formatDateTime = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN");
  };

  const truncate = (s, max = 140) => {
    const t = String(s ?? "");
    if (t.length <= max) return t;
    return `${t.slice(0, max)}...`;
  };

  const countOf = (v) => {
    if (Array.isArray(v)) return v.length;
    return v ? 1 : 0;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/admin/courses`, { headers });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tải danh sách lớp");
        setCourses(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        notify.error(e.message || "Không thể tải danh sách lớp");
      }
    };
    fetchCourses();
  }, [token, headers, notify]);

  const onPickFiles = (e) => {
    const list = e.target?.files ? Array.from(e.target.files) : [];
    setFiles(list);
  };

  const isDocxFile = (f) => {
    const type = String(f?.type || "").toLowerCase();
    const name = String(f?.name || "").toLowerCase();
    return type.includes("wordprocessingml.document") || name.endsWith(".docx");
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const firstDocx = (Array.isArray(files) ? files : []).find((f) => isDocxFile(f));
      if (!firstDocx) {
        setDocxPreviewLoading(false);
        setDocxPreviewText("");
        setDocxPreviewError("");
        setDocxPreviewFileName("");
        return;
      }

      // reset preview
      setDocxPreviewLoading(true);
      setDocxPreviewText("");
      setDocxPreviewError("");
      setDocxPreviewFileName(firstDocx.name || "file.docx");

      try {
        const extractUrl = `${API_BASE}/api/admin/files/extract-docx`;
        const formData = new FormData();
        formData.append("file", firstDocx);

        const res = await fetch(extractUrl, {
          method: "POST",
          headers,
          body: formData,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Không trích được nội dung file .docx");
        }

        if (!cancelled) setDocxPreviewText(String(json.text || ""));
      } catch (e) {
        if (!cancelled) setDocxPreviewError(e?.message || "Lỗi trích docx");
      } finally {
        if (!cancelled) setDocxPreviewLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [files, headers]);

  const fetchNotifications = async ({ nextPage } = {}) => {
    if (!token) return;
    try {
      const pageToUse = nextPage || listPage;
      setListLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(pageToUse));
      params.set("limit", String(listLimit));
      if (listQ.trim()) params.set("q", listQ.trim());

      const res = await fetch(`${API_BASE}/api/admin/notifications?${params.toString()}`, {
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể tải danh sách");

      setNotifications(Array.isArray(json.data) ? json.data : []);
      setListTotal(Number(json.count || 0));
      if (nextPage) setListPage(pageToUse);
    } catch (e) {
      notify.error(e.message || "Không thể tải danh sách thông báo");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openCreate = () => {
    setCreateOpen(true);
    // reset form states
    setTargetType("all");
    setKhoaHocId("");
    setRecipientQuery("");
    setRoles(["student", "teacher"]);
    setTieuDe("");
    setNoidung("");
    setFiles([]);
    setDragOver(false);
    setDocxPreviewLoading(false);
    setDocxPreviewText("");
    setDocxPreviewError("");
    setDocxPreviewFileName("");
  };

  const removeNotification = async (id) => {
    if (!id) return;
    const ok = window.confirm("Xác nhận xóa thông báo này?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa thông báo");
      notify.success("Đã xóa thông báo");
      fetchNotifications();
    } catch (e) {
      notify.error(e.message || "Xóa thất bại");
    }
  };

  const openEdit = (row) => {
    setEditId(String(row?._id || ""));
    setEditForm({
      tieuDe: String(row?.tieuDe || ""),
      noidung: String(row?.noidung || ""),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      setEditLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/notifications/${editId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          tieuDe: editForm.tieuDe,
          noidung: editForm.noidung,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Cập nhật thất bại");
      notify.success("Cập nhật thông báo thành công");
      setEditOpen(false);
      fetchNotifications();
    } catch (e) {
      notify.error(e.message || "Cập nhật thất bại");
    } finally {
      setEditLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!token) {
      notify.error("Bạn chưa đăng nhập");
      return false;
    }
    if (!noidung.trim()) {
      notify.warning("Vui lòng nhập nội dung thông báo");
      return false;
    }

    if (targetType === "class" && !khoaHocId) {
      notify.warning("Vui lòng chọn lớp (KhoaHoc)");
      return false;
    }

    if (targetType === "personal" && !recipientQuery.trim()) {
      notify.warning("Vui lòng nhập email hoặc họ tên để tìm người nhận");
      return false;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("targetType", targetType);
      if (targetType === "class") formData.append("khoaHocId", khoaHocId);
      if (targetType === "personal") formData.append("recipientQuery", recipientQuery);

      // default gửi cả student + teacher
      formData.append("roles", roles.join(","));

      if (tieuDe.trim()) formData.append("tieuDe", tieuDe.trim());
      formData.append("noidung", noidung.trim());

      for (const f of files) {
        formData.append("files", f);
      }

      const res = await fetch(`${API_BASE}/api/admin/notifications/send`, {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Gửi thông báo thất bại");

      notify.success(`Đã gửi thông báo thành công: ${json.count || 0} người nhận`);

      setTieuDe("");
      setNoidung("");
      setRecipientQuery("");
      setFiles([]);
      setKhoaHocId("");
      setTargetType("all");

      return true;
    } catch (e2) {
      notify.error(e2.message || "Gửi thông báo thất bại");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitCreate = async (e) => {
    const ok = await submit(e);
    if (!ok) return;
    setCreateOpen(false);
    setListPage(1);
    fetchNotifications({ nextPage: 1 });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageTitle
        title="Thông báo nội bộ (Admin)"
        subtitle="Gửi thông báo nội bộ theo toàn bộ hệ thống / theo lớp / theo cá nhân. Lưu trong DB (không gửi ra ngoài email)."
      />

        {tab === "send" ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 items-start">
            <div className="col-span-2 md:col-span-3">
              <AdminCard className="space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Danh sách thông báo</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{listTotal} bản ghi</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <InputField
                      type="text"
                      name="listQ"
                      value={listQ}
                      onChange={(e) => setListQ(e.target.value)}
                      placeholder="Tìm theo tiêu đề hoặc nội dung..."
                      inputClassName="w-[260px] max-w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                    />
                    <button type="button" onClick={() => fetchNotifications({ nextPage: 1 })} className="admin-btn-accent-sm admin-btn-accent">
                      Tìm
                    </button>
                  </div>
                </div>

                {listLoading ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Đang tải...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có thông báo.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700/60 text-xs uppercase text-gray-600 dark:text-gray-300">
                        <tr>
                          <th className="px-3 py-2">Tiêu đề</th>
                          <th className="px-3 py-2">Người nhận</th>
                          <th className="px-3 py-2">Đối tượng</th>
                          <th className="px-3 py-2">Trạng thái</th>
                          <th className="px-3 py-2 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.map((n) => (
                          <tr key={n._id} className="border-t border-gray-100 dark:border-gray-700/60">
                            <td className="px-3 py-3">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {n.tieuDe || "(không tiêu đề)"}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">{truncate(n.noidung, 120)}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-sm text-gray-900 dark:text-gray-100">{countOf(n.userID)} người</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {n.createdBy?.hovaten ? `Gửi bởi: ${n.createdBy.hovaten}` : ""}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-sm text-gray-900 dark:text-gray-100">{n.targetType || "all"}</div>
                              {n.targetType === "class" ? (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{n.khoaHocId?.tenkhoahoc || "-"}</div>
                              ) : null}
                            </td>
                            <td className="px-3 py-3">
                              {(() => {
                                const recipientsCount = countOf(n.userID);
                                const readCount = countOf(n.readByUserIds);
                                const unreadCount = Math.max(0, recipientsCount - readCount);
                                return (
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      Đã đọc: {readCount}/{recipientsCount}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Chưa đọc: {unreadCount}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDateTime(n.createdAt)}</div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => openEdit(n)} className="admin-btn-accent-sm admin-btn-accent text-xs">
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeNotification(n._id)}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Trang {listPage}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={listPage <= 1}
                      onClick={() => fetchNotifications({ nextPage: Math.max(1, listPage - 1) })}
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={listPage * listLimit >= listTotal}
                      onClick={() => fetchNotifications({ nextPage: listPage + 1 })}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </AdminCard>
            </div>
            <div className="col-span-1">
              <AdminCard className="p-4 md:p-6">
              <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Đối tượng</label>
                <InputField
                  type="select"
                  inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  name="targetType"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "class", label: "Theo lớp (KhoaHoc)" },
                    { value: "personal", label: "Theo cá nhân (email/họ tên)" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Vai trò nhận</label>
                <InputField
                  type="select"
                  inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  name="roles"
                  value={roles.join(",")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "student") setRoles(["student"]);
                    else if (v === "teacher") setRoles(["teacher"]);
                    else setRoles(["student", "teacher"]);
                  }}
                  options={[
                    { value: "student,teacher", label: "Học viên + Giảng viên" },
                    { value: "student", label: "Chỉ học viên" },
                    { value: "teacher", label: "Chỉ giảng viên" },
                  ]}
                />
              </div>
            </div>

            {targetType === "class" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Chọn lớp</label>
                <InputField
                  type="select"
                  inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  name="khoaHocId"
                  value={khoaHocId}
                  onChange={(e) => setKhoaHocId(e.target.value)}
                  options={[
                    { value: "", label: "-- Chọn --" },
                    ...(courses || []).map((c) => ({
                      value: c._id,
                      label: `${c.tenkhoahoc} (${c.LoaiKhoaHocID?.Tenloai || "KhoaHoc"})`,
                    })),
                  ]}
                />
              </div>
            ) : null}

            {targetType === "personal" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Tìm người nhận (email hoặc họ tên)</label>
                <InputField
                  type="text"
                  inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  name="recipientQuery"
                  value={recipientQuery}
                  onChange={(e) => setRecipientQuery(e.target.value)}
                  placeholder="Ví dụ: student01@gmail.com hoặc Nguyễn Văn A"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Tiêu đề (tuỳ chọn)</label>
              <InputField
                type="text"
                inputClassName="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                name="tieuDe"
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                placeholder="Thông báo..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Nội dung *</label>
              <InputField
                type="textarea"
                inputClassName="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[120px]"
                name="noidung"
                value={noidung}
                onChange={(e) => setNoidung(e.target.value)}
                placeholder="Nhập nội dung thông báo..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Đính kèm file (tuỳ chọn)</label>

              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!dragOver) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const list = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
                  if (list.length) setFiles(list);
                }}
                className={`block w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={onPickFiles}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp3,.mp4,.webm,.mov"
                />
                <div className="flex items-center justify-center gap-2">
                  <FiPaperclip className="w-5 h-5" />
                  <span className="text-sm font-medium">Kéo thả file vào đây hoặc bấm để chọn</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Hỗ trợ docx (có preview nội dung), các định dạng khác dùng để đính kèm.
                </div>
              </label>

              {files.length ? <p className="text-xs text-gray-500 dark:text-gray-400">{files.length} file đã chọn</p> : null}

              {files.length ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {files.map((f) => (
                      <li key={`${f.name}-${f.size}`} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 dark:text-white truncate">{f.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{String(f.type || "")}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((x) => !(x.name === f.name && x.size === f.size)))}
                          className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                        >
                          Gỡ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {docxPreviewLoading ? (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">Đang trích nội dung từ file .docx...</div>
              ) : null}

              {!docxPreviewLoading && docxPreviewError ? (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">{docxPreviewError}</div>
              ) : null}

              {!docxPreviewLoading && !docxPreviewError && docxPreviewText ? (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Xem trước .docx: {docxPreviewFileName}
                  </div>
                  <pre className="w-full max-h-[220px] overflow-auto whitespace-pre-wrap rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-3 text-sm text-gray-800 dark:text-gray-100">
                    {docxPreviewText.length > 9000 ? `${docxPreviewText.slice(0, 9000)}\n\n...(đã cắt bớt để hiển thị)` : docxPreviewText}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                disabled={loading}
                onClick={() => {
                  setTargetType("all");
                  setKhoaHocId("");
                  setRecipientQuery("");
                  setTieuDe("");
                  setNoidung("");
                  setFiles([]);
                }}
              >
                Làm mới
              </button>
              <button type="submit" disabled={loading} className="admin-btn-accent disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? "Đang gửi..." : "Gửi thông báo"}
              </button>
            </div>
          </form>
          </AdminCard>
            </div>
          </div>
        ) : (
          <AdminCard className="space-y-4 p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Danh sách thông báo</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{listTotal} bản ghi</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={openCreate} className="admin-btn-accent-sm admin-btn-accent">
                  + Thêm thông báo
                </button>
                <InputField
                  type="text"
                  name="listQ"
                  value={listQ}
                  onChange={(e) => setListQ(e.target.value)}
                  placeholder="Tìm theo tiêu đề hoặc nội dung..."
                  inputClassName="w-[260px] max-w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                />
                <button type="button" onClick={() => fetchNotifications({ nextPage: 1 })} className="admin-btn-accent-sm admin-btn-accent">
                  Tìm
                </button>
              </div>
            </div>

            {listLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có thông báo.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/60 text-xs uppercase text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-3 py-2">Tiêu đề</th>
                      <th className="px-3 py-2">Người nhận</th>
                      <th className="px-3 py-2">Đối tượng</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n._id} className="border-t border-gray-100 dark:border-gray-700/60">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{n.tieuDe || "(không tiêu đề)"}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">{truncate(n.noidung, 120)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{countOf(n.userID)} người</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {n.createdBy?.hovaten ? `Gửi bởi: ${n.createdBy.hovaten}` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{n.targetType || "all"}</div>
                          {n.targetType === "class" ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{n.khoaHocId?.tenkhoahoc || "-"}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          {(() => {
                            const recipientsCount = countOf(n.userID);
                            const readCount = countOf(n.readByUserIds);
                            const unreadCount = Math.max(0, recipientsCount - readCount);
                            return (
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  Đã đọc: {readCount}/{recipientsCount}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Chưa đọc: {unreadCount}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDateTime(n.createdAt)}</div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => openEdit(n)} className="admin-btn-accent-sm admin-btn-accent text-xs">
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => removeNotification(n._id)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Trang {listPage}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={listPage <= 1}
                  onClick={() => fetchNotifications({ nextPage: Math.max(1, listPage - 1) })}
                >
                  Trước
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={listPage * listLimit >= listTotal}
                  onClick={() => fetchNotifications({ nextPage: listPage + 1 })}
                >
                  Sau
                </button>
              </div>
            </div>
          </AdminCard>
        )}

        {createOpen ? (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4 pointer-events-auto">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">Thêm thông báo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tạo mới và gửi tới người nhận phù hợp</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={submitCreate} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Đối tượng</label>
                    <InputField
                      type="select"
                      inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                      name="targetType"
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                      options={[
                        { value: "all", label: "Tất cả" },
                        { value: "class", label: "Theo lớp (KhoaHoc)" },
                        { value: "personal", label: "Theo cá nhân (email/họ tên)" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Vai trò nhận</label>
                    <InputField
                      type="select"
                      inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                      name="roles"
                      value={roles.join(",")}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "student") setRoles(["student"]);
                        else if (v === "teacher") setRoles(["teacher"]);
                        else setRoles(["student", "teacher"]);
                      }}
                      options={[
                        { value: "student,teacher", label: "Học viên + Giảng viên" },
                        { value: "student", label: "Chỉ học viên" },
                        { value: "teacher", label: "Chỉ giảng viên" },
                      ]}
                    />
                  </div>
                </div>

                {targetType === "class" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Chọn lớp</label>
                    <InputField
                      type="select"
                      inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                      name="khoaHocId"
                      value={khoaHocId}
                      onChange={(e) => setKhoaHocId(e.target.value)}
                      options={[
                        { value: "", label: "-- Chọn --" },
                        ...(courses || []).map((c) => ({
                          value: c._id,
                          label: `${c.tenkhoahoc} (${c.LoaiKhoaHocID?.Tenloai || "KhoaHoc"})`,
                        })),
                      ]}
                    />
                  </div>
                ) : null}

                {targetType === "personal" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Tìm người nhận (email hoặc họ tên)
                    </label>
                    <InputField
                      type="text"
                      inputClassName="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                      name="recipientQuery"
                      value={recipientQuery}
                      onChange={(e) => setRecipientQuery(e.target.value)}
                      placeholder="Ví dụ: student01@gmail.com hoặc Nguyễn Văn A"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Tiêu đề (tuỳ chọn)</label>
                  <InputField
                    type="text"
                    inputClassName="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    name="tieuDe"
                    value={tieuDe}
                    onChange={(e) => setTieuDe(e.target.value)}
                    placeholder="Thông báo..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Nội dung *</label>
                  <InputField
                    type="textarea"
                    inputClassName="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[120px]"
                    name="noidung"
                    value={noidung}
                    onChange={(e) => setNoidung(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang gửi..." : "Gửi thông báo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {editOpen ? (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4 pointer-events-auto">
            <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">Chỉnh sửa thông báo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Receipt-level: 1 record gồm mảng recipients</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Tiêu đề</label>
                  <InputField
                    type="text"
                    name="tieuDe"
                    value={editForm.tieuDe}
                    onChange={(e) => setEditForm((p) => ({ ...p, tieuDe: e.target.value }))}
                    inputClassName="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Nội dung</label>
                  <InputField
                    type="textarea"
                    name="noidung"
                    value={editForm.noidung}
                    onChange={(e) => setEditForm((p) => ({ ...p, noidung: e.target.value }))}
                    inputClassName="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm min-h-[140px]"
                    rows={6}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/20">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={editLoading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={editLoading}
                >
                  {editLoading ? "Đang cập nhật..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
    </div>
  );
}

