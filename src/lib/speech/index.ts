/**
 * Azure Speech qatlami (PLAN.md 8.3).
 *
 * DIQQAT: `azure.ts` va `tts-cache.ts` — SERVER modullari (`server-only`),
 * shuning uchun bu barrel faqat serverda ishlatiladi.
 * Klient komponentda mikrofon yordamchilarini to'g'ridan to'g'ri import qiling:
 * `import { createRecorder } from '@/lib/speech/audio'`.
 */

export * from './azure'
export * from './tts-cache'
