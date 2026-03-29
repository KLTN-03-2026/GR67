"use client";

export default function Students() {
  const students = [
    { id: 1, name: "Nguyễn Văn A", fullName: "Nguyễn Văn An", email: "nguyenvana@email.com", phone: "0123456789", status: "active", attendance: 85 },
    { id: 2, name: "Trần Thị B", fullName: "Trần Thị Bình", email: "tranthib@email.com", phone: "0987654321", status: "active", attendance: 92 },
    { id: 3, name: "Lê Văn C", fullName: "Lê Văn Cường", email: "levanc@email.com", phone: "0111111111", status: "inactive", attendance: 78 },
    { id: 4, name: "Phạm Thị D", fullName: "Phạm Thị Dung", email: "phamthid@email.com", phone: "0222222222", status: "active", attendance: 88 },
    { id: 5, name: "Hoàng Văn E", fullName: "Hoàng Văn Em", email: "hoangvane@email.com", phone: "0333333333", status: "active", attendance: 95 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Danh Sách Học Viên</h1>
        <p className="text-gray-600">Quản lý và theo dõi học viên trong các khóa học</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Học viên khóa Tiếng Anh Cơ Bản</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Học viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm danh (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-sm text-gray-500">{student.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.email}</div>
                    <div className="text-sm text-gray-500">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {student.status === 'active' ? 'Đang học' : 'Tạm nghỉ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2">{student.attendance}%</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${student.attendance >= 90 ? 'bg-green-600' :
                              student.attendance >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                          style={{ width: `${student.attendance}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê lớp học</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số học viên:</span>
              <span className="font-semibold">25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đang học:</span>
              <span className="font-semibold text-green-600">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm nghỉ:</span>
              <span className="font-semibold text-red-600">2</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Điểm danh trung bình</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: '87%' }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Tăng 5% so với tháng trước</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Học viên xuất sắc</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Nguyễn Văn An</span>
              <span className="text-sm font-semibold text-green-600">95%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Trần Thị Bình</span>
              <span className="text-sm font-semibold text-green-600">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Hoàng Văn Em</span>
              <span className="text-sm font-semibold text-green-600">95%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}