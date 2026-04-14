"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import {
  FiHome,
  FiSettings,
  FiUsers,
  FiBookOpen,
  FiLayers,
  FiClipboard,
  FiCamera,
  FiKey,
  FiBell,
  FiBarChart2,
  FiTrendingUp,
} from "react-icons/fi";
import AdminPageTitle from "./components/AdminPageTitle";
import AdminCard from "./components/AdminCard";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DASHBOARD_URL = `${API_BASE}/api/admin/dashboard`;

function formatDdMm(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

function PeopleBarChart({ hocVien, giangVien, admins }) {
  const items = [
    { label: "Học viên", value: hocVien, className: "fill-blue-500 dark:fill-blue-400" },
    { label: "Giảng viên", value: giangVien, className: "fill-emerald-500 dark:fill-emerald-400" },
    { label: "Quản trị", value: admins, className: "fill-violet-500 dark:fill-violet-400" },
  ];
  const max = Math.max(1, hocVien, giangVien, admins);
  const w = 240;
  const h = 120;
  const barW = 56;
  const gap = 24;
  const baseY = h - 8;
  const maxBarH = h - 28;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-xs mx-auto h-32" aria-hidden>
        {items.map((it, i) => {
          const bh = Math.round((it.value / max) * maxBarH);
          const x = 16 + i * (barW + gap);
          const y = baseY - bh;
          return (
            <g key={it.label}>
              <rect x={x} y={y} width={barW} height={Math.max(bh, 2)} rx={4} className={it.className} />
              <text
                x={x + barW / 2}
                y={baseY + 14}
                textAnchor="middle"
                fill="currentColor"
                className="text-gray-500 dark:text-gray-400 text-[9px]"
              >
                {it.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 text-xs text-gray-600 dark:text-gray-400 mt-1">
        {items.map((it) => (
          <span key={it.label}>
            {it.label}: <strong className="text-gray-900 dark:text-white">{it.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

const LINE_COLORS = [
  "text-blue-500 dark:text-blue-400",
  "text-emerald-500 dark:text-emerald-400",
  "text-amber-500 dark:text-amber-400",
  "text-violet-500 dark:text-violet-400",
  "text-rose-500 dark:text-rose-400",
  "text-cyan-500 dark:text-cyan-400",
  "text-orange-500 dark:text-orange-400",
  "text-indigo-500 dark:text-indigo-400",
];

/** dates: ISO yyyy-mm-dd[]; series: { name, counts: number[] }[] (counts cùng độ dài với dates) */
function RegistrationsByFacilityChart({ dates, series }) {
  const w = 360;
  const h = 112;
  const pad = 8;
  const n = dates.length;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2 - 16;
  const step = n > 1 ? innerW / (n - 1) : 0;
  const xAt = (i) => (n > 1 ? pad + i * step : pad + innerW / 2);

  const max = Math.max(
    1,
    ...series.flatMap((row) => (Array.isArray(row.counts) ? row.counts : []))
  );

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h + 14}`} className="w-full h-auto max-h-44" aria-hidden>
        {series.map((row, si) => {
          const counts = Array.isArray(row.counts) ? row.counts : [];
          const colorClass = LINE_COLORS[si % LINE_COLORS.length];
          const pts = dates.map((_, i) => {
            const c = counts[i] ?? 0;
            const x = xAt(i);
            const y = pad + innerH - (c / max) * innerH;
            return `${x},${y}`;
          });
          return (
            <polyline
              key={`${row.name}-${si}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              className={colorClass}
              points={pts.join(" ")}
            />
          );
        })}
        {dates.map((d, i) => {
          const x = xAt(i);
          return (
            <text
              key={d}
              x={x}
              y={h + 8}
              textAnchor="middle"
              fill="currentColor"
              className="text-gray-500 dark:text-gray-400 text-[8px]"
            >
              {formatDdMm(d)}
            </text>
          );
        })}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
        {series.map((row, si) => (
          <li key={`leg-${row.name}-${si}`} className="inline-flex items-center gap-1.5 max-w-full">
            <span
              className={`inline-block h-2 w-5 shrink-0 rounded-sm bg-current ${LINE_COLORS[si % LINE_COLORS.length]}`}
              aria-hidden
            />
            <span className="truncate" title={row.name}>
              {row.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SHORTCUTS = [
  { href: "/admin", label: "Tổng quan", icon: FiHome, hotkey: "O" },
  { href: "/admin/facilities", label: "Cơ sở", icon: FiSettings, hotkey: "F" },
  { href: "/admin/users/student", label: "Học viên", icon: FiUsers, hotkey: "H" },
  { href: "/admin/users/teacher", label: "Giảng viên", icon: FiUsers, hotkey: "G" },
  { href: "/admin/users/admin", label: "Quản trị viên", icon: FiUsers, hotkey: "U" },
  { href: "/admin/attendance", label: "Điểm danh", icon: FiCamera, hotkey: "A" },
  { href: "/admin/kiosk-keys", label: "Mã kiosk", icon: FiKey, hotkey: "K" },
  { href: "/admin/course-types", label: "Loại khóa học", icon: FiLayers, hotkey: "T" },
  { href: "/admin/courses", label: "Khóa học", icon: FiBookOpen, hotkey: "C" },
  { href: "/admin/sample-tests", label: "Đề thi mẫu", icon: FiClipboard, hotkey: "S" },
  { href: "/admin/practice-exercises", label: "Luyện tập", icon: FiLayers, hotkey: "P" },
  { href: "/admin/announcements", label: "Thông báo", icon: FiBell, hotkey: "N" },
  { href: "/admin/reports", label: "Báo cáo", icon: FiBarChart2, hotkey: "—" },
];

const HOTKEY_ROWS = [
  { combo: "Alt + Shift + O", desc: "Tổng quan" },
  { combo: "Alt + Shift + F", desc: "Cơ sở" },
  { combo: "Alt + Shift + H", desc: "Học viên" },
  { combo: "Alt + Shift + G", desc: "Giảng viên" },
  { combo: "Alt + Shift + U", desc: "Quản trị viên" },
  { combo: "Alt + Shift + C", desc: "Khóa học" },
  { combo: "Alt + Shift + T", desc: "Loại khóa học" },
  { combo: "Alt + Shift + A", desc: "Điểm danh" },
  { combo: "Alt + Shift + N", desc: "Thông báo" },
  { combo: "Alt + Shift + K", desc: "Mã kiosk" },
  { combo: "Alt + Shift + S", desc: "Đề thi mẫu" },
  { combo: "Alt + Shift + P", desc: "Luyện tập" },
];

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const displayName = user?.hovaten || user?.name || user?.FullName || "Quản trị viên";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(DASHBOARD_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Không tải được dữ liệu tổng quan");
      setData(json.data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Lỗi tải dữ liệu");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts;
  const facilityChart = useMemo(() => {
    const raw = data?.hocVienLast7DaysByFacility;
    const dates = Array.isArray(raw?.dates) ? raw.dates : [];
    let rows = Array.isArray(raw?.series) ? raw.series : [];
    if (dates.length && rows.length === 0 && Array.isArray(raw?.totalsByDay) && raw.totalsByDay.length) {
      rows = [
        {
          facilityId: "_total",
          name: "Tổng (chưa có cơ sở trong hệ thống)",
          counts: raw.totalsByDay.map((t) => t.count ?? 0),
        },
      ];
    }
    return { dates, series: rows };
  }, [data]);

  const kpiCards = useMemo(() => {
    if (!counts) return [];
    return [
      { title: "Học viên", value: counts.hocVien, icon: FiUsers, accent: "text-blue-600 dark:text-blue-400" },
      { title: "Giảng viên", value: counts.giangVien, icon: FiUsers, accent: "text-emerald-600 dark:text-emerald-400" },
      { title: "Khóa học", value: counts.khoaHoc, icon: FiBookOpen, accent: "text-indigo-600 dark:text-indigo-400" },
      { title: "Loại khóa", value: counts.loaiKhoaHoc, icon: FiLayers, accent: "text-amber-600 dark:text-amber-400" },
      { title: "Cơ sở", value: counts.facilities, icon: FiSettings, accent: "text-slate-600 dark:text-slate-300" },
      { title: "Mã kiosk hoạt động", value: counts.kioskKeys, icon: FiKey, accent: "text-cyan-600 dark:text-cyan-400" },
    ];
  }, [counts]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageTitle title="Tổng quan">
        <p className="admin-page-subtitle mt-2 leading-relaxed">
          Chào mừng quay lại, <span className="admin-accent-link">{displayName}</span>. Đây là bảng điều khiển trung
          tâm — số liệu cập nhật khi tải trang.
        </p>
      </AdminPageTitle>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-[var(--admin-sidebar-fg-muted)]">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent"
            aria-hidden
          />
          <span className="text-sm">Đang tải số liệu…</span>
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200 flex flex-wrap items-center gap-3"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      {!loading && !error && counts ? (
        <>
          <section>
            <h2 className="admin-sidebar-nav-label mb-3 px-0">Số liệu nhanh</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kpiCards.map((card) => (
                <AdminCard key={card.title} className="flex items-start gap-4 p-5">
                  <div className="rounded-lg bg-[var(--admin-accent-subtle)] p-2.5 text-[var(--admin-accent)]">
                    <card.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--admin-sidebar-fg-muted)]">{card.title}</h3>
                    <p className={`mt-1 text-3xl font-bold tabular-nums ${card.accent}`}>{card.value}</p>
                  </div>
                </AdminCard>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AdminCard className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--admin-sidebar-fg)]">
                  <FiClipboard className="h-4 w-4" aria-hidden />
                  Đề thi mẫu
                </h3>
                <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--admin-sidebar-fg)]">{counts.sampleTests}</p>
              </AdminCard>
              <AdminCard className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--admin-sidebar-fg)]">
                  <FiLayers className="h-4 w-4" aria-hidden />
                  Bài luyện tập
                </h3>
                <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--admin-sidebar-fg)]">{counts.practiceExercises}</p>
              </AdminCard>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AdminCard className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-[var(--admin-sidebar-fg)]">Cơ cấu người dùng</h2>
              <PeopleBarChart hocVien={counts.hocVien} giangVien={counts.giangVien} admins={counts.admins} />
            </AdminCard>
            <AdminCard className="p-6">
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--admin-sidebar-fg)]">
                <FiTrendingUp className="h-4 w-4" aria-hidden />
                Đăng ký học viên (7 ngày) — theo cơ sở
              </h2>
              <p className="mb-3 text-xs text-[var(--admin-sidebar-fg-muted)]">
                Theo cơ sở ghi trên khóa học đăng ký đầu tiên (CoSoId); khóa cũ chưa có CoSoId thì suy từ phòng ca đầu trong lịch.
              </p>
              {facilityChart.dates.length > 0 && facilityChart.series.length > 0 ? (
                <RegistrationsByFacilityChart dates={facilityChart.dates} series={facilityChart.series} />
              ) : (
                <p className="text-sm text-[var(--admin-sidebar-fg-muted)]">Chưa có dữ liệu trong 7 ngày.</p>
              )}
            </AdminCard>
          </section>
        </>
      ) : null}

      <section>
        <h2 className="admin-sidebar-nav-label mb-3 px-0">Lối tắt chức năng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="admin-card group flex items-center gap-3 p-4 transition-all hover:border-[var(--admin-accent)] hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--admin-accent-subtle)] text-[var(--admin-accent)] transition-colors group-hover:opacity-90">
                <item.icon className="w-5 h-5" aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--admin-sidebar-fg)]">{item.label}</span>
                <span className="text-[11px] text-[var(--admin-sidebar-fg-muted)]">
                  {item.hotkey === "—" ? "Chưa gán phím" : `Alt+Shift+${item.hotkey}`}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <AdminCard className="p-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--admin-sidebar-fg)]">Phím tắt (toàn khu vực Admin)</h2>
        <p className="mb-4 text-xs text-[var(--admin-sidebar-fg-muted)]">
          Giữ{" "}
          <kbd className="rounded bg-[var(--admin-sidebar-hover)] px-1 py-0.5 font-mono text-[11px] text-[var(--admin-sidebar-fg)]">
            Alt
          </kbd>{" "}
          +{" "}
          <kbd className="rounded bg-[var(--admin-sidebar-hover)] px-1 py-0.5 font-mono text-[11px] text-[var(--admin-sidebar-fg)]">
            Shift
          </kbd>{" "}
          + chữ cái. Không hoạt động khi đang gõ trong ô nhập liệu.
        </p>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {HOTKEY_ROWS.map((row) => (
            <li
              key={row.combo}
              className="flex justify-between gap-4 border-b border-[var(--admin-border)] pb-2 text-[var(--admin-sidebar-fg)]"
            >
              <span className="text-[var(--admin-sidebar-fg-muted)]">{row.desc}</span>
              <kbd className="shrink-0 font-mono text-xs">{row.combo}</kbd>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
