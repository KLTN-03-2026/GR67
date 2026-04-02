/**
 * Always dd/mm/yyyy (day first — not mm/dd).
 * For date-only strings "yyyy-mm-dd", uses local calendar day (not UTC midnight shift).
 */

function toCalendarDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [y, m, d] = value.trim().split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

function formatDateDdMmYyyy(value, empty = "—") {
  if (value === undefined || value === null || value === "") return empty;
  const d = toCalendarDate(value);
  if (Number.isNaN(d.getTime())) return empty;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

module.exports = { formatDateDdMmYyyy };
