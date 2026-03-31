"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";

// Icons
const PlusIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const TrashIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033C6.913 2.345 6 3.255 6 4.375v.916m7.5 0" /></svg>;
const ArrowRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>;
const UsersIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.67c.12-.318.232-.656.328-1.014a.75.75 0 011.498-.075 12.075 12.075 0 01.62 6.217c0 .337-.02.67-.062 1.002a.75.75 0 01-.998.618l-.003-.002zM16.5 7.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;
const ClockIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

/**
 * Helper function to determine course status.
 * NOTE: This function assumes a course duration of 12 weeks if an `endDate` is not provided in the data.
 * For accurate status, it's recommended to add an `endDate` field to the Course model on the server.
 */
const getCourseStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  // If endDate is provided, use it. Otherwise, assume a 12-week duration.
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

  if (now < start) {
    return { key: 'chua-bat-dau', label: 'Chưa bắt đầu', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', indicator: 'border-blue-500' };
  }
  if (now > end) {
    return { key: 'da-xong', label: 'Đã xong', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', indicator: 'border-gray-500' };
  }
  return { key: 'dang-dien-ra', label: 'Đang diễn ra', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', indicator: 'border-green-500' };
};

const dayOfWeekToString = (day) => {
    const days = ['DUMMY', 'Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day] || 'N/A';
};

export default function CoursesListPage() {
    const { token } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCertificate, setFilterCertificate] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');

    const API_URL = "/api/courses";

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // API should populate related fields like courseTypeId and classroomId
                const response = await fetch(API_URL, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();
                if (result.success) {
                    setCourses(result.data);
                } else {
                    throw new Error(result.message || 'Failed to fetch data');
                }
            } catch (err) {
                setError("Không thể tải danh sách khóa học. Vui lòng thử lại.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleFormSubmit = async (formData) => {
        try {
            // Loại bỏ campusId vì nó chỉ dùng để lọc, không lưu trong Course model
            const { campusId, ...dataToSubmit } = formData;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSubmit),
            });
            const result = await response.json();
            if (result.success) {
                setCourses([result.data, ...courses]);
                setIsFormModalOpen(false);
            } else {
                alert(result.message || 'Lỗi khi tạo khóa học');
            }
        } catch (err) {
            console.error("Failed to save course", err);
            alert(`Lỗi: ${err.message}`);
        }
    };

    const processedCourses = useMemo(() => {
        if (!courses) return [];
        return courses.map(course => ({
            ...course,
            status: getCourseStatus(course.startDate, course.endDate) // course.endDate may not exist in your model yet
        }));
    }, [courses]);

    const filteredCourses = useMemo(() => {
        return processedCourses.filter(course => {
            const matchesStatus = filterStatus === 'all' || course.status.key === filterStatus;
            const matchesCert = filterCertificate === 'all' || course.courseTypeId?.certificateType === filterCertificate;
            const matchesMonth = filterMonth === 'all' || (new Date(course.startDate).getMonth() + 1) === parseInt(filterMonth);
            return matchesStatus && matchesCert && matchesMonth;
        });
    }, [processedCourses, filterStatus, filterCertificate, filterMonth]);

    const stats = useMemo(() => {
        const completed = processedCourses.filter(c => c.status.key === 'da-xong').length;
        const ongoing = processedCourses.filter(c => c.status.key === 'dang-dien-ra').length;
        const notStarted = processedCourses.filter(c => c.status.key === 'chua-bat-dau').length;
        return { completed, ongoing, notStarted };
    }, [processedCourses]);

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách Khóa học</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Xem và lọc các khóa học trong hệ thống.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Đang diễn ra" value={stats.ongoing} />
                    <StatCard title="Chưa bắt đầu" value={stats.notStarted} />
                    <StatCard title="Đã hoàn thành" value={stats.completed} />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-start gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex-1"></div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">Tất cả tình trạng</option>
                        <option value="dang-dien-ra">Đang diễn ra</option>
                        <option value="chua-bat-dau">Chưa bắt đầu</option>
                        <option value="da-xong">Đã xong</option>
                    </select>
                    <select value={filterCertificate} onChange={(e) => setFilterCertificate(e.target.value)} className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">Tất cả chứng chỉ</option>
                        <option value="TOEIC">TOEIC</option>
                        <option value="IELTS">IELTS</option>
                    </select>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">Tất cả các tháng</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Thêm khóa học
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 dark:text-gray-400">Đang tải...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredCourses.map((course) => (
                            <div key={course._id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow border-l-4 ${course.status.indicator}`}>
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{course.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="font-medium">{course.courseTypeId?.name || 'N/A'}</span>
                                            <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                                            <span>Bắt đầu: {new Date(course.startDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.status.color}`}>
                                        {course.status.label}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <UsersIcon className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">{course.students?.length || 0} / {course.maxStudents || 20}</span> học viên
                                        </span>
                                    </div>
                                    
                                    {course.schedule?.map((s, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <ClockIcon className="w-5 h-5 text-gray-400" />
                                            <span>{dayOfWeekToString(s.dayOfWeek)} ({s.startTime} - {s.endTime}) - GV: <span className="font-medium text-gray-800 dark:text-gray-200">{s.teacherId?.fullName || 'N/A'}</span></span>
                                        </div>
                                    ))}
                                    {(!course.schedule || course.schedule.length === 0) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <ClockIcon className="w-5 h-5 text-gray-400" />
                                            <span>Chưa có lịch học</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end items-center mt-auto pt-2">
                                    <Link href={`/admin/courses/${course._id}`} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400" title="Xem chi tiết">
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy khóa học</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hãy thử thay đổi bộ lọc của bạn.</p>
                    </div>
                )}
            </div>

            {isFormModalOpen && (
                <CourseFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSubmit={handleFormSubmit}
                />
            )}
        </div>
    );
}

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

function CourseFormModal({ isOpen, onClose, onSubmit }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        courseTypeId: '',
        startDate: '',
        maxStudents: 20,
        campusId: '', // Dùng để lọc phòng học
        classroomId: '',
        assistantTeacherId: '',
        schedule: []
    });

    const [options, setOptions] = useState({
        courseTypes: [],
        campuses: [],
        classrooms: [],
        teachers: []
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [resTypes, resCampuses, resClassrooms, resTeachers] = await Promise.all([
                    fetch('/api/course-types', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/campuses', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/users?role=teacher', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const [types, campuses, classrooms, teachers] = await Promise.all([
                    resTypes.json(), resCampuses.json(), resClassrooms.json(), resTeachers.json()
                ]);

                setOptions({
                    courseTypes: types.success ? types.data : [],
                    campuses: campuses.success ? campuses.data : [],
                    classrooms: classrooms.success ? classrooms.data : [],
                    teachers: teachers.success ? teachers.data : []
                });
            } catch (error) {
                console.error("Error fetching options:", error);
            }
        };
        if (isOpen) fetchOptions();
    }, [isOpen, token]);

    const filteredClassrooms = useMemo(() => {
        if (!formData.campusId) return [];
        return options.classrooms.filter(c => 
            c.campusId === formData.campusId || c.campusId?._id === formData.campusId
        );
    }, [options.classrooms, formData.campusId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSchedule = () => {
        setFormData(prev => ({
            ...prev,
            schedule: [...prev.schedule, { dayOfWeek: 2, startTime: '18:00', endTime: '20:00', teacherId: '' }]
        }));
    };

    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...formData.schedule];
        newSchedule[index][field] = value;
        setFormData(prev => ({ ...prev, schedule: newSchedule }));
    };

    const handleRemoveSchedule = (index) => {
        const newSchedule = formData.schedule.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, schedule: newSchedule }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thêm Khóa Học Mới</h3>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">&times;</button>
                    </div>
                    
                    <div className="px-6 py-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" placeholder="Tên khóa học" value={formData.name} onChange={handleChange} required className="input" />
                            <select name="courseTypeId" value={formData.courseTypeId} onChange={handleChange} required className="input">
                                <option value="">-- Chọn Loại Khóa Học --</option>
                                {options.courseTypes.map(ct => <option key={ct._id} value={ct._id}>{ct.name} ({ct.certificateType})</option>)}
                            </select>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="input" />
                            <input type="number" name="maxStudents" placeholder="Số lượng học viên tối đa" value={formData.maxStudents} onChange={handleChange} min="1" className="input" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-gray-700 pt-4">
                            <select name="campusId" value={formData.campusId} onChange={handleChange} className="input">
                                <option value="">-- Chọn Cơ Sở --</option>
                                {options.campuses.map(cp => <option key={cp._id} value={cp._id}>{cp.name}</option>)}
                            </select>
                            <select name="classroomId" value={formData.classroomId} onChange={handleChange} required className="input" disabled={!formData.campusId}>
                                <option value="">-- Chọn Phòng Học --</option>
                                {filteredClassrooms.map(cr => <option key={cr._id} value={cr._id}>{cr.name} (Sức chứa: {cr.capacity})</option>)}
                            </select>
                        </div>

                        <div className="border-t dark:border-gray-700 pt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trợ giảng (Optional)</label>
                            <select name="assistantTeacherId" value={formData.assistantTeacherId} onChange={handleChange} className="input w-full">
                                <option value="">-- Chọn Trợ Giảng --</option>
                                {options.teachers.map(t => <option key={t._id} value={t._id}>{t.fullName || t.username}</option>)}
                            </select>
                        </div>

                        <div className="border-t dark:border-gray-700 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lịch học cố định</label>
                                <button type="button" onClick={handleAddSchedule} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                    <PlusIcon className="w-4 h-4" /> Thêm buổi học
                                </button>
                            </div>
                            
                            {formData.schedule.map((slot, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-2 mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg items-end md:items-center">
                                    <select value={slot.dayOfWeek} onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)} className="input flex-1">
                                        <option value="1">Chủ Nhật</option>
                                        <option value="2">Thứ 2</option>
                                        <option value="3">Thứ 3</option>
                                        <option value="4">Thứ 4</option>
                                        <option value="5">Thứ 5</option>
                                        <option value="6">Thứ 6</option>
                                        <option value="7">Thứ 7</option>
                                    </select>
                                    <input type="time" value={slot.startTime} onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)} className="input w-24" />
                                    <span className="text-gray-500">-</span>
                                    <input type="time" value={slot.endTime} onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)} className="input w-24" />
                                    <select value={slot.teacherId} onChange={(e) => handleScheduleChange(index, 'teacherId', e.target.value)} className="input flex-1" required>
                                        <option value="">-- Giảng viên --</option>
                                        {options.teachers.map(t => <option key={t._id} value={t._id}>{t.fullName || t.username}</option>)}
                                    </select>
                                    <button type="button" onClick={() => handleRemoveSchedule(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {formData.schedule.length === 0 && <p className="text-sm text-gray-500 italic">Chưa có lịch học nào.</p>}
                        </div>
                    </div>

                    <div className="px-6 py-4 flex justify-end gap-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Hủy</button>
                        <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Tạo khóa học</button>
                    </div>
                </form>
            </div>
        </div>
    );
}