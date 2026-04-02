/**
 * Display: always dd/mm/yyyy (day first, then month — never mm/dd).
 * HTML input type="date" still uses yyyy-mm-dd internally via {@link toDateInputValue}.
 */

function toCalendarDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [y, m, d] = value.trim().split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export function formatDateDdMmYyyy(value, options = {}) {
  const empty = options.empty ?? "—";
  if (value == null || value === "") return empty;
  const d = toCalendarDate(value);
  if (Number.isNaN(d.getTime())) return empty;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Value for HTML input type="date" (yyyy-mm-dd, local calendar day). */
export function toDateInputValue(value) {
  if ((value === undefined || value === null || value === "") && value !== 0) return "";
  const d = toCalendarDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date and time: dd/mm/yyyy, HH:mm (24h). */
export function formatDateTimeDdMmYyyy(value, options = {}) {
  const empty = options.empty ?? "—";
  if (value == null || value === "") return empty;
  const d = toCalendarDate(value);
  if (Number.isNaN(d.getTime())) return empty;
  const datePart = formatDateDdMmYyyy(d, { empty: "" });
  if (datePart === "") return empty;
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${datePart}, ${hh}:${min}`;
}
