"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { ThemeProvider } from "../contexts/ThemeContext";
import {
  FiBell,
  FiMenu,
  FiX,
  FiHome,
  FiSettings,
  FiUsers,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiLayers,
  FiClipboard,
} from "react-icons/fi";

export default function AdminLayout({ children }) {
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // State quản lý Dark Mode
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  // Bảo vệ route: Chỉ Admin mới được vào
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !isAdmin) {
      router.push('/');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    // Khi đổi route thì đóng mobile drawer
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  // Component link sidebar để tái sử dụng
  const SidebarLink = ({ href, icon, text, collapsed, onNavigate }) => {
    const searchParams = useSearchParams();

    const checkIsActive = () => {
      const [hrefPath, hrefQueryString] = href.split('?');
      if (pathname !== hrefPath) {
        return false;
      }
      const hrefParams = new URLSearchParams(hrefQueryString || '');
      const currentParams = searchParams;

      if (hrefParams.toString() === '') {
        return currentParams.toString() === '';
      }
      // So sánh role, có thể mở rộng cho các query khác
      return hrefParams.get('role') === currentParams.get('role');
    };

    const isActive = checkIsActive();

    return (
      <Link
        href={href}
        onClick={() => onNavigate?.()}
        className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 mb-1 ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : darkMode 
              ? "text-gray-400 hover:bg-gray-700 hover:text-gray-100"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        }`}
      >
        <span className="flex-shrink-0 flex items-center justify-center h-5 w-5">
          {icon}
        </span>
        <span
          className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-200 ${
            collapsed ? "hidden group-hover:inline" : "inline"
          }`}
        >
          {text}
        </span>
      </Link>
    );
  };

  // Component cho menu có thể thu gọn
  const CollapsibleMenu = ({ icon, text, children, baseRoute, collapsed }) => {
    const isActive = pathname.startsWith(baseRoute);
    const [isOpen, setIsOpen] = useState(isActive);

    useEffect(() => {
      if (isActive) {
        setIsOpen(true);
      }
    }, [isActive]);

    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 mb-1 ${
            isActive 
              ? "text-blue-600 font-semibold" 
              : darkMode 
                ? "text-gray-400 hover:bg-gray-700 hover:text-gray-100" 
                : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="flex-shrink-0 flex items-center justify-center h-5 w-5">
            {icon}
          </span>
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
          <div className="pl-12 pr-2 pt-1 pb-1 space-y-1">{children}</div>
        </div>
      </div>
    );
  };

  const SidebarBody = ({ collapsed, onNavigate }) => {
    return (
      <>
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1
            className={`text-2xl font-extrabold text-blue-600 tracking-wider transition-opacity duration-200 ${
              collapsed ? "hidden group-hover:block" : "block"
            }`}
          >
            EMC ADMIN
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          <p
            className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${
              collapsed ? "hidden group-hover:block" : ""
            }`}
          >
            Quản lý chung
          </p>
          <SidebarLink
            href="/admin"
            text="Tổng quan"
            icon={<FiHome className="h-5 w-5" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />

          <p
            className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 ${
              collapsed ? "hidden group-hover:block" : ""
            }`}
          >
            Hệ thống
          </p>
          <SidebarLink
            href="/admin/facilities"
            text="Cơ sở"
            icon={<FiSettings className="h-5 w-5" />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />

          <p
            className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 ${
              collapsed ? "hidden group-hover:block" : ""
            }`}
          >
            Nhân sự & Học viên
          </p>
          <CollapsibleMenu
            text="Người dùng"
            icon={<FiUsers className="h-5 w-5" />}
            baseRoute="/admin/users"
            collapsed={collapsed}
          >
            <SidebarLink
              href="/admin/users/admin"
              text="Quản trị viên"
              icon={<span className="h-2 w-2 rounded-full bg-current inline-block" />}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/admin/users/teacher"
              text="Giảng viên"
              icon={<span className="h-2 w-2 rounded-full bg-current inline-block" />}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            <SidebarLink
              href="/admin/users/student"
              text="Học viên"
              icon={<span className="h-2 w-2 rounded-full bg-current inline-block" />}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </CollapsibleMenu>

          <p
            className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 ${
              collapsed ? "hidden group-hover:block" : ""
            }`}
          >
            Đào tạo
          </p>
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

          <p
            className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 ${
              collapsed ? "hidden group-hover:block" : ""
            }`}
          >
            Ôn tập
          </p>
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

          <p
            className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 ${
              collapsed ? "hidden group-hover:block" : ""
            }`}
          >
            Thống kê & Tin tức
          </p>
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

        <div className={`p-4 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center w-full px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="flex items-center justify-center h-5 w-5">
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
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Mobile drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside
            className={`relative w-64 h-full shadow-xl flex-shrink-0 flex flex-col transition-colors duration-300 ${
              darkMode ? "bg-gray-800 border-r border-gray-700" : "bg-white"
            }`}
          >
            <SidebarBody collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex shadow-xl flex-shrink-0 flex flex-col z-10 transition-colors duration-300 group ${
          darkMode ? "bg-gray-800 border-r border-gray-700" : "bg-white"
        } ${menuCollapsed ? "w-20 hover:w-64" : "w-64"} transition-[width] duration-300`}
      >
        <SidebarBody collapsed={menuCollapsed} />
      </aside>

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ThemeProvider value={{ darkMode }}>
          {/* Header chung */}
          <header
            className={`shadow-sm h-16 flex justify-between items-center px-4 sm:px-6 lg:px-8 z-0 transition-colors duration-300 ${
              darkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu"
              >
                <FiMenu size={24} />
              </button>

              <button
                type="button"
                className="hidden lg:inline-flex p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setMenuCollapsed((v) => !v)}
                aria-label="Thu/gọn menu"
              >
                {menuCollapsed ? <FiMenu size={22} /> : <FiX size={22} />}
              </button>

              <h2
                className={`text-xl font-semibold truncate ${
                  darkMode ? "text-gray-100" : "text-gray-800"
                } hidden sm:block`}
              >
                Hệ Thống Quản Lý Trung Tâm
              </h2>
              <h2
                className={`text-lg font-semibold truncate ${
                  darkMode ? "text-gray-100" : "text-gray-800"
                } sm:hidden`}
              >
                Admin
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Nút đổi Theme */}
              <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-700 text-yellow-400" : "hover:bg-gray-100 text-gray-600"}`} title="Đổi giao diện">
                {darkMode ? <IconSun /> : <IconMoon />}
              </button>

              {/* Mobile notification icon */}
              <Link
                href="/admin/announcements"
                className="lg:hidden p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Thông báo"
              >
                <FiBell size={22} />
              </Link>

              <div className="text-right">
                <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{user?.FullName || user?.name}</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Nội dung thay đổi (Children) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          <ConfirmModal
            isOpen={showLogoutModal}
            title="Xác nhận đăng xuất"
            message="Bạn có chắc muốn đăng xuất không?"
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={() => {
              setShowLogoutModal(false);
              logout();
            }}
          />
        </ThemeProvider>
      </div>
    </div>
  );
}

// Icons (SVG) cho theme
const IconChevronDown = ({ isOpen }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-5 w-5 ml-auto transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const IconSun = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const IconMoon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const IconTest = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const IconPractice = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

// (menu/header icons) used from react-icons/fi