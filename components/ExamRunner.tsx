
import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../store/DatabaseContext';
import { Question, User, Difficulty } from '../types';
import { GoogleGenAI } from '@google/genai';

interface Props {
  user: User;
  config: {
    subjectId: string;
    subjectName: string;
    unitId: string;
    unitName: string;
    lessonIds: string[];
    lessonNames: string[];
    questionCount: number;
    duration: number;
    difficulty: Difficulty;
    isChallenge?: boolean;
    roomId?: string;
  };
  onFinish: () => void;
}

const ExamRunner: React.FC<Props> = ({ user, config, onFinish }) => {
  const { questions, addResult, addMistake, updateUserStreak, addXp, leaveRoom, useHint, users } = useDatabase();
  
  const currentUser = users.find(u => u.id === user.id) || user;
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [hiddenOptions, setHiddenOptions] = useState<Record<string, number[]>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>({});

  const getAdjustedTime = () => {
    const base = config.duration * 60;
    if (config.difficulty === 'easy') return Math.floor(base * 1.2);
    if (config.difficulty === 'hard') return Math.floor(base * 0.8);
    return base;
  };

  const [timeLeft, setTimeLeft] = useState(getAdjustedTime());
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const pool = questions.filter(q => config.lessonIds.includes(q.lessonId));
    
    if (pool.length === 0) {
      setHasStarted(true);
      return;
    }

    let prioritizedPool = pool.filter(q => q.difficulty === config.difficulty);
    if (prioritizedPool.length < config.questionCount) {
      const others = pool.filter(q => q.difficulty !== config.difficulty);
      prioritizedPool = [...prioritizedPool, ...others];
    }
    const shuffled = [...prioritizedPool].sort(() => 0.5 - Math.random());
    setExamQuestions(shuffled.slice(0, config.questionCount));
    setHasStarted(true);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const submitExam = () => {
    if (isFinished || examQuestions.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);

    let finalScore = 0;
    const wrongIds: string[] = [];
    examQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        finalScore++;
      } else {
        wrongIds.push(q.id);
        addMistake(user.id, q.id);
      }
    });

    let xpGain = finalScore * 10;
    if (config.isChallenge) xpGain += 100;

    const percentage = (finalScore / examQuestions.length) * 100;
    setScore(finalScore);
    setEarnedXp(xpGain);
    setIsFinished(true);
    updateUserStreak(user.id);
    addXp(user.id, xpGain);

    addResult({
      userId: user.id,
      subjectName: config.subjectName,
      unitName: config.unitName,
      score: finalScore,
      totalPoints: examQuestions.length,
      percentage,
      date: new Date().toISOString(),
      lessonNames: config.lessonNames,
      wrongQuestionIds: wrongIds,
      difficulty: config.difficulty,
      earnedXp: xpGain
    });

    if (config.roomId) leaveRoom(config.roomId, user.id);
  };

  const handleUseHint = () => {
    const q = examQuestions[currentIdx];
    if (hiddenOptions[q.id]) return; 
    
    if (currentUser.hintsCount <= 0) {
      alert('عذراً، رصيدك من التلميحات نفد! يمكنك شراء المزيد من المتجر 🪙');
      return;
    }

    if (useHint(user.id)) {
      const wrongIndices = q.options
        .map((_, i) => i)
        .filter(i => i !== q.correctAnswer);
      
      const shuffledWrong = wrongIndices.sort(() => 0.5 - Math.random());
      const toHide = shuffledWrong.slice(0, 2);
      
      setHiddenOptions(prev => ({ ...prev, [q.id]: toHide }));
    }
  };

  const handleExplain = async (q: Question) => {
    if (aiExplanation[q.id]) return;
    setAiLoading(q.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `أنت مدرس خبير في منهاج التوجيهي الأردني.
      السؤال: ${q.text}
      الإجابة الصحيحة هي: ${q.options[q.correctAnswer]}
      طلب الطالب: اشرح لي بوضوح وبساطة لماذا هذه هي الإجابة الصحيحة.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 16000 } }
      });
      
      setAiExplanation(prev => ({ ...prev, [q.id]: response.text || 'لا يتوفر شرح حالياً.' }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!hasStarted) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-gray-500">جاري تجهيز أسئلة التحدي...</p>
    </div>
  );

  if (examQuestions.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <div className="text-8xl mb-6">🤷‍♂️</div>
      <h2 className="text-3xl font-black text-gray-800 mb-4">عذراً، لا توجد أسئلة!</h2>
      <button onClick={onFinish} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl">العودة</button>
    </div>
  );

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in duration-500">
           <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 text-center relative overflow-hidden">
             <div className="text-8xl mb-6">🎉</div>
             <h2 className="text-4xl font-black text-gray-800 mb-4">تم إنهاء الاختبار بنجاح</h2>
             <div className="flex flex-col md:flex-row justify-center items-center gap-10 mt-10">
                <div className="text-center">
                  <div className="text-7xl font-black text-primary mb-2">%{Math.round((score / examQuestions.length) * 100)}</div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">النسبة المئوية</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-amber-500 mb-2">+{earnedXp}</div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">نقاط XP</p>
                </div>
             </div>
             <button onClick={onFinish} className="mt-12 bg-gray-900 text-white px-12 py-5 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all">العودة للرئيسية 🏠</button>
           </div>
           
           <div className="space-y-6">
             {examQuestions.map((q, idx) => {
               const isCorrect = answers[q.id] === q.correctAnswer;
               return (
                 <div key={q.id} className={`bg-white p-8 rounded-[2.5rem] border-2 shadow-sm ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                   <span className={`px-4 py-1 rounded-full text-[10px] font-black mb-4 inline-block ${isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                     {isCorrect ? 'إجابة صحيحة ✓' : 'إجابة خاطئة ✕'}
                   </span>
                   <p className="text-lg font-black text-gray-800 mb-6">{q.text}</p>
                   <div className="border-t pt-4">
                     {aiExplanation[q.id] ? (
                       <p className="text-sm text-gray-600 leading-relaxed font-bold">{aiExplanation[q.id]}</p>
                     ) : (
                       <button onClick={() => handleExplain(q)} disabled={aiLoading === q.id} className="text-xs text-primary font-black hover:underline">
                         {aiLoading === q.id ? 'جاري التحليل...' : '✨ شرح الذكاء الاصطناعي'}
                       </button>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    );
  }

  const q = examQuestions[currentIdx];
  const progress = ((currentIdx + 1) / examQuestions.length) * 100;
  const currentHidden = hiddenOptions[q.id] || [];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col no-select">
      <header className="bg-white border-b p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => {if(confirm('هل تريد الإلغاء؟')) onFinish();}} className="text-gray-400 hover:text-red-500">✕</button>
            <h1 className="font-black text-sm text-gray-800">{config.subjectName}</h1>
          </div>
          <div className={`px-6 py-2 rounded-2xl font-mono font-black text-xl ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => { if(confirm('تسليم الآن؟')) submitExam(); }} className="bg-primary text-white px-6 py-2 rounded-xl font-black shadow-lg shadow-primary/20">تسليم</button>
        </div>
        <div className="max-w-4xl mx-auto mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 mt-8">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-50 relative animate-in slide-in-from-left duration-300">
          <div className="flex justify-between items-center mb-10">
            <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-[10px] font-black">سؤال {currentIdx + 1} من {examQuestions.length}</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleUseHint}
                disabled={currentHidden.length > 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] transition-all ${
                  currentHidden.length > 0 ? 'bg-amber-500 text-white cursor-not-allowed' : 'bg-amber-100 text-amber-600 hover:scale-105'
                }`}
              >
                {currentHidden.length > 0 ? '✓ تم تفعيل 50:50' : `💡 تلميح (${currentUser.hintsCount})`}
              </button>
              <button onClick={() => setBookmarked({...bookmarked, [q.id]: !bookmarked[q.id]})} className={`text-2xl transition-all ${bookmarked[q.id] ? 'text-amber-500 scale-125' : 'text-gray-200'}`}>
                {bookmarked[q.id] ? '🔖' : '📑'}
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-800 mb-12 leading-relaxed">{q.text}</h2>

          <div className="grid grid-cols-1 gap-4">
            {q.options.map((opt, i) => {
              const isHidden = currentHidden.includes(i);
              return (
                <button
                  key={i}
                  disabled={isHidden}
                  onClick={() => setAnswers({...answers, [q.id]: i})}
                  className={`p-6 rounded-2xl border-2 text-right transition-all flex items-center gap-4 ${
                    isHidden ? 'opacity-20 grayscale border-gray-50' :
                    answers[q.id] === i ? 'border-primary bg-primary/5 text-primary shadow-inner scale-[0.98]' : 'border-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black ${answers[q.id] === i ? 'bg-primary border-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-bold flex-1">{opt}</span>
                  {isHidden && <span className="text-[8px] bg-red-100 text-red-500 px-2 rounded-full font-black">مستبعد</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="px-8 py-3 bg-white border border-gray-100 rounded-2xl font-black text-gray-400 disabled:opacity-30">السابق</button>
          {currentIdx === examQuestions.length - 1 ? (
             <button onClick={submitExam} className="px-8 py-3 bg-green-500 text-white rounded-2xl font-black shadow-lg">إنهاء</button>
          ) : (
            <button onClick={() => setCurrentIdx(currentIdx + 1)} className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg">التالي</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamRunner;
