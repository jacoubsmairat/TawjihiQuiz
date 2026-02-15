
import React from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { UserRole } from '../../types';

const Leaderboard: React.FC = () => {
  const { users, results } = useDatabase();

  // حساب ترتيب الطلاب بناءً على نقاط الخبرة (XP)
  const studentsRank = users
    .filter(u => u.role === UserRole.STUDENT)
    .map(student => {
      const studentResults = results.filter(r => r.userId === student.id);
      return {
        id: student.id,
        username: student.username,
        xp: student.xp || 0,
        totalExams: studentResults.length
      };
    })
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5); // أفضل 5 طلاب فقط

  const getMedal = (index: number) => {
    switch (index) {
      case 0: return { icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'ملك التحديات' };
      case 1: return { icon: '🥈', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', label: 'المركز الثاني' };
      case 2: return { icon: '🥉', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'المركز الثالث' };
      default: return { icon: '⭐', color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-200', label: `المركز ${index + 1}` };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-primary flex items-center justify-center gap-3">
          <span className="text-5xl">🏆</span>
          لائحة الشرف بنقاط الخبرة
        </h2>
        <p className="text-gray-500 font-bold">أكثر 5 طلاب اجتهاداً وتجميعاً للخبرة في Tawjihi Quiz</p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
        {studentsRank.length > 0 ? (
          studentsRank.map((student, index) => {
            const medal = getMedal(index);
            return (
              <div 
                key={student.id} 
                className={`relative flex items-center justify-between p-6 rounded-3xl border-2 transition-all hover:scale-[1.02] hover:shadow-xl ${medal.bg} ${medal.border}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`text-4xl w-16 h-16 flex items-center justify-center rounded-2xl bg-white shadow-sm border ${medal.border}`}>
                    {medal.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${medal.color}`}>{student.username}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{medal.label}</p>
                  </div>
                </div>

                <div className="text-left">
                  <div className={`text-3xl font-black ${medal.color} flex items-center gap-2`}>
                    {student.xp} 
                    <span className="text-sm">XP</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">
                    أنجز {student.totalExams} اختبارات وتحديات
                  </div>
                </div>

                {index === 0 && (
                  <div className="absolute -top-3 -right-3 bg-amber-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-bounce">
                    متصدر الخبرة 🔥
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-400 font-bold">لائحة الشرف قيد التحديث... بانتظار تجميع النقاط الأولى.</p>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto p-4 bg-white/50 rounded-2xl border border-gray-100 text-center">
        <p className="text-xs text-gray-400 leading-relaxed italic">
          يتم احتساب الترتيب بناءً على إجمالي نقاط الخبرة (XP) التي يجمعها الطالب من خلال حل الاختبارات (10 نقاط لكل سؤال صحيح) والمشاركة في التحديات اليومية (100 نقطة إضافية).
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
