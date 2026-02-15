
import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { GoogleGenAI, Type } from '@google/genai';
import { UserRole } from '../../types';

interface Props {
  onStartExam: (config: any) => void;
}

const DailyChallenge: React.FC<Props> = ({ onStartExam }) => {
  const { 
    dailyChallenge, dailyChallengeConfig, lastChallengeDate, 
    updateDailyChallenge, subjects, semesters, units, lessons, questions 
  } = useDatabase();
  const [loading, setLoading] = useState(false);
  const authData = JSON.parse(sessionStorage.getItem('tq_auth') || '{}');
  const currentUser = authData.user;

  const generateNewChallenge = async () => {
    if (subjects.length === 0 || questions.length === 0) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const unitsWithQuestions = units.filter(u => {
        const unitLessonIds = lessons.filter(l => l.unitId === u.id).map(l => l.id);
        return questions.some(q => unitLessonIds.includes(q.lessonId));
      });

      const targetPool = unitsWithQuestions.length > 0 ? unitsWithQuestions : units;
      const randomUnit = targetPool[Math.floor(Math.random() * targetPool.length)];
      const randomSubj = subjects.find(s => s.id === (semesters.find(sem => sem.id === randomUnit.semesterId)?.subjectId)) || subjects[0];
      const unitLessons = lessons.filter(l => l.unitId === randomUnit.id);
      
      const prompt = `أنت مصمم مناهج تعليمية خبير. قم بتوليد تحدي يومي ذكي لطلاب التوجيهي.
      المادة المتاحة: ${randomSubj.name}
      الوحدة المختارة: ${randomUnit.name}
      المطلوب: فكر في أفضل توليفة (عدد أسئلة ووقت) تناسب مستوى التوجيهي لهذه الوحدة.
      ولد تحدياً بصيغة "حل [X] سؤال من [اسم الوحدة] في أقل من [Y] دقيقة".
      اختر X بين 10-30 و Y بين 15-45 بناءً على تقديرك لصعوبة المادة.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              qCount: { type: Type.INTEGER },
              duration: { type: Type.INTEGER }
            },
            required: ["text", "qCount", "duration"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      const challengeConfig = {
        subjectId: randomSubj.id,
        subjectName: randomSubj.name,
        unitId: randomUnit.id,
        unitName: randomUnit.name,
        lessonIds: unitLessons.map(l => l.id),
        lessonNames: unitLessons.map(l => l.name),
        questionCount: data.qCount || 15,
        duration: data.duration || 20,
        difficulty: 'medium',
        isChallenge: true 
      };

      const today = new Date().toISOString().split('T')[0];
      updateDailyChallenge(data.text || `تحدي اليوم: حل ${challengeConfig.questionCount} سؤال من ${randomUnit.name} في أقل من ${challengeConfig.duration} دقيقة!`, challengeConfig, today);
    } catch (err) {
      console.error('Failed to generate challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastChallengeDate !== today && subjects.length > 0) {
      generateNewChallenge();
    }
  }, [lastChallengeDate, subjects]);

  const handleStartChallenge = () => {
    if (dailyChallengeConfig) {
      onStartExam({ ...dailyChallengeConfig, isChallenge: true });
    } else {
      alert('جاري تحضير التحدي، يرجى الانتظار ثوانٍ...');
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary via-[#5AC8FA] to-secondary p-[1.5px] rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 group">
      <div className="bg-white rounded-[1.9rem] p-6 relative overflow-hidden h-full flex flex-col justify-between">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        <div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl animate-pulse">🎯</div>
              <div>
                <h3 className="font-black text-gray-800 text-lg leading-tight">تحدي اليوم الذكي</h3>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">PRO AI Generated</span>
              </div>
            </div>
            {currentUser?.role === UserRole.SUPER_ADMIN && (
              <button onClick={generateNewChallenge} disabled={loading} className="text-gray-400 hover:text-primary p-2 rounded-xl bg-gray-50 transition-all hover:rotate-180 duration-500" title="تحديث التحدي">🔄</button>
            )}
          </div>
          <div className="relative z-10 min-h-[60px] flex items-center">
            <p className="text-gray-700 text-base leading-relaxed font-black">
              {loading ? (
                <span className="flex items-center gap-2 text-gray-400 animate-pulse"><span className="w-2 h-2 bg-gray-300 rounded-full"></span>جاري التفكير لتوليد تحدي استراتيجي...</span>
              ) : dailyChallenge}
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3 relative z-10">
          <button onClick={handleStartChallenge} disabled={loading} className="w-full bg-primary text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group/btn">
            <span>ابدأ التحدي الآن</span><span className="group-hover/btn:translate-x-[-4px] transition-transform">🚀</span>
          </button>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span><span className="text-[10px] font-bold text-gray-400">مكافأة خاصة: +100 خبرة</span></div>
            <span className="text-[10px] text-gray-300 font-bold">Expires in 24h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;
