"use client";

export default function Announcements() {
  const announcements = [
    {
      id: 1,
      title: "Thông báo nghỉ lễ Tết Nguyên Đán",
      content: "Trung tâm sẽ nghỉ từ ngày 08/02/2024 đến 14/02/2024 nhân dịp Tết Nguyên Đán. Các lớp học sẽ được bù vào tuần sau.",
      type: "general",
      priority: "high",
      targetAudience: "All",
      publishedDate: "2024-01-15",
      publishedBy: "Admin",
      status: "published",
      views: 245,
      likes: 12
    },
    {
      id: 4,
      title: "Khảo sát chất lượng giảng dạy",
      content: "Vui lòng tham gia khảo sát chất lượng giảng dạy để chúng tôi cải thiện dịch vụ tốt hơn.",
      type: "survey",
      priority: "low",
      targetAudience: "All",
      publishedDate: "2024-01-22",
      publishedBy: "Admin",
      status: "draft",
      views: 0,
      likes: 0
    }
  ];

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'general': return 'bg-blue-100 text-blue-600';
      case 'survey': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'general': return 'Thông báo chung';
      case 'survey': return 'Khảo sát';
      default: return type;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      {/* Header chính */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thông Báo</h1>
      </div>

      {/* Danh sách thông báo */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Danh sách thông báo</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {announcements.map((item) => (
            <div key={item.id} className="p-6">
              {/* Dòng tiêu đề và lượt xem */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(item.type)}`}>
                    {getTypeText(item.type)}
                  </span>
                </div>
                {item.status === 'published' && (
                  <div className="text-xs text-gray-400 text-right">
                    <div>{item.views} lượt xem</div>
                    <div>{item.likes} lượt thích</div>
                  </div>
                )}
              </div>

              {/* Nội dung đoạn văn */}
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {item.content}
              </p>

              {/* Thông tin metadata */}
              <div className="flex space-x-6 text-sm text-gray-400 mb-6">
                <div><span className="font-semibold text-gray-500">Đối tượng:</span> {item.targetAudience}</div>
                <div><span className="font-semibold text-gray-500">Người đăng:</span> {item.publishedBy}</div>
                <div><span className="font-semibold text-gray-500">Ngày đăng:</span> {item.publishedDate}</div>
              </div>

              {/* Thanh hành động cuối thẻ */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="flex space-x-6">

                  <button className="text-red-500 hover:text-red-700 text-sm font-medium">
                    Xóa
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-gray-400">

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}