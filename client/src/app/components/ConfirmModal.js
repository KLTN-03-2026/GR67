"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Shared ConfirmModal component using Portals to ensure it renders above everything.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  type = "danger", // 'danger' | 'warning' | 'info'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const confirmBtnClass = type === "danger" 
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
    : type === "warning" 
    ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400" 
    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-4 transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="px-6 py-6 flex-1">
          <h3 
            id="confirm-title"
            className="text-xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
