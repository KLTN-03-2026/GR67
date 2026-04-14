"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

import { formatDateTimeDdMmYyyy } from "../../../../lib/dateFormat";

import mammoth from "mammoth";

function DocxViewer({ url }) {
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Thử lấy token nếu url được bảo vệ
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        fetch(url, { headers })
            .then(async res => {
                // Kiểm tra nếu request bị lỗi 404 hoặc lỗi server
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} - Khộng tìm thấy hoặc server từ chối truy cập file.`);
                }

                // Kiểm tra Content-Type xem có phải là trang HTML không
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("text/html")) {
                    throw new Error("Phản hồi từ máy chủ là giao diện HTML, không phải file Word hợp lệ. (Có thể URL file không tồn tại hoặc yêu cầu phân quyền).");
                }

                return res.arrayBuffer();
            })
            .then(arrayBuffer => {
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        setHtml(result.value || "<p class='text-gray-500 italic'>File văn bản trống.</p>");
                        setLoading(false);
                    })
                    .catch(e => {
                        console.error("Lỗi parse file word:", e);
                        setHtml(`<div class='bg-red-50 p-4 rounded-lg text-red-600 border border-red-200'>
                            <h4 class='font-bold mb-2'>Lỗi giải mã file Word</h4>
                            <p class='text-sm mb-2'>${e.message || "Tệp hỏng hoặc không đúng định dạng .docx."}</p>
                            <a href="${url}" target="_blank" download class='inline-block mt-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition'>Tải file xuống thủ công</a>
                        </div>`);
                        setLoading(false);
                    })
            })
            .catch(e => {
                console.error("Lỗi fetch file:", e);
                setHtml(`<div class='bg-red-50 p-4 rounded-lg text-red-600 border border-red-200'>
                    <h4 class='font-bold mb-2'>Không thể lấy dữ liệu file</h4>
                    <p class='text-sm mb-2'>${e.message}</p>
                    <a href="${url}" target="_blank" download class='inline-block mt-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition'>Thử tải file xuống trực tiếp</a>
                </div>`);
                setLoading(false);
            });
    }, [url]);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-full w-full bg-white shadow-xl min-h-[500px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <span className="text-gray-500">Đang tải tài liệu về máy...</span>
        </div>
    );

    return (
        <div className="bg-white shadow-xl min-h-[500px] w-full p-8 overflow-y-auto text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: html }} className="docx-content [&>p]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>table]:border-collapse [&>table]:w-full [&>table]:mb-4 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&>img]:max-w-full [&>img]:h-auto" />
        </div>
    );
}


function AssignmentDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const assignmentId = searchParams.get("id");

    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");

    const [assignment, setAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // States for file preview modal
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    // Toast state
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg, type = "error") => {
        setToastMessage({ text: msg, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleRemind = async (student) => {
        try {
            if (!student.userId) {
                showToast("Không tìm thấy ID người dùng để gửi thông báo", "error");
                return;
            }
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(`${apiUrl}/teacher/assignments/${assignmentId}/remind`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: student.userId })
            });

            const data = await response.json();
            if (data.success) {
                showToast(`Đã gửi nhắc nhở tới ${student.name}`, "success");
            } else {
                showToast(data.message || "Lỗi gửi nhắc nhở", "error");
            }
        } catch (error) {
            console.error("Lỗi gửi nhắc nhở:", error);
            showToast("Lỗi kết nối máy chủ", "error");
        }
    };

    useEffect(() => {
        if (!assignmentId) {
            setError("Không tìm thấy bài tập");
            setLoading(false);
            return;
        }
        fetchDetails();
    }, [assignmentId]);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(`${apiUrl}/teacher/assignments/${assignmentId}/submissions`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setAssignment(data.data.assignment);
                setStudents(data.data.students);
            } else {
                setError(data.message || "Lỗi tải dữ liệu");
            }
        } catch (err) {
            console.error(err);
            setError("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    // FILTER
    const filteredStudents = students.filter((s) => {
        let matchTab = true;
        if (tab === "submitted") {
            matchTab = s.status === "submitted" || s.status === "graded";
        } else if (tab === "notSubmitted") {
            matchTab = s.status === "notSubmitted";
        }

        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase());

        return matchTab && matchSearch;
    });

    const getStatusText = (status) => {
        if (status === "graded") return "Đã chấm";
        if (status === "submitted") return "Đã nộp";
        return "Chưa nộp";
    };

    const getStatusBadgeClass = (status) => {
        if (status === "graded") return "bg-blue-100 text-blue-700";
        if (status === "submitted") return "bg-green-100 text-green-700";
        return "bg-yellow-100 text-yellow-700";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-6">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => router.push("/teacher/courses/assignments")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-100 min-h-screen">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => router.push("/teacher/courses/assignments")}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
                >
                    ← Quay lại
                </button>
            </div>

            {/* INFO */}
            {assignment && (
                <div className="bg-white rounded-xl shadow border p-8 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-blue-600 text-sm font-bold uppercase">
                                {assignment.loai === "test" ? "Bài kiểm tra" : assignment.loai === "homework" ? "Bài tập về nhà" : "Bài tập"}
                            </span>
                            <h1 className="text-2xl font-extrabold mt-1">
                                {assignment.tieude}
                            </h1>
                        </div>

                        {new Date() > new Date(assignment.hannop) ? (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                                Quá hạn
                            </span>
                        ) : (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                Đang mở
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y">
                        <div>
                            <p className="text-sm text-gray-500">📅 Hạn nộp</p>
                            <p className="font-semibold">{formatDateTimeDdMmYyyy(assignment.hannop)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">🎯 Thang điểm</p>
                            <p className="font-semibold">{assignment.diem} điểm</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">📎 File đính kèm</p>
                            {assignment.file ? (
                                <div>
                                    <button
                                        onClick={() => {
                                            let baseUrl = "http://localhost:3000";
                                            if (process.env.NEXT_PUBLIC_API_URL) {
                                                try {
                                                    baseUrl = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
                                                } catch (e) { }
                                            }
                                            const filename = assignment.file.url.split(/[\\/]/).pop();
                                            const fileUrl = `${baseUrl}/uploads/${filename}`;

                                            console.log("URL tài liệu:", fileUrl);
                                            setPreviewUrl(fileUrl);
                                            setIsPreviewOpen(true);
                                        }}
                                        className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left"
                                        title={assignment.file.url.split(/[\\/]/).pop()}
                                    >
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                        </svg>
                                        Xem file đính kèm: {assignment.file.url.split(/[\\/]/).pop().replace(/^\d+-\d+-/, '')}
                                    </button>
                                </div>
                            ) : (
                                <span className="text-gray-500 text-sm">Không có</span>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h5 className="font-semibold mb-2">Nội dung hướng dẫn</h5>
                        <p className="text-gray-600 whitespace-pre-wrap">
                            {assignment.mota || "Không có hướng dẫn chi tiết."}
                        </p>
                    </div>
                </div>
            )}

            {/* STUDENTS */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                {/* TABS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 border-b">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab("all")}
                            className={`px-5 py-4 font-semibold border-b-2 ${tab === "all"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            Tất cả ({students.length})
                        </button>

                        <button
                            onClick={() => setTab("submitted")}
                            className={`px-5 py-4 font-semibold border-b-2 ${tab === "submitted"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            Đã nộp/chấm ({students.filter(s => s.status !== "notSubmitted").length})
                        </button>

                        <button
                            onClick={() => setTab("notSubmitted")}
                            className={`px-5 py-4 font-semibold border-b-2 ${tab === "notSubmitted"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            Chưa nộp ({students.filter(s => s.status === "notSubmitted").length})
                        </button>
                    </div>

                    <div className="pb-4 sm:pb-0">
                        <input
                            type="text"
                            placeholder="Tìm học viên..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Học viên</th>
                                <th className="px-6 py-4 font-medium">Trạng thái</th>
                                <th className="px-6 py-4 font-medium">Thời gian nộp</th>
                                <th className="px-6 py-4 font-medium">Điểm</th>
                                <th className="px-6 py-4 text-right font-medium">Hành động</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.length > 0 ? filteredStudents.map((s, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold uppercase">
                                                {s.name.split(" ").slice(-2).map(n => n?.[0] || "").join("")}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{s.name}</div>
                                                <div className="text-xs text-gray-500">{s.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(s.status)}`}>
                                            {getStatusText(s.status)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-gray-600">{s.date}</td>

                                    <td className={`px-6 py-4 font-semibold ${s.status === "graded" ? "text-blue-600" :
                                            s.status === "submitted" ? "text-yellow-600" : "text-gray-400"
                                        }`}>
                                        {s.score}
                                    </td>

                                    <td className="px-6 py-4 flex justify-end gap-2">
                                        {s.status !== "notSubmitted" ? (
                                            <button
                                                onClick={() => router.push(`/teacher/courses/grade-ass?id=${assignmentId}&submissionId=${s.submissionId}`)}
                                                className="px-3 py-1.5 text-sm rounded-md bg-green-50 text-green-700 hover:bg-green-600 hover:text-white transition-colors"
                                            >
                                                {s.status === "graded" ? "Xem / Chấm lại" : "Chấm điểm"}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRemind(s)}
                                                className="px-3 py-1.5 text-sm rounded-md bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white transition-colors"
                                            >
                                                Nhắc nhở
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Không tìm thấy học viên nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Chi tiết nội dung file</h3>
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body / Iframe */}
                        <div className="flex-1 bg-gray-200 p-4 sm:p-8 overflow-y-auto w-full h-full flex justify-center">
                            {previewUrl.toLowerCase().endsWith('.pdf') || previewUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full bg-white shadow-xl min-h-[500px]"
                                    title="File Preview"
                                />
                            ) : previewUrl.toLowerCase().endsWith('.docx') ? (
                                <DocxViewer url={previewUrl} />
                            ) : (
                                <div className="bg-white w-full max-w-3xl h-full shadow-xl p-8 flex flex-col items-center justify-center text-center">
                                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h4 className="text-lg font-bold text-gray-700 mb-2">Không thể xem trực tiếp định dạng này</h4>
                                    <p className="text-sm text-gray-500 mb-4">Trình duyệt không hỗ trợ xem trực tiếp các file như .docx, .xlsx, .pptx... Vui lòng tải xuống để xem chi tiết.</p>
                                    <button
                                        onClick={() => window.open(previewUrl, '_blank')}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                                    >
                                        Tải file xuống
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-xl text-white font-medium transition-all transform z-50 ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
}

export default function AssignmentDetail() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>}>
            <AssignmentDetailContent />
        </Suspense>
    );
}