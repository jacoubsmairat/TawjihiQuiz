
export enum UserRole {
  STUDENT = 'Student',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'Super Admin'
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  streak: number;
  lastActive: string;
  xp: number;
  coins: number;
  hintsCount: number; // رصيد التلميحات
  selectedTheme: string;
  inventory: string[];
}

export interface Subject {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  subjectId: string;
  name: string;
}

export interface Unit {
  id: string;
  semesterId: string;
  name: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  name: string;
}

export interface Question {
  id: string;
  lessonId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty?: Difficulty;
}

export interface Mistake {
  id: string;
  userId: string;
  questionId: string;
  timestamp: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  subjectName: string;
  unitName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  date: string;
  lessonNames: string[];
  wrongQuestionIds: string[];
  difficulty?: Difficulty;
  earnedXp?: number;
}

export interface ChallengeRoom {
  id: string;
  name: string;
  subjectId: string;
  createdBy: string;
  participants: string[];
  status: 'waiting' | 'active' | 'finished';
  maxParticipants: number;
  messages: ChatMessage[];
  icon?: string;
  password?: string; // كلمة المرور للغرف الخاصة
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'theme' | 'hint' | 'badge';
  value: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const calculateLevel = (xp: number) => {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  
  let rankName = 'مبتدئ 🐣';
  if (level >= 5) rankName = 'طالب مجتهد ✨';
  if (level >= 10) rankName = 'مكافح 🛡️';
  if (level >= 20) rankName = 'خبير توجيحي 🎓';
  if (level >= 50) rankName = 'أسطورة المنصة 🔥';

  return { level, progress, rankName, nextLevelXp };
};
