"use client";

import Link from "next/link";
import { FiBell, FiMenu, FiX } from "react-icons/fi";
import { IconMoon, IconSun } from "./adminIcons";

export default function AdminHeader({
  darkMode,
  toggleTheme,
  user,
  menuCollapsed,
  setMenuCollapsed,
  onOpenMobileMenu,
}) {
  const initial = (user?.name || user?.FullName || user?.hovaten || "?").charAt(0).toUpperCase();

  return (
    <header className="admin-shell-header z-0 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="admin-shell-icon-btn lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu"
        >
          <FiMenu size={24} />
        </button>

        <button
          type="button"
          className="admin-shell-icon-btn hidden lg:inline-flex"
          onClick={() => setMenuCollapsed((v) => !v)}
          aria-label="Thu/gọn menu"
        >
          {menuCollapsed ? <FiMenu size={22} /> : <FiX size={22} />}
        </button>

        <h2 className="admin-shell-header-title hidden truncate text-xl sm:block">Hệ Thống Quản Lý Trung Tâm</h2>
        <h2 className="admin-shell-header-title truncate text-lg sm:hidden">Admin</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="admin-shell-icon-btn rounded-full p-2"
          title="Đổi giao diện"
        >
          {darkMode ? <IconSun /> : <IconMoon />}
        </button>

        <Link href="/admin/announcements" className="admin-shell-icon-btn lg:hidden" aria-label="Thông báo">
          <FiBell size={22} />
        </Link>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[var(--admin-sidebar-fg)]">{user?.FullName || user?.name}</p>
          <p className="text-xs text-[var(--admin-sidebar-fg-muted)]">{user?.email}</p>
        </div>
        <div className="admin-shell-avatar flex h-10 w-10 items-center justify-center rounded-full text-lg">{initial}</div>
      </div>
    </header>
  );
}
