"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function MockTestTakePage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const testId = resolvedParams.id;
  
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mảng lưu câu trả lời: { [questionId]: { loaiCauHoi, cauTraLoiIndex, cauTraLoiIndices, cauTraLoiBoolean, cauTraLoiText } }
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/student/mock-tests/${testId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          setTestData(json.data);
          setTimeLeft(json.data.thoiGianLamBai * 60); // minutes to seconds
        } else {
          setError("Không thể tải bài thi.");
        }
      } catch (err) {
        setError("Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true); // Auto submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitting]);

  const handleAnswerChange = (questionId, loaiCauHoi, value) => {
    setAnswers(prev => {
      const currentAns = prev[questionId] || { loaiCauHoi };
      let newAns = { ...currentAns };

      if (loaiCauHoi === 'mcq') newAns.cauTraLoiIndex = value;
      else if (loaiCauHoi === 'multiSelect') {
        const indices = newAns.cauTraLoiIndices || [];
        if (indices.includes(value)) {
          newAns.cauTraLoiIndices = indices.filter(i => i !== value);
        } else {
          newAns.cauTraLoiIndices = [...indices, value];
        }
      }
      else if (loaiCauHoi === 'trueFalse') newAns.cauTraLoiBoolean = value;
      else if (loaiCauHoi === 'shortAnswer') newAns.cauTraLoiText = value;

      return { ...prev, [questionId]: newAns };
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      if (!confirm("Bạn có chắc chắn muốn nộp bài?")) return;
    }
    
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    const thoiGianLamBai = (testData.thoiGianLamBai * 60) - timeLeft;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/student/mock-tests/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({
          deThiMauID: testId,
          thoiGianLamBai,
          answers
        })
      });

      if (res.ok) {
        const result = await res.json();
        router.push(`/student/practice-tests/history/${result.data._id}`);
      } else {
        alert("Có lỗi khi nộp bài. Vui lòng thử lại.");
        setIsSubmitting(false);
      }
    } catch (err) {
      alert("Lỗi mạng khi nộp bài.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-10"><div className="animate-spin h-10 w-10 border-b-2 border-blue-500 mx-auto"></div></div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!testData) return <div className="text-center p-10">Không có dữ liệu bài thi</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderQuestion = (q, index) => {
    const ans = answers[q._id] || {};
    return (
      <div key={q._id} id={`q-${q._id}`} className="mb-6 p-5 bg-white rounded-lg border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-3 flex gap-2">
          <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full text-sm">
            {index + 1}
          </span>
          <div dangerouslySetInnerHTML={{ __html: q.noiDung }} className="pt-1"></div>
        </h4>

        <div className="pl-10 space-y-2">
          {q.loaiCauHoi === 'mcq' && q.luaChon.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
              <input 
                type="radio" 
                name={q._id} 
                checked={ans.cauTraLoiIndex === i}
                onChange={() => handleAnswerChange(q._id, 'mcq', i)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}

          {q.loaiCauHoi === 'multiSelect' && q.luaChon.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
              <input 
                type="checkbox" 
                checked={(ans.cauTraLoiIndices || []).includes(i)}
                onChange={() => handleAnswerChange(q._id, 'multiSelect', i)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}

          {q.loaiCauHoi === 'trueFalse' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={q._id} checked={ans.cauTraLoiBoolean === true} onChange={() => handleAnswerChange(q._id, 'trueFalse', true)} />
                <span>Đúng</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={q._id} checked={ans.cauTraLoiBoolean === false} onChange={() => handleAnswerChange(q._id, 'trueFalse', false)} />
                <span>Sai</span>
              </label>
            </div>
          )}

          {q.loaiCauHoi === 'shortAnswer' && (
            <input 
              type="text" 
              placeholder="Nhập câu trả lời của bạn..."
              value={ans.cauTraLoiText || ''}
              onChange={(e) => handleAnswerChange(q._id, 'shortAnswer', e.target.value)}
              className="w-full max-w-md p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          )}
        </div>
      </div>
    );
  };

  let globalQuestionIndex = 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 bg-white border-b shadow-sm py-4 px-6 z-10 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{testData.tenDe}</h1>
          <p className="text-sm text-gray-500">{testData.chungChi} • {testData.capDo}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-mono font-bold text-xl flex items-center shadow-sm">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400 shadow-sm"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {testData.phans?.map((phan, pIndex) => (
          <div key={phan._id} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-6">Phần {pIndex + 1}: {phan.tenPhan}</h2>
            
            {/* Questions without group */}
            {phan.cauHoi?.map(q => {
               const elem = renderQuestion(q, globalQuestionIndex);
               globalQuestionIndex++;
               return elem;
            })}

            {/* Groups */}
            {phan.nhom?.map((nhom, nIndex) => (
              <div key={nhom._id} className="mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="prose max-w-none text-gray-800 mb-6 bg-white p-4 rounded-lg shadow-sm" dangerouslySetInnerHTML={{ __html: nhom.noiDung }}></div>
                <div className="space-y-6">
                  {nhom.cauHoi?.map(q => {
                    const elem = renderQuestion(q, globalQuestionIndex);
                    globalQuestionIndex++;
                    return elem;
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="flex justify-center mt-12 mb-8">
           <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-xl text-lg transition-colors disabled:bg-gray-400 shadow-md"
          >
            {isSubmitting ? "Đang xử lý..." : "Nộp Bài Ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
