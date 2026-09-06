import type { ItemDoc, WithId } from '@/types'

/**
 * Test fabrikalari — hujjatlarni qo'lda to'ldirmaslik uchun.
 * Faqat testlarda ishlatiladi (`*.test.ts` emas, shuning uchun Vitest uni
 * alohida test fayli sifatida yig'maydi).
 */

export type TestItem = ItemDoc & WithId

const BASE_ITEM: TestItem = {
  id: 'item-base',
  type: 'gap_fill',
  skill: 'grammar',
  topic: 'present_perfect',
  domain: 'finance',
  cefr: 'B1',
  difficulty: 3,
  stem: 'Revenue ___ by 12% since January.',
  instruction: 'Bo‘shliqni to‘ldiring.',
  answerKey: ['has risen'],
  explanation: {
    why: 'Present Perfect — hozirgacha davom etayotgan natija.',
    how: 'have/has + V3',
    whereElse: 'Company performance hisobotlarida.',
  },
  errorTags: ['tense'],
  tags: ['revenue'],
  source: 'human',
  status: 'approved',
  createdAt: '2027-01-15T10:00:00.000Z',
}

/** Bitta item yaratish; kerakli maydonlarni ustiga yozasiz. */
export function makeItem(overrides: Partial<TestItem> = {}): TestItem {
  return { ...BASE_ITEM, ...overrides }
}

/** Qiyinliklar ro'yxatidan itemlar to'plami (`d1`, `d2`, … id bilan). */
export function makeItemsByDifficulty(
  difficulties: readonly number[],
  overrides: Partial<TestItem> = {}
): TestItem[] {
  return difficulties.map((difficulty, index) =>
    makeItem({ id: `d${difficulty}-${index}`, difficulty, ...overrides })
  )
}
