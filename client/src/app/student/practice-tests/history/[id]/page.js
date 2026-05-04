"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function MockTestResultPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const resultId = resolvedParams.id;
  
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/student/mock-tests/history/${resultId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          setResultData(json.data);
        } else {
          setError("Không thể tải kết quả.");
        }
      } catch (err) {
        setError("Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResult();
  }, [resultId]);

  if (loading) return <div className="text-center p-10"><div className="animate-spin h-10 w-10 border-b-2 border-blue-500 mx-auto"></div></div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!resultData) return <div className="text-center p-10">Không có dữ liệu bài thi</div>;

  const { deThiMauID, diemSo, tongSoCau, soCauDung, thoiGianLamBai, chiTiet } = resultData;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderCorrectAnswer = (detail) => {
    const { loaiCauHoi, dapAnDungIndex, dapAnDungIndices, dapAnDungBoolean, dapAnDungText, cauHoiId } = detail;
    const luaChon = cauHoiId?.luaChon || [];

    if (loaiCauHoi === 'mcq') {
       return luaChon[dapAnDungIndex] || `Option ${dapAnDungIndex + 1}`;
    }
    if (loaiCauHoi === 'multiSelect') {
       return (dapAnDungIndices || []).map(idx => luaChon[idx]).join(", ");
    }
    if (loaiCauHoi === 'trueFalse') {
       return dapAnDungBoolean ? "Đúng" : "Sai";
    }
    if (loaiCauHoi === 'shortAnswer') {
       return dapAnDungText;
    }
    return "";
  };

  const renderStudentAnswer = (detail) => {
    const { loaiCauHoi, cauTraLoiIndex, cauTraLoiIndices, cauTraLoiBoolean, cauTraLoiText, cauHoiId } = detail;
    const luaChon = cauHoiId?.luaChon || [];

    if (loaiCauHoi === 'mcq') {
       return cauTraLoiIndex !== null && cauTraLoiIndex !== undefined ? (luaChon[cauTraLoiIndex] || `Option ${cauTraLoiIndex + 1}`) : "(Chưa trả lời)";
    }
    if (loaiCauHoi === 'multiSelect') {
       if (!cauTraLoiIndices || cauTraLoiIndices.length === 0) return "(Chưa trả lời)";
       return cauTraLoiIndices.map(idx => luaChon[idx]).join(", ");
    }
    if (loaiCauHoi === 'trueFalse') {
       return cauTraLoiBoolean !== null && cauTraLoiBoolean !== undefined ? (cauTraLoiBoolean ? "Đúng" : "Sai") : "(Chưa trả lời)";
    }
    if (loaiCauHoi === 'shortAnswer') {
       return cauTraLoiText || "(Chưa trả lời)";
    }
    return "(Chưa trả lời)";
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        
        <Link href="/student/practice-tests" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại danh sách đề thi
        </Link>
        
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white text-center">
             <h1 className="text-2xl font-bold mb-2">Kết Quả Bài Thi</h1>
             <p className="opacity-90">{deThiMauID.tenDe} ({deThiMauID.chungChi} - {deThiMauID.capDo})</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Điểm Số</p>
                <p className="text-4xl font-black text-blue-600">{diemSo}<span className="text-xl text-gray-400 font-medium">/10</span></p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-600 uppercase tracking-widest mb-1">Số Câu Đúng</p>
                <p className="text-4xl font-black text-green-700">{soCauDung}<span className="text-xl opacity-60 font-medium">/{tongSoCau}</span></p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-sm text-orange-600 uppercase tracking-widest mb-1">Thời Gian</p>
                <p className="text-4xl font-black text-orange-700">{formatTime(thoiGianLamBai)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Answers Section */}
        <div>
           <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
             <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
             Chi Tiết Bài Làm
           </h3>
           <div className="space-y-4">
             {chiTiet.map((item, index) => {
               const stAns = renderStudentAnswer(item);
               const corAns = renderCorrectAnswer(item);
               
               return (
                 <div key={item._id || index} className={`bg-white rounded-xl p-5 border-l-4 shadow-sm flex flex-col md:flex-row gap-6 ${item.ketQua ? 'border-green-500' : 'border-red-500'}`}>
                   
                   <div className="flex-1">
                     <div className="flex items-start gap-3 mb-3">
                       <span className={`shrink-0 flex items-center justify-center w-7 h-7 mt-0.5 rounded-full text-xs font-bold ${item.ketQua ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {index + 1}
                       </span>
                       <div className="text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.cauHoiId?.noiDung || "Câu hỏi không tồn tại" }}></div>
                     </div>
                   </div>

                   <div className="shrink-0 w-full md:w-64 space-y-3 pt-1 md:border-l md:border-gray-100 pl-0 md:pl-6 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Bạn chọn:
                        </p>
                        <p className={`font-semibold ${item.ketQua ? 'text-green-600' : 'text-red-600'}`}>{stAns}</p>
                      </div>

                      {!item.ketQua && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Đáp án đúng:
                          </p>
                          <p className="font-semibold text-gray-800 underline decoration-green-400 decoration-2 underline-offset-2">{corAns}</p>
                        </div>
                      )}
                   </div>

                 </div>
               );
             })}
           </div>
        </div>

      </div>
    </div>
  );
}
