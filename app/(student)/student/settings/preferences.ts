/**
 * Talaba sozlamalari — foydalanuvchi hujjatidagi `preferences` maydoni.
 * Alohida modul: `'use server'` faylidan faqat async funksiya eksport qilish
 * mumkin, shuning uchun konstantalar shu yerda turadi.
 */

export interface StudentPreferences {
  /** Kunlik XP maqsadi */
  dailyGoalXp: number
  notifications: {
    reminders: boolean
    feedback: boolean
    assignments: boolean
    leaderboard: boolean
  }
}

export const DEFAULT_PREFERENCES: StudentPreferences = {
  dailyGoalXp: 120,
  notifications: { reminders: true, feedback: true, assignments: true, leaderboard: false },
}

export const GOAL_LIMITS = { min: 40, max: 600 } as const
