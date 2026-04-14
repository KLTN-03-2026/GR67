"use client";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Có",
  cancelText = "Không",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
      <div className="w-full max-w-md max-h-[min(90vh,40rem)] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
