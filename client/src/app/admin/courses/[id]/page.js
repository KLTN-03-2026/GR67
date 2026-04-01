"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotification } from "../../../contexts/NotificationContext";
import ConfirmModal from "../../../components/ConfirmModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DAY_LABELS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const NAME_REGEX = /^[A-Za-zÀ-ỹ\s'.-]{2,100}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;
const FIELD_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 placeholder:text-gray-400";

export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedHocVienId, setSelectedHocVienId] = useState("");
  const [removeEnrollmentId, setRemoveEnrollmentId] = useState("");
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    hovaten: "",
    email: "",
    password: "",
    soDienThoai: "",
    diachi: "",
    gioitinh: "Nam",
    ngaysinh: "",
  });
  const [sessionModal, setSessionModal] = useState({
    isOpen: false,
    mode: "create",
    sessionId: "",
    ngayhoc: "",
    gioBatDau: "18:00",
    gioKetThuc: "20:00",
    phonghoc: "",
    BaiHocID: "",
  });

  const [formData, setFormData] = useState({
    tenkhoahoc: "",
    LoaiKhoaHocID: "",
    ngaykhaigiang: "",
    giangvien: "",
    lichHoc: [],
  });

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token]
  );

  const loadAll = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const [courseRes, studentsRes, allStudentsRes, typesRes, teachersRes, facilitiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/courses/${id}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/users/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/course-types`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/users/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/facilities?active=true`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [courseJson, studentsJson, allStudentsJson, typesJson, teachersJson, facilitiesJson] = await Promise.all([
        courseRes.json(),
        studentsRes.json(),
        allStudentsRes.json(),
        typesRes.json(),
        teachersRes.json(),
        facilitiesRes.json(),
      ]);

      if (!courseRes.ok || !courseJson.success) throw new Error(courseJson.message || "Không tải được khóa học");
      if (!studentsRes.ok || !studentsJson.success) throw new Error(studentsJson.message || "Không tải được học viên khóa");
      if (!allStudentsRes.ok || !allStudentsJson.success) throw new Error(allStudentsJson.message || "Không tải được học viên");
      if (!typesRes.ok || !typesJson.success) throw new Error(typesJson.message || "Không tải được loại khóa");
      if (!teachersRes.ok || !teachersJson.success) throw new Error(teachersJson.message || "Không tải được giảng viên");
      if (!facilitiesRes.ok) throw new Error(facilitiesJson.message || "Không tải được phòng học");

      const c = courseJson.data;
      const lessonsRes = await fetch(`${API_BASE}/api/course-types/${c.LoaiKhoaHocID?._id || ""}/lessons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lessonsJson = await lessonsRes.json();
      if (lessonsRes.ok && lessonsJson.success) {
        setLessons(Array.isArray(lessonsJson.data) ? lessonsJson.data : []);
      } else {
        setLessons([]);
      }
      setCourse(c);
      setStudents(Array.isArray(studentsJson.data) ? studentsJson.data : []);
      setAllStudents(Array.isArray(allStudentsJson.data) ? allStudentsJson.data : []);
      setCourseTypes(Array.isArray(typesJson.data) ? typesJson.data : []);
      setTeachers(
        (Array.isArray(teachersJson.data) ? teachersJson.data : [])
          .map((t) => ({ ...t, courseTeacherId: t?.giangVienInfo?._id || "" }))
          .filter((t) => t.courseTeacherId)
      );
      setRooms(
        (Array.isArray(facilitiesJson) ? facilitiesJson : []).flatMap((f) =>
          (Array.isArray(f.phongHocList) ? f.phongHocList : []).map((r) => ({
            _id: r._id,
            TenPhong: r.TenPhong,
            CoSoName: f.Tencoso,
          }))
        )
      );

      setFormData({
        tenkhoahoc: c.tenkhoahoc || "",
        LoaiKhoaHocID: c.LoaiKhoaHocID?._id || "",
        ngaykhaigiang: toDateInput(c.ngaykhaigiang),
        giangvien: c.giangvien?._id || "",
        lichHoc: (c.lichHoc || []).map((it) => ({
          thu: Number(it.thu),
          gioBatDau: it.gioBatDau,
          gioKetThuc: it.gioKetThuc,
          phonghoc: String(it.phonghoc?._id || it.phonghoc || ""),
        })),
      });
    } catch (e) {
      notify.error(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [token, id]);

  const addSchedule = () =>
    setFormData((p) => ({
      ...p,
      lichHoc: [...(p.lichHoc || []), { thu: 1, gioBatDau: "18:00", gioKetThuc: "20:00", phonghoc: "" }],
    }));

  const updateSchedule = (idx, field, value) =>
    setFormData((p) => {
      const next = [...(p.lichHoc || [])];
      next[idx] = { ...next[idx], [field]: value };
      return { ...p, lichHoc: next };
    });

  const removeSchedule = (idx) => setFormData((p) => ({ ...p, lichHoc: p.lichHoc.filter((_, i) => i !== idx) }));

  const saveCourse = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        tenkhoahoc: formData.tenkhoahoc.trim(),
        LoaiKhoaHocID: formData.LoaiKhoaHocID,
        ngaykhaigiang: formData.ngaykhaigiang,
        giangvien: formData.giangvien,
        lichHoc: (formData.lichHoc || []).map((it) => ({
          thu: Number(it.thu),
          gioBatDau: it.gioBatDau,
          gioKetThuc: it.gioKetThuc,
          phonghoc: it.phonghoc,
        })),
      };
      const res = await fetch(`${API_BASE}/api/admin/courses/${id}`, { method: "PUT", headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Cập nhật thất bại");
      notify.success("Cập nhật khóa học thành công");
      await loadAll();
    } catch (e2) {
      notify.error(e2.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const availableStudents = useMemo(() => {
    const enrolled = new Set(students.map((s) => String(s.hocvienId)));
    return allStudents.filter((s) => s?.hocVienInfo?._id && !enrolled.has(String(s.hocVienInfo._id)));
  }, [allStudents, students]);
  const isCourseFull = Number(course?.soHocVienToiDa || 0) > 0 && students.length >= Number(course?.soHocVienToiDa);

  const addStudent = async () => {
    if (!selectedHocVienId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${id}/students`, {
        method: "POST",
        headers,
        body: JSON.stringify({ hocvienId: selectedHocVienId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể thêm học viên");
      notify.success("Đã thêm học viên");
      setSelectedHocVienId("");
      loadAll();
    } catch (e) {
      notify.error(e.message || "Không thể thêm học viên");
    }
  };

  const createAndAddStudent = async (e) => {
    e.preventDefault();
    try {
      const name = studentForm.hovaten.trim();
      const email = studentForm.email.trim();
      const phone = studentForm.soDienThoai.trim();
      if (!NAME_REGEX.test(name)) {
        throw new Error("Họ và tên không hợp lệ (2-100 ký tự, không chứa số)");
      }
      if (!EMAIL_REGEX.test(email)) {
        throw new Error("Email không đúng định dạng");
      }
      if (phone && !PHONE_REGEX.test(phone)) {
        throw new Error("Số điện thoại không hợp lệ (VD: 09xxxxxxxx hoặc +84xxxxxxxxx)");
      }

      setCreatingStudent(true);
      const createRes = await fetch(`${API_BASE}/api/admin/users/students`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...studentForm,
          hovaten: name,
          email,
          soDienThoai: phone,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.success) throw new Error(createJson.message || "Không thể tạo học viên mới");
      const newHocVienId = createJson?.data?.hocVienInfo?._id;
      if (!newHocVienId) throw new Error("Tạo học viên thành công nhưng không lấy được hocVienInfo._id");

      const enrollRes = await fetch(`${API_BASE}/api/admin/courses/${id}/students`, {
        method: "POST",
        headers,
        body: JSON.stringify({ hocvienId: newHocVienId }),
      });
      const enrollJson = await enrollRes.json();
      if (!enrollRes.ok || !enrollJson.success) throw new Error(enrollJson.message || "Không thể thêm học viên vào khóa");

      notify.success("Đã tạo học viên mới và thêm vào khóa học");
      setStudentModalOpen(false);
      setStudentForm({
        hovaten: "",
        email: "",
        password: "",
        soDienThoai: "",
        diachi: "",
        gioitinh: "Nam",
        ngaysinh: "",
      });
      await loadAll();
    } catch (err) {
      notify.error(err.message || "Không thể tạo học viên mới");
    } finally {
      setCreatingStudent(false);
    }
  };

  const openCreateSessionModal = () => {
    const defaultRoom = rooms[0]?._id || "";
    const defaultLesson = lessons[0]?._id || "";
    const today = toDateInput(new Date());
    setSessionModal({
      isOpen: true,
      mode: "create",
      sessionId: "",
      ngayhoc: today,
      gioBatDau: "18:00",
      gioKetThuc: "20:00",
      phonghoc: defaultRoom,
      BaiHocID: defaultLesson,
    });
  };

  const openEditSessionModal = (session) => {
    setSessionModal({
      isOpen: true,
      mode: "edit",
      sessionId: session._id,
      ngayhoc: toDateInput(session.ngayhoc),
      gioBatDau: formatTime(session.giobatdau),
      gioKetThuc: formatTime(session.gioketthuc),
      phonghoc: String(session.phonghoc?._id || session.phonghoc || ""),
      BaiHocID: String(session.BaiHocID?._id || session.BaiHocID || ""),
    });
  };

  const saveSession = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ngayhoc: sessionModal.ngayhoc,
        gioBatDau: sessionModal.gioBatDau,
        gioKetThuc: sessionModal.gioKetThuc,
        phonghoc: sessionModal.phonghoc,
        BaiHocID: sessionModal.BaiHocID,
      };
      const isEdit = sessionModal.mode === "edit";
      const url = isEdit
        ? `${API_BASE}/api/admin/courses/${id}/sessions/${sessionModal.sessionId}`
        : `${API_BASE}/api/admin/courses/${id}/sessions`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể lưu buổi học");
      notify.success(isEdit ? "Đã cập nhật buổi học" : "Đã thêm buổi học");
      setSessionModal((p) => ({ ...p, isOpen: false }));
      await loadAll();
    } catch (err) {
      notify.error(err.message || "Không thể lưu buổi học");
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${id}/sessions/${sessionId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa buổi học");
      notify.success(json.message || "Đã xóa buổi học");
      await loadAll();
    } catch (err) {
      notify.error(err.message || "Không thể xóa buổi học");
    }
  };

  const removeStudent = async () => {
    if (!removeEnrollmentId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/courses/${id}/students/${removeEnrollmentId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể gỡ học viên");
      notify.success("Đã gỡ học viên khỏi khóa học");
      setRemoveEnrollmentId("");
      loadAll();
    } catch (e) {
      notify.error(e.message || "Không thể gỡ học viên");
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!course) return <div className="p-6">Không tìm thấy khóa học.</div>;

  return (
    <div className="p-4 md:p-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sửa khóa học</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chỉnh thông tin khóa học, lịch học và quản lý học viên.
          </p>
        </div>
        <Link href="/admin/courses" className="w-fit px-4 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          Quay lại danh sách
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Tổng học viên hiện tại</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{students.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Số buổi học</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{(course.buoiHoc || []).length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="text-sm text-gray-500 dark:text-gray-400">Số học viên tối đa</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{course.soHocVienToiDa || "-"}</div>
        </div>
      </div>

      <form onSubmit={saveCourse} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sửa thông tin khóa học</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tên khóa học</label>
            <input
              className={FIELD_CLASS}
              title="Nhập tên khóa học"
              value={formData.tenkhoahoc}
              onChange={(e) => setFormData((p) => ({ ...p, tenkhoahoc: e.target.value }))}
              placeholder="Ví dụ: TOEIC Foundation T4-T6"
            />
          </div>
          <div className="lg:col-span-6 space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại khóa học</label>
            <select className={FIELD_CLASS} title="Chọn loại khóa học" value={formData.LoaiKhoaHocID} onChange={(e) => setFormData((p) => ({ ...p, LoaiKhoaHocID: e.target.value }))}>
              <option value="">Chọn loại khóa học</option>
              {courseTypes.map((ct, idx) => <option key={ct._id || idx} value={ct._id}>{ct.Tenloai}</option>)}
            </select>
          </div>
          <div className="lg:col-span-6 space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày khai giảng</label>
            <input className={FIELD_CLASS} title="Chọn ngày khai giảng" type="date" value={formData.ngaykhaigiang} onChange={(e) => setFormData((p) => ({ ...p, ngaykhaigiang: e.target.value }))} />
          </div>
          <div className="lg:col-span-6 space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Giảng viên</label>
            <select className={FIELD_CLASS} title="Chọn giảng viên phụ trách khóa" value={formData.giangvien} onChange={(e) => setFormData((p) => ({ ...p, giangvien: e.target.value }))}>
              <option value="">Chọn giảng viên</option>
              {teachers.map((t, idx) => <option key={t.courseTeacherId || idx} value={t.courseTeacherId}>{t.hovaten || t.email}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Lịch học cố định</h3>
            <button type="button" className="px-3 py-1.5 border border-blue-300 text-blue-700 dark:text-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={addSchedule}>+ Thêm lịch</button>
          </div>
          {(formData.lichHoc || []).map((slot, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <select className={FIELD_CLASS} value={slot.thu} onChange={(e) => updateSchedule(idx, "thu", Number(e.target.value))}>
                {DAY_LABELS.map((d, i) => <option key={`${d}-${i}`} value={i}>{d}</option>)}
              </select>
              <input className={FIELD_CLASS} type="time" value={slot.gioBatDau} onChange={(e) => updateSchedule(idx, "gioBatDau", e.target.value)} />
              <input className={FIELD_CLASS} type="time" value={slot.gioKetThuc} onChange={(e) => updateSchedule(idx, "gioKetThuc", e.target.value)} />
              <select className={FIELD_CLASS} value={slot.phonghoc} onChange={(e) => updateSchedule(idx, "phonghoc", e.target.value)}>
                <option value="">Chọn phòng</option>
                {rooms.map((r, i) => <option key={r._id || i} value={r._id}>{r.TenPhong} - {r.CoSoName}</option>)}
              </select>
              <button type="button" className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => removeSchedule(idx)}>Xóa</button>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Quản lý học viên trong khóa</h2>
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <select className={`${FIELD_CLASS} flex-1`} value={selectedHocVienId} onChange={(e) => setSelectedHocVienId(e.target.value)} disabled={isCourseFull}>
              <option value="">Chọn học viên để thêm</option>
              {availableStudents.map((s, idx) => (
                <option key={s.hocVienInfo?._id || idx} value={s.hocVienInfo?._id}>
                  {s.hovaten || s.email} - {s.email}
                </option>
              ))}
            </select>
            <button type="button" onClick={addStudent} disabled={isCourseFull} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed">Thêm có sẵn</button>
            <button type="button" onClick={() => setStudentModalOpen(true)} disabled={isCourseFull} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">Tạo mới học viên</button>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            Số lượng hiện tại: {students.length}/{course.soHocVienToiDa || "-"} học viên
          </div>
          <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
            {students.map((s) => (
              <div key={s.enrollmentId} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-900/20">
                <div className="text-sm">
                  <div className="font-medium">{s.hovaten || s.email}</div>
                  <div className="text-gray-500">{s.email}</div>
                </div>
                <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700" onClick={() => setRemoveEnrollmentId(s.enrollmentId)}>
                  Gỡ
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Danh sách buổi học và trạng thái chỉnh sửa</h2>
          <div className="mb-3">
            <button type="button" onClick={openCreateSessionModal} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Thêm buổi học riêng
            </button>
          </div>
          <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
            {(course.buoiHoc || []).map((b) => (
              <div key={b._id} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex items-center justify-between bg-gray-50 dark:bg-gray-900/20">
                <div>
                  {formatDate(b.ngayhoc)} | {formatTime(b.giobatdau)} - {formatTime(b.gioketthuc)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${b.isLocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {b.isLocked ? (b.lockReason === "before_today" ? "Khóa: buổi trước hôm nay" : "Khóa: có đơn xin nghỉ/học bù/xin vào học") : "Được phép đổi"}
                  </span>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-60"
                    disabled={b.isLocked}
                    onClick={() => openEditSessionModal(b)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
                    disabled={b.isLocked}
                    onClick={() => deleteSession(b._id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={Boolean(removeEnrollmentId)}
        title="Xác nhận gỡ học viên"
        message="Bạn có chắc muốn gỡ học viên này khỏi khóa học?"
        onConfirm={removeStudent}
        onCancel={() => setRemoveEnrollmentId("")}
        confirmText="Gỡ"
      />

      {studentModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
            <form onSubmit={createAndAddStudent}>
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Tạo học viên mới và thêm vào khóa</h3>
                <button type="button" onClick={() => setStudentModalOpen(false)}>Đóng</button>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên *</label>
                  <input
                    className={FIELD_CLASS}
                    title="Chỉ gồm chữ cái, khoảng trắng, dấu chấm hoặc gạch nối"
                    placeholder="Nguyễn Văn A"
                    value={studentForm.hovaten}
                    onChange={(e) => setStudentForm((p) => ({ ...p, hovaten: e.target.value }))}
                    pattern="^[A-Za-zÀ-ỹ\s'.-]{2,100}$"
                    required
                  />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                  <input
                    className={FIELD_CLASS}
                    title="Nhập email hợp lệ, ví dụ: abc@gmail.com"
                    placeholder="abc@gmail.com"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm((p) => ({ ...p, email: e.target.value }))}
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                    required
                  />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu *</label>
                  <input className={FIELD_CLASS} title="Mật khẩu tối thiểu 6 ký tự" placeholder="Ít nhất 6 ký tự" type="password" minLength={6} value={studentForm.password} onChange={(e) => setStudentForm((p) => ({ ...p, password: e.target.value }))} required />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                  <input
                    className={FIELD_CLASS}
                    title="Định dạng: 09xxxxxxxx hoặc +84xxxxxxxxx"
                    placeholder="09xxxxxxxx"
                    value={studentForm.soDienThoai}
                    onChange={(e) => setStudentForm((p) => ({ ...p, soDienThoai: e.target.value }))}
                    pattern="^(0|\+84)\d{9,10}$"
                  />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Giới tính</label>
                  <select className={FIELD_CLASS} title="Chọn giới tính" value={studentForm.gioitinh} onChange={(e) => setStudentForm((p) => ({ ...p, gioitinh: e.target.value }))}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày sinh</label>
                  <input className={FIELD_CLASS} title="Chọn ngày sinh" type="date" value={studentForm.ngaysinh} onChange={(e) => setStudentForm((p) => ({ ...p, ngaysinh: e.target.value }))} />
                </div>
                <div className="md:col-span-12 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
                  <input className={FIELD_CLASS} title="Nhập địa chỉ liên hệ" placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" value={studentForm.diachi} onChange={(e) => setStudentForm((p) => ({ ...p, diachi: e.target.value }))} />
                </div>
              </div>
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button type="button" className="px-4 py-2 border rounded" onClick={() => setStudentModalOpen(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={creatingStudent}>
                  {creatingStudent ? "Đang tạo..." : "Tạo và thêm vào khóa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {sessionModal.isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
            <form onSubmit={saveSession}>
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">{sessionModal.mode === "edit" ? "Sửa buổi học" : "Thêm buổi học"}</h3>
                <button type="button" onClick={() => setSessionModal((p) => ({ ...p, isOpen: false }))}>Đóng</button>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={FIELD_CLASS} type="date" value={sessionModal.ngayhoc} onChange={(e) => setSessionModal((p) => ({ ...p, ngayhoc: e.target.value }))} required />
                <select className={FIELD_CLASS} value={sessionModal.BaiHocID} onChange={(e) => setSessionModal((p) => ({ ...p, BaiHocID: e.target.value }))} required>
                  <option value="">Chọn bài học</option>
                  {lessons.map((ls) => (
                    <option key={ls._id} value={ls._id}>
                      {ls.thutu}. {ls.tenbai}
                    </option>
                  ))}
                </select>
                <input className={FIELD_CLASS} type="time" value={sessionModal.gioBatDau} onChange={(e) => setSessionModal((p) => ({ ...p, gioBatDau: e.target.value }))} required />
                <input className={FIELD_CLASS} type="time" value={sessionModal.gioKetThuc} onChange={(e) => setSessionModal((p) => ({ ...p, gioKetThuc: e.target.value }))} required />
                <select className={`${FIELD_CLASS} md:col-span-2`} value={sessionModal.phonghoc} onChange={(e) => setSessionModal((p) => ({ ...p, phonghoc: e.target.value }))} required>
                  <option value="">Chọn phòng học</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>{r.TenPhong} - {r.CoSoName}</option>
                  ))}
                </select>
              </div>
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button type="button" className="px-4 py-2 border rounded" onClick={() => setSessionModal((p) => ({ ...p, isOpen: false }))}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toDateInput(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function formatTime(v) {
  if (!v) return "--:--";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}
