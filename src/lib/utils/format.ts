import type { TimeValue } from '@/types'

/** Firestore Timestamp / Date / string / number → Date */
export function toDate(value: TimeValue | null | undefined): Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000)
  }
  return null
}

export function toMillis(value: TimeValue | null | undefined): number {
  return toDate(value)?.getTime() ?? 0
}

export function formatDate(value: TimeValue | null | undefined, locale = 'uz-UZ'): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d)
}

export function formatDateTime(value: TimeValue | null | undefined, locale = 'uz-UZ'): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

/** YYYY-MM-DD (UTC) — statsDaily kaliti uchun */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function relativeTime(value: TimeValue | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  const diff = Date.now() - d.getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'hozir'
  if (min < 60) return `${min} daq oldin`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} soat oldin`
  const days = Math.round(h / 24)
  if (days < 30) return `${days} kun oldin`
  return formatDate(d)
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} daq`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m ? `${h} soat ${m} daq` : `${h} soat`
}

export function percent(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function truncate(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Firestore hujjatlarini JSON-safe qilish (Server → Client komponent) */
export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (val && typeof val === 'object' && typeof val.toDate === 'function') {
        return val.toDate().toISOString()
      }
      if (val && typeof val === 'object' && '_seconds' in val) {
        return new Date(val._seconds * 1000).toISOString()
      }
      return val
    })
  ) as T
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-sky-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-sky-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}

/** Talaba javobini normallashtirish (gap-fill, transformation baholash uchun) */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
