"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import ConfirmModal from "../../components/ConfirmModal";
import InputField from "../../components/InputField";
import { FiPlus, FiSearch, FiTrash2, FiEdit2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { formatDateDdMmYyyy } from "../../../lib/dateFormat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function Modal({ isOpen, title, onClose, children, footer, maxWidthClassName = "max-w-3xl" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`w-full ${maxWidthClassName} bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden`}>
        <div className="px-6 py-5 border-b dark:border-gray-700 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Đóng
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
        {footer ? <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">{footer}</div> : null}
      </div>
    </div>
  );
}

function stringifyCapDo(capDo) {
  const v = String(capDo || "").trim();
  if (!v) return "easy";
  return v;
}

function SampleTestEditor({
  token,
  notify,
  mode,
  activeTestId,
  activeTest,
  courses,
  courseTypes,
  API_SAMPLE_TESTS,
  FILE_UPLOAD_API_URL,
  onBack,
}) {
  const [testId, setTestId] = useState(mode === "edit" ? activeTestId : null);
  const [localTest, setLocalTest] = useState(activeTest);
  const [expandedPartId, setExpandedPartId] = useState(activeTest?.parts?.[0]?._id || null);

  const [partModalOpen, setPartModalOpen] = useState(false);
  const [partEditing, setPartEditing] = useState(null);
  const [partForm, setPartForm] = useState({ tenPhan: "", thuTu: 1 });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionEditing, setQuestionEditing] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    thuTu: 1,
    noiDung: "",
    luaChon: ["", "", "", ""],
    dapAnDungIndex: 0,
    giaiThich: "",
    deThiMauPhanNhomID: "",
  });
  const [questionFiles, setQuestionFiles] = useState([]); // File records from /api/admin/files/upload

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupEditing, setGroupEditing] = useState(null);
  const [groupForm, setGroupForm] = useState({ tenNhom: "", thuTu: 1 });
  const [groupFiles, setGroupFiles] = useState([]); // File records
  const [deleteGroupId, setDeleteGroupId] = useState(null);
  const [confirmDeleteGroupOpen, setConfirmDeleteGroupOpen] = useState(false);

  const [confirmDeletePartOpen, setConfirmDeletePartOpen] = useState(false);
  const [deletePartId, setDeletePartId] = useState(null);
  const [confirmDeleteQuestionOpen, setConfirmDeleteQuestionOpen] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState(null);

  useEffect(() => {
    setLocalTest(activeTest);
    setExpandedPartId(activeTest?.parts?.[0]?._id || null);
    if (mode === "edit") setTestId(activeTestId);
  }, [activeTest, activeTestId, mode]);

  const isCreate = mode === "create";

  const getCourseOptionsByChungChi = (cc) => {
    const mapCourseTypeIdToChungChi = new Map(
      (courseTypes || []).map((ct) => [String(ct._id), String(ct.ChungChi || "").toUpperCase()])
    );
    return (courses || [])
      .filter((c) => {
        const ctId = c.LoaiKhoaHocID?._id || c.LoaiKhoaHocID;
        const ctChungChi = mapCourseTypeIdToChungChi.get(String(ctId || ""));
        if (!ctChungChi) return false;
        return cc === "all" ? true : ctChungChi === cc;
      })
      .map((c) => ({
        value: String(c._id),
        label: `${c.tenkhoahoc || "Khóa học"}${c.LoaiKhoaHocID?.Tenloai ? ` - ${c.LoaiKhoaHocID.Tenloai}` : ""}`,
      }));
  };

  const courseOptions = getCourseOptionsByChungChi(String(localTest?.chungChi || "TOEIC").toUpperCase());

  const refreshTest = async (id) => {
    try {
      const res = await fetch(`${API_SAMPLE_TESTS}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được chi tiết đề.");
      setLocalTest(json.data);
      setExpandedPartId(json.data.parts?.[0]?._id || null);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi tải lại.");
    }
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return [];
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(FILE_UPLOAD_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Upload thất bại.");
      return Array.isArray(json.data) ? json.data : [];
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi upload file.");
      return [];
    }
  };

  const saveTestMeta = async () => {
    try {
      const payload = {
        khoaHocID: localTest.khoaHocID,
        tenDe: localTest.tenDe,
        chungChi: String(localTest.chungChi || "").toUpperCase(),
        capDo: stringifyCapDo(localTest.capDo),
        thoiGianLamBai: Number(localTest.thoiGianLamBai),
        moTa: localTest.moTa,
      };

      // Khóa học có thể bỏ trống (đề dùng chung cho tất cả khóa)
      if (!payload.tenDe?.trim()) return notify.warning("Nhập tên đề.");

      if (isCreate && !testId) {
        const res = await fetch(`${API_SAMPLE_TESTS}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo đề.");
        const createdId = json.data?._id;
        if (!createdId) throw new Error("Không nhận được id sau khi tạo đề.");
        setTestId(createdId);
        notify.success("Tạo đề thành công.");
        await refreshTest(createdId);
      } else {
        const idToUpdate = testId;
        if (!idToUpdate) return notify.warning("Chưa có id đề.");
        const res = await fetch(`${API_SAMPLE_TESTS}/${idToUpdate}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật đề.");
        notify.success("Cập nhật metadata thành công.");
        await refreshTest(idToUpdate);
      }
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu đề.");
    }
  };

  const openCreatePart = () => {
    const nextThuTu = (localTest.parts || []).reduce((m, p) => Math.max(m, Number(p.thuTu || 0)), 0) + 1;
    setPartEditing(null);
    setPartForm({ tenPhan: "", thuTu: nextThuTu });
    setPartModalOpen(true);
  };

  const openEditPart = (part) => {
    setPartEditing(part);
    setPartForm({ tenPhan: part.tenPhan || "", thuTu: Number(part.thuTu || 1) });
    setPartModalOpen(true);
  };

  const submitPart = async () => {
    try {
      if (!testId) return notify.warning("Hãy lưu metadata trước để tạo được part.");
      const tenPhan = String(partForm.tenPhan || "").trim();
      const thuTu = Number(partForm.thuTu);
      if (!tenPhan) return notify.warning("Nhập tên phần.");
      if (!Number.isFinite(thuTu) || thuTu < 1) return notify.warning("ThuTu không hợp lệ.");

      if (!partEditing) {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenPhan, thuTu }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo phần.");
        notify.success("Tạo phần thành công.");
      } else {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tenPhan, thuTu }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật phần.");
        notify.success("Cập nhật phần thành công.");
      }

      setPartModalOpen(false);
      setPartEditing(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu phần.");
    }
  };

  const confirmDeletePart = (partId) => {
    setDeletePartId(partId);
    setConfirmDeletePartOpen(true);
  };

  const deletePart = async () => {
    try {
      if (!testId || !deletePartId) return;
      const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${deletePartId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa phần.");
      notify.success("Đã xóa phần.");
      setConfirmDeletePartOpen(false);
      setDeletePartId(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa phần.");
    }
  };

  // ===== Groups (nhóm nhỏ trong part) =====
  const openCreateGroup = (part) => {
    const groups = part.groups || [];
    const nextThuTu = groups.reduce((m, g) => Math.max(m, Number(g.thuTu || 0)), 0) + 1;
    setGroupEditing(null);
    setGroupForm({ tenNhom: "", thuTu: nextThuTu });
    setGroupFiles([]);
    setDeleteGroupId(null);
    setGroupModalOpen(true);
  };

  const openEditGroup = (group) => {
    setGroupEditing(group);
    setGroupForm({
      tenNhom: group.tenNhom || "",
      thuTu: Number(group.thuTu || 1),
    });
    const normalizedFiles = (Array.isArray(group.files) ? group.files : []).map((f) => {
      if (!f) return null;
      if (typeof f === "string") return { _id: f, originalName: f };
      return f;
    }).filter(Boolean);
    setGroupFiles(normalizedFiles);
    setDeleteGroupId(null);
    setGroupModalOpen(true);
  };

  const submitGroup = async () => {
    try {
      if (!testId) return notify.warning("Chưa có id đề.");
      const partId = expandedPartId;
      if (!partId) return notify.warning("Chọn part hợp lệ.");

      const tenNhom = String(groupForm.tenNhom || "").trim();
      const thuTu = Number(groupForm.thuTu);
      if (!tenNhom) return notify.warning("Nhập tên nhóm.");
      if (!Number.isFinite(thuTu) || thuTu < 1) return notify.warning("thuTu không hợp lệ.");

      const payload = {
        tenNhom,
        thuTu,
        files: (groupFiles || []).map((f) => f?._id).filter(Boolean),
      };

      if (!groupEditing) {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partId}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo nhóm.");
        notify.success("Tạo nhóm thành công.");
      } else {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partId}/groups/${groupEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật nhóm.");
        notify.success("Cập nhật nhóm thành công.");
      }

      setGroupModalOpen(false);
      setGroupEditing(null);
      setGroupFiles([]);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu nhóm.");
    }
  };

  const confirmDeleteGroup = (groupId) => {
    setDeleteGroupId(groupId);
    setConfirmDeleteGroupOpen(true);
  };

  const deleteGroup = async () => {
    try {
      if (!testId || !deleteGroupId) return;
      const partId = expandedPartId;
      if (!partId) return;

      const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${partId}/groups/${deleteGroupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa nhóm.");
      notify.success("Đã xóa nhóm.");
      setConfirmDeleteGroupOpen(false);
      setDeleteGroupId(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa nhóm.");
    }
  };

  const openCreateQuestion = (part, groupId = "") => {
    const questions = part.questions || [];
    const nextThuTu = questions.reduce((m, q) => Math.max(m, Number(q.thuTu || 0)), 0) + 1;
    setQuestionEditing(null);
    setQuestionForm({
      thuTu: nextThuTu,
      noiDung: "",
      luaChon: ["", "", "", ""],
      dapAnDungIndex: 0,
      giaiThich: "",
      deThiMauPhanNhomID: groupId || "",
    });
    setQuestionFiles([]);
    setExpandedPartId(part._id);
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (question) => {
    setQuestionEditing(question);
    setQuestionForm({
      thuTu: Number(question.thuTu || 1),
      noiDung: question.noiDung || "",
      luaChon: Array.isArray(question.luaChon) ? [...question.luaChon] : ["", "", "", ""],
      dapAnDungIndex: Number(question.dapAnDungIndex || 0),
      giaiThich: question.giaiThich || "",
      deThiMauPhanNhomID: question.deThiMauPhanNhomID ? String(question.deThiMauPhanNhomID) : "",
    });
    const normalizedFiles = (Array.isArray(question.files) ? question.files : []).map((f) => {
      if (!f) return null;
      if (typeof f === "string") return { _id: f, originalName: f };
      return f;
    }).filter(Boolean);
    setQuestionFiles(normalizedFiles);
    setQuestionModalOpen(true);
  };

  const submitQuestion = async () => {
    try {
      if (!testId) return notify.warning("Chưa có id đề.");
      const part = (localTest.parts || []).find((p) => String(p._id) === String(expandedPartId));
      if (!part) return notify.warning("Chọn part hợp lệ.");

      const payload = {
        thuTu: Number(questionForm.thuTu),
        noiDung: String(questionForm.noiDung || "").trim(),
        luaChon: (questionForm.luaChon || []).map((x) => String(x || "").trim()),
        dapAnDungIndex: Number(questionForm.dapAnDungIndex),
        giaiThich: String(questionForm.giaiThich || "").trim(),
        loaiCauHoi: "mcq",
        deThiMauPhanNhomID: questionForm.deThiMauPhanNhomID || null,
        files: (questionFiles || []).map((f) => f?._id).filter(Boolean),
      };

      if (!payload.noiDung) return notify.warning("Nhập nội dung câu hỏi.");
      if (!payload.luaChon || payload.luaChon.length !== 4) return notify.warning("Cần đúng 4 lựa chọn.");

      if (!questionEditing) {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo câu hỏi.");
        notify.success("Tạo câu hỏi thành công.");
      } else {
        const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions/${questionEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật câu hỏi.");
        notify.success("Cập nhật câu hỏi thành công.");
      }

      setQuestionModalOpen(false);
      setQuestionEditing(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu câu hỏi.");
    }
  };

  const confirmDeleteQuestion = (questionId) => {
    setDeleteQuestionId(questionId);
    setConfirmDeleteQuestionOpen(true);
  };

  const deleteQuestion = async () => {
    try {
      if (!testId || !deleteQuestionId) return;
      const part = (localTest.parts || []).find((p) => String(p._id) === String(expandedPartId));
      if (!part) return notify.warning("Không xác định part để xóa câu.");
      const res = await fetch(`${API_SAMPLE_TESTS}/${testId}/parts/${part._id}/questions/${deleteQuestionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa câu hỏi.");
      notify.success("Đã xóa câu hỏi.");
      setConfirmDeleteQuestionOpen(false);
      setDeleteQuestionId(null);
      await refreshTest(testId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa câu hỏi.");
    }
  };

  const activePartForQuestion = (localTest.parts || []).find((p) => String(p._id) === String(expandedPartId));
  const groupSelectOptions = [
    { value: "", label: "Không nhóm" },
    ...((activePartForQuestion?.groups || []).map((g) => ({
      value: String(g._id),
      label: g.tenNhom,
    }))),
  ];

  const capDoOptions = [
    { value: "easy", label: "easy" },
    { value: "medium", label: "medium" },
    { value: "hard", label: "hard" },
    { value: "dễ", label: "dễ" },
    { value: "trung bình", label: "trung bình" },
    { value: "khó", label: "khó" },
  ];

  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isCreate ? "Tạo đề thi mẫu" : "Chỉnh sửa đề thi mẫu"}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {String(localTest?.chungChi || "").toUpperCase()} - quản lý part/câu MCQ
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Thông tin đề</div>
              </div>
              <form
                className="px-5 py-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveTestMeta();
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đề</label>
                  <InputField
                    type="text"
                    name="tenDe"
                    value={localTest.tenDe}
                    onChange={(e) => setLocalTest((p) => ({ ...p, tenDe: e.target.value }))}
                    placeholder="Ví dụ: TOEIC Foundation Test"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chứng chỉ</label>
                  <InputField
                    type="select"
                    name="chungChi"
                    value={localTest.chungChi}
                    onChange={(e) => setLocalTest((p) => ({ ...p, chungChi: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={[
                      { value: "TOEIC", label: "TOEIC" },
                      { value: "IELTS", label: "IELTS" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Khóa học</label>
                  <InputField
                    type="select"
                    name="khoaHocID"
                    value={localTest.khoaHocID}
                    onChange={(e) => setLocalTest((p) => ({ ...p, khoaHocID: e.target.value }))}
                    placeholder="Dùng cho tất cả khóa học"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={courseOptions}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Để trống = đề dùng cho tất cả khóa học.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cấp độ</label>
                    <InputField
                      type="select"
                      name="capDo"
                      value={String(localTest.capDo || "")}
                      onChange={(e) => setLocalTest((p) => ({ ...p, capDo: e.target.value }))}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      options={capDoOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian (phút)</label>
                    <InputField
                      type="number"
                      name="thoiGianLamBai"
                      value={localTest.thoiGianLamBai}
                      onChange={(e) => setLocalTest((p) => ({ ...p, thoiGianLamBai: e.target.value }))}
                      min={1}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                  <InputField
                    type="textarea"
                    name="moTa"
                    value={localTest.moTa}
                    onChange={(e) => setLocalTest((p) => ({ ...p, moTa: e.target.value }))}
                    rows={4}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                    {isCreate ? "Lưu & tạo đề" : "Lưu metadata"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Parts & câu hỏi</div>
                <button
                  type="button"
                  onClick={openCreatePart}
                  disabled={!testId}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                >
                  <FiPlus />
                  Thêm phần
                </button>
              </div>

              <div className="px-5 py-4">
                {(localTest.parts || []).length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có part nào. Thêm part để bắt đầu nhập câu hỏi.</div>
                ) : (
                  <div className="space-y-3">
                    {(localTest.parts || []).map((part) => {
                      const expanded = String(expandedPartId) === String(part._id);
                      return (
                        <div key={part._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {part.thuTu}. {part.tenPhan}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{part.questions?.length ?? 0} câu</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setExpandedPartId(expanded ? null : part._id)}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={expanded ? "Thu gọn" : "Mở rộng"}
                              >
                                {expanded ? <FiChevronUp /> : <FiChevronDown />}
                              </button>
                              <button
                                type="button"
                                onClick={() => openCreateQuestion(part)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Thêm câu
                              </button>
                              <button
                                type="button"
                                onClick={() => openCreateGroup(part)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Thêm nhóm
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditPart(part)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-yellow-400/90 text-white hover:bg-yellow-400" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDeletePart(part._id)}
                                disabled={!testId}
                                className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="px-4 py-3">
                              {(part.groups || []).length === 0 && (part.ungroupedQuestions || []).length === 0 ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có câu hỏi.</div>
                              ) : (
                                <div className="space-y-3">
                                  {(part.groups || []).map((group) => (
                                    <div key={group._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/10">
                                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                                            {group.tenNhom}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            file: {group.files?.length ?? 0} | câu: {group.questions?.length ?? 0}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => openCreateQuestion(part, group._id)}
                                            disabled={!testId}
                                            className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                          >
                                            Thêm câu
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => openEditGroup(group)}
                                            disabled={!testId}
                                            className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-yellow-400/90 hover:bg-yellow-400 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                          >
                                            Sửa nhóm
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => confirmDeleteGroup(group._id)}
                                            disabled={!testId}
                                            className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                          >
                                            Xóa
                                          </button>
                                        </div>
                                      </div>

                                      <div className="px-3 py-2 space-y-2">
                                        {(group.questions || []).length === 0 ? (
                                          <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có câu trong nhóm.</div>
                                        ) : (
                                          (group.questions || []).map((q) => (
                                            <div key={q._id} className="flex items-start justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-900/20">
                                              <div className="min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                  {q.thuTu}. {String(q.noiDung || "").length > 90 ? `${String(q.noiDung).slice(0, 90)}...` : q.noiDung}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => openEditQuestion(q)}
                                                  className="px-3 py-2 rounded-md text-sm font-semibold bg-yellow-400/90 hover:bg-yellow-400 text-white"
                                                >
                                                  Sửa
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => confirmDeleteQuestion(q._id)}
                                                  className="px-3 py-2 rounded-md text-sm font-semibold bg-red-500 hover:bg-red-600 text-white"
                                                >
                                                  Xóa
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900/10">
                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-white truncate">Không nhóm</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          câu: {(part.ungroupedQuestions || []).length}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openCreateQuestion(part, "")}
                                        disabled={!testId}
                                        className={`px-3 py-2 rounded-md text-sm font-semibold ${testId ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                      >
                                        Thêm câu
                                      </button>
                                    </div>
                                    <div className="px-3 py-2 space-y-2">
                                      {(part.ungroupedQuestions || []).length === 0 ? (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có câu không nhóm.</div>
                                      ) : (
                                        (part.ungroupedQuestions || []).map((q) => (
                                          <div key={q._id} className="flex items-start justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-900/20">
                                            <div className="min-w-0">
                                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {q.thuTu}. {String(q.noiDung || "").length > 90 ? `${String(q.noiDung).slice(0, 90)}...` : q.noiDung}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => openEditQuestion(q)}
                                                className="px-3 py-2 rounded-md text-sm font-semibold bg-yellow-400/90 hover:bg-yellow-400 text-white"
                                              >
                                                Sửa
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => confirmDeleteQuestion(q._id)}
                                                className="px-3 py-2 rounded-md text-sm font-semibold bg-red-500 hover:bg-red-600 text-white"
                                              >
                                                Xóa
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              V1: loại câu hỏi MCQ, nhập 4 lựa chọn và `dapAnDungIndex` (0-3).
            </div>
          </section>
        </div>
        <Modal
          isOpen={partModalOpen}
          title={partEditing ? "Chỉnh sửa part" : "Thêm part"}
          onClose={() => {
            setPartModalOpen(false);
            setPartEditing(null);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setPartModalOpen(false);
                  setPartEditing(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitPart} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên phần</label>
              <InputField
                type="text"
                value={partForm.tenPhan}
                onChange={(e) => setPartForm((p) => ({ ...p, tenPhan: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
              <InputField
                type="number"
                min={1}
                value={partForm.thuTu}
                onChange={(e) => setPartForm((p) => ({ ...p, thuTu: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={questionModalOpen}
          title={questionEditing ? "Chỉnh sửa câu hỏi MCQ" : "Thêm câu hỏi MCQ"}
          onClose={() => {
            setQuestionModalOpen(false);
            setQuestionEditing(null);
          }}
          maxWidthClassName="max-w-xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setQuestionModalOpen(false);
                  setQuestionEditing(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitQuestion} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
                <InputField
                  type="number"
                  min={1}
                  value={questionForm.thuTu}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, thuTu: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án đúng (0-3)</label>
                <InputField
                  type="number"
                  min={0}
                  max={3}
                  value={questionForm.dapAnDungIndex}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, dapAnDungIndex: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm câu hỏi</label>
              <InputField
                type="select"
                value={questionForm.deThiMauPhanNhomID}
                onChange={(e) => setQuestionForm((p) => ({ ...p, deThiMauPhanNhomID: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                options={groupSelectOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung câu hỏi</label>
              <InputField
                type="textarea"
                rows={4}
                value={questionForm.noiDung}
                onChange={(e) => setQuestionForm((p) => ({ ...p, noiDung: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Lựa chọn (4 đáp án)</div>
              {["A", "B", "C", "D"].map((label, idx) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                  <InputField
                    type="text"
                    value={questionForm.luaChon[idx] || ""}
                    onChange={(e) => {
                      const next = [...(questionForm.luaChon || ["", "", "", ""])];
                      next[idx] = e.target.value;
                      setQuestionForm((p) => ({ ...p, luaChon: next }));
                    }}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giải thích (optional)</label>
              <InputField
                type="textarea"
                rows={3}
                value={questionForm.giaiThich}
                onChange={(e) => setQuestionForm((p) => ({ ...p, giaiThich: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tệp đính kèm (optional)</label>
              <input
                type="file"
                multiple
                onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  const uploaded = await uploadFiles(e.target.files);
                  if (!uploaded.length) return;
                  setQuestionFiles((prev) => {
                    const map = new Map((prev || []).map((f) => [String(f?._id), f]));
                    uploaded.forEach((f) => {
                      if (!f?._id) return;
                      map.set(String(f._id), f);
                    });
                    return Array.from(map.values());
                  });
                  e.target.value = "";
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-300"
              />
              {questionFiles?.length ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/60">
                    Đã đính kèm ({questionFiles.length})
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {questionFiles.map((f) => (
                      <li key={String(f?._id)} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {f?.originalName || f?.url || f?._id}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestionFiles((prev) => (prev || []).filter((x) => String(x?._id) !== String(f?._id)))}
                          className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                        >
                          Gỡ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Chưa có file nào.</p>
              )}
            </div>
          </div>
        </Modal>

        {/* Group modal */}
        <Modal
          isOpen={groupModalOpen}
          title={groupEditing ? "Chỉnh sửa nhóm" : "Thêm nhóm"}
          maxWidthClassName="max-w-xl"
          onClose={() => {
            setGroupModalOpen(false);
            setGroupEditing(null);
            setGroupFiles([]);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setGroupModalOpen(false);
                  setGroupEditing(null);
                  setGroupFiles([]);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitGroup} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhóm</label>
              <InputField
                type="text"
                value={groupForm.tenNhom}
                onChange={(e) => setGroupForm((p) => ({ ...p, tenNhom: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
              <InputField
                type="number"
                min={1}
                value={groupForm.thuTu}
                onChange={(e) => setGroupForm((p) => ({ ...p, thuTu: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload file cho nhóm (optional)</label>
              <input
                type="file"
                multiple
                onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  const uploaded = await uploadFiles(e.target.files);
                  if (!uploaded.length) return;
                  setGroupFiles((prev) => {
                    const map = new Map((prev || []).map((f) => [String(f?._id), f]));
                    uploaded.forEach((f) => {
                      if (!f?._id) return;
                      map.set(String(f._id), f);
                    });
                    return Array.from(map.values());
                  });
                  e.target.value = "";
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-300"
              />

              {groupFiles?.length ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/60">
                    Đã đính kèm ({groupFiles.length})
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {groupFiles.map((f) => (
                      <li key={String(f?._id)} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {f?.originalName || f?.url || f?._id}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGroupFiles((prev) => (prev || []).filter((x) => String(x?._id) !== String(f?._id)))}
                          className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                        >
                          Gỡ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Chưa có file nào.</p>
              )}
            </div>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={confirmDeleteGroupOpen}
          title="Xác nhận xóa nhóm"
          message="Xóa nhóm này? Nếu nhóm còn câu hỏi, hệ thống sẽ chặn."
          onConfirm={deleteGroup}
          onCancel={() => {
            setConfirmDeleteGroupOpen(false);
            setDeleteGroupId(null);
          }}
          confirmText="Xóa"
        />

        <ConfirmModal
          isOpen={confirmDeletePartOpen}
          title="Xác nhận xóa phần"
          message="Xóa phần này? Hệ thống sẽ chặn nếu xóa làm đề không còn câu hỏi."
          onConfirm={deletePart}
          onCancel={() => {
            setConfirmDeletePartOpen(false);
            setDeletePartId(null);
          }}
          confirmText="Xóa"
        />

        <ConfirmModal
          isOpen={confirmDeleteQuestionOpen}
          title="Xác nhận xóa câu hỏi"
          message="Xóa câu hỏi này? Hệ thống sẽ chặn nếu xóa làm đề không còn câu hỏi."
          onConfirm={deleteQuestion}
          onCancel={() => {
            setConfirmDeleteQuestionOpen(false);
            setDeleteQuestionId(null);
          }}
          confirmText="Xóa"
        />
      </div>
    </div>
  );
}

export default function SampleTestsPage() {
  const { token } = useAuth();
  const notify = useNotification();

  const [courseTypes, setCourseTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterChungChi, setFilterChungChi] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  const [mode, setMode] = useState("list"); // list | create | edit
  const [activeTestId, setActiveTestId] = useState(null);
  const [activeTest, setActiveTest] = useState(null);

  // delete modal
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_COURSE_TYPES = `${API_BASE}/api/course-types`;
  const API_COURSES = `${API_BASE}/api/admin/courses`;
  const API_SAMPLE_TESTS = `${API_BASE}/api/admin/sample-tests`;
  const FILE_UPLOAD_API_URL = `${API_BASE}/api/admin/files/upload`;

  const chungChiOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả" },
      { value: "TOEIC", label: "TOEIC" },
      { value: "IELTS", label: "IELTS" },
    ],
    []
  );

  const fetchAll = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [ctRes, coursesRes, testsRes] = await Promise.all([
        fetch(API_COURSE_TYPES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_COURSES, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_SAMPLE_TESTS}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [ctJson, coursesJson, testsJson] = await Promise.all([ctRes.json(), coursesRes.json(), testsRes.json()]);

      if (!ctRes.ok || !ctJson.success) throw new Error(ctJson.message || "Không tải được course types.");
      if (!coursesRes.ok || !coursesJson.success && coursesJson.success !== undefined) {
        // một số endpoint không trả success; admin/courses có success true
      }
      if (!testsRes.ok || !testsJson.success) throw new Error(testsJson.message || "Không tải được đề thi mẫu.");

      setCourseTypes(Array.isArray(ctJson.data) ? ctJson.data : []);
      setCourses(Array.isArray(coursesJson.data) ? coursesJson.data : []);
      setTests(Array.isArray(testsJson.data) ? testsJson.data : []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const cc = String(t.chungChi || "").trim().toUpperCase();
      const matchesCC = filterChungChi === "all" || cc === filterChungChi;
      const matchesQ = !searchQ.trim() ? true : String(t.tenDe || "").toLowerCase().includes(searchQ.trim().toLowerCase()) || String(t.moTa || "").toLowerCase().includes(searchQ.trim().toLowerCase());
      return matchesCC && matchesQ;
    });
  }, [tests, filterChungChi, searchQ]);

  const refreshTests = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (filterChungChi !== "all") params.set("chungChi", filterChungChi);
      if (searchQ.trim()) params.set("q", searchQ.trim());

      const res = await fetch(`${API_SAMPLE_TESTS}${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được danh sách đề.");
      setTests(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi tải danh sách.");
    }
  };

  useEffect(() => {
    // refresh list only when leaving edit/create
    if (mode === "list") refreshTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filterChungChi, searchQ]);

  const openCreate = () => {
    setActiveTestId(null);
    setActiveTest({
      tenDe: "",
      khoaHocID: "",
      chungChi: "TOEIC",
      capDo: "easy",
      thoiGianLamBai: 60,
      moTa: "",
      parts: [],
    });
    setMode("create");
  };

  const openEdit = (id) => {
    setActiveTestId(id);
    setActiveTest(null);
    setMode("edit");
  };

  useEffect(() => {
    if (!token) return;
    if (mode !== "edit" || !activeTestId) return;
    const run = async () => {
      try {
        const res = await fetch(`${API_SAMPLE_TESTS}/${activeTestId}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không tải được chi tiết đề.");
        setActiveTest(json.data);
      } catch (e) {
        console.error(e);
        notify.error(e?.message || "Lỗi tải chi tiết.");
      }
    };
    run();
  }, [mode, activeTestId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDelete = (id) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !deleteId) return;
    try {
      const res = await fetch(`${API_SAMPLE_TESTS}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa.");
      notify.success("Đã xóa đề thi mẫu.");
      setConfirmDeleteOpen(false);
      setDeleteId(null);
      setMode("list");
      refreshTests();
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa.");
    }
  };

  if (mode === "list") {
    return (
      <div className="p-4 md:p-6 min-h-full">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý đề thi mẫu</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tạo/sửa/xóa đề TOEIC/IELTS và quản lý phần/câu hỏi</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              <FiPlus />
              Thêm đề
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="relative w-full lg:w-1/2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <InputField
                type="text"
                name="q"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm theo tên/mô tả..."
                inputClassName="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 w-full lg:w-auto">
              <InputField
                type="select"
                name="chungChi"
                value={filterChungChi}
                onChange={(e) => setFilterChungChi(e.target.value)}
                options={chungChiOptions}
                inputClassName="border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Tên đề</th>
                    <th className="px-6 py-3">Chứng chỉ</th>
                    <th className="px-6 py-3">Cấp độ</th>
                    <th className="px-6 py-3">Thời gian</th>
                    <th className="px-6 py-3">Câu hỏi</th>
                    <th className="px-6 py-3">Ngày tạo</th>
                    <th className="px-6 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 dark:text-gray-400">Đang tải...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-red-500 dark:text-red-400">{error}</td>
                    </tr>
                  ) : filteredTests.length ? (
                    filteredTests.map((t) => (
                      <tr key={t._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/40">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{t.tenDe}</td>
                        <td className="px-6 py-4">{String(t.chungChi || "").toUpperCase()}</td>
                        <td className="px-6 py-4">{t.capDo}</td>
                        <td className="px-6 py-4">{t.thoiGianLamBai} phút</td>
                        <td className="px-6 py-4">{t.questionCount ?? 0}</td>
                        <td className="px-6 py-4">{t.createdAt ? formatDateDdMmYyyy(t.createdAt) : "—"}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(t._id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-yellow-400/90 hover:bg-yellow-400 text-white"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(t._id)}
                            className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-500 hover:bg-red-600 text-white"
                            title="Xóa"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 dark:text-gray-400">Không có đề thi mẫu phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ConfirmModal
            isOpen={confirmDeleteOpen}
            title="Xác nhận xóa"
            message="Bạn có chắc muốn xóa đề thi mẫu này không?"
            onConfirm={confirmDelete}
            onCancel={() => {
              setConfirmDeleteOpen(false);
              setDeleteId(null);
            }}
            confirmText="Xóa"
          />
        </div>
      </div>
    );
  }

  if (!activeTest) {
    return (
      <div className="p-4 md:p-6 min-h-full">
        <div className="text-center text-gray-600">Đang tải chi tiết...</div>
      </div>
    );
  }
  return (
    <SampleTestEditor
      token={token}
      notify={notify}
      mode={mode}
      activeTestId={activeTestId}
      activeTest={activeTest}
      courses={courses}
      courseTypes={courseTypes}
      API_SAMPLE_TESTS={API_SAMPLE_TESTS}
      FILE_UPLOAD_API_URL={FILE_UPLOAD_API_URL}
      onBack={() => {
        setMode("list");
        setActiveTestId(null);
        setActiveTest(null);
        refreshTests();
      }}
    />
  );
}

