"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { useNotification } from "../../contexts/NotificationContext";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiArrowLeft, FiPaperclip } from "react-icons/fi";
import { formatDateDdMmYyyy } from "../../../lib/dateFormat";


export default function CourseTypesPage() {
  const { token } = useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const COURSE_TYPES_API_URL = `${API_BASE}/api/course-types`;
  const FILE_UPLOAD_API_URL = `${API_BASE}/api/admin/files/upload`;

  const [mode, setMode] = useState("list"); // list | create | edit
  const [activeCourseType, setActiveCourseType] = useState(null);

  if (mode === "edit" && activeCourseType) {
    return (
      <EditCourseTypeView
        token={token}
        apiBase={API_BASE}
        courseTypesApiUrl={COURSE_TYPES_API_URL}
        fileUploadApiUrl={FILE_UPLOAD_API_URL}
        courseType={activeCourseType}
        onBack={() => { setMode("list"); setActiveCourseType(null); }}
        onUpdated={(next) => setActiveCourseType(next)}
      />
    );
  }

  return (
    <ListCourseTypesView
      token={token}
      apiBase={API_BASE}
      courseTypesApiUrl={COURSE_TYPES_API_URL}
      onCreate={() => { setMode("create"); setActiveCourseType(null); }}
      onCancelCreate={() => setMode("list")}
      creating={mode === "create"}
      onEdit={(ct) => { setActiveCourseType(ct); setMode("edit"); }}
    />
  );
}

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

function ListCourseTypesView({ token, courseTypesApiUrl, creating, onCreate, onCancelCreate, onEdit }) {
  const notify = useNotification();
  const [courseTypes, setCourseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCertificate, setFilterCertificate] = useState("all");

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const REGEX = useMemo(() => ({
    tenLoai: /^[A-Za-zÀ-ỹ0-9\s:;,.!?()\-_/\\'"&+]{2,80}$/u,
    chungChi: /^(TOEIC|IELTS)$/i,
  }), []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ Tenloai: "", ChungChi: "TOEIC", mota: "" });

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(courseTypesApiUrl, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải dữ liệu");
        setCourseTypes(Array.isArray(result.data) ? result.data : []);
      } catch (e) {
        console.error(e);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, courseTypesApiUrl]);

  useEffect(() => {
    if (!creating) return;
    setIsCreateModalOpen(true);
    setCreateForm({ Tenloai: "", ChungChi: "TOEIC", mota: "" });
  }, [creating]);

  const filteredCourseTypes = useMemo(() => {
    return courseTypes.filter(ct => {
      const cert = String(ct.ChungChi || "").toUpperCase();
      const name = String(ct.Tenloai || "");
      const matchesCertificate = filterCertificate === 'all' || cert === filterCertificate;
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCertificate && matchesSearch;
    });
  }, [courseTypes, searchTerm, filterCertificate]);

  const stats = useMemo(() => {
    const total = courseTypes.length;
    const toeic = courseTypes.filter(ct => String(ct.ChungChi || "").toUpperCase() === 'TOEIC').length;
    const ielts = courseTypes.filter(ct => String(ct.ChungChi || "").toUpperCase() === 'IELTS').length;
    return { total, toeic, ielts };
  }, [courseTypes]);

  const openDelete = (id) => {
    setDeletingId(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`${courseTypesApiUrl}/${deletingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể xóa");
      setCourseTypes(prev => prev.filter(x => x._id !== deletingId));
      notify.success("Đã xóa loại khóa học");
    } catch (e) {
      console.error(e);
      notify.error(`Lỗi: ${e.message}`);
    } finally {
      setIsConfirmDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    const ten = String(createForm.Tenloai || "").trim();
    if (!REGEX.tenLoai.test(ten)) {
      notify.warning("Tên loại khóa học không hợp lệ (2-80 ký tự).");
      return;
    }
    const cc = String(createForm.ChungChi || "").trim();
    if (cc && !REGEX.chungChi.test(cc)) {
      notify.warning("Chứng chỉ chỉ được chọn TOEIC hoặc IELTS.");
      return;
    }

    try {
      const response = await fetch(courseTypesApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...createForm, Tenloai: ten, mota: String(createForm.mota || "").trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tạo loại khóa học");
      setCourseTypes(prev => [result.data, ...prev]);
      notify.success("Tạo loại khóa học thành công");
      setIsCreateModalOpen(false);
      onCancelCreate();
    } catch (e2) {
      console.error(e2);
      notify.error(`Lỗi: ${e2.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản Lý Phân loại khóa học</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Thêm, sửa, xóa và tìm kiếm các loại khóa học trong hệ thống.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Tổng số" value={stats.total} />
          <StatCard title="TOEIC" value={stats.toeic} />
          <StatCard title="IELTS" value={stats.ielts} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main list */}
          <section className="lg:col-span-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="relative w-full md:w-1/2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khóa học"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
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
                  type="button"
                  onClick={onCreate}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="h-5 w-5" />
                  Thêm mới
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">#</th>
                      <th scope="col" className="px-6 py-3">Tên Phân Loại Khóa Học</th>
                      <th scope="col" className="px-6 py-3">Mô tả</th>
                      <th scope="col" className="px-6 py-3">Chứng chỉ</th>
                      <th scope="col" className="px-6 py-3">Ngày tạo</th>
                      <th scope="col" className="px-6 py-3 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-8 dark:text-gray-400">Đang tải...</td></tr>
                    ) : error ? (
                      <tr><td colSpan="6" className="text-center py-8 text-red-500 dark:text-red-400">{error}</td></tr>
                    ) : filteredCourseTypes.length > 0 ? (
                      filteredCourseTypes.map((ct, index) => (
                        <tr key={ct._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/40">
                          <td className="px-6 py-4">{index + 1}</td>
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{ct.Tenloai}</th>
                          <td className="px-6 py-4 max-w-sm truncate">{ct.mota || ""}</td>
                          <td className="px-6 py-4">{String(ct.ChungChi || "").toUpperCase() || "—"}</td>
                          <td className="px-6 py-4">{ct.createdAt ? formatDateDdMmYyyy(ct.createdAt) : "—"}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => onEdit(ct)} className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-yellow-400/90 hover:bg-yellow-400 text-white" title="Chỉnh sửa">
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button onClick={() => openDelete(ct._id)} className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-500 hover:bg-red-600 text-white" title="Xóa">
                              <FiTrash2 className="h-5 w-5" />
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
          </section>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        title="Thêm Loại Khóa Học Mới"
        onClose={() => { setIsCreateModalOpen(false); onCancelCreate(); }}
        footer={(
          <>
            <button
              type="button"
              onClick={() => { setIsCreateModalOpen(false); onCancelCreate(); }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              form="create-course-type-form"
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              Tạo mới
            </button>
          </>
        )}
      >
        <form id="create-course-type-form" onSubmit={submitCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên loại khóa học</label>
            <input
              value={createForm.Tenloai}
              onChange={(e) => setCreateForm(prev => ({ ...prev, Tenloai: e.target.value }))}
              placeholder="Nhập tên khóa học..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại chứng chỉ</label>
            <select
              value={createForm.ChungChi}
              onChange={(e) => setCreateForm(prev => ({ ...prev, ChungChi: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TOEIC">TOEIC</option>
              <option value="IELTS">IELTS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
            <textarea
              value={createForm.mota}
              onChange={(e) => setCreateForm(prev => ({ ...prev, mota: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa loại khóa học này không? Hành động này sẽ xóa luôn toàn bộ bài học thuộc loại."
        onConfirm={confirmDelete}
        onCancel={() => { setIsConfirmDeleteOpen(false); setDeletingId(null); }}
        confirmText="Xóa"
      />
    </div>
  );
}

function EditCourseTypeView({ token, apiBase, courseTypesApiUrl, fileUploadApiUrl, courseType, onBack, onUpdated }) {
  const notify = useNotification();
  const REGEX = useMemo(() => ({
    tenLoai: /^[A-Za-zÀ-ỹ0-9\s:;,.!?()\-_/\\'"&+]{2,80}$/u,
    chungChi: /^(TOEIC|IELTS)$/i,
    tenBai: /^[A-Za-zÀ-ỹ0-9\s:;,.!?()\-_/\\'"&+]{2,120}$/u,
  }), []);

  const [typeForm, setTypeForm] = useState({
    Tenloai: courseType?.Tenloai || "",
    ChungChi: String(courseType?.ChungChi || "TOEIC").toUpperCase(),
    mota: courseType?.mota || "",
  });

  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState(null);
  const [lessons, setLessons] = useState([]);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonEditing, setLessonEditing] = useState(null);
  const [lessonForm, setLessonForm] = useState({ tenbai: "", thutu: 1, mota: "" });
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{_id,url,type,size}]
  const [uploading, setUploading] = useState(false);

  const [isDeleteLessonOpen, setIsDeleteLessonOpen] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState(null);
  const [isFilesViewerOpen, setIsFilesViewerOpen] = useState(false);
  const [viewerFiles, setViewerFiles] = useState([]);
  const [activeViewerFile, setActiveViewerFile] = useState(null);
  const [pptSlideMode, setPptSlideMode] = useState(false);

  useEffect(() => {
    setTypeForm({
      Tenloai: courseType?.Tenloai || "",
      ChungChi: String(courseType?.ChungChi || "TOEIC").toUpperCase(),
      mota: courseType?.mota || "",
    });
  }, [courseType?._id]);

  useEffect(() => {
    if (!token || !courseType?._id) return;
    const run = async () => {
      try {
        setLessonsLoading(true);
        setLessonsError(null);
        const res = await fetch(`${courseTypesApiUrl}/${courseType._id}/lessons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tải bài giảng");
        const data = Array.isArray(json.data) ? json.data : [];
        setLessons(data.sort((a, b) => (a.thutu || 0) - (b.thutu || 0)));
      } catch (e) {
        console.error(e);
        setLessonsError(e.message || "Không thể tải bài giảng");
      } finally {
        setLessonsLoading(false);
      }
    };
    run();
  }, [token, courseTypesApiUrl, courseType?._id]);

  const openEditLesson = (ls) => {
    setLessonEditing(ls);
    setLessonForm({
      tenbai: ls.tenbai || "",
      thutu: Number(ls.thutu || 1),
      mota: ls.mota || "",
    });
    const files = Array.isArray(ls.files) && ls.files.length > 0 ? ls.files : (ls.file ? [ls.file] : []);
    const normalized = files
      .filter(Boolean)
      .map((f) => (typeof f === "string" ? { _id: f } : f));
    setUploadedFiles(normalized);
    setIsLessonModalOpen(true);
  };

  const resetLessonForm = () => {
    setLessonEditing(null);
    setLessonForm({ tenbai: "", thutu: 1, mota: "" });
    setUploadedFiles([]);
    setIsLessonModalOpen(true);
  };

  const toFileLabel = (f) => {
    const originalName = String(f?.originalName || "").trim();
    if (originalName) return originalName;
    const url = String(f?.url || "");
    if (!url) return f?._id || "Tài liệu";
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  };

  const openFilesViewer = (ls) => {
    const files = Array.isArray(ls.files) && ls.files.length > 0 ? ls.files : (ls.file ? [ls.file] : []);
    const normalized = files
      .filter(Boolean)
      .map((f) => (typeof f === "string" ? { _id: f } : f));
    setViewerFiles(normalized);
    setActiveViewerFile(normalized[0] || null);
    setPptSlideMode(false);
    setIsFilesViewerOpen(true);
  };

  const isPreviewable = (f) => {
    const type = String(f?.type || "").toLowerCase();
    const url = String(f?.url || "").toLowerCase();
    const isImage = type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp)$/.test(url);
    const isPdf = type === "application/pdf" || /\.pdf$/.test(url);
    const isVideo = type.startsWith("video/") || /\.(mp4|webm|mov)$/.test(url);
    const isWord = /(msword|officedocument\.wordprocessingml\.document)/.test(type) || /\.(doc|docx)$/.test(url);
    const isPpt = /(ms-powerpoint|officedocument\.presentationml\.presentation)/.test(type) || /\.(ppt|pptx)$/.test(url);
    const isExcel = /(vnd\.ms-excel|officedocument\.spreadsheetml\.sheet)/.test(type) || /\.(xls|xlsx)$/.test(url);
    return { isImage, isPdf, isVideo, isWord, isPpt, isExcel, ok: isImage || isPdf || isVideo || isWord || isPpt || isExcel };
  };

  const uploadDroppedFiles = async (fileList) => {
    const arr = Array.from(fileList || []);
    if (arr.length === 0) return;
    if (!token) return;

    try {
      setUploading(true);
      const fd = new FormData();
      arr.forEach((f) => fd.append("files", f));

      const res = await fetch(fileUploadApiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Upload thất bại");
      const newFiles = Array.isArray(json.data) ? json.data : [];
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      notify.success("Upload tài liệu thành công");
    } catch (e) {
      console.error(e);
      notify.error(`Lỗi upload: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    const ten = String(lessonForm.tenbai || "").trim();
    if (!REGEX.tenBai.test(ten)) {
      notify.warning("Tên bài giảng không hợp lệ (2-120 ký tự).");
      return;
    }
    const order = Number(lessonForm.thutu);
    if (!Number.isInteger(order) || order < 1 || order > 9999) {
      notify.warning("Thứ tự phải là số nguyên từ 1 đến 9999.");
      return;
    }

    const payload = {
      tenbai: ten,
      thutu: order,
      mota: String(lessonForm.mota || "").trim(),
      file: uploadedFiles[0]?._id || undefined,
      files: uploadedFiles.map((f) => f._id).filter(Boolean),
    };

    try {
      const url = lessonEditing
        ? `${courseTypesApiUrl}/${courseType._id}/lessons/${lessonEditing._id}`
        : `${courseTypesApiUrl}/${courseType._id}/lessons`;
      const method = lessonEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể lưu bài giảng");

      if (lessonEditing) {
        setLessons(prev => prev.map(x => (x._id === lessonEditing._id ? json.data : x)).sort((a, b) => (a.thutu || 0) - (b.thutu || 0)));
        notify.success("Cập nhật bài giảng thành công");
      } else {
        setLessons(prev => [...prev, json.data].sort((a, b) => (a.thutu || 0) - (b.thutu || 0)));
        notify.success("Tạo bài giảng thành công");
      }
      setIsLessonModalOpen(false);
      setLessonEditing(null);
      setLessonForm({ tenbai: "", thutu: 1, mota: "" });
      setUploadedFiles([]);
    } catch (e2) {
      console.error(e2);
      notify.error(`Lỗi: ${e2.message}`);
    }
  };

  const openDeleteLesson = (id) => {
    setDeletingLessonId(id);
    setIsDeleteLessonOpen(true);
  };

  const confirmDeleteLesson = async () => {
    if (!deletingLessonId) return;
    try {
      const res = await fetch(`${courseTypesApiUrl}/${courseType._id}/lessons/${deletingLessonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa bài giảng");
      setLessons(prev => prev.filter(x => x._id !== deletingLessonId));
      notify.success("Đã xóa bài giảng");
    } catch (e) {
      console.error(e);
      notify.error(`Lỗi: ${e.message}`);
    } finally {
      setIsDeleteLessonOpen(false);
      setDeletingLessonId(null);
    }
  };

  const submitCourseType = async (e) => {
    e.preventDefault();
    const ten = String(typeForm.Tenloai || "").trim();
    if (!REGEX.tenLoai.test(ten)) {
      notify.warning("Tên loại khóa học không hợp lệ (2-80 ký tự).");
      return;
    }
    const cc = String(typeForm.ChungChi || "").trim();
    if (cc && !REGEX.chungChi.test(cc)) {
      notify.warning("Chứng chỉ chỉ được chọn TOEIC hoặc IELTS.");
      return;
    }

    try {
      const res = await fetch(`${courseTypesApiUrl}/${courseType._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...typeForm, Tenloai: ten, mota: String(typeForm.mota || "").trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật loại khóa học");
      notify.success("Cập nhật loại khóa học thành công");
      onUpdated(json.data);
    } catch (e2) {
      console.error(e2);
      notify.error(`Lỗi: ${e2.message}`);
    }
  };

  const fileLabel = (ls) => {
    const files = Array.isArray(ls?.files) && ls.files.length > 0 ? ls.files : (ls?.file ? [ls.file] : []);
    if (!files || files.length === 0) return "—";
    return `${files.length} file`;
  };

  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chỉnh sửa loại khóa học</h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <FiArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: lessons list + form (giống ảnh 2) */}
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Danh sách bài giảng</div>
                <button
                  type="button"
                  onClick={resetLessonForm}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                >
                  <FiPlus className="w-5 h-5" />
                  Thêm mới
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Thứ tự</th>
                      <th className="px-6 py-3">Tên bài giảng</th>
                      <th className="px-6 py-3">Tài liệu</th>
                      <th className="px-6 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonsLoading ? (
                      <tr><td colSpan="4" className="px-6 py-6 text-center">Đang tải...</td></tr>
                    ) : lessonsError ? (
                      <tr><td colSpan="4" className="px-6 py-6 text-center text-red-600 dark:text-red-400">{lessonsError}</td></tr>
                    ) : lessons.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-6 text-center">Chưa có bài giảng nào.</td></tr>
                    ) : (
                      lessons.map((ls) => (
                        <tr key={ls._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                          <td className="px-6 py-4">{ls.thutu}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{ls.tenbai}</td>
                          <td className="px-6 py-4">
                            {fileLabel(ls) === "—" ? (
                              <span>—</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openFilesViewer(ls)}
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <FiPaperclip className="w-4 h-4" />
                                {fileLabel(ls)}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openEditLesson(ls)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                              title="Sửa"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteLesson(ls._id)}
                              className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-500 hover:bg-red-600 text-white"
                              title="Xóa"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Right: edit course type */}
          <aside className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Chỉnh sửa thông tin khóa học</div>
              </div>
              <form onSubmit={submitCourseType} className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên loại khóa học</label>
                  <input
                    value={typeForm.Tenloai}
                    onChange={(e) => setTypeForm(prev => ({ ...prev, Tenloai: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại chứng chỉ</label>
                  <select
                    value={typeForm.ChungChi}
                    onChange={(e) => setTypeForm(prev => ({ ...prev, ChungChi: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TOEIC">TOEIC</option>
                    <option value="IELTS">IELTS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                  <textarea
                    rows={6}
                    value={typeForm.mota}
                    onChange={(e) => setTypeForm(prev => ({ ...prev, mota: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteLessonOpen}
        title="Xác nhận xóa bài giảng"
        message="Bạn có chắc chắn muốn xóa bài giảng này không?"
        onConfirm={confirmDeleteLesson}
        onCancel={() => { setIsDeleteLessonOpen(false); setDeletingLessonId(null); }}
        confirmText="Xóa"
      />

      <Modal
        isOpen={isLessonModalOpen}
        title={lessonEditing ? "Chỉnh sửa bài giảng" : "Thêm bài giảng mới"}
        onClose={() => { setIsLessonModalOpen(false); setLessonEditing(null); setLessonForm({ tenbai: "", thutu: 1, mota: "" }); setUploadedFiles([]); }}
        footer={(
          <>
            <button
              type="button"
              onClick={() => { setIsLessonModalOpen(false); setLessonEditing(null); setLessonForm({ tenbai: "", thutu: 1, mota: "" }); setUploadedFiles([]); }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              form="lesson-form"
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              disabled={uploading}
            >
              {lessonEditing ? "Lưu" : "Tạo mới"}
            </button>
          </>
        )}
      >
        <form id="lesson-form" onSubmit={submitLesson} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên bài giảng</label>
            <input
              value={lessonForm.tenbai}
              onChange={(e) => setLessonForm(prev => ({ ...prev, tenbai: e.target.value }))}
              placeholder="Tên bài giảng"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={lessonForm.thutu}
                onChange={(e) => setLessonForm(prev => ({ ...prev, thutu: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung</label>
            <textarea
              rows={5}
              value={lessonForm.mota}
              onChange={(e) => setLessonForm(prev => ({ ...prev, mota: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File đính kèm</label>
            <Dropzone
              disabled={uploading}
              onFiles={(files) => uploadDroppedFiles(files)}
            />

            {uploading ? (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Đang upload...</div>
            ) : null}

            {uploadedFiles.length > 0 ? (
              <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/60">
                  Danh sách file ({uploadedFiles.length})
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {uploadedFiles.map((f) => (
                    <li key={f._id} className="px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 dark:text-white truncate">{toFileLabel(f)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{String(f.type || "")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles(prev => prev.filter(x => x._id !== f._id))}
                        className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                      >
                        Gỡ
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Kéo thả file vào khung hoặc bấm để chọn. Hỗ trợ: jpg/png/pdf/doc/docx/xls/xlsx (tối đa 5MB).</div>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isFilesViewerOpen}
        title="Tài liệu đính kèm"
        onClose={() => { setIsFilesViewerOpen(false); setViewerFiles([]); setActiveViewerFile(null); setPptSlideMode(false); }}
        footer={(
          <button
            type="button"
            onClick={() => { setIsFilesViewerOpen(false); setViewerFiles([]); setActiveViewerFile(null); setPptSlideMode(false); }}
            className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Đóng
          </button>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Danh sách file</div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[50vh] overflow-auto">
                {viewerFiles.map((f) => {
                  const active = activeViewerFile?._id === f._id;
                  return (
                    <li key={f._id}>
                      <button
                        type="button"
                        onClick={() => { setActiveViewerFile(f); setPptSlideMode(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${active ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" : "hover:bg-gray-50 dark:hover:bg-gray-700/40 text-gray-800 dark:text-gray-200"}`}
                      >
                        {toFileLabel(f)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Xem file</div>
            {!activeViewerFile ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Chọn 1 file để xem.</div>
            ) : (
              (() => {
                const { ok, isImage, isPdf, isVideo, isWord, isPpt, isExcel } = isPreviewable(activeViewerFile);
                const url = String(activeViewerFile.url || "");
                if (!url) {
                  return <div className="text-sm text-gray-500 dark:text-gray-400">File không có đường dẫn.</div>;
                }
                const fullUrl = url.startsWith("http") ? url : `${apiBase}${url}`;
                const encodedUrl = encodeURIComponent(fullUrl);
                const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                const officeSlideUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}&wdSlideShow=true`;
                if (isImage) {
                  return <img src={fullUrl} alt="preview" className="max-h-[55vh] w-auto rounded border border-gray-200 dark:border-gray-700" />;
                }
                if (isPdf) {
                  return <iframe title="pdf" src={fullUrl} className="w-full h-[55vh] rounded border border-gray-200 dark:border-gray-700" />;
                }
                if (isVideo) {
                  return (
                    <video controls className="w-full max-h-[55vh] rounded border border-gray-200 dark:border-gray-700 bg-black">
                      <source src={fullUrl} />
                      Trình duyệt không hỗ trợ phát video.
                    </video>
                  );
                }
                if (isWord || isExcel || isPpt) {
                  return (
                    <div className="space-y-3">
                      {isPpt ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPptSlideMode((prev) => !prev)}
                            className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                          >
                            {pptSlideMode ? "Tắt trình chiếu" : "Bật trình chiếu PPT"}
                          </button>
                        </div>
                      ) : null}
                      <iframe
                        title="office-preview"
                        src={isPpt && pptSlideMode ? officeSlideUrl : officeEmbedUrl}
                        className="w-full h-[55vh] rounded border border-gray-200 dark:border-gray-700"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Nếu không xem được trên localhost, hãy mở file ở tab mới.
                      </div>
                    </div>
                  );
                }
                if (!ok) {
                  return (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">File này không hỗ trợ preview trực tiếp. Bạn có thể mở ở tab mới.</div>
                      <a href={fullUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm">
                        Mở file
                      </a>
                    </div>
                  );
                }
                return null;
              })()
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ isOpen, title, onClose, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b dark:border-gray-700 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
            Đóng
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Dropzone({ disabled, onFiles }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={`block w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
        disabled
          ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900/20"
          : dragOver
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/40"
      }`}
    >
      <input
        type="file"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (disabled) return;
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex items-center justify-center gap-2">
                        <FiPaperclip className="w-5 h-5" />
        <span className="text-sm font-medium">Kéo thả file vào đây hoặc bấm để chọn</span>
      </div>
    </label>
  );
}
