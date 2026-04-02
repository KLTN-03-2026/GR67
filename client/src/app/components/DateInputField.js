"use client";

import { useRef } from "react";
import { formatDateDdMmYyyy } from "../../lib/dateFormat";

function CalendarIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5m-18 0h18"
      />
    </svg>
  );
}

const ROW_MIN = "min-h-[2.75rem]";

/**
 * Visible dd/mm/yyyy (read-only text) + calendar button. Value/onChange stay yyyy-mm-dd.
 * Hidden native date input is off-screen; avoids browser mm/dd placeholder and evens out row height.
 */
export default function DateInputField({
  value,
  onChange,
  className = "",
  inputClassName = "",
  disabled = false,
  required = false,
  title,
  name,
  id,
}) {
  const hiddenRef = useRef(null);

  const displayText = value ? formatDateDdMmYyyy(value, { empty: "" }) : "";

  const openPicker = () => {
    const el = hiddenRef.current;
    if (!el || disabled) return;
    try {
      if (typeof el.showPicker === "function") el.showPicker();
      else el.click();
    } catch {
      el.click();
    }
  };

  return (
    <div
      className={`relative box-border flex min-h-0 items-stretch !p-0 overflow-hidden rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900 ${ROW_MIN} ${className}`.trim()}
    >
      <input
        type="text"
        inputMode="none"
        id={id}
        readOnly
        tabIndex={disabled ? -1 : 0}
        value={displayText}
        placeholder="dd/mm/yyyy"
        disabled={disabled}
        title={title}
        aria-required={required}
        aria-haspopup="dialog"
        autoComplete="off"
        spellCheck={false}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        className={`min-h-0 min-w-0 flex-1 self-stretch cursor-pointer border-0 bg-transparent px-3 py-2.5 text-[15px] leading-snug text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-500 ${inputClassName}`.trim()}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          openPicker();
        }}
        disabled={disabled}
        className={`flex w-11 shrink-0 items-center justify-center self-stretch border-l border-gray-300 bg-gray-50 px-0 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`}
        aria-label="Mở lịch chọn ngày"
        title={title || "Chọn ngày"}
      >
        <CalendarIcon className="h-5 w-5 shrink-0" />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        className="date-input-field pointer-events-none fixed top-0 left-[-9999px] h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
      />
    </div>
  );
}
