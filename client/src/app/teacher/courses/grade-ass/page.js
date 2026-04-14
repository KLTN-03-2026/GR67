"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import mammoth from "mammoth";
import { formatDateTimeDdMmYyyy } from "../../../../lib/dateFormat";

function DocxViewer({ url }) {
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        fetch(url, { headers })
            .then(async res => {
                if (!res.ok) throw new Error("Không thể tải file");
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("text/html")) throw new Error("Phản hồi là HTML");
                return res.arrayBuffer();
            })
            .then(arrayBuffer => {
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        setHtml(result.value || "<p>File trống.</p>");
                        setLoading(false);
                    })
                    .catch(e => {
                        setHtml(`<div class='text-red-500'>Lỗi đọc file: ${e.message}</div>`);
                        setLoading(false);
                    })
            })
            .catch(e => {
                setHtml(`<div class='text-red-500'>Không thể tải file: ${e.message}</div><a href="${url}" target="_blank" class="text-blue-500 hover:underline">Tải về</a>`);
                setLoading(false);
            });
    }, [url]);

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải tài liệu...</div>;

    return (
        <div className="bg-white shadow max-w-4xl mx-auto p-12 min-h-[800px] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: html }} className="docx-content [&>p]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4" />
        </div>
    );
}

function GradeAssignmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const assignmentId = searchParams.get("id");
    const submissionId = searchParams.get("submissionId");

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [diem, setDiem] = useState("");
    const [nhanxet, setNhanxet] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [removedFileIds, setRemovedFileIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg, type = "error") => {
        setToastMessage({ text: msg, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        if (!submissionId || submissionId === "null" || submissionId === "undefined") {
            setError(`Không tìm thấy ID bài nộp. (URL nhận được: id=${assignmentId}, submissionId=${submissionId})`);
            setLoading(false);
            return;
        }
        fetchSubmission();
    }, [submissionId]);

    const fetchSubmission = async () => {
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const response = await fetch(`${apiUrl}/teacher/submissions/${submissionId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setSubmission(data.data);
                if (data.data.diem !== undefined) setDiem(data.data.diem);
                if (data.data.nhanxet) setNhanxet(data.data.nhanxet);
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

    const handleSaveGrade = async () => {
        const maxDiem = submission?.baitapID?.diem || 100;
        if (diem === "" || Number(diem) < 0 || Number(diem) > maxDiem) {
            showToast(`Vui lòng nhập điểm hợp lệ (từ 0 đến ${maxDiem}).`, "error");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const formData = new FormData();
            formData.append("diem", Number(diem));
            if (nhanxet) formData.append("nhanxet", nhanxet);

            selectedFiles.forEach(file => {
                formData.append("files", file);
            });
            removedFileIds.forEach(id => {
                formData.append("removeFiles", id);
            });

            const response = await fetch(`${apiUrl}/teacher/submissions/${submissionId}/grade`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                showToast("Chấm điểm thành công!", "success");
                setTimeout(() => {
                    router.push(`/teacher/courses/detail-ass?id=${assignmentId}`);
                }, 1500);
            } else {
                showToast(data.message || "Có lỗi xảy ra khi chấm điểm.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối máy chủ.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickComment = (text) => {
        setNhanxet((prev) => (prev ? prev + "\n" + text : text));
    };

    const maxDiem = submission?.baitapID?.diem || 100;
    const studentName = submission?.dangkykhoahocID?.hocvienId?.userId?.hovaten || "Học viên ẩn danh";
    const studentInitials = studentName.split(" ").slice(-2).map(n => n?.[0] || "").join("");
    const submittedTime = submission?.thoigian ? formatDateTimeDdMmYyyy(submission.thoigian) : "--";

    const getFileUrl = (urlStr) => {
        let baseUrl = "http://localhost:3000";
        if (process.env.NEXT_PUBLIC_API_URL) {
            try { baseUrl = new URL(process.env.NEXT_PUBLIC_API_URL).origin; } catch (e) { }
        }
        const filename = typeof urlStr === 'string' ? urlStr.split(/[\\/]/).pop() : "";
        return `${baseUrl}/uploads/${filename}`;
    };

    if (loading) {
        return <div className="h-screen flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (error) {
        return <div className="h-screen flex flex-col justify-center items-center gap-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Quay lại</button>
        </div>;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100 font-sans">
            {/* HEADER */}
            <div className="h-16 bg-white border-b flex items-center px-6 gap-8 shrink-0">
                <button
                    onClick={() => router.push(`/teacher/courses/detail-ass?id=${assignmentId}`)}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-semibold transition"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Quay lại
                </button>

                <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                        {studentInitials}
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-gray-900">{studentName}</div>
                        <div className="text-xs text-gray-500">Nộp lúc: {submittedTime}</div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex flex-1 p-5 gap-5 overflow-hidden">
                {/* LEFT - Document Preview */}
                <div className="flex-[2] bg-white rounded-xl shadow flex flex-col overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <div>
                            <h3 className="font-bold text-gray-800">
                                {submission?.baitapID?.tieude || "Bài nộp"}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">File: {submission?.filenop?.url?.split(/[\\/]/).pop() || "Không có file"}</p>
                        </div>
                        {submission?.filenop && (
                            <button
                                onClick={() => window.open(getFileUrl(submission.filenop.url), '_blank')}
                                className="flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline bg-blue-50 px-3 py-1.5 rounded-md"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Tải xuống
                            </button>
                        )}
                    </div>

                    <div className="flex-1 bg-gray-200 overflow-y-auto">
                        {submission?.filenop ? (
                            submission.filenop.url.toLowerCase().endsWith('.docx') ? (
                                <DocxViewer url={getFileUrl(submission.filenop.url)} />
                            ) : submission.filenop.url.toLowerCase().endsWith('.pdf') || submission.filenop.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <iframe src={getFileUrl(submission.filenop.url)} className="w-full h-full bg-white" />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                                    <p className="text-gray-500 mb-4">Không có bản xem trước trực tiếp cho định dạng này.</p>
                                    <button
                                        onClick={() => window.open(getFileUrl(submission.filenop.url), '_blank')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Tải file về máy
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Học viên không đính kèm file.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT - Grading Panel */}
                <div className="flex-1 min-w-[350px] max-w-md bg-white rounded-xl shadow flex flex-col">
                    <div className="p-5 border-b font-bold text-gray-800 bg-gray-50 rounded-t-xl">
                        Chấm điểm & Nhận xét
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="mb-6">
                            <label className="block mb-2 font-semibold text-sm text-gray-700">
                                Điểm số
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max={maxDiem}
                                    value={diem}
                                    onChange={(e) => setDiem(e.target.value)}
                                    className="w-24 p-2 border-2 border-blue-500 rounded-lg text-xl font-bold text-center focus:outline-none focus:ring-0 focus:border-blue-600"
                                    placeholder="0"
                                />
                                <span className="text-gray-500 text-lg font-medium">/ {maxDiem}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-2 font-semibold text-sm text-gray-700">
                                Nhận xét
                            </label>
                            <textarea
                                rows="6"
                                value={nhanxet}
                                onChange={(e) => setNhanxet(e.target.value)}
                                placeholder="Viết nhận xét cho bài làm của học viên..."
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                            ></textarea>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-2 font-semibold text-sm text-gray-700">
                                File đáp án
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                            />

                            {/* File vừa chọn */}
                            {selectedFiles.length > 0 && (
                                <ul className="mb-3 space-y-1">
                                    {selectedFiles.map((f, i) => (
                                        <li key={i} className="flex justify-between items-center text-xs bg-blue-50 py-1.5 px-3 rounded-lg text-blue-800 border border-blue-100">
                                            <span className="truncate flex-1">{f.name}</span>
                                            <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="ml-2 text-red-500 font-bold hover:text-red-700 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition-colors">✕</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* File đã đính kèm từ trước */}
                            {submission?.filedapan && (
                                <ul className="space-y-1">
                                    {(() => {
                                        const arr = Array.isArray(submission.filedapan) ? submission.filedapan : [submission.filedapan];
                                        return arr.map((f, i) => {
                                            if (!f || removedFileIds.includes(f._id)) return null;
                                            const name = f.originalName || typeof f === 'object' ? f.url?.split(/[\\/]/).pop() : "File đáp án";
                                            return (
                                                <li key={f._id || i} className="flex justify-between items-center text-xs bg-gray-50 py-1.5 px-3 rounded-lg text-gray-700 border border-gray-200">
                                                    <span className="truncate flex-1">Đã đính kèm: <a href={getFileUrl(f.url)} target="_blank" className="text-blue-600 hover:underline">{name}</a></span>
                                                    <button type="button" onClick={() => setRemovedFileIds(prev => [...prev, f._id])} className="ml-2 text-red-500 font-bold hover:text-red-700 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition-colors" title="Xoá file này">✕</button>
                                                </li>
                                            );
                                        });
                                    })()}
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="font-semibold text-sm text-gray-700">
                                Nhận xét nhanh
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <span onClick={() => handleQuickComment("Làm bài rất tốt, tiếp tục phát huy nhé! 👍")} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                                    Làm bài tốt 👍
                                </span>
                                <span onClick={() => handleQuickComment("Bài làm còn nhiều thiếu sót, cần xem kỹ lại bài giảng.")} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium cursor-pointer hover:bg-orange-100 transition-colors">
                                    Cần cố gắng hơn
                                </span>
                                <span onClick={() => handleQuickComment("Trình bày sạch đẹp, rõ ràng.")} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium cursor-pointer hover:bg-green-100 transition-colors">
                                    Trình bày đẹp
                                </span>
                                <span onClick={() => handleQuickComment("Chưa hoàn thành đủ yêu cầu của bài tập.")} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium cursor-pointer hover:bg-red-100 transition-colors">
                                    Chưa đủ yêu cầu
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t bg-gray-50 rounded-b-xl">
                        <button
                            onClick={handleSaveGrade}
                            disabled={isSubmitting}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-sm transition-colors ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {isSubmitting ? "Đang gửi..." : "Hoàn tất chấm bài"}
                        </button>
                    </div>
                </div>
            </div>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-xl text-white font-medium transition-all transform z-50 ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
}

export default function GradeAssignment() {
    return (
        <Suspense fallback={<div className="h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>}>
            <GradeAssignmentContent />
        </Suspense>
    );
}
