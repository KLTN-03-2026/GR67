"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FiBell,
  FiHome,
  FiSettings,
  FiUsers,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiLayers,
  FiClipboard,
  FiCamera,
  FiKey,
} from "react-icons/fi";
import { IconChevronDown } from "./adminIcons";

function SidebarLink({ href, icon, text, collapsed, onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const checkIsActive = () => {
    const [hrefPath, hrefQueryString] = href.split("?");
    if (pathname !== hrefPath) return false;
    const hrefParams = new URLSearchParams(hrefQueryString || "");
    if (hrefParams.toString() === "") return searchParams.toString() === "";
    return hrefParams.get("role") === searchParams.get("role");
  };

  const isActive = checkIsActive();

  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={`admin-sidebar-link ${isActive ? "admin-sidebar-link--active" : ""}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span
        className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-200 ${
          collapsed ? "hidden group-hover:inline" : "inline"
        }`}
      >
        {text}
      </span>
    </Link>
  );
}

function CollapsibleMenu({ icon, text, children, baseRoute, collapsed }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(baseRoute);
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`admin-sidebar-submenu-btn ${isActive ? "admin-sidebar-submenu-btn--open" : ""}`}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
        <span
          className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-200 ${
            collapsed ? "hidden group-hover:inline" : "inline"
          }`}
        >
          {text}
        </span>
        <span className={`${collapsed ? "hidden group-hover:inline-flex" : "inline-flex"} ml-auto`}>
          <IconChevronDown isOpen={isOpen} />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? "hidden group-hover:block" : ""
        } ${isOpen ? "max-h-screen" : "max-h-0"}`}
      >
        <div className="space-y-1 border-l-2 border-[var(--admin-sidebar-border)] pl-3 pr-2 pb-1 pt-1 ml-3">{children}</div>
      </div>
    </div>
  );
}

export default function AdminSidebar({ collapsed, onNavigate, onLogout }) {
  return (
    <>
      <div className="admin-sidebar-header flex h-16 items-center justify-center px-2">
        <h1
          className={`admin-shell-logo text-xl font-semibold tracking-wide text-[var(--admin-accent)] transition-opacity duration-200 sm:text-2xl ${
            collapsed ? "hidden group-hover:block" : "block"
          }`}
        >
          EMC ADMIN
        </h1>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <p className={`admin-sidebar-nav-label mb-2 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Quản lý chung</p>
        <SidebarLink
          href="/admin"
          text="Tổng quan"
          icon={<FiHome className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <p className={`admin-sidebar-nav-label mb-2 mt-6 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Hệ thống</p>
        <SidebarLink
          href="/admin/facilities"
          text="Cơ sở"
          icon={<FiSettings className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <p className={`admin-sidebar-nav-label mb-2 mt-6 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Nhân sự & Học viên</p>
        <CollapsibleMenu text="Người dùng" icon={<FiUsers className="h-5 w-5" />} baseRoute="/admin/users" collapsed={collapsed}>
          <SidebarLink
            href="/admin/users/admin"
            text="Quản trị viên"
            icon={<span className="inline-block h-2 w-2 rounded-full bg-current" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href="/admin/users/teacher"
            text="Giảng viên"
            icon={<span className="inline-block h-2 w-2 rounded-full bg-current" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href="/admin/users/student"
            text="Học viên"
            icon={<span className="inline-block h-2 w-2 rounded-full bg-current" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        </CollapsibleMenu>

        <SidebarLink
          href="/admin/attendance"
          text="Điểm danh (real-time)"
          icon={<FiCamera className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/admin/kiosk-keys"
          text="Mã kiosk điểm danh"
          icon={<FiKey className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <p className={`admin-sidebar-nav-label mb-2 mt-6 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Đào tạo</p>
        <SidebarLink
          href="/admin/course-types"
          text="Loại khóa học"
          icon={<FiLayers className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/admin/courses"
          text="Khóa học"
          icon={<FiBookOpen className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <p className={`admin-sidebar-nav-label mb-2 mt-6 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Ôn tập</p>
        <SidebarLink
          href="/admin/sample-tests"
          text="Đề thi mẫu"
          icon={<FiClipboard className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/admin/practice-exercises"
          text="Luyện tập"
          icon={<FiLayers className="h-5 w-5 rotate-45" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <p className={`admin-sidebar-nav-label mb-2 mt-6 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Thống kê & Tin tức</p>
        <SidebarLink
          href="/admin/reports"
          text="Báo cáo thống kê"
          icon={<FiBarChart2 className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/admin/announcements"
          text="Thông báo"
          icon={<FiBell className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="admin-sidebar-footer p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center rounded-lg px-4 py-2.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <FiLogOut className="h-5 w-5" />
          </span>
          <span
            className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-200 ${
              collapsed ? "hidden group-hover:inline" : "inline"
            }`}
          >
            Đăng xuất
          </span>
        </button>
      </div>
    </>
  );
}
