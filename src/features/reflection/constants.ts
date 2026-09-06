/**
 * Refleksiya kundaligining o'zgarmas qismlari (PLAN 8.14).
 * Uchta savol metodikadan olingan va TARJIMA QILINMAYDI — ilmiy tahlilda
 * javoblar aynan shu uch o'lchov bo'yicha kodlanadi.
 */

export const REFLECTION_QUESTIONS = [
  {
    key: 'didWell' as const,
    uz: 'Nimani yaxshi bajardim?',
    en: 'What did I do well?',
    placeholder: 'Masalan: hisobot uchun 10 ta yangi termin ishlatdim…',
  },
  {
    key: 'repeatedMistakes' as const,
    uz: 'Qaysi xatolarni takrorladim?',
    en: 'What mistakes did I repeat?',
    placeholder: 'Masalan: yana artikllarni tushirib qoldirdim…',
  },
  {
    key: 'improveNext' as const,
    uz: 'Keyingi safar nimani yaxshilayman?',
    en: 'What will I improve next?',
    placeholder: 'Masalan: Present Perfect mavzusini qayta ko‘raman…',
  },
]

export const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', uz: 'Juda qiyin' },
  { value: 2, emoji: '🙁', uz: 'Qiyin' },
  { value: 3, emoji: '😐', uz: 'Odatdagidek' },
  { value: 4, emoji: '🙂', uz: 'Yaxshi' },
  { value: 5, emoji: '😄', uz: 'Ajoyib' },
]

export const MOOD_LABELS: Record<number, { emoji: string; uz: string }> = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.value, { emoji: option.emoji, uz: option.uz }])
)

/**
 * `/api/ai/feedback-report` javobidan qisqa izohni ajratib olish.
 * Javob shakli turlicha bo'lishi mumkin, shuning uchun bir necha kalit
 * tekshiriladi; hech biri topilmasa `null` (izoh ko'rsatilmaydi).
 */
export function extractAiComment(payload: unknown): string | null {
  if (typeof payload === 'string') return payload.trim() || null
  if (!payload || typeof payload !== 'object') return null

  const root = payload as Record<string, unknown>
  const source = (root.data && typeof root.data === 'object' ? root.data : root) as Record<
    string,
    unknown
  >

  for (const key of ['comment', 'aiComment', 'text', 'encouragement', 'summary', 'note']) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  // `nextSteps: string[]` kabi ro'yxat qaytsa — birlashtiramiz
  const nextSteps = source.nextSteps
  if (Array.isArray(nextSteps)) {
    const lines = nextSteps.filter((item): item is string => typeof item === 'string')
    if (lines.length) return lines.map((line) => `- ${line}`).join('\n')
  }

  return null
}
