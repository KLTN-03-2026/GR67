"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import ConfirmModal from "../../components/ConfirmModal";
import InputField from "../../components/InputField";
import { FiPlus, FiSearch, FiTrash2, FiEdit2 } from "react-icons/fi";
import { formatDateDdMmYyyy } from "../../../lib/dateFormat";
import AdminPageTitle from "../components/AdminPageTitle";
import AdminCard from "../components/AdminCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Bài hỗn hợp: mỗi item chọn quiz / multi / TF / short — không flashcard */
const MIXED_NO_FLASHCARD = "mixedNoFlashcard";
const MIXED_ITEM_TYPE_OPTIONS = [
  { value: "quiz", label: "Quiz (một đáp án)" },
  { value: "multiSelect", label: "Chọn nhiều" },
  { value: "trueFalse", label: "Đúng / Sai" },
  { value: "shortAnswer", label: "Trả lời ngắn" },
];

function effectiveItemLoai(localEx, itemForm) {
  return localEx.loaiBai === MIXED_NO_FLASHCARD ? itemForm.loaiItem : localEx.loaiBai;
}

function Modal({ isOpen, title, onClose, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b dark:border-gray-700 flex items-start justify-between gap-4 flex-shrink-0">
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
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer ? (
          <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseNumberArrayFromCSV(s) {
  const raw = String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const nums = raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  return nums;
}

function PracticeExerciseEditor({
  token,
  notify,
  mode,
  activeExerciseId,
  activeExercise,
  courses,
  loaiBaiOptions,
  API_EXERCISES,
  onBack,
}) {
  const [exerciseId, setExerciseId] = useState(mode === "edit" ? activeExerciseId : null);
  const [localEx, setLocalEx] = useState(activeExercise);

  useEffect(() => {
    setLocalEx(activeExercise);
    if (mode === "edit") setExerciseId(activeExerciseId);
  }, [activeExercise, activeExerciseId, mode]);

  const isCreate = mode === "create";

  const refreshExercise = async (id) => {
    try {
      const res = await fetch(`${API_EXERCISES}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được chi tiết bài.");
      setLocalEx(json.data);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi tải lại.");
    }
  };

  const saveExerciseMeta = async () => {
    try {
      const payload = {
        tenBai: localEx.tenBai,
        loaiBai: localEx.loaiBai,
        thoiGianLamBai: Number(localEx.thoiGianLamBai || 0),
        moTa: localEx.moTa,
      };

      if (localEx.khoaHocID) {
        payload.khoaHocID = localEx.khoaHocID;
      }
      if (!payload.tenBai?.trim()) return notify.warning("Nhập tên bài.");
      if (!payload.loaiBai) return notify.warning("Chọn loại bài.");

      if (isCreate && !exerciseId) {
        const res = await fetch(`${API_EXERCISES}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo bài luyện tập.");
        const createdId = json.data?._id;
        if (!createdId) throw new Error("Không nhận được id sau khi tạo bài.");
        setExerciseId(createdId);
        notify.success("Tạo bài thành công.");
        await refreshExercise(createdId);
      } else {
        if (!exerciseId) return notify.warning("Chưa có id bài.");
        const res = await fetch(`${API_EXERCISES}/${exerciseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật bài.");
        notify.success("Cập nhật metadata thành công.");
        await refreshExercise(exerciseId);
      }
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu bài.");
    }
  };

  // Item modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemEditing, setItemEditing] = useState(null);
  const [itemForm, setItemForm] = useState({
    thuTu: 1,
    loaiItem: "quiz",
    noiDung: "",
    matTruoc: "",
    matSau: "",
    luaChon: ["", "", "", ""],
    dapAnDungIndex: 0,
    dapAnDungIndicesCSV: "0,1",
    dapAnDungBoolean: true,
    dapAnDungText: "",
  });

  const openCreateItem = () => {
    const nextThuTu = (localEx.items || []).reduce((m, it) => Math.max(m, Number(it.thuTu || 0)), 0) + 1;
    setItemEditing(null);
    setItemForm({
      thuTu: nextThuTu,
      loaiItem: localEx.loaiBai === MIXED_NO_FLASHCARD ? "quiz" : localEx.loaiBai,
      noiDung: "",
      matTruoc: "",
      matSau: "",
      luaChon: ["", "", "", ""],
      dapAnDungIndex: 0,
      dapAnDungIndicesCSV: "0",
      dapAnDungBoolean: true,
      dapAnDungText: "",
    });
    setItemModalOpen(true);
  };

  const openEditItem = (it) => {
    setItemEditing(it);
    setItemForm({
      thuTu: Number(it.thuTu || 1),
      loaiItem: it.loaiItem || localEx.loaiBai || "quiz",
      noiDung: it.noiDung || "",
      matTruoc: it.matTruoc || "",
      matSau: it.matSau || "",
      luaChon: Array.isArray(it.luaChon) ? [...it.luaChon] : ["", "", "", ""],
      dapAnDungIndex: Number(it.dapAnDungIndex ?? 0),
      dapAnDungIndicesCSV: Array.isArray(it.dapAnDungIndices) ? it.dapAnDungIndices.join(",") : "0",
      dapAnDungBoolean: it.dapAnDungBoolean === false ? false : true,
      dapAnDungText: it.dapAnDungText || "",
    });
    setItemModalOpen(true);
  };

  const [confirmDeleteItemOpen, setConfirmDeleteItemOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const submitItem = async () => {
    try {
      if (!exerciseId) return notify.warning("Hãy lưu metadata trước để tạo item.");
      const loaiBai = localEx.loaiBai;
      if (!loaiBai) return notify.warning("Thiếu loaiBai.");

      const itemLoai = effectiveItemLoai(localEx, itemForm);
      if (localEx.loaiBai === MIXED_NO_FLASHCARD) {
        if (!MIXED_ITEM_TYPE_OPTIONS.some((o) => o.value === itemLoai)) return notify.warning("Chọn loại câu cho item (quiz / multi / TF / short).");
      }

      const basePayload = {
        loaiItem: itemLoai,
        thuTu: Number(itemForm.thuTu),
        noiDung: String(itemForm.noiDung || ""),
      };

      let payload = { ...basePayload };
      if (itemLoai === "flashcard") {
        payload = { ...payload, matTruoc: String(itemForm.matTruoc || "").trim(), matSau: String(itemForm.matSau || "").trim() };
      } else if (itemLoai === "quiz") {
        payload = {
          ...payload,
          luaChon: (itemForm.luaChon || []).map((x) => String(x || "").trim()),
          dapAnDungIndex: Number(itemForm.dapAnDungIndex),
        };
      } else if (itemLoai === "multiSelect") {
        payload = {
          ...payload,
          luaChon: (itemForm.luaChon || []).map((x) => String(x || "").trim()),
          dapAnDungIndices: parseNumberArrayFromCSV(itemForm.dapAnDungIndicesCSV),
        };
      } else if (itemLoai === "trueFalse") {
        payload = { ...payload, dapAnDungBoolean: itemForm.dapAnDungBoolean === true };
      } else if (itemLoai === "shortAnswer") {
        payload = { ...payload, dapAnDungText: String(itemForm.dapAnDungText || "").trim() };
      }

      if (!payload.thuTu || payload.thuTu < 1) return notify.warning("ThuTu không hợp lệ.");

      if (!itemEditing) {
        const res = await fetch(`${API_EXERCISES}/${exerciseId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể tạo item.");
        notify.success("Tạo item thành công.");
      } else {
        const res = await fetch(`${API_EXERCISES}/${exerciseId}/items/${itemEditing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Không thể cập nhật item.");
        notify.success("Cập nhật item thành công.");
      }

      setItemModalOpen(false);
      setItemEditing(null);
      await refreshExercise(exerciseId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi lưu item.");
    }
  };

  const confirmDeleteItem = (id) => {
    setDeleteItemId(id);
    setConfirmDeleteItemOpen(true);
  };

  const deleteItem = async () => {
    try {
      if (!exerciseId || !deleteItemId) return;
      const res = await fetch(`${API_EXERCISES}/${exerciseId}/items/${deleteItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa item.");
      notify.success("Đã xóa item.");
      setConfirmDeleteItemOpen(false);
      setDeleteItemId(null);
      await refreshExercise(exerciseId);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa item.");
    }
  };

  const renderItemPreview = (it) => {
    const t = it.loaiItem || localEx.loaiBai;
    const prefix = localEx.loaiBai === MIXED_NO_FLASHCARD && t ? `[${t}] ` : "";
    if (t === "flashcard") {
      return `${prefix}${it.matTruoc ? `Flashcard: ${it.matTruoc}` : "Flashcard"}`;
    }
    if (t === "quiz") {
      return `${prefix}${it.noiDung ? `Quiz: ${it.noiDung}` : "Quiz"}`;
    }
    if (t === "multiSelect") {
      return `${prefix}${it.noiDung ? `MultiSelect: ${it.noiDung}` : "MultiSelect"}`;
    }
    if (t === "trueFalse") {
      return `${prefix}${it.noiDung ? `True/False: ${it.noiDung}` : "True/False"}`;
    }
    if (t === "shortAnswer") {
      return `${prefix}${it.noiDung ? `ShortAnswer: ${it.noiDung}` : "ShortAnswer"}`;
    }
    return prefix ? `${prefix}Item` : "Item";
  };

  const itemModalLoai = effectiveItemLoai(localEx, itemForm);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="admin-card flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="admin-page-title">{isCreate ? "Tạo bài luyện tập" : "Chỉnh sửa bài luyện tập"}</h1>
            <p className="admin-page-subtitle !mt-1">
              Quản lý item theo loại bài; bài <strong className="font-medium">hỗn hợp</strong> cho phép từng câu là quiz / multi / TF / short (không flashcard).
            </p>
          </div>
          <button type="button" onClick={onBack} className="admin-btn-outline h-fit shrink-0">
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-5">
            <AdminCard className="overflow-hidden p-0">
              <div className="admin-card-head">Thông tin bài</div>
              <form
                className="px-5 py-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveExerciseMeta();
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên bài</label>
                  <InputField
                    type="text"
                    value={localEx.tenBai}
                    onChange={(e) => setLocalEx((p) => ({ ...p, tenBai: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Flashcard từ vựng Unit 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại bài</label>
                  <InputField
                    type="select"
                    value={localEx.loaiBai}
                    onChange={(e) => setLocalEx((p) => ({ ...p, loaiBai: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={loaiBaiOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Khóa học (bỏ trống = dùng cho tất cả)
                  </label>
                  <InputField
                    type="select"
                    value={localEx.khoaHocID || ""}
                    onChange={(e) => setLocalEx((p) => ({ ...p, khoaHocID: e.target.value || "" }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={[
                      { value: "", label: "Dùng cho tất cả khóa học" },
                      ...(courses || []).map((c) => ({
                        value: String(c._id),
                        label: c.tenkhoahoc || "Khóa học",
                      })),
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian (phút)</label>
                    <InputField
                      type="number"
                      min={0}
                      value={localEx.thoiGianLamBai}
                      onChange={(e) => setLocalEx((p) => ({ ...p, thoiGianLamBai: e.target.value }))}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="hidden" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                  <InputField
                    type="textarea"
                    rows={4}
                    value={localEx.moTa}
                    onChange={(e) => setLocalEx((p) => ({ ...p, moTa: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="submit" className="admin-btn-accent">
                    {isCreate ? "Lưu & tạo bài" : "Lưu metadata"}
                  </button>
                </div>
              </form>
            </AdminCard>
          </section>

          <section className="space-y-6 lg:col-span-7">
            <AdminCard className="overflow-hidden p-0">
              <div className="admin-card-head flex flex-wrap items-center justify-between gap-4">
                <span>Danh sách item</span>
                <button
                  type="button"
                  onClick={() => (localEx.loaiBai ? openCreateItem() : null)}
                  disabled={!exerciseId}
                  className={`inline-flex items-center gap-2 rounded-md text-sm font-semibold ${exerciseId ? "admin-btn-accent-sm admin-btn-accent" : "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
                >
                  <FiPlus className="shrink-0" />
                  Thêm item
                </button>
              </div>

              <div className="px-5 py-4">
                {(localEx.items || []).length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có item. Hãy thêm item cho bài.</div>
                ) : (
                  <div className="space-y-2">
                    {(localEx.items || []).map((it) => (
                      <div key={it._id} className="flex items-start justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-900/20">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {it.thuTu}. {renderItemPreview(it)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            id: {String(it._id).slice(0, 6)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditItem(it)}
                            className="px-3 py-2 rounded-md text-sm font-semibold bg-yellow-400/90 hover:bg-yellow-400 text-white"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteItem(it._id)}
                            className="px-3 py-2 rounded-md text-sm font-semibold bg-red-500 hover:bg-red-600 text-white"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AdminCard>
          </section>
        </div>

        <Modal
          isOpen={itemModalOpen}
          title={itemEditing ? "Chỉnh sửa item" : "Thêm item"}
          onClose={() => {
            setItemModalOpen(false);
            setItemEditing(null);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setItemModalOpen(false);
                  setItemEditing(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button type="button" onClick={submitItem} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
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
                  value={itemForm.thuTu}
                  onChange={(e) => setItemForm((p) => ({ ...p, thuTu: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="hidden" />
            </div>

            {localEx.loaiBai === MIXED_NO_FLASHCARD ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại câu (trong bài hỗn hợp)</label>
                <InputField
                  type="select"
                  value={itemForm.loaiItem}
                  onChange={(e) => setItemForm((p) => ({ ...p, loaiItem: e.target.value }))}
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  options={MIXED_ITEM_TYPE_OPTIONS}
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung (dùng cho quiz/multi/TF/short)</label>
              <InputField
                type="textarea"
                rows={3}
                value={itemForm.noiDung}
                onChange={(e) => setItemForm((p) => ({ ...p, noiDung: e.target.value }))}
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {itemModalLoai === "flashcard" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mặt trước</label>
                  <InputField
                    type="textarea"
                    rows={2}
                    value={itemForm.matTruoc}
                    onChange={(e) => setItemForm((p) => ({ ...p, matTruoc: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mặt sau</label>
                  <InputField
                    type="textarea"
                    rows={2}
                    value={itemForm.matSau}
                    onChange={(e) => setItemForm((p) => ({ ...p, matSau: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : null}

            {itemModalLoai === "quiz" ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">4 lựa chọn</div>
                {["A", "B", "C", "D"].map((label, idx) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <InputField
                      type="text"
                      value={itemForm.luaChon[idx] || ""}
                      onChange={(e) => {
                        const next = [...(itemForm.luaChon || ["", "", "", ""])];
                        next[idx] = e.target.value;
                        setItemForm((p) => ({ ...p, luaChon: next }));
                      }}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án đúng (0-3)</label>
                  <InputField
                    type="number"
                    min={0}
                    max={3}
                    value={itemForm.dapAnDungIndex}
                    onChange={(e) => setItemForm((p) => ({ ...p, dapAnDungIndex: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : null}

            {itemModalLoai === "multiSelect" ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">4 lựa chọn</div>
                {["A", "B", "C", "D"].map((label, idx) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <InputField
                      type="text"
                      value={itemForm.luaChon[idx] || ""}
                      onChange={(e) => {
                        const next = [...(itemForm.luaChon || ["", "", "", ""])];
                        next[idx] = e.target.value;
                        setItemForm((p) => ({ ...p, luaChon: next }));
                      }}
                      inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án đúng (CSV chỉ số 0-3, ví dụ: `0,2`)</label>
                  <InputField
                    type="text"
                    value={itemForm.dapAnDungIndicesCSV}
                    onChange={(e) => setItemForm((p) => ({ ...p, dapAnDungIndicesCSV: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : null}

            {itemModalLoai === "trueFalse" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án đúng</label>
                  <InputField
                    type="select"
                    value={itemForm.dapAnDungBoolean ? "true" : "false"}
                    onChange={(e) => setItemForm((p) => ({ ...p, dapAnDungBoolean: e.target.value === "true" }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    options={[
                      { value: "true", label: "True" },
                      { value: "false", label: "False" },
                    ]}
                  />
                </div>
              </div>
            ) : null}

            {itemModalLoai === "shortAnswer" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đáp án mẫu</label>
                  <InputField
                    type="textarea"
                    rows={3}
                    value={itemForm.dapAnDungText}
                    onChange={(e) => setItemForm((p) => ({ ...p, dapAnDungText: e.target.value }))}
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Modal>

        <ConfirmModal
          isOpen={confirmDeleteItemOpen}
          title="Xác nhận xóa item"
          message="Xóa item này? Hệ thống sẽ chặn nếu xóa làm bài không còn item."
          onConfirm={deleteItem}
          onCancel={() => {
            setConfirmDeleteItemOpen(false);
            setDeleteItemId(null);
          }}
          confirmText="Xóa"
        />
    </div>
  );
}

export default function PracticeExercisesPage() {
  const { token } = useAuth();
  const notify = useNotification();

  const API_EXERCISES = `${API_BASE}/api/admin/practice-exercises`;
  const API_COURSES = `${API_BASE}/api/admin/courses`;

  const [courses, setCourses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterLoaiBai, setFilterLoaiBai] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  const [mode, setMode] = useState("list");
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loaiBaiOptions = useMemo(
    () => [
      { value: "flashcard", label: "Flashcard" },
      { value: "quiz", label: "Quiz (một đáp án)" },
      { value: "trueFalse", label: "Đúng / Sai" },
      { value: "shortAnswer", label: "Trả lời ngắn" },
      { value: "multiSelect", label: "Chọn nhiều" },
      { value: MIXED_NO_FLASHCARD, label: "Hỗn hợp (không flashcard)" },
    ],
    []
  );

  const loaiBaiLabel = (v) => loaiBaiOptions.find((o) => o.value === v)?.label || v;

  const fetchCourses = async () => {
    const res = await fetch(API_COURSES, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || "Không tải được khóa học.");
    setCourses(Array.isArray(json.data) ? json.data : []);
  };

  const refreshList = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterLoaiBai !== "all") params.set("loaiBai", filterLoaiBai);
      if (searchQ.trim()) params.set("q", searchQ.trim());

      const res = await fetch(`${API_EXERCISES}${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được danh sách.");
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      try {
        await Promise.all([fetchCourses(), refreshList()]);
      } catch (e) {
        console.error(e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (mode !== "list") return;
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLoaiBai, searchQ, mode]);

  const openCreate = () => {
    setActiveExerciseId(null);
    setActiveExercise({
      tenBai: "",
      khoaHocID: "",
      loaiBai: "flashcard",
      thoiGianLamBai: 10,
      moTa: "",
      items: [],
    });
    setMode("create");
  };

  const openEdit = async (id) => {
    setActiveExerciseId(id);
    setActiveExercise(null);
    setMode("edit");
    try {
      const res = await fetch(`${API_EXERCISES}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được chi tiết.");
      setActiveExercise(json.data);
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi tải chi tiết.");
    }
  };

  const onBack = () => {
    setMode("list");
    setActiveExerciseId(null);
    setActiveExercise(null);
    refreshList();
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !deleteId) return;
    try {
      const res = await fetch(`${API_EXERCISES}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Không thể xóa.");
      notify.success("Đã xóa bài luyện tập.");
      setConfirmDeleteOpen(false);
      setDeleteId(null);
      onBack();
    } catch (e) {
      console.error(e);
      notify.error(e?.message || "Lỗi xóa.");
    }
  };

  if (mode === "list") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <AdminPageTitle
              className="mb-0 flex-1"
              title="Quản lý luyện tập"
              subtitle="CRUD bài luyện tập và item; loại hỗn hợp (không flashcard): mỗi câu chọn quiz, chọn nhiều, đúng/sai hoặc trả lời ngắn."
            />
            <button type="button" onClick={openCreate} className="admin-btn-accent h-fit shrink-0 self-start sm:self-center">
              <FiPlus className="shrink-0" />
              Thêm bài
            </button>
          </div>

          <AdminCard className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-1/2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <InputField
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm theo tên/mô tả..."
                inputClassName="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 w-full lg:w-auto">
              <InputField
                type="select"
                value={filterLoaiBai}
                onChange={(e) => setFilterLoaiBai(e.target.value)}
                options={[{ value: "all", label: "Tất cả" }, ...loaiBaiOptions]}
                inputClassName="border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Tên bài</th>
                    <th className="px-6 py-3">Loại</th>
                    <th className="px-6 py-3">Thời gian</th>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">Ngày tạo</th>
                    <th className="px-6 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 dark:text-gray-400">Đang tải...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-red-500 dark:text-red-400">{error}</td>
                    </tr>
                  ) : items.length ? (
                    items.map((it) => (
                      <tr key={it._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/40">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{it.tenBai}</td>
                        <td className="px-6 py-4">{loaiBaiLabel(it.loaiBai)}</td>
                        <td className="px-6 py-4">{it.thoiGianLamBai || 0} phút</td>
                        <td className="px-6 py-4">{it.itemCount ?? 0}</td>
                        <td className="px-6 py-4">{it.createdAt ? formatDateDdMmYyyy(it.createdAt) : "—"}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(it._id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-yellow-400/90 hover:bg-yellow-400 text-white"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(it._id)}
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
                      <td colSpan="6" className="text-center py-8 dark:text-gray-400">Không có bài luyện tập.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AdminCard>

          <ConfirmModal
            isOpen={confirmDeleteOpen}
            title="Xác nhận xóa"
            message="Bạn có chắc muốn xóa bài luyện tập này không?"
            onConfirm={confirmDelete}
            onCancel={() => {
              setConfirmDeleteOpen(false);
              setDeleteId(null);
            }}
            confirmText="Xóa"
          />
      </div>
    );
  }

  if (!activeExercise) {
    return (
      <div className="p-4 md:p-6 min-h-full">
        <div className="text-center text-gray-600">Đang tải chi tiết...</div>
      </div>
    );
  }

  return (
    <PracticeExerciseEditor
      token={token}
      notify={notify}
      mode={mode}
      activeExerciseId={activeExerciseId}
      activeExercise={activeExercise}
      courses={courses}
      loaiBaiOptions={loaiBaiOptions}
      API_EXERCISES={API_EXERCISES}
      onBack={onBack}
    />
  );
}

