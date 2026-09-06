import { describe, expect, it } from 'vitest'

import { gradeAll, gradeItem } from '@/lib/adaptive/grade'
import { makeItem } from '../factories'

/**
 * Deterministik baholash testlari — PLAN 6, 8.2.
 * Eksperiment uchun kritik: bir xil javob HAR DOIM bir xil ball olishi kerak
 * (eksperimental va nazorat guruhida ham).
 */

describe('grade — matn javoblarini normallashtirish', () => {
  const item = makeItem({ type: 'gap_fill', answerKey: ['has risen'] })

  it('katta-kichik harf va ortiqcha bo‘shliqlarga e’tibor bermaydi', () => {
    expect(gradeItem(item, ['HAS   RISEN']).isCorrect).toBe(true)
    expect(gradeItem(item, ['  has risen  ']).isCorrect).toBe(true)
  })

  it('oxiridagi tinish belgilarini olib tashlaydi', () => {
    expect(gradeItem(item, ['Has risen.']).isCorrect).toBe(true)
    expect(gradeItem(item, ['has risen!']).isCorrect).toBe(true)
  })

  it('egri (typographic) apostrofni to‘g‘rilaydi', () => {
    const contracted = makeItem({ type: 'gap_fill', answerKey: ["hasn't risen"] })
    expect(gradeItem(contracted, ['hasn’t risen']).isCorrect).toBe(true)
  })

  it('muqobil javoblarni `|` orqali qabul qiladi', () => {
    const alt = makeItem({ type: 'gap_fill', answerKey: ['has risen|rose|went up'] })
    expect(gradeItem(alt, ['rose']).isCorrect).toBe(true)
    expect(gradeItem(alt, ['went up']).isCorrect).toBe(true)
    expect(gradeItem(alt, ['fell']).isCorrect).toBe(false)
  })

  it('xato javobda itemning errorTags qaytariladi', () => {
    const result = gradeItem(item, ['have rise'])
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(0)
    expect(result.errorTags).toContain('tense')
    expect(result.needsAi).toBe(false)
  })

  it('bo‘sh javob — xato, lekin AI kerak emas', () => {
    const result = gradeItem(item, [''])
    expect(result.isCorrect).toBe(false)
    expect(result.needsAi).toBe(false)
  })
})

describe('grade — bir nechta bo‘shliq (pozitsion)', () => {
  const item = makeItem({
    type: 'gap_fill',
    answerKey: ['has increased', 'by'],
    errorTags: ['tense', 'prepositions'],
  })

  it('hammasi to‘g‘ri → score 1', () => {
    const result = gradeItem(item, ['has increased', 'by'])
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(1)
    expect(result.parts).toEqual([true, true])
  })

  it('yarmi to‘g‘ri → qisman ball 0.5', () => {
    const result = gradeItem(item, ['has increased', 'in'])
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(0.5)
    expect(result.parts).toEqual([true, false])
  })
})

describe('grade — MCQ', () => {
  const item = makeItem({
    type: 'mcq',
    stem: 'Inflation ___ sharply last quarter.',
    options: [
      { id: 'a', text: 'has rise' },
      { id: 'b', text: 'rose' },
      { id: 'c', text: 'was rose' },
    ],
    answerKey: ['b'],
    errorTags: ['tense'],
  })

  it('variant id bo‘yicha baholaydi', () => {
    expect(gradeItem(item, ['b']).isCorrect).toBe(true)
    expect(gradeItem(item, ['a']).isCorrect).toBe(false)
  })

  it('variant matni yuborilsa ham tushunadi', () => {
    expect(gradeItem(item, ['rose']).isCorrect).toBe(true)
    expect(gradeItem(item, ['Rose.']).isCorrect).toBe(true)
  })

  it("to'g'ri javobda errorTags bo'sh", () => {
    expect(gradeItem(item, ['b']).errorTags).toEqual([])
  })

  it('hech qachon AI so‘ramaydi', () => {
    expect(gradeItem(item, ['c']).needsAi).toBe(false)
  })

  it('bir nechta to‘g‘ri variant (multi-select) qisman baholanadi', () => {
    const multi = makeItem({
      type: 'mcq',
      options: [
        { id: 'a', text: 'revenue' },
        { id: 'b', text: 'turnover' },
        { id: 'c', text: 'expense' },
      ],
      answerKey: ['a', 'b'],
    })
    expect(gradeItem(multi, ['a', 'b']).score).toBe(1)
    expect(gradeItem(multi, ['a', 'c']).score).toBe(0.5)
    expect(gradeItem(multi, ['a', 'b']).isCorrect).toBe(true)
  })
})

describe('grade — word order', () => {
  const item = makeItem({
    type: 'word_order',
    stem: 'company / the / a / profit / has / made',
    answerKey: ['the company has made a profit'],
    errorTags: ['word_order'],
  })

  it("to'g'ri tartib → 1 ball", () => {
    const result = gradeItem(item, ['the', 'company', 'has', 'made', 'a', 'profit'])
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(1)
  })

  it('bitta gap sifatida yuborilsa ham ishlaydi', () => {
    expect(gradeItem(item, ['The company has made a profit.']).isCorrect).toBe(true)
  })

  it('qisman to‘g‘ri tartib qisman ball oladi', () => {
    const result = gradeItem(item, ['the', 'company', 'has', 'a', 'made', 'profit'])
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(1)
    expect(result.parts?.slice(0, 3)).toEqual([true, true, true])
  })

  it('butunlay boshqa tartib → 0 ga yaqin', () => {
    const result = gradeItem(item, ['profit', 'a', 'made', 'has', 'company', 'the'])
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBeLessThan(0.5)
    expect(result.errorTags).toContain('word_order')
  })
})

describe('grade — matching va classification', () => {
  it('matching juftliklari pozitsion tekshiriladi', () => {
    const item = makeItem({
      type: 'matching',
      answerKey: [],
      pairs: [
        { left: 'revenue', right: 'daromad' },
        { left: 'expense', right: 'xarajat' },
      ],
    })
    expect(gradeItem(item, ['daromad', 'xarajat']).score).toBe(1)
    expect(gradeItem(item, ['xarajat', 'daromad']).score).toBe(0)
    expect(gradeItem(item, ['daromad', 'foyda']).score).toBe(0.5)
  })

  it('matching `left::right` formatida ham ishlaydi', () => {
    const item = makeItem({
      type: 'matching',
      answerKey: [],
      pairs: [
        { left: 'revenue', right: 'daromad' },
        { left: 'expense', right: 'xarajat' },
      ],
    })
    const result = gradeItem(item, ['revenue::daromad', 'expense::xarajat'])
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(1)
  })

  it('classification elementni kategoriyaga joylaydi', () => {
    const item = makeItem({
      type: 'classification',
      categories: ['assets', 'liabilities'],
      answerKey: ['cash::assets', 'loan::liabilities'],
    })
    expect(gradeItem(item, ['cash::assets', 'loan::liabilities']).score).toBe(1)
    expect(gradeItem(item, ['cash::liabilities', 'loan::liabilities']).score).toBe(0.5)
  })
})

describe('grade — ochiq topshiriqlar AI ga yuboriladi', () => {
  it('open_writing / speaking_prompt / imitation → needsAi', () => {
    for (const type of ['open_writing', 'speaking_prompt', 'imitation'] as const) {
      const result = gradeItem(makeItem({ type }), ['Some student answer.'])
      expect(result.needsAi).toBe(true)
      expect(result.isCorrect).toBe(false)
      expect(result.reason).toBeTruthy()
    }
  })

  it('answerKey bo‘sh bo‘lsa AI baholaydi', () => {
    const result = gradeItem(makeItem({ type: 'transformation', answerKey: [] }), ['anything'])
    expect(result.needsAi).toBe(true)
  })
})

describe('grade — gradeAll', () => {
  it('avtomatik baholanadigan itemlar bo‘yicha umumiy ball hisoblanadi', () => {
    const correct = makeItem({ id: 'c1', type: 'gap_fill', answerKey: ['has risen'] })
    const wrong = makeItem({ id: 'w1', type: 'gap_fill', answerKey: ['fell'] })
    const open = makeItem({ id: 'o1', type: 'open_writing' })

    const summary = gradeAll([
      { item: correct, answer: ['has risen'] },
      { item: wrong, answer: ['rose'] },
      { item: open, answer: ['Long essay text here.'] },
    ])

    expect(summary.results).toHaveLength(3)
    expect(summary.max).toBe(2)
    expect(summary.total).toBe(1)
    expect(summary.percent).toBe(50)
    expect(summary.needsAi).toBe(1)
  })

  it('bo‘sh ro‘yxat xato bermaydi', () => {
    const summary = gradeAll([])
    expect(summary.max).toBe(0)
    expect(summary.percent).toBe(0)
    expect(summary.total).toBe(0)
  })
})
