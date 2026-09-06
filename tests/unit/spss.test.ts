import { describe, expect, it } from 'vitest'

import { spssNameMap, spssSafeName } from '@/lib/export/spss'
import type { ColumnDef } from '@/lib/export/datasets'

/**
 * SPSS eksport testlari — PLAN 9.3.
 * O'zgaruvchi nomlari SPSS qoidalariga mos bo'lmasa, `import.sps` xato beradi
 * va tadqiqotchi ma'lumotni qo'lda tuzatishga majbur bo'ladi.
 */

function column(name: string): ColumnDef {
  return { name, label: name, type: 'number', measure: 'scale' }
}

describe('spss — spssSafeName', () => {
  it('allaqachon xavfsiz nomni o‘zgartirmaydi', () => {
    expect(spssSafeName('pre_vocabulary')).toBe('pre_vocabulary')
    expect(spssSafeName('gain_grammar')).toBe('gain_grammar')
    expect(spssSafeName('participantCode')).toBe('participantCode')
  })

  it('bo‘shliqlarni pastki chiziqqa almashtiradi', () => {
    expect(spssSafeName('Pre Vocabulary Score')).toBe('Pre_Vocabulary_Score')
  })

  it('ruxsat etilmagan belgilarni tozalaydi', () => {
    expect(spssSafeName('gain %')).toBe('gain')
    expect(spssSafeName('score(pre)')).toBe('score_pre')
    expect(spssSafeName('ai-messages/day')).toBe('ai_messages_day')
  })

  it('ketma-ket pastki chiziqlarni bittaga siqadi', () => {
    expect(spssSafeName('a   b')).toBe('a_b')
    expect(spssSafeName('a--b')).toBe('a_b')
  })

  it('raqam bilan boshlanmaydi (oldiga `v` qo‘shiladi)', () => {
    expect(spssSafeName('2027_score')).toBe('v2027_score')
    expect(spssSafeName('1')).toBe('v1')
  })

  it('pastki chiziq bilan tugamaydi', () => {
    expect(spssSafeName('score_')).toBe('score')
    expect(spssSafeName('score  ')).toBe('score')
  })

  it('SPSS band kalit so‘zlarini himoyalaydi', () => {
    expect(spssSafeName('to')).toBe('to_')
    expect(spssSafeName('BY')).toBe('BY_')
    expect(spssSafeName('and')).toBe('and_')
    // Kalit so'zga o'xshash, lekin band emas
    expect(spssSafeName('total')).toBe('total')
  })

  it('64 belgidan uzun nomlarni qisqartiradi', () => {
    const long = `pre_${'x'.repeat(80)}`
    const safe = spssSafeName(long)
    expect(safe.length).toBeLessThanOrEqual(64)
    expect(safe.startsWith('pre_')).toBe(true)
  })

  it('bo‘sh yoki faqat belgilardan iborat nom uchun xavfsiz standart', () => {
    expect(spssSafeName('')).toBe('v')
    expect(spssSafeName('___')).toBe('var')
    expect(spssSafeName('%%%')).toBe('var')
  })

  it('o‘zbek/kirill harflarini saqlaydi, tipografik belgilarni tozalaydi', () => {
    expect(spssSafeName('ball_o‘rtacha')).toBe('ball_o_rtacha')
    expect(spssSafeName("o'qish_bali")).toBe('o_qish_bali')
  })

  it('natija har doim SPSS nom qoidasiga mos', () => {
    const inputs = [
      'gain %',
      '2027 ball',
      'to',
      '___',
      'pre-test (vocabulary)',
      `${'a'.repeat(100)}`,
      'ball_o‘rtacha',
    ]
    for (const input of inputs) {
      const safe = spssSafeName(input)
      expect(safe.length).toBeGreaterThan(0)
      expect(safe.length).toBeLessThanOrEqual(64)
      expect(safe).toMatch(/^[^\d_][\p{L}\p{N}_]*$/u)
      expect(safe.endsWith('_')).toBe(input.toLowerCase() === 'to')
    }
  })
})

describe('spss — spssNameMap', () => {
  it('har bir ustunga nom beradi', () => {
    const map = spssNameMap([column('participantCode'), column('pre_vocabulary')])
    expect(map.get('participantCode')).toBe('participantCode')
    expect(map.get('pre_vocabulary')).toBe('pre_vocabulary')
  })

  it('to‘qnashgan nomlarni raqam bilan ajratadi', () => {
    const map = spssNameMap([column('gain %'), column('gain!'), column('gain?')])
    const names = [...map.values()]
    expect(new Set(names).size).toBe(3)
    expect(names[0]).toBe('gain')
    expect(names[1]).toBe('gain_2')
    expect(names[2]).toBe('gain_3')
  })

  it('nomlar takrorlanmaydi (registrdan qat’i nazar)', () => {
    const map = spssNameMap([column('Score'), column('score'), column('SCORE')])
    const lower = [...map.values()].map((name) => name.toLowerCase())
    expect(new Set(lower).size).toBe(3)
  })
})
