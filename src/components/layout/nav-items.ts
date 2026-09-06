import {
  BarChart3,
  BookMarked,
  BookOpen,
  Bot,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  Dumbbell,
  FileCheck2,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  Languages,
  LayoutDashboard,
  MessagesSquare,
  Mic,
  NotebookPen,
  PenLine,
  Route,
  ScrollText,
  Server,
  Settings,
  SlidersHorizontal,
  Trophy,
  Users,
  UsersRound,
  Wand2,
} from 'lucide-react'

import type { NavItem } from './sidebar'

/**
 * Rollar bo‘yicha navigatsiya (PLAN.md 3-bo‘lim: axborot arxitekturasi).
 * `stage` — 8 bosqichli metodika bosqichi (guruhlash uchun).
 * `flag` — nazorat guruhida yashiriladigan AI imkoniyatlari (PLAN 1.5).
 */

export const STUDENT_NAV: NavItem[] = [
  { href: '/student/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/student/path', label: 'Mening o‘quv yo‘lim', icon: Route, stage: 1 },
  { href: '/student/prompt-lab', label: 'Prompt Lab', icon: Wand2, stage: 3, flag: 'promptLab' },
  { href: '/student/learn', label: 'Darslar', icon: GraduationCap, stage: 4 },
  { href: '/student/practice', label: 'Mashq maydoni', icon: Dumbbell, stage: 5 },
  { href: '/student/ai-teacher', label: 'AI o‘qituvchi', icon: Bot, stage: 6, flag: 'aiTutor' },
  { href: '/student/speaking-lab', label: 'Speaking Lab', icon: Mic, stage: 6 },
  { href: '/student/writing-lab', label: 'Writing Lab', icon: PenLine, stage: 6 },
  {
    href: '/student/communication',
    label: 'Muloqot markazi',
    icon: MessagesSquare,
    stage: 6,
    flag: 'forum',
  },
  { href: '/student/projects', label: 'Guruh loyihalari', icon: UsersRound, stage: 7 },
  { href: '/student/assessment', label: 'Baholash markazi', icon: ClipboardCheck, stage: 8 },
  { href: '/student/surveys', label: 'So‘rovnomalar', icon: ClipboardList, stage: 8 },
  { href: '/student/reflection', label: 'Refleksiya kundaligi', icon: NotebookPen, stage: 8 },
  { href: '/student/portfolio', label: 'Portfolio', icon: FolderOpen, stage: 8 },
  { href: '/student/achievements', label: 'Yutuqlar', icon: Trophy, flag: 'gamification' },
  { href: '/student/settings', label: 'Sozlamalar', icon: Settings },
]

export const TEACHER_NAV: NavItem[] = [
  { href: '/teacher/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/teacher/groups', label: 'Guruhlarim', icon: Users },
  { href: '/teacher/review', label: 'Baholash navbati', icon: FileCheck2 },
  { href: '/teacher/content', label: 'Kontent tasdig‘i', icon: BookMarked },
  { href: '/teacher/assignments', label: 'Topshiriqlar', icon: ClipboardList },
  { href: '/teacher/chats', label: 'Suhbatlar', icon: MessagesSquare },
  { href: '/teacher/analytics', label: 'Analitika', icon: BarChart3 },
]

export const RESEARCHER_NAV: NavItem[] = [
  { href: '/researcher/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/researcher/experiment', label: 'Eksperiment', icon: FlaskConical },
  { href: '/researcher/groups', label: 'Guruhlar', icon: Users },
  { href: '/researcher/tests', label: 'Testlar', icon: ClipboardCheck },
  { href: '/researcher/surveys', label: 'So‘rovnomalar', icon: ClipboardList },
  { href: '/researcher/analytics', label: 'Analitika', icon: BarChart3 },
  { href: '/researcher/participants', label: 'Ishtirokchilar', icon: UsersRound },
  { href: '/researcher/export', label: 'Eksport', icon: Download },
]

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/admin/groups', label: 'Guruhlar', icon: UsersRound },
  { href: '/admin/cohorts', label: 'Kohortlar', icon: Boxes },
  { href: '/admin/courses', label: 'Kurslar va darslar', icon: BookOpen },
  { href: '/admin/items', label: 'Mashq banki', icon: Database },
  { href: '/admin/lexicon', label: 'Lug‘at (lexicon)', icon: Languages },
  { href: '/admin/flags', label: 'Feature flaglar', icon: SlidersHorizontal },
  { href: '/admin/audit', label: 'Audit jurnali', icon: ScrollText },
  { href: '/admin/system', label: 'Tizim holati', icon: Server },
]

/** Rol bo‘yicha standart navigatsiya */
export const NAV_BY_ROLE = {
  student: STUDENT_NAV,
  teacher: TEACHER_NAV,
  researcher: RESEARCHER_NAV,
  admin: ADMIN_NAV,
} as const
