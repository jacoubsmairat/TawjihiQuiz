
import { Subject, Semester, Unit, Lesson, UserRole, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'superadmin',
    email: 'super@tawjihi.com',
    role: UserRole.SUPER_ADMIN,
    passwordHash: 'super123',
    streak: 0,
    lastActive: '',
    xp: 0,
    coins: 100,
    hintsCount: 10,
    selectedTheme: 'default',
    inventory: ['default_theme']
  },
  {
    id: 'u2',
    username: 'jacoub',
    email: 'jacoub@tawjihi.com',
    role: UserRole.STUDENT,
    passwordHash: 'test123',
    streak: 5,
    lastActive: new Date().toISOString().split('T')[0],
    xp: 1500,
    coins: 250,
    hintsCount: 5,
    selectedTheme: 'default',
    inventory: ['default_theme']
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 's1', name: 'اللغة العربية' },
  { id: 's2', name: 'الرياضيات' },
  { id: 's3', name: 'تاريخ الأردن' },
  { id: 's4', name: 'الفيزياء' }
];

export const INITIAL_SEMESTERS: Semester[] = [
  { id: 'sem1_s1', subjectId: 's1', name: 'الفصل الدراسي الأول' },
  { id: 'sem2_s1', subjectId: 's1', name: 'الفصل الدراسي الثاني' },
  { id: 'sem1_s2', subjectId: 's2', name: 'الفصل الدراسي الأول' },
  { id: 'sem1_s3', subjectId: 's3', name: 'الفصل الدراسي الأول' }
];

const generateUnitsAndLessons = () => {
  const units: Unit[] = [];
  const lessons: Lesson[] = [];

  // Subject 1 - Arabic
  const subj1U1 = { id: 'u1_s1', semesterId: 'sem1_s1', name: 'الوحدة الأولى: آيات من سورة آل عمران' };
  const subj1U2 = { id: 'u2_s1', semesterId: 'sem1_s1', name: 'الوحدة الثانية: فن السرور' };
  
  units.push(subj1U1, subj1U2);

  lessons.push(
    { id: 'l1_u1_s1', unitId: 'u1_s1', name: 'تفسير الآيات الكريمة' },
    { id: 'l2_u1_s1', unitId: 'u1_s1', name: 'القضايا اللغوية' },
    { id: 'l1_u2_s1', unitId: 'u2_s1', name: 'تحليل النص الأدبي' }
  );

  // Subject 2 - Math
  const subj2U1 = { id: 'u1_s2', semesterId: 'sem1_s2', name: 'الوحدة الأولى: التفاضل' };
  units.push(subj2U1);
  lessons.push({ id: 'l1_u1_s2', unitId: 'u1_s2', name: 'قواعد الاشتقاق' });

  return { units, lessons };
};

const data = generateUnitsAndLessons();
export const INITIAL_UNITS = data.units;
export const INITIAL_LESSONS = data.lessons;
