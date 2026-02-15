
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Subject, Semester, Unit, Lesson, Question, ExamResult, UserRole, Mistake, ChallengeRoom, ChatMessage, StoreItem
} from '../types';
import { apiClient } from '../api';
import { INITIAL_SUBJECTS, INITIAL_SEMESTERS, INITIAL_UNITS, INITIAL_LESSONS, INITIAL_USERS } from '../constants';

interface DatabaseContextType {
  users: User[];
  subjects: Subject[];
  semesters: Semester[];
  units: Unit[];
  lessons: Lesson[];
  questions: Question[];
  results: ExamResult[];
  mistakes: Mistake[];
  rooms: ChallengeRoom[];
  storeItems: StoreItem[];
  announcement: string;
  loading: boolean;
  
  addUser: (user: Partial<User>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateAnnouncement: (text: string) => void;
  addSubject: (name: string) => void;
  deleteSubject: (id: string) => void;
  renameSubject: (id: string, name: string) => void;
  addSemester: (subjectId: string, name: string) => void;
  deleteSemester: (id: string) => void;
  renameSemester: (id: string, name: string) => void;
  addUnit: (semesterId: string, name: string) => void;
  deleteUnit: (id: string) => void;
  renameUnit: (id: string, name: string) => void;
  addLesson: (unitId: string, name: string) => void;
  deleteLesson: (id: string) => void;
  renameLesson: (id: string, name: string) => void;
  addQuestion: (q: Omit<Question, 'id'>) => void;
  deleteQuestion: (id: string) => void;
  updateQuestion: (q: Question) => void;
  addResult: (res: Omit<ExamResult, 'id'>) => Promise<void>;
  addMistake: (userId: string, questionId: string) => void;
  removeMistake: (id: string) => void;
  updateUserStreak: (userId: string) => void;
  addXp: (userId: string, amount: number) => void;
  buyItem: (userId: string, item: StoreItem) => boolean;
  useHint: (userId: string) => boolean;
  updateUserTheme: (userId: string, theme: string) => void;
  createRoom: (roomData: Partial<ChallengeRoom>) => string;
  joinRoom: (roomId: string, userId: string, password?: string) => boolean;
  leaveRoom: (roomId: string, userId: string) => void;
  sendRoomMessage: (roomId: string, message: ChatMessage) => void;
  addStoreItem: (item: Omit<StoreItem, 'id'>) => void;
  updateStoreItem: (item: StoreItem) => void;
  deleteStoreItem: (id: string) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_SEMESTERS);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [rooms, setRooms] = useState<ChallengeRoom[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [announcement, setAnnouncement] = useState('أهلاً بكم في Tawjihi Quiz!');

  // Initial Data Fetch with Smart Fallback
  useEffect(() => {
    const load = async () => {
      try {
        // 1. محاولة جلب البيانات من السيرفر
        const data = await apiClient.fetchAllData();
        if (data) {
          if (data.subjects?.length) setSubjects(data.subjects);
          if (data.semesters?.length) setSemesters(data.semesters);
          if (data.units?.length) setUnits(data.units);
          if (data.lessons?.length) setLessons(data.lessons);
          setQuestions(data.questions || []);
          setStoreItems(data.store_items || []);
          setAnnouncement(data.announcement || 'أهلاً بكم في Tawjihi Quiz!');
          
          // تحديث الكاش المحلي بالبيانات الجديدة من السيرفر
          localStorage.setItem('tq_global_cache', JSON.stringify(data));
        }
      } catch (e) {
        console.info("Running in Offline Mode: Server unreachable, using local storage.");
        
        // 2. إذا فشل السيرفر، نبحث في الكاش المحلي (LocalStorage)
        const cache = localStorage.getItem('tq_global_cache');
        if (cache) {
          const data = JSON.parse(cache);
          if (data.subjects?.length) setSubjects(data.subjects);
          if (data.semesters?.length) setSemesters(data.semesters);
          if (data.units?.length) setUnits(data.units);
          if (data.lessons?.length) setLessons(data.lessons);
          setQuestions(data.questions || []);
          setStoreItems(data.store_items || []);
          setAnnouncement(data.announcement || 'أهلاً بكم في Tawjihi Quiz!');
        }
      } finally {
        // تحميل المستخدمين والنتائج الخاصة بالجهاز دائماً
        const savedUsers = localStorage.getItem('tq_users');
        if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);
          // دمج المستخدمين المحفوظين مع المستخدمين الأوليين (لضمان وجود superadmin دائماً)
          const mergedUsers = [...INITIAL_USERS];
          parsedUsers.forEach((u: User) => {
            if (!mergedUsers.find(mu => mu.id === u.id)) mergedUsers.push(u);
          });
          setUsers(mergedUsers);
        }
        
        const savedResults = localStorage.getItem('tq_results_offline');
        if (savedResults) setResults(JSON.parse(savedResults));
        
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sync Data Snapshot
  const syncData = async () => {
    const fullState = { subjects, semesters, units, lessons, questions, store_items: storeItems, announcement };
    
    // حفظ في الكاش المحلي فوراً
    localStorage.setItem('tq_global_cache', JSON.stringify(fullState));
    localStorage.setItem('tq_users', JSON.stringify(users));
    localStorage.setItem('tq_results_offline', JSON.stringify(results));

    // محاولة المزامنة مع السيرفر في الخلفية
    try {
      await apiClient.adminSync(fullState);
    } catch (e) {
      // فشل المزامنة مع السيرفر صامت هنا لأننا نعتمد على الكاش المحلي
    }
  };

  useEffect(() => {
    if (!loading) {
      syncData();
    }
  }, [subjects, semesters, units, lessons, questions, storeItems, announcement, users, results]);

  const addUser = async (user: Partial<User>) => {
    const newUser: User = { 
      id: Math.random().toString(36).substr(2, 9), 
      username: user.username!, 
      email: user.email!, 
      role: UserRole.STUDENT, 
      passwordHash: user.passwordHash!, 
      streak: 0, 
      lastActive: '', 
      xp: 0, 
      coins: 50, 
      hintsCount: 3, 
      selectedTheme: 'default', 
      inventory: ['theme_default'] 
    };
    try {
      await apiClient.register(newUser);
    } catch (e) {
      console.info("User registered locally.");
    }
    setUsers(prev => [...prev, newUser]);
  };

  const addResult = async (res: Omit<ExamResult, 'id'>) => {
    const newRes = { ...res, id: 'res' + Math.random().toString(36).substr(2, 7) };
    try {
      await apiClient.saveResult(res.userId, newRes);
    } catch (e) {
      console.info("Result saved locally.");
    }
    setResults(prev => [...prev, newRes]);
  };

  const addXp = (userId: string, amount: number) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, xp: (u.xp || 0) + amount } : u));
  
  const buyItem = (userId: string, item: StoreItem) => {
    const u = users.find(curr => curr.id === userId);
    if (!u || u.coins < item.price) return false;
    setUsers(prev => prev.map(curr => {
      if (curr.id === userId) {
        if (item.type === 'hint') return { ...curr, coins: curr.coins - item.price, hintsCount: curr.hintsCount + parseInt(item.value) };
        return { ...curr, coins: curr.coins - item.price, inventory: [...curr.inventory, item.id], selectedTheme: item.type === 'theme' ? item.value : curr.selectedTheme };
      }
      return curr;
    }));
    return true;
  };

  const useHint = (userId: string) => {
    const u = users.find(curr => curr.id === userId);
    if (!u || u.hintsCount <= 0) return false;
    setUsers(prev => prev.map(curr => curr.id === userId ? { ...curr, hintsCount: curr.hintsCount - 1 } : curr));
    return true;
  };

  const updateUserTheme = (userId: string, theme: string) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, selectedTheme: theme } : u));
  const updateAnnouncement = (text: string) => setAnnouncement(text);
  const addSubject = (name: string) => setSubjects(prev => [...prev, { id: 's'+Math.random().toString(36).substr(2,5), name }]);
  const deleteSubject = (id: string) => setSubjects(prev => prev.filter(s => s.id !== id));
  const renameSubject = (id: string, name: string) => setSubjects(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  const addSemester = (subjectId: string, name: string) => setSemesters(prev => [...prev, { id: 'sem'+Math.random().toString(36).substr(2,5), subjectId, name }]);
  const deleteSemester = (id: string) => setSemesters(prev => prev.filter(s => s.id !== id));
  const renameSemester = (id: string, name: string) => setSemesters(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  const addUnit = (semesterId: string, name: string) => setUnits(prev => [...prev, { id: 'u'+Math.random().toString(36).substr(2,5), semesterId, name }]);
  const deleteUnit = (id: string) => setUnits(prev => prev.filter(u => u.id !== id));
  const renameUnit = (id: string, name: string) => setUnits(prev => prev.map(u => u.id === id ? { ...u, name } : u));
  const addLesson = (unitId: string, name: string) => setLessons(prev => [...prev, { id: 'l'+Math.random().toString(36).substr(2,5), unitId, name }]);
  const deleteLesson = (id: string) => setLessons(prev => prev.filter(l => l.id !== id));
  const renameLesson = (id: string, name: string) => setLessons(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  const addQuestion = (q: Omit<Question, 'id'>) => setQuestions(prev => [...prev, { ...q, id: 'q'+Math.random().toString(36).substr(2,7) }]);
  const deleteQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (q: Question) => setQuestions(prev => prev.map(curr => curr.id === q.id ? q : curr));
  const addMistake = (userId: string, questionId: string) => { if(!mistakes.find(m => m.userId === userId && m.questionId === questionId)) setMistakes(prev => [...prev, { id: Math.random().toString(36).substr(2,9), userId, questionId, timestamp: new Date().toISOString() }]); };
  const removeMistake = (id: string) => setMistakes(prev => prev.filter(m => m.id !== id));
  const updateUserStreak = (userId: string) => { const today = new Date().toISOString().split('T')[0]; setUsers(prev => prev.map(u => u.id === userId ? { ...u, streak: u.lastActive === today ? u.streak : u.streak + 1, lastActive: today } : u)); };
  const updateUserRole = (userId: string, role: UserRole) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  const addStoreItem = (item: Omit<StoreItem, 'id'>) => setStoreItems(prev => [...prev, { ...item, id: 'st'+Math.random().toString(36).substr(2,7) }]);
  const updateStoreItem = (item: StoreItem) => setStoreItems(prev => prev.map(si => si.id === item.id ? item : si));
  const deleteStoreItem = (id: string) => setStoreItems(prev => prev.filter(si => si.id !== id));
  const createRoom = (roomData: Partial<ChallengeRoom>) => { const id = 'rm'+Math.random().toString(36).substr(2,5); setRooms(prev => [...prev, { id, name: roomData.name!, subjectId: roomData.subjectId!, createdBy: roomData.createdBy!, participants: [roomData.createdBy!], status: 'waiting', maxParticipants: 4, messages: [], icon: roomData.icon, password: roomData.password }]); return id; };
  const joinRoom = (roomId: string, userId: string, password?: string) => { const r = rooms.find(rm => rm.id === roomId); if(!r || (r.password && r.password !== password)) return false; setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, participants: [...rm.participants, userId] } : rm)); return true; };
  const leaveRoom = (roomId: string, userId: string) => setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, participants: rm.participants.filter(p => p !== userId) } : rm).filter(rm => rm.participants.length > 0));
  const sendRoomMessage = (roomId: string, msg: ChatMessage) => setRooms(prev => prev.map(rm => rm.id === roomId ? { ...rm, messages: [...rm.messages, msg] } : rm));

  return (
    <DatabaseContext.Provider value={{
      users, subjects, semesters, units, lessons, questions, results, mistakes, rooms, storeItems, announcement, loading,
      addUser, updateUserRole, updateAnnouncement, addSubject, deleteSubject, renameSubject, addSemester, deleteSemester, renameSemester,
      addUnit, deleteUnit, renameUnit, addLesson, deleteLesson, renameLesson, addQuestion, deleteQuestion, updateQuestion,
      addResult, addMistake, removeMistake, updateUserStreak, addXp, buyItem, useHint, updateUserTheme, createRoom, joinRoom, leaveRoom, sendRoomMessage,
      addStoreItem, updateStoreItem, deleteStoreItem
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};
