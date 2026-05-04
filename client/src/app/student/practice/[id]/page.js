"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

  // Thêm state để track xem flashcard đã lật chưa
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

  // Hook Countdown Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    
    if (timeLeft <= 0) {
      handleSubmit(); // Auto submit when time runs out
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  // Handle thay đổi câu hỏi reset trạng thái flip
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
          // Compare sorted arrays
          const studentAns = Array.isArray(ans) ? [...ans].sort() : [];
          const correctAns = Array.isArray(q.dapAnDungIndices) ? [...q.dapAnDungIndices].sort() : [];
          if (JSON.stringify(studentAns) === JSON.stringify(correctAns)) {
            correctCount++;
          }
          break;
        case "flashcard":
          // Flashcard is not normally graded
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !practiceInfo) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm text-center border border-red-100">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy dữ liệu"}</p>
        <button onClick={() => router.back()} className="px-5 py-2 bg-gray-200 rounded-lg font-medium">Trở lại</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Helper check correctness cho UI lúc review (submitted = true)
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
    return true; // Flashcard
  };

  return (
    <div className="max-w-5xl mx-auto min-h-screen pb-20">
      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-200">
        <div>
          <button onClick={() => router.back()} className="text-blue-500 hover:text-blue-700 text-sm font-medium mb-1 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại danh sách
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{practiceInfo.tenBai}</h1>
          <p className="text-sm text-gray-500 mt-1">{practiceInfo.moTa}</p>
        </div>
        
        {timeLeft !== null && (
          <div className="mt-4 md:mt-0 flex items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <svg className={`w-5 h-5 mr-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className={`font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
          <p className="text-gray-500">Bài luyện tập này chưa có câu hỏi nào.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Question Area */}
          <div className="flex-1">
            {submitted && score.total > 0 && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-900 mb-1">Kết quả bài làm</h2>
                  <p className="text-blue-700">Tuyệt vời! Bạn đã hoàn thành bài luyện tập.</p>
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-blue-200 flex items-center justify-center bg-white shadow-inner">
                  <span className="text-2xl font-bold text-blue-600">{score.correct}/{score.total}</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                <span className="font-semibold text-gray-700">Câu hỏi {currentIndex + 1} / {questions.length}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded uppercase">
                  {currentQuestion.loaiItem}
                </span>
              </div>
              
              <div className="p-6 md:p-8 min-h-[300px] flex flex-col">
                <p className="text-lg font-medium text-gray-800 mb-8 whitespace-pre-wrap">
                  {currentQuestion.noiDung}
                </p>

                {/* Question Type Interfaces */}
                <div className="flex-1 flex flex-col justify-center">
                  
                  {/* === QUIZ === */}
                  {currentQuestion.loaiItem === "quiz" && (
                     <div className="space-y-3">
                       {currentQuestion.luaChon.map((opt, idx) => {
                         const isSelected = answers[currentIndex] === idx;
                         let btnClass = "border-gray-200 hover:bg-gray-50 bg-white";
                         if (isSelected) btnClass = "border-blue-500 bg-blue-50 shadow-sm";
                         
                         // Review mode styling
                         if (submitted) {
                           if (idx === currentQuestion.dapAnDungIndex) btnClass = "border-green-500 bg-green-50 text-green-900"; // correct answer
                           else if (isSelected && (idx !== currentQuestion.dapAnDungIndex)) btnClass = "border-red-500 bg-red-50 text-red-900 line-through"; // wrong selection
                           else btnClass = "border-gray-200 bg-gray-50 opacity-60"; // others
                         }
                         
                         return (
                           <button 
                             key={idx}
                             onClick={() => handleAnswerChange(idx)}
                             disabled={submitted}
                             className={`w-full text-left p-4 rounded-lg flex items-center gap-4 border-2 transition-all duration-200 ${btnClass}`}
                           >
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                               {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                             </div>
                             <span className="text-gray-800">{opt}</span>
                           </button>
                         );
                       })}
                     </div>
                  )}

                  {/* === MULTI SELECT === */}
                  {currentQuestion.loaiItem === "multiSelect" && (
                    <div className="space-y-3">
                      {currentQuestion.luaChon.map((opt, idx) => {
                         const selectedArr = answers[currentIndex] || [];
                         const isSelected = selectedArr.includes(idx);
                         let btnClass = "border-gray-200 hover:bg-gray-50 bg-white";
                         if (isSelected) btnClass = "border-teal-500 bg-teal-50 shadow-sm";
                         
                         if (submitted) {
                           const isCorrectChoice = currentQuestion.dapAnDungIndices.includes(idx);
                           if (isCorrectChoice) btnClass = "border-green-500 bg-green-50 text-green-900"; 
                           else if (isSelected && !isCorrectChoice) btnClass = "border-red-500 bg-red-50 text-red-900 line-through";
                           else btnClass = "border-gray-200 bg-gray-50 opacity-60";
                         }

                         return (
                           <button 
                             key={idx}
                             onClick={() => handleMultiSelectToggle(idx)}
                             disabled={submitted}
                             className={`w-full text-left p-4 rounded-lg flex items-center gap-4 border-2 transition-all duration-200 ${btnClass}`}
                           >
                             <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border-2 ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                               {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                             </div>
                             <span className="text-gray-800">{opt}</span>
                           </button>
                         );
                      })}
                    </div>
                  )}

                  {/* === TRUE / FALSE === */}
                  {currentQuestion.loaiItem === "trueFalse" && (
                    <div className="flex gap-4">
                      {[true, false].map((val) => {
                        const isSelected = answers[currentIndex] === val;
                        let btnClass = "border-gray-200 hover:bg-gray-50 bg-white";
                        if (isSelected) btnClass = "border-purple-500 bg-purple-50 shadow-sm";

                        if (submitted) {
                          if (val === currentQuestion.dapAnDungBoolean) btnClass = "border-green-500 bg-green-50 text-green-900";
                          else if (isSelected && val !== currentQuestion.dapAnDungBoolean) btnClass = "border-red-500 bg-red-50 text-red-900";
                          else btnClass = "border-gray-200 bg-gray-50 opacity-60";
                        }

                        return (
                          <button
                            key={val ? "true" : "false"}
                            onClick={() => handleAnswerChange(val)}
                            disabled={submitted}
                            className={`flex-1 p-6 rounded-xl border-2 transition-all duration-200 text-center font-bold text-lg ${btnClass}`}
                          >
                            {val ? "ĐÚNG (True)" : "SAI (False)"}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* === SHORT ANSWER === */}
                  {currentQuestion.loaiItem === "shortAnswer" && (
                    <div className="space-y-4">
                      <input 
                        type="text"
                        disabled={submitted}
                        value={answers[currentIndex] || ""}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Nhập câu trả lời của bạn vào đây..."
                        className={`w-full p-4 text-lg border-2 rounded-xl focus:outline-none transition-colors ${
                          submitted 
                            ? isCorrectReview(currentIndex) 
                              ? "border-green-500 bg-green-50 text-green-900" 
                              : "border-red-500 bg-red-50 text-red-900" 
                            : "border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                        }`}
                      />
                      {submitted && !isCorrectReview(currentIndex) && (
                        <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-lg flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Đáp án đúng: <strong>{currentQuestion.dapAnDungText}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* === FLASHCARD === */}
                  {currentQuestion.loaiItem === "flashcard" && (
                    <div className="flex justify-center items-center h-full min-h-[250px] perspective-1000">
                      <div 
                        onClick={() => setFlipped(!flipped)}
                        className={`relative w-full max-w-md h-64 rounded-xl shadow-lg cursor-pointer transition-transform duration-700 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
                      >
                        {/* Front Side */}
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center p-6 text-white text-center">
                           <span className="text-2xl font-bold">{currentQuestion.matTruoc}</span>
                           <div className="absolute bottom-4 left-0 right-0 text-indigo-200 text-sm opacity-60">Nhấn để lật</div>
                        </div>
                        {/* Back Side */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-indigo-200 rounded-xl flex items-center justify-center p-6 text-indigo-900 text-center shadow-inner">
                           <span className="text-xl whitespace-pre-wrap">{currentQuestion.matSau}</span>
                           <div className="absolute bottom-4 left-0 right-0 text-indigo-300 text-sm">Mặt sau</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
                <button 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-5 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Câu trước
                </button>
                
                {currentIndex === questions.length - 1 ? (
                  <button 
                    onClick={handleSubmit}
                    disabled={submitted}
                    className="px-6 py-2 font-bold text-white bg-blue-600 border border-transparent rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitted ? "Đã nộp bài" : "Nộp bài"}
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Câu tiếp
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Question Palette */}
          <div className="w-full lg:w-72 shrink-0">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
                <h3 className="font-bold text-gray-800 mb-4">Danh sách câu hỏi</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isFocussed = currentIndex === idx;
                    let hasAnswered = answers[idx] !== undefined;
                    if (q.loaiItem === 'multiSelect') hasAnswered = Array.isArray(answers[idx]) && answers[idx].length > 0;
                    if (q.loaiItem === 'flashcard') hasAnswered = false; // flashcard ko the tich dâu phẩy

                    let paletteClass = "bg-white border-gray-300 text-gray-600 hover:bg-gray-100";
                    
                    if (submitted) {
                      if (q.loaiItem !== 'flashcard') {
                        const correct = isCorrectReview(idx);
                        paletteClass = correct ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600";
                      } else {
                        paletteClass = "bg-gray-200 text-gray-500 border-gray-300";
                      }
                    } else {
                      if (hasAnswered) paletteClass = "bg-blue-100 text-blue-800 border-blue-300";
                      if (isFocussed) paletteClass = "bg-blue-500 text-white border-blue-600 shadow-md transform scale-110";
                    }

                    return (
                      <button 
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-full aspect-square flex items-center justify-center rounded-lg border-2 font-semibold text-sm transition-all duration-200 ${paletteClass}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
                
                {!submitted && (
                  <div className="mt-8">
                     <button
                       onClick={handleSubmit}
                       className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 shadow-sm transition-colors"
                     >
                        Nộp bài ngay
                     </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Global strict styling for 3D flip card */}
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
