"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import ConfirmModal from "../../components/ConfirmModal";
import InputField from "../../components/InputField";
import AdminPageTitle from "../components/AdminPageTitle";
import AdminCard from "../components/AdminCard";
import { formatDateDdMmYyyy } from "../../../lib/dateFormat";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DAY_LABELS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const MONTH_FILTER_OPTIONS = [
  { value: "", label: "Cả năm" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` })),
];
function getCurrentYearString() {
  return String(new Date().getFullYear());
}
function buildYearFilterOptions() {
  const y = new Date().getFullYear();
  const opts = [{ value: "", label: "Mọi năm" }];
  for (let i = y - 8; i <= y + 6; i += 1) opts.push({ value: String(i), label: String(i) });
  return opts;
}
const createDefaultForm = () => ({
  _id: "",
  tenkhoahoc: "",
  CoSoId: "",
  LoaiKhoaHocID: "",
  ngaykhaigiang: "",
  giangvien: "",
  lichHoc: [{ thu: 1, gioBatDau: "18:00", gioKetThuc: "20:00", phonghoc: "" }],
});

export default function AdminCoursesPage() {
  const { token } = useAuth();
  const notify = useNotification();
  const [courses, setCourses] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    LoaiKhoaHocID: "",
    giangvien: "",
    CoSoId: "",
    year: getCurrentYearString(),
    month: "",
  });
  const yearFilterOptions = useMemo(() => buildYearFilterOptions(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(createDefaultForm());
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [deleteId, setDeleteId] = useState("");
  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token]
  );
  const fetchCourses = async (appliedFilters = filters) => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (appliedFilters.LoaiKhoaHocID) params.set("LoaiKhoaHocID", appliedFilters.LoaiKhoaHocID);
      if (appliedFilters.giangvien) params.set("giangvien", appliedFilters.giangvien);
      if (appliedFilters.CoSoId) params.set("CoSoId", appliedFilters.CoSoId);
      if (appliedFilters.year) {
        params.set("year", appliedFilters.year);
        if (appliedFilters.month) params.set("month", appliedFilters.month);
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/api/admin/courses${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể tải danh sách khóa học");
      setCourses(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e.message || "Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!token) return;
    const fetchOptions = async () => {
      try {
        const [ctRes, teacherRes, facilitiesRes] = await Promise.all([
          fetch(`${API_BASE}/api/course-types`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/admin/users/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/admin/facilities?active=true`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [ctJson, teacherJson, facilitiesJson] = await Promise.all([ctRes.json(), teacherRes.json(), facilitiesRes.json()]);
        if (!ctRes.ok || !ctJson.success) throw new Error(ctJson.message || "Không thể tải loại khóa học");
        if (!teacherRes.ok || !teacherJson.success) throw new Error(teacherJson.message || "Không thể tải giảng viên");
        if (!facilitiesRes.ok) throw new Error(facilitiesJson.message || "Không thể tải phòng học");
        setCourseTypes(Array.isArray(ctJson.data) ? ctJson.data : []);
        const teacherList = (Array.isArray(teacherJson.data) ? teacherJson.data : [])
          .map((t) => ({
            ...t,
            courseTeacherId: t?.giangVienInfo?._id || "",
          }))
          .filter((t) => t.courseTeacherId);
        const teacherMap = new Map();
        teacherList.forEach((t) => {
          if (!teacherMap.has(t.courseTeacherId)) teacherMap.set(t.courseTeacherId, t);
        });
        setTeachers(Array.from(teacherMap.values()));
        const facList = Array.isArray(facilitiesJson) ? facilitiesJson : [];
        setFacilities(facList.map((f) => ({ _id: f._id, Tencoso: f.Tencoso || "" })).filter((f) => f._id));
        const roomList = facList
          .flatMap((f) =>
            (Array.isArray(f.phongHocList) ? f.phongHocList : []).map((r) => ({
              _id: r._id,
              TenPhong: r.TenPhong,
              CoSoName: f.Tencoso,
              coSoId: f._id,
            }))
          )
          .filter((r) => r._id);
        setRooms(roomList);
      } catch (e) {
        notify.error(`Lỗi tải dữ liệu nền: ${e.message}`);
      }
    };
    fetchOptions();
    fetchCourses();
  }, [token]);
  const openCreateModal = () => {
    setValidationResult(null);
    setFormData(createDefaultForm());
    setModalOpen(true);
  };
  const submitCourse = async (e) => {
    e.preventDefault();
    if (!formData.tenkhoahoc.trim()) return notify.warning("Vui lòng nhập tên khóa học");
    if (!formData.LoaiKhoaHocID) return notify.warning("Vui lòng chọn loại khóa học");
    if (!formData.ngaykhaigiang) return notify.warning("Vui lòng chọn ngày khai giảng");
    if (!formData.giangvien) return notify.warning("Vui lòng chọn giảng viên");
    if (!formData.CoSoId) return notify.warning("Vui lòng chọn cơ sở");
    if (!Array.isArray(formData.lichHoc) || formData.lichHoc.length === 0) {
      return notify.warning("Vui lòng thêm ít nhất 1 lịch học");
    }
    const seenThu = new Set();
    for (let i = 0; i < formData.lichHoc.length; i += 1) {
      const slot = formData.lichHoc[i];
      if (!slot?.phonghoc) return notify.warning(`Vui lòng chọn phòng học cho lịch #${i + 1}`);
      if (!slot?.gioBatDau || !slot?.gioKetThuc) return notify.warning(`Vui lòng nhập giờ học cho lịch #${i + 1}`);
      if (slot.gioBatDau >= slot.gioKetThuc) {
        return notify.warning(`Lịch #${i + 1}: giờ bắt đầu phải nhỏ hơn giờ kết thúc`);
      }
      if (seenThu.has(Number(slot.thu))) {
        return notify.warning("Mỗi thứ chỉ được xuất hiện 1 lần trong lịch học");
      }
      seenThu.add(Number(slot.thu));
    }

    const payloadForValidate = buildValidatePayload(formData);
    const result = await validateSchedule(payloadForValidate, { quiet: true });
    if (!result?.ok) return;
    if ((result.data?.conflicts || []).length > 0) {
      return notify.warning(
        formData._id
          ? "Lịch học bị trùng phòng hoặc giảng viên. Không thể cập nhật khóa học."
          : "Lịch học bị trùng phòng hoặc giảng viên. Không thể tạo khóa học."
      );
    }
    try {
      setSaving(true);
      const payload = {
        tenkhoahoc: formData.tenkhoahoc.trim(),
        CoSoId: formData.CoSoId,
        LoaiKhoaHocID: formData.LoaiKhoaHocID,
        ngaykhaigiang: formData.ngaykhaigiang,
        giangvien: formData.giangvien,
        lichHoc: formData.lichHoc.map((it) => ({
          thu: Number(it.thu),
          gioBatDau: it.gioBatDau,
          gioKetThuc: it.gioKetThuc,
          phonghoc: it.phonghoc,
        })),
      };
      const isEdit = Boolean(formData._id);
      const url = isEdit ? `${API_BASE}/api/admin/courses/${formData._id}` : `${API_BASE}/api/admin/courses`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && Array.isArray(json.data?.conflicts)) {
        setValidationResult((prev) => ({
          lessonCount: json.data.lessonCount ?? prev?.lessonCount ?? result.data?.lessonCount ?? 0,
          conflicts: json.data.conflicts,
          suggestedStartDates: json.data.suggestedStartDates ?? [],
        }));
      }
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể lưu khóa học");
      notify.success(isEdit ? "Cập nhật khóa học thành công" : "Tạo khóa học thành công");
      setModalOpen(false);
      fetchCourses();
    } catch (e2) {
      notify.error(e2.message || "Lưu khóa học thất bại");
    } finally {
      setSaving(false);
    }
  };
  const validateSchedule = async (customPayload, options = {}) => {
    const { quiet = false } = options;
    const isPayloadObject = customPayload && typeof customPayload === "object" && "lichHoc" in customPayload;
    try {
      setValidating(true);
      const payload = isPayloadObject ? customPayload : buildValidatePayload(formData);
      if (!quiet) setValidationResult(null);
      const res = await fetch(`${API_BASE}/api/admin/courses/validate-schedule`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Kiểm tra lịch thất bại");
      setValidationResult(json.data);
      if (!quiet) {
        if ((json.data?.conflicts || []).length === 0) notify.success("Lịch học hợp lệ, không bị trùng");
        else notify.warning(`Phát hiện ${json.data.conflicts.length} xung đột lịch`);
      }
      return { ok: true, data: json.data };
    } catch (e) {
      notify.error(e.message || "Kiểm tra lịch thất bại");
      return { ok: false, error: e };
    } finally {
      setValidating(false);
    }
  };
  const deleteCourse = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa khóa học");
      notify.success("Xóa khóa học thành công");
      setDeleteId("");
      fetchCourses();
    } catch (e) {
      notify.error(e.message || "Xóa khóa học thất bại");
    }
  };
  const stats = useMemo(
    () => ({
      total: courses.length,
      notStarted: courses.filter((c) => new Date(c.ngaykhaigiang) > new Date()).length,
      hasSchedule: courses.filter((c) => (c.lichHoc || []).length > 0).length,
    }),
    [courses]
  );
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <AdminPageTitle
        title="Quản lý khóa học"
        subtitle="Danh sách, tạo mới và cập nhật lịch học theo API admin/courses."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Tổng khóa học" value={stats.total} />
        <StatCard title="Chưa khai giảng" value={stats.notStarted} />
        <StatCard title="Đã có lịch học" value={stats.hasSchedule} />
      </div>
      <AdminCard className="flex flex-col flex-wrap gap-3 p-4 lg:flex-row lg:items-end">
          <InputField
            type="select"
            containerClassName="flex-1 min-w-[10rem]"
            name="LoaiKhoaHocID"
            value={filters.LoaiKhoaHocID}
            onChange={(e) => setFilters((p) => ({ ...p, LoaiKhoaHocID: e.target.value }))}
            options={[
              { value: "", label: "Tất cả loại khóa học" },
              ...(courseTypes || []).map((it, idx) => ({ value: it._id || `ct-${idx}`, label: it.Tenloai })),
            ]}
          />
          <InputField
            type="select"
            containerClassName="flex-1 min-w-[10rem]"
            name="giangvien"
            value={filters.giangvien}
            onChange={(e) => setFilters((p) => ({ ...p, giangvien: e.target.value }))}
            options={[
              { value: "", label: "Tất cả giảng viên" },
              ...(teachers || []).map((it, idx) => ({ value: it.courseTeacherId || `gv-${idx}`, label: it.hovaten || it.email })),
            ]}
          />
          <InputField
            type="select"
            containerClassName="flex-1 min-w-[10rem]"
            name="filterCoSoId"
            value={filters.CoSoId}
            onChange={(e) => setFilters((p) => ({ ...p, CoSoId: e.target.value }))}
            options={[
              { value: "", label: "Tất cả cơ sở" },
              ...(facilities || []).map((f, idx) => ({
                value: String(f._id || idx),
                label: f.Tencoso || "Cơ sở",
              })),
            ]}
          />
          <InputField
            type="select"
            containerClassName="w-full sm:w-auto min-w-[8rem]"
            name="filterYear"
            value={filters.year}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((p) => ({ ...p, year: v, month: v ? p.month : "" }));
            }}
            options={yearFilterOptions}
          />
          <InputField
            type="select"
            containerClassName="w-full sm:w-auto min-w-[9rem]"
            name="filterMonth"
            value={filters.month}
            disabled={!filters.year}
            onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
            options={MONTH_FILTER_OPTIONS}
          />
          <button
            type="button"
            className="shrink-0 rounded-md px-4 py-2 text-white transition-opacity hover:opacity-90 bg-[var(--admin-accent)]"
            onClick={() => fetchCourses()}
          >
            Lọc
          </button>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-4 py-2 text-white transition-opacity hover:opacity-90 dark:bg-emerald-700"
            onClick={openCreateModal}
          >
            Thêm khóa học
          </button>
      </AdminCard>
        <AdminCard className="overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Tên khóa</th>
                <th className="px-4 py-3">Loại khóa</th>
                <th className="px-4 py-3">Cơ sở</th>
                <th className="px-4 py-3">Khai giảng</th>
                <th className="px-4 py-3">Giảng viên</th>
                <th className="px-4 py-3">Lịch học</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center">Đang tải...</td></tr> : null}
              {!loading && error ? <tr><td colSpan={7} className="px-4 py-8 text-center text-red-600">{error}</td></tr> : null}
              {!loading && !error && courses.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center">Chưa có khóa học</td></tr> : null}
              {!loading && !error && courses.map((c) => (
                <tr key={c._id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.tenkhoahoc}</td>
                  <td className="px-4 py-3">{c.LoaiKhoaHocID?.Tenloai || "-"}</td>
                  <td className="px-4 py-3">{c.CoSoId?.Tencoso || "-"}</td>
                  <td className="px-4 py-3">{formatDateDdMmYyyy(c.ngaykhaigiang, { empty: "-" })}</td>
                  <td className="px-4 py-3">{c.giangvien?.userId?.hovaten || c.giangvien?.userId?.email || c.giangvien?._id || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {(c.lichHoc || []).map((it, idx) => (
                        <div key={`${c._id}-${idx}`} className="text-xs">
                          {DAY_LABELS[Number(it.thu)]} ({it.gioBatDau} - {it.gioKetThuc})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link className="inline-block px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700" href={`/admin/courses/${c._id}`}>Sửa</Link>
                    <button className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => setDeleteId(c._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      <CourseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={formData}
        setData={setFormData}
        teachers={teachers}
        courseTypes={courseTypes}
        facilities={facilities}
        rooms={rooms}
        onSubmit={submitCourse}
        onValidate={validateSchedule}
        validationResult={validationResult}
        saving={saving}
        validating={validating}
      />
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Xác nhận xóa khóa học"
        message="Bạn chắc chắn muốn xóa khóa học này?"
        onConfirm={deleteCourse}
        onCancel={() => setDeleteId("")}
        confirmText="Xóa"
      />
    </div>
  );
}
function CourseModal({ isOpen, onClose, data, setData, teachers, courseTypes, facilities, rooms, onSubmit, onValidate, validationResult, saving, validating }) {
  const roomsForCoSo = useMemo(
    () => (rooms || []).filter((r) => String(r.coSoId) === String(data.CoSoId)),
    [rooms, data.CoSoId]
  );
  if (!isOpen) return null;
  const addSchedule = () => setData((p) => ({ ...p, lichHoc: [...(p.lichHoc || []), { thu: 1, gioBatDau: "18:00", gioKetThuc: "20:00", phonghoc: "" }] }));
  const changeSchedule = (idx, field, value) => setData((p) => {
    const next = [...(p.lichHoc || [])];
    next[idx] = { ...next[idx], [field]: value };
    return { ...p, lichHoc: next };
  });
  const removeSchedule = (idx) => setData((p) => ({ ...p, lichHoc: p.lichHoc.filter((_, i) => i !== idx) }));
  const fieldLabelClass = "mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100";
  const fieldHintClass = "mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300";
  const modalInputClass = "input w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-[15px] font-medium text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/30";
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
          <div className="px-6 py-4 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data._id ? "Cập nhật khóa học" : "Thêm khóa học"}</h3>
            <button type="button" className="text-base font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" onClick={onClose}>Đóng</button>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabelClass}>Tên khóa học *</label>
                <InputField
                  inputClassName={modalInputClass}
                  placeholder="Ví dụ: IELTS Foundation T7-CN"
                  name="tenkhoahoc"
                  value={data.tenkhoahoc}
                  onChange={(e) => setData((p) => ({ ...p, tenkhoahoc: e.target.value }))}
                />
                <p className={fieldHintClass}>Đặt tên ngắn gọn, dễ phân biệt theo trình độ hoặc lịch học.</p>
              </div>
              <div>
                <label className={fieldLabelClass}>Loại khóa học *</label>
                <InputField
                  type="select"
                  inputClassName={modalInputClass}
                  name="LoaiKhoaHocID"
                  value={data.LoaiKhoaHocID}
                  onChange={(e) => setData((p) => ({ ...p, LoaiKhoaHocID: e.target.value }))}
                  options={[
                    { value: "", label: "Chọn loại khóa học" },
                    ...(courseTypes || []).map((it, idx) => ({ value: it._id || `ct-modal-${idx}`, label: it.Tenloai })),
                  ]}
                />
                <p className={fieldHintClass}>Loại khóa sẽ quyết định số buổi học và cấu trúc chương trình.</p>
              </div>
              <div>
                <label className={fieldLabelClass}>Ngày khai giảng *</label>
                <InputField
                  type="date"
                  inputClassName={modalInputClass}
                  name="ngaykhaigiang"
                  value={data.ngaykhaigiang}
                  onChange={(e) => setData((p) => ({ ...p, ngaykhaigiang: e.target.value }))}
                />
                <p className={fieldHintClass}>Nên chọn trước ngày học buổi đầu tiên ít nhất 1-3 ngày.</p>
              </div>
              <div>
                <label className={fieldLabelClass}>Giảng viên phụ trách *</label>
                <InputField
                  type="select"
                  inputClassName={modalInputClass}
                  name="giangvien"
                  value={data.giangvien}
                  onChange={(e) => setData((p) => ({ ...p, giangvien: e.target.value }))}
                  options={[
                    { value: "", label: "Chọn giảng viên" },
                    ...(teachers || []).map((it, idx) => ({
                      value: it.courseTeacherId || `gv-modal-${idx}`,
                      label: it.hovaten || it.email,
                    })),
                  ]}
                />
                <p className={fieldHintClass}>Chọn giảng viên chính để hệ thống kiểm tra trùng lịch chính xác hơn.</p>
              </div>
              <div className="md:col-span-2">
                <label className={fieldLabelClass}>Cơ sở *</label>
                <InputField
                  type="select"
                  inputClassName={modalInputClass}
                  name="CoSoId"
                  value={data.CoSoId}
                  onChange={(e) => {
                    const nextCoSo = e.target.value;
                    setData((p) => ({
                      ...p,
                      CoSoId: nextCoSo,
                      lichHoc: (p.lichHoc || []).map((slot) => {
                        if (!nextCoSo || !slot.phonghoc) return { ...slot, phonghoc: nextCoSo ? slot.phonghoc : "" };
                        const ok = (rooms || []).some(
                          (r) => String(r._id) === String(slot.phonghoc) && String(r.coSoId) === String(nextCoSo)
                        );
                        return { ...slot, phonghoc: ok ? slot.phonghoc : "" };
                      }),
                    }));
                  }}
                  options={[
                    { value: "", label: "Chọn cơ sở" },
                    ...(facilities || []).map((f, idx) => ({
                      value: f._id || `cs-${idx}`,
                      label: f.Tencoso || "Cơ sở",
                    })),
                  ]}
                />
                <p className={fieldHintClass}>Chỉ hiển thị phòng thuộc cơ sở đã chọn trong từng ca học.</p>
              </div>
            </div>
            <div className="border-t-2 border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lịch học cố định</div>
                  <p className={fieldHintClass}>Mỗi dòng là một ca học lặp lại hằng tuần.</p>
                </div>
                <button type="button" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-base font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300" onClick={addSchedule}>+ Thêm lịch</button>
              </div>
              {(data.lichHoc || []).map((slot, idx) => (
                <div key={idx} className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 p-3 mb-2">
                  <div className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">Lịch #{idx + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">Thứ</label>
                      <InputField
                        type="select"
                        inputClassName={modalInputClass}
                        name="thu"
                        value={slot.thu}
                        onChange={(e) => changeSchedule(idx, "thu", Number(e.target.value))}
                        options={DAY_LABELS.map((d, i) => ({ value: i, label: d }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">Giờ bắt đầu</label>
                      <InputField
                        type="time"
                        inputClassName={modalInputClass}
                        name="gioBatDau"
                        value={slot.gioBatDau}
                        onChange={(e) => changeSchedule(idx, "gioBatDau", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">Giờ kết thúc</label>
                      <InputField
                        type="time"
                        inputClassName={modalInputClass}
                        name="gioKetThuc"
                        value={slot.gioKetThuc}
                        onChange={(e) => changeSchedule(idx, "gioKetThuc", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">Phòng học</label>
                      <InputField
                        type="select"
                        inputClassName={modalInputClass}
                        name="phonghoc"
                        value={slot.phonghoc}
                        onChange={(e) => changeSchedule(idx, "phonghoc", e.target.value)}
                        options={[
                          { value: "", label: data.CoSoId ? "Chọn phòng học" : "Chọn cơ sở trước" },
                          ...roomsForCoSo.map((r, rIdx) => ({
                            value: r._id || `room-${rIdx}`,
                            label: `${r.TenPhong} - ${r.CoSoName}`,
                          })),
                        ]}
                      />
                    </div>
                    <div className="flex items-end">
                      <button type="button" className="w-full px-3 py-2.5 rounded-md border border-red-200 bg-red-50 text-red-700 text-base font-semibold hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300" onClick={() => removeSchedule(idx)}>Xóa</button>
                    </div>
                  </div>
                  <p className={fieldHintClass}>Gợi ý: mỗi ca nên dài 90-120 phút và không trùng giờ của giảng viên.</p>
                </div>
              ))}
            </div>
            {validationResult ? (
              <div className="p-3 rounded-lg border-2 border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20 text-sm">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200">Kết quả kiểm tra lịch</div>
                <div className="text-indigo-800 dark:text-indigo-300">Số bài học của loại khóa: {validationResult.lessonCount || 0}</div>
                <div className="text-indigo-800 dark:text-indigo-300">Số xung đột: {(validationResult.conflicts || []).length}</div>
                {(validationResult.conflicts || []).slice(0, 6).map((c, idx) => (
                  <div key={`cf-${idx}`} className="text-indigo-800 dark:text-indigo-300 mt-1">
                    {c.tomTat ||
                      `${c.lyDo || "Xung đột lịch"}. ${DAY_LABELS[Number(c?.proposed?.thu)] || ""} — ${formatDateDdMmYyyy(c?.proposed?.ngayhoc, { empty: "-" })}`}
                  </div>
                ))}
                {(validationResult.suggestedStartDates || []).length > 0 ? (
                  <div className="text-indigo-800 dark:text-indigo-300">Ngày gợi ý: {(validationResult.suggestedStartDates || []).map((d) => formatDateDdMmYyyy(d, { empty: "-" })).join(", ")}</div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="px-6 py-4 border-t-2 border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onValidate()}
              className="px-4 py-2.5 rounded-md bg-indigo-600 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={validating}
            >
              {validating ? "Đang kiểm tra..." : "Kiểm tra trùng lịch"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-md border-2 border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">Hủy</button>
            <button type="submit" className="px-4 py-2.5 rounded-md bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu khóa học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function StatCard({ title, value }) {
  return (
    <AdminCard className="p-4">
      <h3 className="text-sm text-[var(--admin-sidebar-fg-muted)]">{title}</h3>
      <p className="text-3xl font-semibold tabular-nums text-[var(--admin-sidebar-fg)]">{value}</p>
    </AdminCard>
  );
}
function buildValidatePayload(formData) {
  return {
    CoSoId: formData.CoSoId,
    LoaiKhoaHocID: formData.LoaiKhoaHocID,
    ngaykhaigiang: formData.ngaykhaigiang,
    giangvien: formData.giangvien,
    lichHoc: (formData.lichHoc || []).map((it) => ({
      thu: Number(it.thu),
      gioBatDau: it.gioBatDau,
      gioKetThuc: it.gioKetThuc,
      phonghoc: it.phonghoc,
    })),
    ignoreCourseId: formData._id || undefined,
  };
}
