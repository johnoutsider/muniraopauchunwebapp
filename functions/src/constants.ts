/**
 * Cloud Functions uchun konstantalar.
 *
 * DIQQAT: bu fayl ataylab `src/config/constants.ts` NUSXASI (kerakli qismi).
 * Functions alohida npm paketi bo'lgani uchun Next.js kodidan import qila olmaydi
 * (`@/` alias va bundler yo'q). Kolleksiya nomi o'zgarsa — IKKALA joyda o'zgartiring.
 */

export const COL = {
  users: 'users',
  groups: 'groups',
  invites: 'invites',
  items: 'items',
  attempts: 'attempts',
  speakingSubmissions: 'speakingSubmissions',
  writingSubmissions: 'writingSubmissions',
  portfolioItems: 'portfolioItems',
  notifications: 'notifications',
  chats: 'chats',
  statsDaily: 'statsDaily',
  statsGroupDaily: 'statsGroupDaily',
  predictions: 'predictions',
  streaks: 'streaks',
} as const;

/** Firebase resurslari joylashgan region (PLAN 1.2 — Frankfurt). */
export const REGION = 'europe-west3';

/** Cron ishlari O'zbekiston vaqti bo'yicha ishlaydi. */
export const TIMEZONE = 'Asia/Tashkent';

/** Yangi foydalanuvchi uchun standart qiymatlar (PLAN 4.1). */
export const DEFAULT_USER = {
  role: 'student' as const,
  locale: 'uz' as const,
  status: 'pending' as const,
  totalXp: 0,
  consentGiven: false,
};

/** Prognoz uchun: nechta kunlik statistika olinadi va risk chegaralari. */
export const PREDICTION = {
  WINDOW_DAYS: 28,
  MIN_POINTS: 3,
  RISK_LOW_MIN: 65,
  RISK_MEDIUM_MIN: 45,
} as const;

/** Portfolio: talaffuz bali shu chegaradan past bo'lsa portfolioga qo'shilmaydi. */
export const PORTFOLIO_MIN_PRON_SCORE = 60;
