import React, { useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { Question, Difficulty } from '../../types';

interface Props {
  tab: string;
}

const AdminView: React.FC<Props> = ({ tab }) => {
  const { 
    subjects, semesters, units, lessons, questions, results, users,
    addQuestion, deleteQuestion, updateQuestion 
  } = useDatabase();

  // Filters for Questions tab
  const [selectedSubj, setSelectedSubj] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState<Question | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    lessonId: '',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium'
  });

  // إذا تم اختيار وحدة ولم يتم اختيار درس، نعرض أسئلة الوحدة كاملة
  // وإذا تم اختيار درس نعرض أسئلة الدرس فقط
  const unitLessons = lessons.filter(l => l.unitId === selectedUnit).map(l => l.id);
  
  const filteredQuestions = questions.filter(q => {
    if (selectedLesson) return q.lessonId === selectedLesson;
    if (selectedUnit) return unitLessons.includes(q.lessonId);
    return false;
  });

  const handleSave = () => {
    if (!formData.text || formData.options.some(o => !o) || !formData.lessonId) {
      alert('يرجى إكمال كافة البيانات (النص، الخيارات، والدرس المرتبط)');
      return;
    }

    if (isEditing) {
      updateQuestion({ ...formData, id: isEditing.id });
      setIsEditing(null);
    } else {
      addQuestion(formData);
      setIsAdding(false);
    }
    
    setFormData({
      lessonId: selectedLesson || formData.lessonId,
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 'medium'
    });
  };

  const startEdit = (q: Question) => {
    setIsEditing(q);
    setFormData({
      lessonId: q.lessonId,
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty || 'medium'
    });
    setIsAdding(true);
  };

  if (tab === 'all-results') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black mb-6">نتائج كافة الطلاب</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-gray-600 text-sm font-bold">الطالب</th>
                <th className="p-4 text-gray-600 text-sm font-bold">المادة</th>
                <th className="p-4 text-gray-600 text-sm font-bold">العلامة</th>
                <th className="p-4 text-gray-600 text-sm font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(res => {
                const student = users.find(u => u.id === res.userId);
                return (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{student?.username || 'مستخدم محذوف'}</td>
                    <td className="p-4 text-gray-600 text-sm">{res.subjectName}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${res.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {res.percentage.toFixed(1)}% ({res.score}/{res.totalPoints})
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400 font-bold">{new Date(res.date).toLocaleDateString('ar-JO')}</td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-400 font-bold">لا يوجد نتائج مسجلة بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-black">إدارة بنك الأسئلة</h2>
        <button 
          onClick={() => { 
            setIsAdding(true); 
            setIsEditing(null); 
            setFormData({
              lessonId: selectedLesson || (unitLessons[0] || ''),
              text: '',
              options: ['', '', '', ''],
              correctAnswer: 0,
              difficulty: 'medium'
            }); 
          }}
          className="bg-primary text-white px-6 py-2 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          + إضافة سؤال جديد
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <select 
          className="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold"
          value={selectedSubj}
          onChange={e => { setSelectedSubj(e.target.value); setSelectedSem(''); setSelectedUnit(''); setSelectedLesson(''); }}
        >
          <option value="">-- اختر المادة --</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select 
          disabled={!selectedSubj}
          className="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold disabled:opacity-50"
          value={selectedSem}
          onChange={e => { setSelectedSem(e.target.value); setSelectedUnit(''); setSelectedLesson(''); }}
        >
          <option value="">-- الفصل --</option>
          {semesters.filter(s => s.subjectId === selectedSubj).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select 
          disabled={!selectedSem}
          className="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold disabled:opacity-50"
          value={selectedUnit}
          onChange={e => { setSelectedUnit(e.target.value); setSelectedLesson(''); }}
        >
          <option value="">-- الوحدة --</option>
          {units.filter(u => u.semesterId === selectedSem).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select 
          disabled={!selectedUnit}
          className="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold disabled:opacity-50"
          value={selectedLesson}
          onChange={e => setSelectedLesson(e.target.value)}
        >
          <option value="">-- الدرس (اختياري للعرض) --</option>
          {lessons.filter(l => l.unitId === selectedUnit).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Question List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {selectedUnit ? (
          <div className="divide-y divide-gray-50">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">تم العثور على {filteredQuestions.length} سؤال في هذا القسم</span>
              {selectedLesson && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">فلترة بالدرس</span>}
            </div>
            {filteredQuestions.map((q, idx) => {
              const lesson = lessons.find(l => l.id === q.lessonId);
              return (
                <div key={q.id} className="p-6 hover:bg-gray-50/30 transition-all flex justify-between items-start gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        q.difficulty === 'easy' ? 'text-green-600 bg-green-50 border-green-100' :
                        q.difficulty === 'hard' ? 'text-red-600 bg-red-50 border-red-100' :
                        'text-blue-600 bg-blue-50 border-blue-100'
                      }`}>
                        {(q.difficulty || 'medium').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-300 font-bold">| {lesson?.name || 'بدون درس'}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg leading-relaxed">{q.text}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-2 rounded-lg text-xs font-bold ${i === q.correctAnswer ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-400'}`}>
                          {String.fromCharCode(65 + i)}) {opt}
                          {i === q.correctAnswer && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(q)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="تعديل">✏️</button>
                    <button onClick={() => { if(confirm('هل أنت متأكد من حذف هذا السؤال؟')) deleteQuestion(q.id); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="حذف">🗑️</button>
                  </div>
                </div>
              );
            })}
            {filteredQuestions.length === 0 && (
              <div className="p-12 text-center text-gray-400 font-bold">لا يوجد أسئلة مضافة لهذا القسم حتى الآن.</div>
            )}
          </div>
        ) : (
          <div className="p-20 text-center text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-bold">يرجى اختيار المادة والفصل والوحدة لعرض الأسئلة.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-gray-800 mb-6">{isEditing ? 'تعديل سؤال' : 'إضافة سؤال جديد'}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-600 mb-2">نص السؤال</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold min-h-[100px]"
                  value={formData.text}
                  onChange={e => setFormData({...formData, text: e.target.value})}
                  placeholder="اكتب نص السؤال هنا..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-gray-600 mb-2">الدرس</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                    value={formData.lessonId}
                    onChange={e => setFormData({...formData, lessonId: e.target.value})}
                  >
                    <option value="">-- اختر الدرس --</option>
                    {lessons.filter(l => !selectedUnit || l.unitId === selectedUnit).map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({units.find(u => u.id === l.unitId)?.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-600 mb-2">الصعوبة</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value as Difficulty})}
                  >
                    <option value="easy">سهل</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">صعب</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-gray-600">الخيارات (حدد الخيار الصحيح)</label>
                {formData.options.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input 
                      type="radio" 
                      name="correctAnswer" 
                      checked={formData.correctAnswer === i} 
                      onChange={() => setFormData({...formData, correctAnswer: i})}
                      className="w-5 h-5 accent-primary"
                    />
                    <input 
                      type="text"
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                      value={opt}
                      onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[i] = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                      placeholder={`خيار ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-primary text-white font-black py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20"
                >حفظ</button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all"
                >إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
