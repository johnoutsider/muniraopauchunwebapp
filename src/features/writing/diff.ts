/**
 * Qoralamalarni taqqoslash uchun oddiy so'z darajasidagi diff (LCS).
 * Kutubxona qo'shilmaydi — matnlar qisqa (≤ 12 000 belgi), LCS jadvali yetarli.
 */

export type DiffOp = 'same' | 'added' | 'removed'

export interface DiffToken {
  op: DiffOp
  text: string
}

const MAX_TOKENS = 1200

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0)
}

export function diffWords(before: string, after: string): DiffToken[] {
  const a = tokenize(before).slice(0, MAX_TOKENS)
  const b = tokenize(after).slice(0, MAX_TOKENS)

  // LCS uzunliklari jadvali
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  )
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const tokens: DiffToken[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      tokens.push({ op: 'same', text: a[i] })
      i += 1
      j += 1
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      tokens.push({ op: 'removed', text: a[i] })
      i += 1
    } else {
      tokens.push({ op: 'added', text: b[j] })
      j += 1
    }
  }
  while (i < a.length) {
    tokens.push({ op: 'removed', text: a[i] })
    i += 1
  }
  while (j < b.length) {
    tokens.push({ op: 'added', text: b[j] })
    j += 1
  }

  return tokens
}

export interface DiffStats {
  added: number
  removed: number
}

export function diffStats(tokens: DiffToken[]): DiffStats {
  let added = 0
  let removed = 0
  for (const token of tokens) {
    if (!token.text.trim()) continue
    if (token.op === 'added') added += 1
    if (token.op === 'removed') removed += 1
  }
  return { added, removed }
}
