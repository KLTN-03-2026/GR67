"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function AdminLayout({ children }) {
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // State quản lý Dark Mode
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  // Component link sidebar để tái sử dụng
  const SidebarLink = ({ href, icon, text }) => {
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
        className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 mb-1 ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : darkMode 
              ? "text-gray-400 hover:bg-gray-700 hover:text-gray-100"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        }`}
      >
        {icon}
        <span className="ml-3 font-medium">{text}</span>
      </Link>
    );
  };

  // Component cho menu có thể thu gọn
  const CollapsibleMenu = ({ icon, text, children, baseRoute }) => {
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
          {icon}
          <span className="ml-3 font-medium">{text}</span>
          <IconChevronDown isOpen={isOpen} />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-screen" : "max-h-0"
          }`}
        >
          <div className="pl-12 pr-2 pt-1 pb-1 space-y-1">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar cố định */}
      <aside className={`w-64 shadow-xl flex-shrink-0 flex flex-col z-10 transition-colors duration-300 ${darkMode ? "bg-gray-800 border-r border-gray-700" : "bg-white"}`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-wider">EMC ADMIN</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quản lý chung</p>
          <SidebarLink href="/admin" text="Tổng quan" icon={<IconHome />} />
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Hệ thống</p>
          <SidebarLink href="/admin/facilities" text="Cơ sở" icon={<IconBuilding />} />
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Nhân sự & Học viên</p>
          <CollapsibleMenu text="Người dùng" icon={<IconUsers />} baseRoute="/admin/users">
            <SidebarLink href="/admin/users/admin" text="Quản trị viên"  />
            <SidebarLink href="/admin/users/teacher" text="Giảng viên"  />
            <SidebarLink href="/admin/users/student" text="Học viên"  />
          </CollapsibleMenu>
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Đào tạo</p>
          <SidebarLink href="/admin/course-types" text="Loại khóa học" icon={<IconCategory />} />
          <SidebarLink href="/admin/courses" text="Khóa học" icon={<IconBook />} />
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Thống kê & Tin tức</p>
          <SidebarLink href="/admin/reports" text="Báo cáo thống kê" icon={<IconChart />} />
          <SidebarLink href="/admin/announcements" text="Thông báo" icon={<IconBell />} />
        </nav>

        <div className={`p-4 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center w-full px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <IconLogout />
            <span className="ml-3 font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ThemeProvider value={{ darkMode }}>
          {/* Header chung */}
          <header className={`shadow-sm h-16 flex justify-between items-center px-8 z-0 transition-colors duration-300 ${darkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Hệ Thống Quản Lý Trung Tâm</h2>
            <div className="flex items-center space-x-4">
              {/* Nút đổi Theme */}
              <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-700 text-yellow-400" : "hover:bg-gray-100 text-gray-600"}`} title="Đổi giao diện">
                {darkMode ? <IconSun /> : <IconMoon />}
              </button>

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
          <main className="flex-1 overflow-y-auto p-8">
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

// Icons (SVG)
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IconBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 004.77-2.88" /></svg>;
const IconCategory = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconBell = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IconChevronDown = ({ isOpen }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-auto transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const IconDot = () => <svg viewBox="0 0 16 16" className="h-5 w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="3"/></svg>;
const IconSun = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IconMoon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;