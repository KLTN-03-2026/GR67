"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PracticeTestingPage() {
  const params = useParams();
  const router = useRouter();
  const practiceId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [practiceInfo, setPracticeInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const timerRef = useRef(null);

  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/student/practice/${practiceId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setPracticeInfo(data.luyenTap);
          setQuestions(data.items || []);
          
          if (data.luyenTap.thoiGianLamBai > 0) {
            setTimeLeft(data.luyenTap.thoiGianLamBai * 60);
          }
        } else {
          setError("Không thể tải chi tiết bài luyện tập");
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Lỗi kết nối mạng");
      } finally {
        setLoading(false);
      }
    };
    
    if (practiceId) fetchDetail();
  }, [practiceId]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  useEffect(() => {
    setFlipped(false);
  }, [currentIndex]);

  const handleAnswerChange = (val) => {
    if (submitted) return;
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: val
    }));
  };

  const handleMultiSelectToggle = (index) => {
    if (submitted) return;
    setAnswers(prev => {
      const currentArr = prev[currentIndex] || [];
      if (currentArr.includes(index)) {
        return { ...prev, [currentIndex]: currentArr.filter(i => i !== index) };
      } else {
        return { ...prev, [currentIndex]: [...currentArr, index] };
      }
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    let correctCount = 0;
    let gradeableTotal = 0;
    
    questions.forEach((q, idx) => {
      const ans = answers[idx];
      
      switch (q.loaiItem) {
        case "quiz":
          gradeableTotal++;
          if (ans === q.dapAnDungIndex) correctCount++;
          break;
        case "trueFalse":
          gradeableTotal++;
          if (ans === q.dapAnDungBoolean) correctCount++;
          break;
        case "shortAnswer":
          gradeableTotal++;
          if (ans != null && ans.toString().trim().toLowerCase() === q.dapAnDungText.trim().toLowerCase()) {
            correctCount++;
          }
          break;
        case "multiSelect":
          gradeableTotal++;
          const studentAns = Array.isArray(ans) ? [...ans].sort() : [];
          const correctAns = Array.isArray(q.dapAnDungIndices) ? [...q.dapAnDungIndices].sort() : [];
          if (JSON.stringify(studentAns) === JSON.stringify(correctAns)) {
            correctCount++;
          }
          break;
        case "flashcard":
          break;
      }
    });
    
    setScore({ correct: correctCount, total: gradeableTotal });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full"></div></div>;

  if (error || !practiceInfo) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white border border-red-500 rounded-xl text-center">
        <h2 className="text-red-500 font-bold text-xl mb-4">Lỗi: {error || "Không có dữ liệu"}</h2>
        <button onClick={() => router.back()} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded font-bold">Quay lại</button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex];

  const isCorrectReview = (idx) => {
    const q = questions[idx];
    const ans = answers[idx];
    if (q.loaiItem === 'quiz') return ans === q.dapAnDungIndex;
    if (q.loaiItem === 'trueFalse') return ans === q.dapAnDungBoolean;
    if (q.loaiItem === 'multiSelect') {
        const studentAns = Array.isArray(ans) ? [...ans].sort() : [];
        const correctAns = Array.isArray(q.dapAnDungIndices) ? [...q.dapAnDungIndices].sort() : [];
        return JSON.stringify(studentAns) === JSON.stringify(correctAns);
    }
    if (q.loaiItem === 'shortAnswer') {
        return ans != null && ans.toString().trim().toLowerCase() === q.dapAnDungText.trim().toLowerCase();
    }
    return true; 
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 mt-2">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 flex flex-col md:flex-row justify-between border border-gray-200">
        <div>
          <button onClick={() => router.back()} className="text-blue-500 hover:text-blue-700 text-sm font-medium mb-1">
            &larr; Quay lại danh sách
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{practiceInfo.tenBai}</h1>
          <p className="text-sm text-gray-500 mt-1">{practiceInfo.moTa}</p>
        </div>
        
        {timeLeft !== null && (
          <div className="mt-4 md:mt-0 flex items-center bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
            <span className={`font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-800'}`}>
              🕒 {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center shadow-sm">Chưa có câu hỏi nào.</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {submitted && score.total > 0 && (
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">Hoàn thành bài tập!</h2>
                  <p className="text-green-600">Điểm số của bạn: {score.correct}/{score.total}</p>
                </div>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-green-300 font-bold text-2xl text-green-600">
                  {Math.round((score.correct / score.total) * 100)}%
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                <span className="font-semibold text-gray-700">Câu hỏi {currentIndex + 1} / {questions.length}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded uppercase">
                  {currentQuestion.loaiItem}
                </span>
              </div>
              
              <div className="p-6 md:p-8 min-h-[300px] flex flex-col">
                <p className="text-lg font-medium text-gray-800 mb-8 whitespace-pre-wrap">{currentQuestion.noiDung}</p>

                <div className="flex-1 flex flex-col justify-center">
                  
                  {currentQuestion.loaiItem === "quiz" && (
                     <div className="space-y-3">
                       {currentQuestion.luaChon.map((opt, idx) => {
                         const isSelected = answers[currentIndex] === idx;
                         let btnClass = isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50";
                         
                         if (submitted) {
                           if (idx === currentQuestion.dapAnDungIndex) btnClass = "border-green-500 bg-green-50 text-green-900 font-bold";
                           else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-900 line-through";
                           else btnClass = "border-gray-200 opacity-50";
                         }
                         
                         return (
                           <button 
                             key={idx} onClick={() => handleAnswerChange(idx)} disabled={submitted}
                             className={`w-full text-left p-4 rounded-lg flex items-center gap-4 border-2 transition-colors ${btnClass}`}
                           >
                             <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}></div>
                             {opt}
                           </button>
                         );
                       })}
                     </div>
                  )}

                  {currentQuestion.loaiItem === "multiSelect" && (
                    <div className="space-y-3">
                      {currentQuestion.luaChon.map((opt, idx) => {
                         const selectedArr = answers[currentIndex] || [];
                         const isSelected = selectedArr.includes(idx);
                         let btnClass = isSelected ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:bg-gray-50";
                         
                         if (submitted) {
                           const isCorrectChoice = currentQuestion.dapAnDungIndices.includes(idx);
                           if (isCorrectChoice) btnClass = "border-green-500 bg-green-50 font-bold"; 
                           else if (isSelected && !isCorrectChoice) btnClass = "border-red-500 bg-red-50 line-through";
                           else btnClass = "border-gray-200 opacity-50";
                         }

                         return (
                           <button 
                             key={idx} onClick={() => handleMultiSelectToggle(idx)} disabled={submitted}
                             className={`w-full text-left p-4 rounded-lg flex items-center gap-4 border-2 transition-colors ${btnClass}`}
                           >
                             <div className={`w-5 h-5 rounded border-2 ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}></div>
                             {opt}
                           </button>
                         );
                      })}
                    </div>
                  )}

                  {currentQuestion.loaiItem === "trueFalse" && (
                    <div className="flex gap-4">
                      {[true, false].map((val) => {
                        const isSelected = answers[currentIndex] === val;
                        let btnClass = isSelected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50";

                        if (submitted) {
                          if (val === currentQuestion.dapAnDungBoolean) btnClass = "border-green-500 bg-green-50 font-bold";
                          else if (isSelected) btnClass = "border-red-500 bg-red-50 line-through";
                          else btnClass = "border-gray-200 opacity-50";
                        }

                        return (
                          <button
                            key={val ? "true" : "false"} onClick={() => handleAnswerChange(val)} disabled={submitted}
                            className={`flex-1 p-6 rounded-xl border-2 font-bold text-lg ${btnClass}`}
                          >
                            {val ? "ĐÚNG" : "SAI"}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.loaiItem === "shortAnswer" && (
                    <div className="space-y-4">
                      <input 
                        type="text" disabled={submitted} value={answers[currentIndex] || ""} onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Nhập câu trả lời..."
                        className={`w-full p-4 text-lg border-2 rounded focus:outline-none ${submitted ? (isCorrectReview(currentIndex) ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50") : "border-gray-300"}`}
                      />
                      {submitted && !isCorrectReview(currentIndex) && (
                        <div className="p-3 bg-green-100 text-green-900 font-bold rounded">Đáp án đúng: {currentQuestion.dapAnDungText}</div>
                      )}
                    </div>
                  )}

                  {currentQuestion.loaiItem === "flashcard" && (
                    <div className="flex justify-center perspective-1000">
                      <div onClick={() => setFlipped(!flipped)} className={`relative w-full max-w-sm h-64 rounded-xl shadow cursor-pointer transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 backface-hidden bg-blue-600 rounded-xl flex items-center justify-center p-6 text-white text-center text-xl font-bold">
                           {currentQuestion.matTruoc}
                        </div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-blue-600 rounded-xl flex items-center justify-center p-6 text-blue-900 text-center text-xl">
                           {currentQuestion.matSau}
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

              <div className="bg-gray-50 border-t p-4 flex justify-between items-center">
                <button 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-5 py-2 font-medium bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                  >Trước</button>
                
                {currentIndex === questions.length - 1 ? (
                  <button onClick={handleSubmit} disabled={submitted} className="px-6 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
                    {submitted ? "Đã nộp" : "Nộp bài"}
                  </button>
                ) : (
                  <button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} className="px-5 py-2 font-medium bg-white border border-gray-300 rounded hover:bg-gray-100">
                    Tiếp</button>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-64 shrink-0">
             <div className="bg-white rounded-xl shadow border border-gray-200 p-5 sticky top-6">
                <h3 className="font-bold mb-3">Danh sách câu</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isFocussed = currentIndex === idx;
                    let hasAnswered = answers[idx] !== undefined && q.loaiItem !== 'flashcard';
                    if (q.loaiItem === 'multiSelect') hasAnswered = Array.isArray(answers[idx]) && answers[idx].length > 0;

                    let c = "bg-white border-gray-300 text-gray-600";
                    if (submitted && q.loaiItem !== 'flashcard') c = isCorrectReview(idx) ? "bg-green-500 text-white" : "bg-red-500 text-white";
                    else if (!submitted && hasAnswered) c = "bg-blue-100 text-blue-800 border-blue-300";
                    if (!submitted && isFocussed) c += " ring-2 ring-blue-500";

                    return (
                      <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-full aspect-square flex items-center justify-center rounded border font-semibold text-sm ${c}`}>
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
                {!submitted && <button onClick={handleSubmit} className="w-full mt-6 py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-900">Nộp bài ngay</button>}
             </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
