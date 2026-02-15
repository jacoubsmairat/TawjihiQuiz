
import React, { useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { Difficulty } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface Props {
  mode: 'setup' | 'results' | 'mistakes' | 'analytics';
  userId: string;
  onStartExam?: (config: any) => void;
}

const StudentView: React.FC<Props> = ({ mode, userId, onStartExam }) => {
  const { subjects, semesters, units, lessons, questions, results, mistakes, removeMistake } = useDatabase();
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const filteredSemesters = semesters.filter(s => s.subjectId === selectedSubject);
  const filteredUnits = units.filter(u => u.semesterId === selectedSemester);
  const filteredLessons = lessons.filter(l => l.unitId === selectedUnit);
  const myResults = results.filter(r => r.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const myMistakes = mistakes.filter(m => m.userId === userId);

  const handleToggleLesson = (id: string) => {
    if (selectedLessons.includes(id)) {
      setSelectedLessons(selectedLessons.filter(l => l !== id));
    } else {
      setSelectedLessons([...selectedLessons, id]);
    }
  };

  const handleSelectAllLessons = () => {
    if (selectedLessons.length === filteredLessons.length) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons(filteredLessons.map(l => l.id));
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch(diff) {
      case 'easy': return 'text-green-500 border-green-500 bg-green-50';
      case 'medium': return 'text-primary border-primary bg-primary/5';
      case 'hard': return 'text-red-500 border-red-500 bg-red-50';
    }
  };

  const validateAndStart = () => {
    if (!onStartExam) return;
    
    if (questionCount < 1 || questionCount > 100) {
      alert('يجب أن يكون عدد الأسئلة بين 1 و 100 سؤال.');
      return;
    }
    
    onStartExam({
      subjectId: selectedSubject,
      subjectName: subjects.find(s => s.id === selectedSubject)?.name,
      semesterId: selectedSemester,
      unitId: selectedUnit,
      unitName: units.find(u => u.id === selectedUnit)?.name,
      lessonIds: selectedLessons,
      lessonNames: lessons.filter(l => selectedLessons.includes(l.id)).map(l => l.name),
      questionCount,
      duration,
      difficulty
    });
  };

  if (mode === 'mistakes') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8 rounded-[2.5rem] text-white shadow-xl mb-12">
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <span className="text-4xl">📂</span>
            بنك الأخطاء الذكي
          </h2>
          <p className="text-white/80 font-bold italic">هنا يتم تجميع الأسئلة التي واجهت فيها صعوبة. مراجعتها هي طريقك للإبداع!</p>
        </div>

        {myMistakes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myMistakes.map(m => {
              const q = questions.find(q => q.id === m.questionId);
              if (!q) return null;
              const lesson = lessons.find(l => l.id === q.lessonId);
              return (
                <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
                  <span className="text-[10px] bg-red-50 text-red-500 px-3 py-1 rounded-full font-black mb-3 inline-block">
                    {lesson?.name || 'موضوع عام'}
                  </span>
                  <p className="font-bold text-gray-800 mb-4">{q.text}</p>
                  <div className="text-xs text-green-600 font-bold mb-4 bg-green-50 p-3 rounded-xl border border-green-100">
                    الإجابة الصحيحة: {q.options[q.correctAnswer]}
                  </div>
                  <button 
                    onClick={() => removeMistake(m.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    تم الإتقان، حذف من البنك ✅
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <div className="text-6xl mb-4">🌟</div>
            <p className="text-gray-400 font-black">لا يوجد أخطاء مسجلة! أنت تبلي بلاءً حسناً جداً.</p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'results' || mode === 'analytics') {
    // Collect data for Radar Chart
    const subjectAverages = subjects.map(s => {
      const subjectResults = myResults.filter(r => r.subjectName === s.name);
      const avg = subjectResults.length > 0 
        ? subjectResults.reduce((acc, r) => acc + r.percentage, 0) / subjectResults.length 
        : 0;
      return { subject: s.name, score: Math.round(avg), fullMark: 100 };
    }).filter(s => s.score > 0 || subjects.length < 5);

    const chartData = myResults.slice(0, 10).reverse().map(r => ({
      name: r.date.split('T')[0],
      score: r.percentage
    }));

    return (
      <div className="space-y-12 pb-20">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-gray-800">التحليلات المتقدمة للأداء 📈</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart for Strengths */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 flex flex-col items-center">
            <h3 className="text-lg font-black mb-8 text-gray-700 w-full">توازن القوة بين المواد 🎯</h3>
            {subjectAverages.length >= 3 ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectAverages}>
                    <PolarGrid stroke="#eee" />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="مستواك"
                      dataKey="score"
                      stroke="#4A90E2"
                      fill="#4A90E2"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center px-6">
                <div className="text-4xl mb-4">🧊</div>
                <p className="text-xs text-gray-400 font-bold">نحتاج لنتائج في 3 مواد على الأقل لرسم "رادار القوة" الخاص بك.</p>
              </div>
            )}
          </div>

          {/* Progress Over Time */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50">
            <h3 className="text-lg font-black mb-8 text-gray-700">تطور العلامات (أخر 10 اختبارات) 🚀</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f8f9fb'}} />
                  <Bar dataKey="score" fill="#4A90E2" radius={[10, 10, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-black text-gray-700">سجل الاختبارات التفصيلي</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-white text-gray-400 text-[10px] font-black uppercase">
                  <th className="p-6 text-right">المادة والوحدة</th>
                  <th className="p-6 text-center">العلامة</th>
                  <th className="p-6 text-center">المستوى</th>
                  <th className="p-6 text-left">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myResults.map(res => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="font-black text-gray-800">{res.subjectName}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{res.unitName}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className={`inline-block px-4 py-1 rounded-full text-xs font-black ${res.percentage >= 90 ? 'bg-green-100 text-green-600' : res.percentage >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        {res.percentage.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase ${
                          res.difficulty === 'easy' ? 'border-green-200 text-green-600 bg-green-50' :
                          res.difficulty === 'hard' ? 'border-red-200 text-red-600 bg-red-50' :
                          'border-blue-200 text-blue-600 bg-blue-50'
                        }`}>
                          {res.difficulty || 'medium'}
                        </span>
                    </td>
                    <td className="p-6 text-left text-[10px] text-gray-400 font-black">
                      {new Date(res.date).toLocaleDateString('ar-JO')}
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

  const canStart = selectedSubject && selectedSemester && selectedUnit && selectedLessons.length > 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-4xl font-black text-gray-800 mb-2">جهز اختبارك الذكي 📝</h2>
        <p className="text-gray-500 font-bold">اتبع الخطوات البسيطة لتخصيص اختبارك المثالي.</p>
      </div>

      {/* Step 1: Select Subject */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">1</div>
          <h3 className="text-xl font-black text-gray-700">اختر المادة الدراسية</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelectedSubject(s.id); setSelectedSemester(''); setSelectedUnit(''); setSelectedLessons([]); }}
              className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-4 group ${
                selectedSubject === s.id 
                ? 'border-primary bg-primary/5 shadow-xl scale-105' 
                : 'border-gray-50 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 ${selectedSubject === s.id ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                {s.name.includes('اللغة') ? '📖' : s.name.includes('الرياضيات') ? '📐' : s.name.includes('العلوم') ? '🧬' : '📚'}
              </div>
              <span className={`font-black text-sm text-center ${selectedSubject === s.id ? 'text-primary' : 'text-gray-600'}`}>{s.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Hierarchy (Semester & Unit) */}
      {selectedSubject && (
        <section className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">2</div>
            <h3 className="text-xl font-black text-gray-700">اختر الفصل والوحدة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">الفصل الدراسي</label>
              <div className="grid grid-cols-1 gap-2">
                {filteredSemesters.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSemester(s.id); setSelectedUnit(''); setSelectedLessons([]); }}
                    className={`w-full p-4 rounded-xl text-right font-bold transition-all border-2 ${
                      selectedSemester === s.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">الوحدة الدراسية</label>
              <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto">
                {!selectedSemester && <p className="text-center text-gray-300 py-10 font-bold">يرجى اختيار الفصل أولاً</p>}
                {filteredUnits.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUnit(u.id); setSelectedLessons([]); }}
                    className={`w-full p-4 rounded-xl text-right font-bold transition-all border-2 ${
                      selectedUnit === u.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Lessons & Config */}
      {selectedUnit && (
        <section className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">3</div>
            <h3 className="text-xl font-black text-gray-700">تخصيص الدروس والإعدادات</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lessons Column */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-gray-700">حدد الدروس المطلوبة</h4>
                <button 
                  onClick={handleSelectAllLessons}
                  className="text-xs font-black text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  {selectedLessons.length === filteredLessons.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLessons.map(l => (
                  <label key={l.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedLessons.includes(l.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedLessons.includes(l.id)}
                      onChange={() => handleToggleLesson(l.id)}
                      className="w-6 h-6 rounded-lg accent-primary"
                    />
                    <span className={`font-bold text-sm ${selectedLessons.includes(l.id) ? 'text-primary' : 'text-gray-700'}`}>{l.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Config Column */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">عدد الأسئلة</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="5" max="50" step="5"
                      className="flex-1 accent-primary"
                      value={questionCount}
                      onChange={e => setQuestionCount(Number(e.target.value))}
                    />
                    <span className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-black">{questionCount}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">المدة (دقيقة)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="10" max="60" step="5"
                      className="flex-1 accent-primary"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                    />
                    <span className="w-12 h-12 bg-gray-100 text-gray-700 flex items-center justify-center rounded-xl font-black">{duration}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">الصعوبة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`py-3 rounded-xl text-[10px] font-black border-2 transition-all ${
                          difficulty === level 
                            ? getDifficultyColor(level) + ' shadow-md'
                            : 'bg-white border-gray-100 text-gray-400'
                        }`}
                      >
                        {level === 'easy' ? 'سهل' : level === 'medium' ? 'متوسط' : 'صعب'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                disabled={!canStart}
                onClick={validateAndStart}
                className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 group ${
                  canStart 
                  ? 'bg-primary text-white shadow-primary/30 hover:scale-[1.03] active:scale-95' 
                  : 'bg-gray-100 text-gray-300'
                }`}
              >
                <span>ابدأ الاختبار الآن</span>
                <span className={`transition-transform duration-500 ${canStart ? 'group-hover:translate-x-[-8px] animate-bounce' : ''}`}>🚀</span>
              </button>
              
              {!canStart && (
                <p className="text-center text-[10px] font-black text-amber-500 animate-pulse">
                  يرجى تحديد مادة، وحدة، ودرس واحد على الأقل للبدء
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentView;
