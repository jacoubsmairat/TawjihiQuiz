
import React, { useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { User, ChallengeRoom } from '../../types';

const GroupStudy: React.FC<{ user: User }> = ({ user }) => {
  const { rooms, subjects, createRoom, joinRoom, leaveRoom, sendRoomMessage, users } = useDatabase();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  
  // Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📚');

  const AVAILABLE_ICONS = ['📚', '🧬', '📐', '🎭', '🌍', '⚖️', '💻', '🧪', '🏹', '🎨', '🧩', '🎸'];

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const newId = createRoom({
      name: newRoomName,
      subjectId: selectedSubjectId || (subjects[0]?.id || ''),
      createdBy: user.id,
      participants: [user.id],
      icon: selectedIcon,
      password: roomPassword.trim() || undefined
    });

    // Auto-enter the newly created room
    setActiveRoomId(newId);
    setIsCreating(false);
    setNewRoomName('');
    setRoomPassword('');
    setSelectedSubjectId('');
    setSelectedIcon('📚');
  };

  const handleJoinRoom = (room: ChallengeRoom) => {
    if (room.password) {
      const enteredPass = prompt('هذه الغرفة محمية، يرجى إدخال كلمة المرور:');
      if (enteredPass === null) return;
      
      const success = joinRoom(room.id, user.id, enteredPass);
      if (success) {
        setActiveRoomId(room.id);
      } else {
        alert('كلمة المرور غير صحيحة أو الغرفة ممتلئة!');
      }
    } else {
      const success = joinRoom(room.id, user.id);
      if (success) setActiveRoomId(room.id);
    }
  };

  const handleLeaveRoom = () => {
    if (activeRoomId) {
      leaveRoom(activeRoomId, user.id);
      setActiveRoomId(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeRoomId) return;
    sendRoomMessage(activeRoomId, {
      id: Math.random().toString(),
      userId: user.id,
      username: user.username,
      text: msgText,
      timestamp: new Date().toISOString()
    });
    setMsgText('');
  };

  if (activeRoom) {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom duration-500">
        <div className="p-6 bg-primary text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              {activeRoom.icon || '🏛️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl leading-none">{activeRoom.name}</h3>
                {activeRoom.password && <span title="غرفة محمية">🔒</span>}
              </div>
              <p className="text-[10px] opacity-80 font-bold mt-1">{activeRoom.participants.length} طلاب متصلون حالياً</p>
            </div>
          </div>
          <button onClick={handleLeaveRoom} className="bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-all font-black text-xs">مغادرة الغرفة 🚪</button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
          <div className="flex-1 flex flex-col border-l border-gray-50">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeRoom.messages.length > 0 ? activeRoom.messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-black text-gray-400 mb-1 px-2">{msg.username}</span>
                  <div className={`p-4 rounded-2xl max-w-[80%] text-sm font-bold ${
                    msg.userId === user.id ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 text-gray-300 font-bold">ابدأ الدردشة مع زملائك! 👋</div>
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-50 bg-gray-50/50 flex gap-2">
              <input 
                type="text" 
                placeholder="اكتب رسالتك هنا..." 
                className="flex-1 bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
              />
              <button className="bg-primary text-white p-3 rounded-xl hover:scale-105 transition-all">
                <span>✈️</span>
              </button>
            </form>
          </div>

          <div className="w-64 bg-gray-50/30 p-6 hidden md:block">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">المشاركون</h4>
            <div className="space-y-4">
              {activeRoom.participants.map(pid => {
                const p = users.find(u => u.id === pid);
                return (
                  <div key={pid} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                      {p?.username[0].toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-black text-gray-700">{p?.username} {pid === user.id && '(أنت)'}</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-12 p-4 bg-amber-50 rounded-2xl border border-amber-100">
               <p className="text-[10px] font-black text-amber-600 leading-relaxed">
                 تنبيه: سيتم حذف هذه الغرفة تلقائياً عند خروج آخر طالب منها لضمان الخصوصية.
               </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-800">غرف الدراسة الجماعية 🤝</h2>
          <p className="text-gray-500 font-bold">ادرس، تحدَّ، ودردش مع أصدقائك. الغرف تحذف تلقائياً عند خلوها.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          + إنشاء غرفة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length > 0 ? rooms.map(room => (
          <div key={room.id} className="group-study-room-card bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-4xl group-hover:bg-primary/10 transition-all group-hover:scale-110 group-hover:rotate-6">
                {room.icon || '🏛️'}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="bg-green-50 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100 shadow-sm">نشطة</span>
                {room.password && <span className="text-xs" title="غرفة محمية بكلمة مرور">🔒</span>}
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black text-gray-800 mb-2 leading-tight">{room.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold mb-6 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="opacity-60">بواسطة:</span>
                <span className="text-primary">{users.find(u => u.id === room.createdBy)?.username || 'مستخدم'}</span>
              </p>
            </div>
            
            <div className="flex justify-between items-center mt-auto relative z-10">
              <div className="flex -space-x-2 rtl:space-x-reverse items-center">
                {room.participants.slice(0, 3).map((pid, idx) => (
                   <div key={pid} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-500" title={users.find(u => u.id === pid)?.username}>
                      {(users.find(u => u.id === pid)?.username[0] || 'U').toUpperCase()}
                   </div>
                ))}
                {room.participants.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-400">
                    +{room.participants.length - 3}
                  </div>
                )}
                <span className="mr-3 text-[10px] font-black text-gray-300">{room.participants.length} / {room.maxParticipants}</span>
              </div>
              <button 
                onClick={() => handleJoinRoom(room)}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-primary transition-all shadow-lg shadow-gray-200 group-hover:shadow-primary/20"
              >
                دخول الغرفة
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="text-6xl mb-6">☁️</div>
            <p className="text-gray-400 font-black">لا يوجد غرف نشطة حالياً. كن أول من ينشئ غرفة!</p>
          </div>
        )}
      </div>

      {/* Modern Create Room Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 border border-white/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner animate-pulse">
                {selectedIcon}
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-800 leading-none mb-1">غرفة دراسة محمية</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">توجيهي كويز - أمان تام</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-3 uppercase tracking-wide">اسم الغرفة</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  placeholder="مثال: مراجعة الفيزياء، أبطال التوجيهي..."
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 mb-3 uppercase tracking-wide">كلمة المرور (اختياري)</label>
                <input 
                  type="password"
                  placeholder="اتركها فارغة لغرفة عامة"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  value={roomPassword}
                  onChange={e => setRoomPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 mb-3 uppercase tracking-wide">أيقونة الغرفة</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`p-2 rounded-xl text-xl transition-all border-2 ${selectedIcon === icon ? 'bg-primary/10 border-primary shadow-inner scale-110' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white font-black py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group/go"
                >
                  <span>إنشاء ودخول</span>
                  <span className="group-hover/go:translate-x-[-2px] transition-transform">🚀</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all text-sm"
                >إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupStudy;
