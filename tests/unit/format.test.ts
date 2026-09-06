import { describe, expect, it } from 'vitest'

import {
  clamp,
  dayKey,
  initials,
  normalizeAnswer,
  percent,
  toDate,
  toMillis,
  truncate,
  wordCount,
} from '@/lib/utils/format'

/**
 * Formatlash yordamchilari — barcha modullar shularga tayanadi, shuning uchun
 * chegara holatlari alohida tekshiriladi (Firestore Timestamp, null, buzilgan sana).
 */

describe('format — toDate', () => {
  it('null/undefined uchun null', () => {
    expect(toDate(null)).toBeNull()
    expect(toDate(undefined)).toBeNull()
  })

  it('Date obyektini o‘zgartirmasdan qaytaradi', () => {
    const d = new Date('2027-03-01T12:00:00.000Z')
    expect(toDate(d)).toBe(d)
  })

  it('millisekund raqamini Date ga aylantiradi', () => {
    const ms = Date.UTC(2027, 0, 15, 10, 0, 0)
    expect(toDate(ms)?.toISOString()).toBe('2027-01-15T10:00:00.000Z')
  })

  it('ISO satrni o‘qiydi', () => {
    expect(toDate('2027-01-15T10:00:00.000Z')?.toISOString()).toBe('2027-01-15T10:00:00.000Z')
  })

  it('yaroqsiz satr uchun null', () => {
    expect(toDate('bu sana emas')).toBeNull()
  })

  it('Firestore Timestamp shaklini ({seconds, nanoseconds}) qo‘llab-quvvatlaydi', () => {
    const seconds = Math.floor(Date.UTC(2027, 0, 15, 10, 0, 0) / 1000)
    expect(toDate({ seconds, nanoseconds: 0 })?.toISOString()).toBe('2027-01-15T10:00:00.000Z')
  })

  it('toMillis mavjud bo‘lmagan qiymat uchun 0 qaytaradi', () => {
    expect(toMillis(null)).toBe(0)
    expect(toMillis('2027-01-15T10:00:00.000Z')).toBe(Date.UTC(2027, 0, 15, 10, 0, 0))
  })
})

describe('format — dayKey', () => {
  it('YYYY-MM-DD (UTC) formatida kalit beradi', () => {
    expect(dayKey(new Date('2027-01-15T10:00:00.000Z'))).toBe('2027-01-15')
  })

  it('kun oxiridagi vaqtni ham to‘g‘ri kesadi', () => {
    expect(dayKey(new Date('2027-01-15T23:59:59.999Z'))).toBe('2027-01-15')
    expect(dayKey(new Date('2027-01-16T00:00:00.000Z'))).toBe('2027-01-16')
  })

  it('leksikografik saralash = xronologik saralash', () => {
    const keys = [
      dayKey(new Date('2027-02-01T00:00:00Z')),
      dayKey(new Date('2027-01-09T00:00:00Z')),
      dayKey(new Date('2027-01-10T00:00:00Z')),
    ]
    expect([...keys].sort()).toEqual(['2027-01-09', '2027-01-10', '2027-02-01'])
  })
})

describe('format — normalizeAnswer', () => {
  it('kichik harfga o‘tkazadi va bo‘shliqlarni siqadi', () => {
    expect(normalizeAnswer('  HAS   Risen ')).toBe('has risen')
  })

  it('oxiridagi tinish belgilarini olib tashlaydi', () => {
    expect(normalizeAnswer('has risen.')).toBe('has risen')
    expect(normalizeAnswer('has risen?!')).toBe('has risen')
  })

  it('so‘z ichidagi tinish belgisini saqlaydi', () => {
    expect(normalizeAnswer('e.g. revenue')).toBe('e.g. revenue')
  })

  it('egri qo‘shtirnoq va apostrofni to‘g‘rilaydi', () => {
    expect(normalizeAnswer('hasn’t risen')).toBe("hasn't risen")
    expect(normalizeAnswer('“profit” margin')).toBe('"profit" margin')
  })

  it('bo‘sh satr uchun bo‘sh satr', () => {
    expect(normalizeAnswer('   ')).toBe('')
  })
})

describe('format — wordCount', () => {
  it('so‘zlarni sanaydi', () => {
    expect(wordCount('Revenue has risen by 12 percent')).toBe(6)
  })

  it('ortiqcha bo‘shliq va yangi qatorlarni hisobga olmaydi', () => {
    expect(wordCount('  one   two\nthree\t four  ')).toBe(4)
  })

  it('bo‘sh matn → 0', () => {
    expect(wordCount('')).toBe(0)
    expect(wordCount('    ')).toBe(0)
  })
})

describe('format — kichik yordamchilar', () => {
  it('percent', () => {
    expect(percent(1, 4)).toBe(25)
    expect(percent(0, 0)).toBe(0)
    expect(percent(2, 3)).toBe(67)
  })

  it('clamp', () => {
    expect(clamp(7, 1, 5)).toBe(5)
    expect(clamp(-2, 1, 5)).toBe(1)
    expect(clamp(3, 1, 5)).toBe(3)
  })

  it('initials', () => {
    expect(initials('Munirakhon Mukhitdinova')).toBe('MM')
    expect(initials('Aziz')).toBe('A')
    expect(initials('')).toBe('')
  })

  it('truncate', () => {
    expect(truncate('abcdef', 10)).toBe('abcdef')
    expect(truncate('abcdef', 4)).toBe('abc…')
  })
})
