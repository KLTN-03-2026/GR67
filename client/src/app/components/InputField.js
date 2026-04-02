"use client";

import DateInputField from "./DateInputField";


const DEFAULT_INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 placeholder:text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed";

const DEFAULT_LABEL_CLASS = "text-sm font-semibold text-gray-800 dark:text-gray-200";

const DEFAULT_DATE_WRAPPER_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-900 placeholder:text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed";

export default function InputField({
  type = "text",
  label,
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  required = false,
  placeholder,
  rows = 5,
  inputClassName,
  labelClassName,
  containerClassName,
  error,
  id,
  ...rest
}) {
  const emit = (nextValue) => {
    if (!onChange) return;
    onChange({ target: { name, value: nextValue } });
  };

  if (type === "date") {
    const wrapperClassName = (inputClassName || DEFAULT_DATE_WRAPPER_CLASS).replaceAll("focus:", "focus-within:");

    let normalizedInnerInputClassName = rest.inputClassName
      ? rest.inputClassName
      : "date-input-field min-w-0 flex-1 px-0 py-0 text-sm outline-none border-0 bg-transparent disabled:opacity-70 dark:bg-transparent dark:text-gray-100 placeholder:text-gray-400";

    if (!normalizedInnerInputClassName.includes("date-input-field")) {
      normalizedInnerInputClassName = `date-input-field ${normalizedInnerInputClassName}`;
    }
    if (!normalizedInnerInputClassName.includes("input-date-icon")) {
      normalizedInnerInputClassName = `input-date-icon ${normalizedInnerInputClassName}`;
    }

    return (
      <div className={containerClassName}>
        {label ? <label className={labelClassName || DEFAULT_LABEL_CLASS}>{label}</label> : null}
        <div className={label ? "mt-1" : undefined}>
          <DateInputField
            id={id}
            name={name}
            value={value}
            onChange={(e) => emit(e?.target?.value ?? "")}
            disabled={disabled}
            required={required}
            className={wrapperClassName}
            inputClassName={normalizedInnerInputClassName}
            placeholder={placeholder}
          />
        </div>
        {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className={containerClassName}>
        {label ? <label className={labelClassName || DEFAULT_LABEL_CLASS}>{label}</label> : null}
        <select
          id={id}
          name={name}
          value={value ?? ""}
          onChange={(e) => emit(e.target.value)}
          disabled={disabled}
          required={required}
          className={inputClassName || DEFAULT_INPUT_CLASS}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {(options || []).map((opt, idx) => {
            if (!opt) return null;
            const optValue = opt.value ?? opt.id ?? "";
            const optLabel = opt.label ?? opt.name ?? String(optValue);
            const isDisabled = Boolean(opt.disabled);
            return (
              <option key={optValue || optLabel || idx} value={optValue} disabled={isDisabled}>
                {optLabel}
              </option>
            );
          })}
        </select>
        {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className={containerClassName}>
        {label ? <label className={labelClassName || DEFAULT_LABEL_CLASS}>{label}</label> : null}
        <textarea
          id={id}
          name={name}
          value={value ?? ""}
          onChange={(e) => emit(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className={inputClassName || DEFAULT_INPUT_CLASS}
          {...rest}
        />
        {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className={containerClassName}>
        {label ? <label className={labelClassName || DEFAULT_LABEL_CLASS}>{label}</label> : null}
        <input
          id={id}
          name={name}
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return emit("");
            emit(Number(raw));
          }}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={inputClassName || DEFAULT_INPUT_CLASS}
          {...rest}
        />
        {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {label ? <label className={labelClassName || DEFAULT_LABEL_CLASS}>{label}</label> : null}
      <input
        id={id}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) => emit(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={inputClassName || DEFAULT_INPUT_CLASS}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

