"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FiHome,
  FiBook,
  FiCalendar,
  FiBell,
  FiUser,
  FiLogOut,
  FiUsers,
  FiFileText,
  FiClipboard,
  FiCalendar as FiEvent,
} from "react-icons/fi";
import { IconChevronDown } from "./teacherIcons";

function SidebarLink({ href, icon, text, collapsed, onNavigate, activePath }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const checkIsActive = () => {
    // Nếu activePath được truyền vào, ưu tiên so sánh nó
    if (activePath) {
       // Sử dụng startsWith để giữ active kể cả khi vào trang con của mục đó
       if (pathname.startsWith(activePath)) return true;
       
       // Xử lý trường hợp người dùng bị chuyển hướng sang trang chọn khóa học trước
       if (pathname === '/teacher/selectkhoahoc') {
           const redirectParam = searchParams.get('redirect');
           if (redirectParam && redirectParam.startsWith(activePath)) return true;
       }
       return false;
    }

    const [hrefPath, hrefQueryString] = href.split("?");
    
    if (hrefPath === '/teacher') {
      return pathname === '/teacher';
    }

    if (!pathname.startsWith(hrefPath)) return false;
    if (pathname === hrefPath) {
      const hrefParams = new URLSearchParams(hrefQueryString || "");
      if (hrefParams.toString() === "") return searchParams.toString() === "";
    }
    return true;
  };

  const isActive = checkIsActive();

  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={`teacher-sidebar-link ${isActive ? "teacher-sidebar-link--active" : ""}`}
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
        className={`teacher-sidebar-submenu-btn ${isActive ? "teacher-sidebar-submenu-btn--open" : ""}`}
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
        <div className="space-y-1 border-l-2 border-[var(--teacher-sidebar-border)] pl-3 pr-2 pb-1 pt-1 ml-3">{children}</div>
      </div>
    </div>
  );
}

export default function TeacherSidebar({ collapsed, onNavigate, onLogout }) {
  return (
    <>
      <div className="teacher-sidebar-header flex h-16 items-center justify-center px-2">
        <h1
          className={`teacher-shell-logo text-xl font-semibold tracking-wide text-[var(--teacher-accent)] transition-opacity duration-200 sm:text-2xl ${
            collapsed ? "hidden group-hover:block" : "block"
          }`}
        >
          TEACHER
        </h1>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <p className={`teacher-sidebar-nav-label mb-2 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Giảng dạy</p>
        <SidebarLink
          href="/teacher"
          text="Tổng quan"
          icon={<FiHome className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <CollapsibleMenu text="Khóa Học" icon={<FiBook className="h-5 w-5" />} baseRoute="/teacher/courses" collapsed={collapsed}>
          <SidebarLink
            activePath="/teacher/courses/students"
            href="/teacher/selectkhoahoc?redirect=/teacher/courses/students"
            text="Quản lý học viên"
            icon={<FiUsers className="h-4 w-4" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          <SidebarLink
            activePath="/teacher/courses/lessons"
            href="/teacher/selectkhoahoc?redirect=/teacher/courses/lessons"
            text="Quản lý bài học"
            icon={<FiFileText className="h-4 w-4" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          <SidebarLink
            activePath="/teacher/courses/assignments"
            href="/teacher/selectkhoahoc?redirect=/teacher/courses/assignments"
            text="Quản lý bài tập"
            icon={<FiClipboard className="h-4 w-4" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          <SidebarLink
             activePath="/teacher/courses/leave-requests"
             href="/teacher/courses/leave-requests"
             text="Quản lý nghỉ phép"
             icon={<FiEvent className="h-4 w-4" />}
             collapsed={collapsed}
             onNavigate={onNavigate}
          />
        </CollapsibleMenu>

        <SidebarLink
          href="/teacher/schedule"
          text="Lịch dạy"
          icon={<FiCalendar className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <p className={`teacher-sidebar-nav-label mb-2 mt-6 px-4 ${collapsed ? "hidden group-hover:block" : "block"}`}>Thông tin</p>
        <SidebarLink
          href="/teacher/announcements"
          text="Thông báo"
          icon={<FiBell className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarLink
          href="/teacher/profile"
          text="Thông tin cá nhân"
          icon={<FiUser className="h-5 w-5" />}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="teacher-sidebar-footer p-4">
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
