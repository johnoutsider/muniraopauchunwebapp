/**
 * Audit amallari va ularning o'zbekcha yorliqlari.
 * Klient komponentlar ham import qiladi, shuning uchun `server-only` emas.
 */

/** Ma'muriy amallar ro'yxati — filtrlar va o'zbekcha yorliqlar uchun. */
export const AUDIT_ACTIONS = {
  'user.create': 'Foydalanuvchi yaratildi',
  'user.update': 'Foydalanuvchi tahrirlandi',
  'user.role': 'Rol o‘zgartirildi',
  'user.group': 'Guruh o‘zgartirildi',
  'user.status': 'Holat o‘zgartirildi',
  'user.approve': 'Foydalanuvchi tasdiqlandi',
  'user.password_reset': 'Parolni tiklash havolasi yuborildi',
  'user.bulk': 'Ommaviy amal',
  'group.create': 'Guruh yaratildi',
  'group.update': 'Guruh tahrirlandi',
  'group.delete': 'Guruh o‘chirildi',
  'group.flags': 'Guruh flaglari o‘zgartirildi',
  'cohort.create': 'Kohort yaratildi',
  'cohort.update': 'Kohort tahrirlandi',
  'cohort.delete': 'Kohort o‘chirildi',
  'course.create': 'Kurs yaratildi',
  'course.update': 'Kurs tahrirlandi',
  'course.publish': 'Kurs nashr holati o‘zgardi',
  'module.create': 'Modul yaratildi',
  'module.update': 'Modul tahrirlandi',
  'lesson.create': 'Dars yaratildi',
  'lesson.update': 'Dars tahrirlandi',
  'lesson.publish': 'Dars nashr holati o‘zgardi',
  'item.update': 'Mashq tahrirlandi',
  'item.status': 'Mashq holati o‘zgardi',
  'lexicon.create': 'Lug‘at so‘zi qo‘shildi',
  'lexicon.update': 'Lug‘at so‘zi tahrirlandi',
  'settings.flags': 'Global flaglar o‘zgartirildi',
  'settings.models': 'Model sozlamalari o‘zgartirildi',
  'settings.limits': 'Limitlar o‘zgartirildi',
  'settings.announcement': 'E’lon o‘zgartirildi',
  'settings.maintenance': 'Texnik rejim o‘zgartirildi',
  'experiment.create': 'Eksperiment yaratildi',
  'experiment.update': 'Eksperiment tahrirlandi',
  'experiment.status': 'Eksperiment holati o‘zgardi',
  'experiment.randomize': 'Randomizatsiya bajarildi',
  'experiment.assign_test': 'Test guruhlarga biriktirildi',
  'experiment.assign_survey': 'So‘rovnoma guruhlarga biriktirildi',
  'participant.withdraw': 'Ishtirokchi tadqiqotdan chiqarildi',
  'participant.restore': 'Ishtirokchi tadqiqotga qaytarildi',
  'participant.code': 'Ishtirokchi kodlari berildi',
  'research.export': 'Ilmiy ma’lumot eksport qilindi',
  'stats.recompute': 'Statistika qayta hisoblandi',
  'predictions.refresh': 'Prognozlar yangilandi',
} as const

export type AuditAction = keyof typeof AUDIT_ACTIONS

export function auditActionLabel(action: string): string {
  return (AUDIT_ACTIONS as Record<string, string>)[action] ?? action
}
