"use client";

export default function Page() {
    const attendanceList = [
        { id: 1, name: "Nguyễn Văn An", email: "nguyenvana@email.com", avatar: "NA", status: "Có mặt" },
        { id: 2, name: "Minh Tuấn", email: "tuanminh@email.com", avatar: "MT", status: "Vắng mặt" },
    ];

    const materials = [
        { name: "Bai-giang-co-ban.pdf", type: "pdf", action: "Tải về" },
        { name: "Video-huong-dan-phat-am.mp4", type: "video", action: "Xem" },
        { name: "Bai-tap-ve-nha.docx", type: "doc", action: "Tải về" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">
                    Bài học 1: Chào hỏi cơ bản
                </h1>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                    Đã hoàn thành
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT */}
                <div className="space-y-6">

                    {/* INFO */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="font-bold mb-3">Thông tin buổi học</h2>

                        <p><b>📅 Ngày:</b> 2024-01-15</p>
                        <p><b>⏰ Thời gian:</b> 09:00 - 10:30</p>
                        <p><b>📝 Ghi chú:</b> Học viên tham gia tích cực</p>
                    </div>

                    {/* MATERIAL */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="font-bold mb-3">Tài liệu</h2>

                        {materials.map((m, i) => (
                            <div key={i} className="flex justify-between py-2 border-b">
                                <span>{m.name}</span>
                                <button className="text-blue-600 text-sm">
                                    {m.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
                    <h2 className="font-bold mb-4">
                        Danh sách điểm danh
                    </h2>

                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Học viên</th>
                                <th className="text-center p-2">Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {attendanceList.map((s) => (
                                <tr key={s.id} className="border-b">
                                    <td className="p-2">
                                        <div className="font-bold">{s.name}</div>
                                        <div className="text-sm text-gray-500">{s.email}</div>
                                    </td>

                                    <td className="text-center p-2">
                                        <span className={
                                            s.status === "Có mặt"
                                                ? "text-green-600 font-bold"
                                                : "text-red-600 font-bold"
                                        }>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
}