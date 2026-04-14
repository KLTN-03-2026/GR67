"use client";

import Link from "next/link";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import AdminPageTitle from "../components/AdminPageTitle";

export default function AdminReportsPlaceholderPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <AdminPageTitle
        title="Báo cáo thống kê"
        subtitle="Trang báo cáo chi tiết đang được mở rộng. Hiện tại bạn có thể xem số liệu tổng quan và biểu đồ nhanh trên trang Tổng quan."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin" className="admin-btn-accent">
            <FiHome className="w-4 h-4 shrink-0" aria-hidden />
            Về tổng quan
          </Link>
          <Link href="/admin/courses" className="admin-btn-outline">
            <FiArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
            Khóa học
          </Link>
        </div>
      </AdminPageTitle>
    </div>
  );
}
