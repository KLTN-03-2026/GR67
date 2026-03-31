"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";

// Icons
const ArrowLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const UserIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const CalendarIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const BookOpenIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const MapPinIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;

const dayOfWeekToString = (day) => {
  const days = ['CN', 'Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[day] || 'N/A';
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, curriculum

  const COURSE_API_URL = `/api/courses/${id}`;
  const LESSONS_API_URL = `/api/lessons`; // Assuming filtering by courseTypeId is possible

  useEffect(() => {
    if (!token || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Course Detail
        const courseRes = await fetch(COURSE_API_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!courseRes.ok) throw new Error('Không thể tải thông tin khóa học');
        const courseData = await courseRes.json();
        
        if (!courseData.success) throw new Error(courseData.message);
        setCourse(courseData.data);

        // 2. Fetch Lessons based on Course Type if available
        if (courseData.data?.courseTypeId?._id) {
          const lessonsRes = await fetch(`${LESSONS_API_URL}?courseTypeId=${courseData.data.courseTypeId._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const lessonsData = await lessonsRes.json();
          if (lessonsData.success) {
            setLessons(lessonsData.data);
          }
        }

      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, COURSE_API_URL, LESSONS_API_URL]);

  if (loading) return <div className="p-8 text-center dark:text-gray-400">Đang tải thông tin khóa học...</div>;
  if (error) return <div className="p-8 text-center text-red-500 dark:text-red-400">Lỗi: {error}</div>;
  if (!course) return <div className="p-8 text-center dark:text-gray-400">Không tìm thấy khóa học</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/courses" className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {course.courseTypeId?.name} &middot; Bắt đầu: {new Date(course.startDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Stats / Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sĩ số</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{course.students?.length || 0} / {course.maxStudents}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phòng học</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{course.classroomId?.name || 'Chưa cập nhật'}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
              <BookOpenIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Số buổi học</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{lessons.length} bài học</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Thông tin chung
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Danh sách học viên ({course.students?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'curriculum'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Nội dung đào tạo
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lịch học hàng tuần</h3>
                {course.schedule && course.schedule.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.schedule.map((slot, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{dayOfWeekToString(slot.dayOfWeek)}</span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {slot.teacherId?.fullName?.charAt(0) || 'GV'}
                          </div>
                          <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Giảng viên</p>
                            <p className="font-medium text-gray-900 dark:text-white">{slot.teacherId?.fullName || 'Chưa phân công'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Chưa có lịch học.</p>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin bổ sung</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Trợ giảng</p>
                    <p className="font-medium text-gray-900 dark:text-white">{course.assistantTeacherId?.fullName || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loại chứng chỉ</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {course.courseTypeId?.certificateType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ngày tạo</p>
                    <p className="text-gray-900 dark:text-white">{new Date(course.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">STT</th>
                    <th scope="col" className="px-6 py-3">Họ và tên</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">Số điện thoại</th>
                    <th scope="col" className="px-6 py-3">Giới tính</th>
                  </tr>
                </thead>
                <tbody>
                  {course.students && course.students.length > 0 ? (
                    course.students.map((student, index) => (
                      <tr key={student._id || index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4">{index + 1}</td>
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          {student.fullName}
                        </th>
                        <td className="px-6 py-4">{student.email}</td>
                        <td className="px-6 py-4">{student.phone || student.Numberphone || 'N/A'}</td>
                        <td className="px-6 py-4">{student.gender || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Chưa có học viên nào trong khóa học này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Danh sách bài học ({lessons.length})</h3>
            <div className="space-y-3">
              {lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <div key={lesson._id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{lesson.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{lesson.content?.length || 0} tài liệu đính kèm</p>
                      </div>
                    </div>
                    {/* Placeholder for actions if needed */}
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">Chưa có bài học nào được tạo cho loại khóa học này.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
