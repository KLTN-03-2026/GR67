"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  FiDownload, FiPieChart, FiUsers, FiBook, FiBriefcase, 
  FiFileText, FiTrendingUp, FiLoader, FiHome, FiSettings, 
  FiActivity, FiBarChart2, FiGrid, FiUserCheck, FiTarget
} from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import AdminPageTitle from "../components/AdminPageTitle";
import AdminCard from "../components/AdminCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STATS_URL = `${API_BASE}/api/admin/reports/stats`;
const EXPORT_BASE_URL = `${API_BASE}/api/admin/reports/export`;

const CHART_COLORS = ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#858796", "#5a5c69", "#6f42c1", "#fd7e14"];

// --- Chart Components ---

function SimplePieChart({ data, title, height = 180 }) {
  const total = useMemo(() => data?.reduce((sum, item) => sum + item.count, 0) || 0, [data]);
  let currentPos = 0;

  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-gray-400">Không có dữ liệu</div>;

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative" style={{ width: height, height: height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {data.map((item, i) => {
            const percentage = (item.count / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -currentPos;
            currentPos += percentage;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="35"
                fill="transparent"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out hover:opacity-80 cursor-alias"
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-4 space-y-1 w-full flex flex-col items-center">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] w-full justify-between px-4">
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                <span className="truncate text-gray-600 dark:text-gray-400" title={item.name}>{item.name}</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-300">{item.count} ({Math.round((item.count/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({ data, color = "#4e73df" }) {
    if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-gray-400">Không có dữ liệu</div>;
    const max = Math.max(...data.map(d => d.count)) || 1;

    return (
        <div className="space-y-3">
            {data.map((item, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                        <span className="text-gray-600 dark:text-gray-400 truncate w-3/4">{item.name}</span>
                        <span className="font-bold">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function AttendanceTrendChart({ data }) {
  const w = 500; const h = 180; const pad = 30;
  const innerW = w - pad * 2; const innerH = h - pad * 2;
  
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-gray-400">Không có dữ liệu</div>;

  const points = data.map((d, i) => {
    const x = pad + (i * (innerW / (data.length - 1 || 1)));
    const y = h - pad - (d.rate / 100) * innerH;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <path d={`M ${pad},${h - pad} ${points} L ${w - pad},${h - pad} Z`} className="fill-blue-500/5" />
        <polyline fill="none" stroke="#4e73df" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} className="transition-all duration-1000" />
        {data.map((d, i) => {
          const x = pad + (i * (innerW / (data.length - 1 || 1)));
          const y = h - pad - (d.rate / 100) * innerH;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" className="fill-blue-600 stroke-white dark:stroke-slate-900 stroke-1" />
              <text x={x} y={h - 10} textAnchor="middle" className="text-[9px] fill-gray-400">{d.month}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- Main Page ---

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(STATS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async (type, filename) => {
    if (!token) return;
    setExporting(type);
    try {
      const res = await fetch(`${EXPORT_BASE_URL}/${type}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) { alert("Lỗi khi tải file."); } 
    finally { setExporting(null); }
  };

  const sections = [
    {
      title: "Báo cáo Học viên",
      icon: FiUsers,
      color: "text-blue-500",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Phân bổ Giới tính</h4>
            <SimplePieChart data={stats?.genderDist} />
          </AdminCard>
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Phân bổ theo Cơ sở</h4>
            <div className="py-2"><SimplePieChart data={stats?.studentsByFacility} height={140} /></div>
          </AdminCard>
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Đăng ký mới nhất</h4>
            <div className="space-y-3 mt-2">
                {stats?.recentEnrollments?.slice(0, 5).map((en, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800/40 pb-2 last:border-0 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-[10px] shrink-0">{en.student?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate">{en.student}</p>
                            <p className="text-[9px] text-gray-400 truncate">{en.course}</p>
                        </div>
                    </div>
                ))}
            </div>
          </AdminCard>
        </div>
      )
    },
    {
      title: "Báo cáo Học thuật",
      icon: FiBook,
      color: "text-emerald-500",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Trình độ Giảng viên</h4>
            <MiniBarChart data={stats?.qualificationDist} color="#1cc88a" />
          </AdminCard>
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Trạng thái Khóa học</h4>
            <SimplePieChart data={stats?.courseStatusDist} height={140} />
          </AdminCard>
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Phân bổ Loại khóa</h4>
            <MiniBarChart data={stats?.coursesByType} color="#36b9cc" />
          </AdminCard>
        </div>
      )
    },
    {
      title: "Vận hành & Chuyên cần",
      icon: FiActivity,
      color: "text-amber-500",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminCard className="md:col-span-2 p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Xu hướng Đi học (%)</h4>
            <AttendanceTrendChart data={stats?.attendanceTrend} />
          </AdminCard>
          <AdminCard className="p-5">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Quy mô Cơ sở (Phòng)</h4>
            <MiniBarChart data={stats?.facilitySize} color="#f6c23e" />
          </AdminCard>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <AdminPageTitle title="Trung tâm Thống kê" subtitle="Dữ liệu tổng hợp chuyên sâu phục vụ quản trị và ra quyết định." />

      {/* Hero Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array(4).fill(0).map((_, i) => <AdminCard key={i} className="animate-pulse h-24 p-5" />) :
          stats?.summary?.map((item, i) => (
            <AdminCard key={i} className="p-5 flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: item.color }}>
                {item.icon === 'students' && <FiUsers size={24} />}
                {item.icon === 'teachers' && <FiBriefcase size={24} />}
                {item.icon === 'courses' && <FiBook size={24} />}
                {item.icon === 'facilities' && <FiSettings size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
                <p className="text-2xl font-black">{item.value.toLocaleString()}</p>
              </div>
            </AdminCard>
          ))
        }
      </section>

      {/* Main Sections */}
      {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <FiLoader className="w-10 h-10 animate-spin text-blue-500" />
             <span className="text-sm font-medium text-gray-400 tracking-widest uppercase">Đang đồng bộ dữ liệu...</span>
          </div>
      ) : (
        <div className="space-y-12">
            {sections.map((section, idx) => (
                <section key={idx} className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm ${section.color}`}><section.icon size={20} /></div>
                        <h2 className="text-lg font-black tracking-tight">{section.title}</h2>
                    </div>
                    {section.content}
                </section>
            ))}
        </div>
      )}

      {/* Summary Charts - Level 3 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard className="lg:col-span-2 p-6 overflow-hidden relative">
            <h3 className="text-sm font-black uppercase text-gray-400 mb-6 flex items-center gap-2">
                <FiTarget className="text-rose-500" /> Hiệu suất khai thác lớp học (%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                {stats?.courseUsage?.slice(0, 10).map((c, i) => (
                    <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-bold truncate max-w-[70%]" title={c.name}>{c.name}</span>
                            <span className="text-[10px] text-gray-500">{c.enrolled}/{c.max}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <div className={`h-full rounded-full transition-all duration-1000 ${c.percentage > 85 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(c.percentage, 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </AdminCard>
        
        <AdminCard className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-xl flex flex-col justify-between">
            <div>
                <h3 className="text-xs font-bold uppercase opacity-60 tracking-widest mb-2">Tóm lược hoạt động</h3>
                <p className="text-xl font-light leading-relaxed">Trong tháng này, trung tâm đã ghi nhận <strong className="font-black underline decoration-yellow-400">{stats?.chartData?.slice(-1)[0]?.count || 0} lượt đăng ký mới</strong>, duy trì tỷ lệ chuyên cần trung bình ở mức <strong className="font-black text-yellow-300">{stats?.attendanceTrend?.slice(-1)[0]?.rate || 0}%</strong>.</p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6">
                <Link href="/admin/courses" className="text-xs font-bold py-3 bg-white/10 hover:bg-white/20 transition-colors block text-center rounded-lg backdrop-blur-sm">QUẢN LÝ LỚP HỌC</Link>
            </div>
        </AdminCard>
      </section>

      {/* Export Section */}
      <section className="pt-8 pt-10">
        <div className="flex items-center gap-3 mb-6">
            <FiDownload className="text-gray-400" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Tải dữ liệu báo cáo chi tiết</h2>
        </div>
        <div className="flex flex-wrap gap-4">
            {[
                { id: "students", label: "Học viên", fn: "DanhSachHocVien" },
                { id: "teachers", label: "Giảng viên", fn: "DanhSachGiangVien" },
                { id: "courses", label: "Khóa học", fn: "DanhSachKhoaHoc" },
                { id: "enrollments", label: "Đăng ký", fn: "ThongKeDangKy" },
                { id: "facilities", label: "Cơ sở", fn: "DanhSachCoSo" }
            ].map(btn => (
                <button
                    key={btn.id}
                    onClick={() => handleExport(btn.id, btn.fn)}
                    disabled={exporting !== null}
                    className="px-6 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all rounded-xl text-xs font-black uppercase flex items-center gap-3"
                >
                    {exporting === btn.id ? <FiLoader className="animate-spin" /> : <FiFileText />}
                    {btn.label}
                </button>
            ))}
        </div>
      </section>
    </div>
  );
}
