/** `corpusNgrams` hujjat kaliti: "make a profit" → "make_a_profit". */
export function ngramKey(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, '_')
}

/** Ko‘p bo‘shliqlarni tozalab, uzunlikni cheklaydi. */
export function cleanPhrase(value: unknown, max = 120): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}
