
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, calculateLevel } from '../types';
import StudentView from './dashboard/StudentView';
import AdminView from './dashboard/AdminView';
import SuperAdminView from './dashboard/SuperAdminView';
import Leaderboard from './dashboard/Leaderboard';
import DailyChallenge from './dashboard/DailyChallenge';
import VirtualStore from './dashboard/VirtualStore';
import GroupStudy from './dashboard/GroupStudy';
import { useDatabase } from '../store/DatabaseContext';
import { GoogleGenAI } from '@google/genai';
import { apiClient } from '../api';

interface Props {
  user: User;
  onLogout: () => void;
  onStartExam: (config: any) => void;
}

const Dashboard: React.FC<Props> = ({ user, onLogout, onStartExam }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(false);
  const { announcement, users, results, mistakes } = useDatabase();
  
  const [timer, setTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerId = useRef<any>(null);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const currentUserData = users.find(u => u.id === user.id) || user;
  const { level, progress, rankName } = calculateLevel(currentUserData.xp || 0);
  
  const myResults = results.filter(r => r.userId === user.id);
  const averagePercentage = myResults.length > 0 
    ? (myResults.reduce((acc, curr) => acc + curr.percentage, 0) / myResults.length).toFixed(1)
    : 0;

  // فحص حالة الاتصال بالسيرفر
  useEffect(() => {
    const checkConn = async () => {
      const status = await apiClient.checkStatus();
      setIsOnline(status);
    };
    checkConn();
    const interval = setInterval(checkConn, 10000); // فحص كل 10 ثواني
    return () => clearInterval(interval);
  }, []);

  const fetchAIInsight = async () => {
    if (myResults.length < 1) return;
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `أنت مساعد دراسي ذكي لطلاب التوجيهي. حلل متوسط علامة الطالب (${averagePercentage}%) وعدد اختباراته (${myResults.length}) وقدم نصيحة واحدة استراتيجية مشجعة باللغة العربية بفقرة واحدة قصيرة تبدأ بـ "مرحباً ${currentUserData.username}...".`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      setAiInsight(response.text || 'استمر في التقدم، النجاح حليفك!');
    } catch (e) {
      setAiInsight('واصل الاجتهاد، أنت تسير على الطريق الصحيح!');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'home' && !aiInsight) {
      fetchAIInsight();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isTimerRunning) {
      timerId.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 0) {
            setIsTimerRunning(false);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerId.current);
    }
    return () => clearInterval(timerId.current);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const sidebarItems = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    ...(user.role === UserRole.STUDENT ? [
      { id: 'exam-setup', label: 'بدء اختبار', icon: '📝' },
      { id: 'mistakes', label: 'بنك الأخطاء', icon: '📂' },
      { id: 'analytics', label: 'تحليلات الأداء', icon: '📊' },
      { id: 'leaderboard', label: 'لائحة الشرف', icon: '🏆' },
      { id: 'group-study', label: 'دراسة جماعية', icon: '🤝' },
      { id: 'store', label: 'متجر التميز', icon: '🪙' }
    ] : []),
    ...(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN ? [
      { id: 'questions', label: 'إدارة الأسئلة', icon: '❓' },
      { id: 'all-results', label: 'نتائج الطلاب', icon: '👥' }
    ] : []),
    ...(user.role === UserRole.SUPER_ADMIN ? [
      { id: 'materials', label: 'إدارة المواد', icon: '📚' },
      { id: 'users', label: 'إدارة المستخدمين', icon: '🛡️' },
      { id: 'store-mgmt', label: 'إدارة المتجر', icon: '🏪' }
    ] : [])
  ];

  const getThemeClass = () => {
    switch (currentUserData.selectedTheme) {
      case 'dark': return 'bg-gray-900 text-gray-100';
      case 'gold': return 'bg-[#FFF8E1] text-[#795548]';
      case 'nature': return 'bg-[#F1F8E9] text-[#2E7D32]';
      default: return 'bg-[#F8F9FB] text-gray-800';
    }
  };

  const getCardTheme = () => {
     switch (currentUserData.selectedTheme) {
      case 'dark': return 'bg-gray-800 border-gray-700';
      case 'gold': return 'bg-white border-amber-200';
      case 'nature': return 'bg-white border-green-100';
      default: return 'bg-white border-gray-100';
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${getThemeClass()}`}>
      {/* Sidebar */}
      <aside className={`w-72 border-l hidden md:flex flex-col shadow-2xl z-50 ${getCardTheme()}`}>
        <div className="p-8 border-b border-opacity-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white p-2 shadow-xl border border-gray-50 mb-4 flex items-center justify-center overflow-hidden">
            <img src="image.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div className="text-center">
            <h2 className="font-black text-lg">{currentUserData.username}</h2>
            <p className="text-[10px] font-black text-primary bg-primary/10 px-3 py-0.5 rounded-full inline-block mt-1">{rankName}</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {sidebarItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full text-right flex items-center gap-3 p-3 rounded-2xl transition-all font-black text-sm ${activeTab === item.id ? 'bg-primary text-white shadow-lg scale-[1.02]' : 'opacity-60 hover:opacity-100 hover:bg-gray-50/10'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mx-4 mb-4 bg-gray-900 rounded-[2rem] text-white">
           <div className="text-2xl font-mono font-black text-center mb-3">{formatTimer(timer)}</div>
           <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-full py-2 rounded-xl text-[10px] font-black ${isTimerRunning ? 'bg-red-500' : 'bg-primary'}`}>
              {isTimerRunning ? 'إيقاف التركيز' : 'ابدأ مؤقت التركيز'}
           </button>
        </div>

        <div className="p-4 border-t border-opacity-10">
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 font-black transition-all text-xs">
            <span>🚪 تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Status Indicator Bar */}
        <div className="flex justify-end mb-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border ${isOnline ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {isOnline ? 'متصل بالسيرفر (قاعدة بيانات حية)' : 'يعمل في الوضع المحلي (تخزين المتصفح)'}
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="bg-gradient-to-br from-[#4A90E2] to-[#357ABD] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h1 className="text-3xl font-black mb-2">أهلاً بك، {currentUserData.username}!</h1>
                  <p className="text-white/80 font-bold max-w-lg">مستعد لرفع مستواك الدراسي اليوم؟</p>
                </div>
              </div>

              {/* AI Insight */}
              {myResults.length > 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm relative group">
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-3xl shadow-lg">🤖</div>
                    <div className="flex-1">
                      <h3 className="font-black text-blue-600 mb-2">نصيحة الذكاء الاصطناعي الاستراتيجية</h3>
                      <div className="text-gray-700 font-bold text-sm leading-relaxed">
                        {aiLoading ? 'جاري تحليل أدائك...' : aiInsight}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className={`${getCardTheme()} p-8 rounded-[2rem] shadow-sm border`}>
                    <h3 className="font-black mb-4">📢 إعلان المنصة</h3>
                    <p className="opacity-70 font-bold">{announcement}</p>
                  </div>
                </div>
                <DailyChallenge onStartExam={onStartExam} />
              </div>
            </div>
          )}

          {activeTab === 'exam-setup' && <StudentView mode="setup" onStartExam={onStartExam} userId={user.id} />}
          {activeTab === 'mistakes' && <StudentView mode="mistakes" userId={user.id} />}
          {activeTab === 'analytics' && <StudentView mode="analytics" userId={user.id} />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'group-study' && <GroupStudy user={currentUserData} />}
          {activeTab === 'store' && <VirtualStore user={currentUserData} />}
          
          {(activeTab === 'questions' || activeTab === 'all-results') && <AdminView tab={activeTab} />}
          {(activeTab === 'materials' || activeTab === 'users' || activeTab === 'store-mgmt') && <SuperAdminView tab={activeTab} />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
