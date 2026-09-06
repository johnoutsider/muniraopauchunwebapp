/**
 * Ilmiy ma'lumot eksporti (PLAN.md 9-bo'lim).
 *
 * DIQQAT: `datasets.ts` — SERVER moduli (`server-only`), shuning uchun bu
 * barrel faqat serverda (Route Handler / Server Action / cron) ishlatiladi.
 * Formatlash modullari (`csv`, `excel`, `spss`) toza — ularni skriptlardan
 * to'g'ridan to'g'ri import qilish mumkin.
 */

export * from './datasets'
export * from './csv'
export * from './excel'
export * from './spss'
