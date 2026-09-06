/**
 * SPSS-ready eksport (PLAN.md 9.3).
 *
 * ILMIY MAQSAD:
 * Dissertatsiyaning yakuniy statistik tahlili SPSS'da bajariladi. Ma'lumotni
 * qo'lda import qilish — xatolar manbai (noto'g'ri o'lchov darajasi, yo'qolgan
 * qiymat yorliqlari, buzilgan kodirovka). Shuning uchun eksport paketi
 * uch qismdan iborat:
 *
 *   1. `*.csv`        — ma'lumotning o'zi (UTF-8 + BOM, vergul, ISO sanalar);
 *   2. `codebook.md`  — inson uchun kodlash kitobi (o'zgaruvchi, yorliq, tip,
 *                       o'lchov, qiymat yorliqlari) — ilovaga qo'shiladi;
 *   3. `import.sps`   — SPSS sintaksisi: GET DATA + VARIABLE LABELS +
 *                       VALUE LABELS + VARIABLE LEVEL + SAVE OUTFILE.
 *
 * Tadqiqotchi `import.sps` ni ochib "Run All" bosadi — barcha yorliqlar va
 * o'lchov darajalari avtomatik o'rnatiladi. Bu takrorlanuvchanlikni
 * (reproducibility) ta'minlaydi: tahlil qadamlari fayl sifatida saqlanadi.
 */

import type { ColumnDef, Dataset, Measure } from './datasets'

/* ------------------------------------------------------------------ */
/* O'zgaruvchi nomlari                                                 */
/* ------------------------------------------------------------------ */

/** SPSS'da band bo'lgan kalit so'zlar — o'zgaruvchi nomi bo'la olmaydi. */
const RESERVED = new Set([
  'all',
  'and',
  'by',
  'eq',
  'ge',
  'gt',
  'le',
  'lt',
  'ne',
  'not',
  'or',
  'to',
  'with',
])

const MAX_NAME_LENGTH = 64

/**
 * Nomni SPSS-xavfsiz shaklga keltirish:
 *   • faqat harflar, raqamlar, `_` (boshqa belgilar `_` ga almashadi);
 *   • raqam bilan boshlanmaydi (oldiga `v` qo'shiladi);
 *   • `_` bilan tugamaydi;
 *   • uzunligi ≤ 64 belgi;
 *   • band kalit so'zlar `_` bilan yakunlanadi.
 */
export function spssSafeName(name: string): string {
  let safe = name
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}_]/gu, '_')
    .replace(/_{2,}/g, '_')

  if (!safe || /^[0-9]/.test(safe)) safe = `v${safe}`
  safe = safe.replace(/_+$/, '')
  if (!safe) safe = 'var'
  if (safe.length > MAX_NAME_LENGTH) safe = safe.slice(0, MAX_NAME_LENGTH).replace(/_+$/, '')
  if (RESERVED.has(safe.toLowerCase())) safe = `${safe}_`
  return safe
}

/**
 * Dataset ustunlari uchun takrorlanmaydigan SPSS nomlari.
 * Nomlar kesilganda to'qnashishi mumkin — oxiriga raqam qo'shiladi.
 */
export function spssNameMap(columns: readonly ColumnDef[]): Map<string, string> {
  const used = new Set<string>()
  const map = new Map<string, string>()
  for (const column of columns) {
    let name = spssSafeName(column.name)
    if (used.has(name.toLowerCase())) {
      let index = 2
      let candidate = `${name.slice(0, MAX_NAME_LENGTH - 2)}_${index}`
      while (used.has(candidate.toLowerCase())) {
        index += 1
        candidate = `${name.slice(0, MAX_NAME_LENGTH - String(index).length - 1)}_${index}`
      }
      name = candidate
    }
    used.add(name.toLowerCase())
    map.set(column.name, name)
  }
  return map
}

/* ------------------------------------------------------------------ */
/* Formatlar                                                           */
/* ------------------------------------------------------------------ */

/** Matn ustunining maksimal uzunligi (SPSS `A<n>` formati uchun). */
function stringWidth(column: ColumnDef, rows: ReadonlyArray<Record<string, unknown>>): number {
  let width = 8
  for (const row of rows) {
    const value = row[column.name]
    if (value === null || value === undefined) continue
    const length = String(value).length
    if (length > width) width = length
  }
  return Math.min(32767, Math.max(8, width + 4))
}

/** Ustun uchun SPSS import formati (`A20`, `F8.2` …). */
export function spssFormat(
  column: ColumnDef,
  rows: ReadonlyArray<Record<string, unknown>>
): string {
  if (column.type === 'string') return `A${stringWidth(column, rows)}`
  // Sanalar ISO matn sifatida import qilinadi; keyin ALTER TYPE bilan
  // SPSS sanasiga aylantirish mumkin (izoh sintaksis faylida berilgan).
  if (column.type === 'date') return `A30`
  if (column.measure === 'scale') return 'F12.4'
  return 'F8.0'
}

/** SPSS satrini qo'shtirnoq bilan qochirish. */
function q(text: string): string {
  return `"${String(text).replace(/"/g, '""')}"`
}

/** VALUE LABELS uchun bitta tirnoq. */
function q1(text: string): string {
  return `'${String(text).replace(/'/g, "''")}'`
}

/* ------------------------------------------------------------------ */
/* import.sps                                                          */
/* ------------------------------------------------------------------ */

export interface SpssSyntaxOptions {
  /** `SAVE OUTFILE` uchun `.sav` fayl nomi (standart: dataset nomi). */
  savFileName?: string
  /** Sarlavhaga qo'shiladigan eksperiment nomi. */
  experimentTitle?: string
  generatedAt?: Date
}

/**
 * Bitta dataset uchun to'liq SPSS sintaksis fayli.
 *
 * @param dataset     ustunlar va qatorlar (qatorlar faqat format kengligini
 *                    aniqlash uchun ishlatiladi — sintaksisga tushmaydi)
 * @param csvFileName sintaksis o'qiydigan CSV fayl nomi (workbook bilan
 *                    bir papkada bo'lishi kerak)
 */
export function buildSpsSyntax(
  dataset: Dataset,
  csvFileName: string,
  options: SpssSyntaxOptions = {}
): string {
  const names = spssNameMap(dataset.columns)
  const sav = options.savFileName ?? `${dataset.name}.sav`
  const generatedAt = (options.generatedAt ?? new Date()).toISOString()

  const lines: string[] = []

  lines.push('* Encoding: UTF-8.')
  lines.push('* -----------------------------------------------------------------.')
  lines.push(`* LinguaEcon AI — ${dataset.label} (${dataset.name}).`)
  if (options.experimentTitle) lines.push(`* Eksperiment: ${options.experimentTitle}.`)
  lines.push(`* Yaratilgan: ${generatedAt}.`)
  lines.push(`* Qatorlar: ${dataset.rows.length}, o'zgaruvchilar: ${dataset.columns.length}.`)
  lines.push('* Anonim: faqat participantCode. Guruh: 1=eksperimental, 2=nazorat.')
  lines.push("* CSV fayl shu sintaksis bilan BIR PAPKADA bo'lishi kerak.")
  lines.push('* -----------------------------------------------------------------.')
  lines.push('')

  /* --- GET DATA --------------------------------------------------- */
  lines.push('GET DATA')
  lines.push('  /TYPE=TXT')
  lines.push(`  /FILE=${q(csvFileName)}`)
  lines.push("  /ENCODING='UTF8'")
  lines.push('  /ARRANGEMENT=DELIMITED')
  lines.push('  /DELIMITERS=","')
  lines.push("  /QUALIFIER='\"'")
  lines.push('  /FIRSTCASE=2')
  lines.push('  /IMPORTCASE=ALL')
  lines.push('  /VARIABLES=')
  for (const column of dataset.columns) {
    lines.push(`    ${names.get(column.name)} ${spssFormat(column, dataset.rows)}`)
  }
  lines.push('  .')
  lines.push('CACHE.')
  lines.push('EXECUTE.')
  lines.push('')
  lines.push(`DATASET NAME ${spssSafeName(dataset.name)} WINDOW=FRONT.`)
  lines.push('')

  /* --- VARIABLE LABELS -------------------------------------------- */
  lines.push('VARIABLE LABELS')
  for (const column of dataset.columns) {
    lines.push(`  ${names.get(column.name)} ${q(column.label)}`)
  }
  lines.push('  .')
  lines.push('')

  /* --- VALUE LABELS ------------------------------------------------ */
  const labelled = dataset.columns.filter(
    (column) => column.values && Object.keys(column.values).length > 0
  )
  if (labelled.length) {
    lines.push('VALUE LABELS')
    labelled.forEach((column, index) => {
      lines.push(`  ${names.get(column.name)}`)
      for (const [value, label] of Object.entries(column.values ?? {})) {
        const key = column.type === 'number' ? value : q1(value)
        lines.push(`    ${key} ${q1(label)}`)
      }
      lines.push(index === labelled.length - 1 ? '  .' : '  /')
    })
    lines.push('')
  }

  /* --- VARIABLE LEVEL ---------------------------------------------- */
  // SPSS matnli (`A<n>`) o'zgaruvchiga SCALE darajasini bermaydi — sana
  // ustunlari ISO matn sifatida import qilingani uchun ular NOMINAL bo'ladi.
  const levelOf = (column: ColumnDef): Measure =>
    column.type === 'string' || column.type === 'date'
      ? column.measure === 'scale'
        ? 'nominal'
        : column.measure
      : column.measure

  for (const measure of ['nominal', 'ordinal', 'scale'] as const) {
    const group = dataset.columns.filter((column) => levelOf(column) === measure)
    if (!group.length) continue
    const list = group.map((column) => names.get(column.name)).join(' ')
    lines.push(`VARIABLE LEVEL ${list} (${measure.toUpperCase()}).`)
  }
  lines.push('')

  /* --- Sanalarni aylantirish (ixtiyoriy) ---------------------------- */
  const dates = dataset.columns.filter((column) => column.type === 'date')
  if (dates.length) {
    lines.push('* Sana ustunlari ISO 8601 matn sifatida import qilingan.')
    lines.push('* Ularni SPSS sanasiga aylantirish uchun quyidagini oching:')
    for (const column of dates) {
      const name = names.get(column.name)
      lines.push(`*   COMPUTE ${name}_d = NUMBER(CHAR.SUBSTR(${name},1,10), ADATE10).`)
      lines.push(`*   VARIABLE LEVEL ${name}_d (SCALE).`)
    }
    lines.push('* EXECUTE.')
    lines.push('')
  }

  /* --- SAVE --------------------------------------------------------- */
  lines.push(`SAVE OUTFILE=${q(sav)}`)
  lines.push('  /COMPRESSED.')
  lines.push('')
  lines.push('* Tavsiya etilgan birinchi qadamlar:')
  lines.push('*   DESCRIPTIVES VARIABLES=ALL.')
  lines.push('*   FREQUENCIES VARIABLES=expGroup.')
  lines.push('')

  return lines.join('\r\n')
}

/* ------------------------------------------------------------------ */
/* codebook.md                                                         */
/* ------------------------------------------------------------------ */

export interface CodebookOptions {
  experimentTitle?: string
  experimentId?: string
  hypothesis?: string
  design?: string
  generatedAt?: Date
}

/**
 * Barcha datasetlar uchun yagona kodlash kitobi (markdown).
 * Dissertatsiya ilovasiga to'g'ridan to'g'ri qo'shsa bo'ladigan hujjat.
 */
export function buildCodebook(datasets: readonly Dataset[], options: CodebookOptions = {}): string {
  const generatedAt = (options.generatedAt ?? new Date()).toISOString()
  const lines: string[] = []

  lines.push('# LinguaEcon AI — kodlash kitobi (codebook)')
  lines.push('')
  if (options.experimentTitle) lines.push(`**Eksperiment:** ${options.experimentTitle}  `)
  if (options.experimentId) lines.push(`**Eksperiment ID:** \`${options.experimentId}\`  `)
  if (options.hypothesis) lines.push(`**Gipoteza:** ${options.hypothesis}  `)
  if (options.design) lines.push(`**Dizayn:** ${options.design}  `)
  lines.push(`**Yaratilgan:** ${generatedAt}  `)
  lines.push('')

  lines.push('## Umumiy qoidalar')
  lines.push('')
  lines.push('| Qoida | Qiymat |')
  lines.push('|---|---|')
  lines.push(
    '| Anonimlik | Faqat `participantCode`. Uid, email, ism va boshqa identifikator YO‘Q. |'
  )
  lines.push(
    '| Guruh kodlari | `1` = eksperimental (AI yoqilgan), `2` = nazorat (AI o‘chirilgan) |'
  )
  lines.push('| Mantiqiy maydonlar | `0` = yo‘q, `1` = ha |')
  lines.push('| Bo‘sh katak | Ma‘lumot yo‘q (SPSS: system-missing) |')
  lines.push('| Sana formati | ISO 8601, UTC (`2027-03-14T09:12:00.000Z`) |')
  lines.push('| Fayl kodirovkasi | UTF-8 + BOM, ajratgich `,`, qo‘shtirnoq `"` |')
  lines.push('| Ball shkalasi | Test va ko‘nikma ballari 0–100 ga normallashtirilgan |')
  lines.push('')

  lines.push('## Datasetlar')
  lines.push('')
  lines.push('| Fayl | Nomi | Qatorlar | O‘zgaruvchilar | Tavsif |')
  lines.push('|---|---|---:|---:|---|')
  for (const dataset of datasets) {
    lines.push(
      `| \`${dataset.name}.csv\` | ${dataset.label} | ${dataset.rows.length} | ${dataset.columns.length} | ${dataset.description} |`
    )
  }
  lines.push('')

  for (const dataset of datasets) {
    const names = spssNameMap(dataset.columns)
    lines.push(`## \`${dataset.name}\` — ${dataset.label}`)
    lines.push('')
    lines.push(dataset.description)
    lines.push('')
    lines.push('| # | O‘zgaruvchi (SPSS) | Yorliq | Tip | O‘lchov | Format | Qiymat yorliqlari |')
    lines.push('|---:|---|---|---|---|---|---|')
    dataset.columns.forEach((column, index) => {
      const values = column.values
        ? Object.entries(column.values)
            .map(([key, label]) => `\`${key}\` = ${label}`)
            .join('<br>')
        : '—'
      lines.push(
        `| ${index + 1} | \`${names.get(column.name)}\` | ${column.label} | ${column.type} | ${column.measure} | \`${spssFormat(
          column,
          dataset.rows
        )}\` | ${values} |`
      )
    })
    lines.push('')
  }

  lines.push('## Tavsiya etilgan tahlil qadamlari (SPSS)')
  lines.push('')
  lines.push(
    '1. `import.sps` fayllarini ishga tushiring (`Run All`) — barcha yorliqlar o‘rnatiladi.'
  )
  lines.push('2. `participants` faylida: `DESCRIPTIVES` bilan pre/post o‘rtachalarni ko‘ring.')
  lines.push('3. Ichki-guruh o‘sishi: `T-TEST PAIRS = pre_total WITH post_total (PAIRED).`')
  lines.push('4. Guruhlararo taqqoslash: `T-TEST GROUPS=expGroup(1 2) /VARIABLES=gain_total.`')
  lines.push('5. Normal taqsimot shubhali bo‘lsa: `NPAR TESTS /M-W= gain_total BY expGroup(1 2).`')
  lines.push("6. Effekt hajmi (Cohen's d) — `T-TEST` chiqishidagi `Effect Size` jadvalidan.")
  lines.push('7. Korrelyatsiya: `CORRELATIONS /VARIABLES=aiMessages gain_total.`')
  lines.push(
    '8. So‘rovnoma ishonchliligi: `survey_items` ni wide formatga o‘tkazib, `RELIABILITY`.'
  )
  lines.push('')

  return lines.join('\n')
}

/* ------------------------------------------------------------------ */
/* Paket                                                               */
/* ------------------------------------------------------------------ */

export interface SpssPackageFile {
  name: string
  content: string
  contentType: string
}

/**
 * To'liq SPSS paketi uchun matnli fayllar ro'yxati (CSV fayllari
 * `csv.ts` orqali alohida qo'shiladi).
 */
export function buildSpssPackage(
  datasets: readonly Dataset[],
  options: CodebookOptions = {}
): SpssPackageFile[] {
  const files: SpssPackageFile[] = [
    {
      name: 'codebook.md',
      content: buildCodebook(datasets, options),
      contentType: 'text/markdown; charset=utf-8',
    },
  ]
  for (const dataset of datasets) {
    files.push({
      name: `${dataset.name}.sps`,
      content: buildSpsSyntax(dataset, `${dataset.name}.csv`, {
        experimentTitle: options.experimentTitle,
        generatedAt: options.generatedAt,
      }),
      contentType: 'text/plain; charset=utf-8',
    })
  }
  return files
}
