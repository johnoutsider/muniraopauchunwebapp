/**
 * scripts/export-research.ts — ilmiy ma'lumotlarni eksport qiladi (PLAN 9-bo'lim).
 *
 *   npx tsx scripts/export-research.ts --experiment=exp-2027-spring
 *
 * Natija `scripts/out/<sana>/` papkasida:
 *   linguaecon-research.xlsx   — ko'p varaqli Excel (har dataset alohida varaq)
 *   <dataset>.csv              — SPSS/R uchun UTF-8 CSV
 *   import.sps                 — SPSS sintaksis fayli (GET DATA, VARIABLE LABELS, ...)
 *   codebook.md                — o'zgaruvchilar kitobi
 *
 * Eksport mantiqi `@/lib/export` modulida (boshqa agent yozadi). Modul topilmasa
 * yoki kutilgan funksiyani eksport qilmasa — skript aniq xato bilan to'xtaydi.
 * Modul faqat datasetlarni qursa (CSV/Excel/SPSS generatorlarisiz), skript
 * ularni o'zi yozadi.
 *
 * ANONIMLIK: eksportda uid va ism bo'lmasligi kerak — faqat `participantCode`
 * (PLAN 9.3). Skript uid/email/displayName ustunlarini topsa ogohlantiradi.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import ExcelJS from 'exceljs'

import {
  c,
  initAdmin,
  isoDate,
  log,
  parseArgs,
  projectId,
  runMain,
  showHelp,
  table,
  wantsHelp,
} from './_lib'

const MODULE_REL = 'src/lib/export/index.ts'
const MODULE_ALIAS = '@/lib/export'

const HELP = `
${c.bold('export-research')} — Excel / CSV / SPSS eksport paketini yaratadi.

${c.bold('Ishlatish:')}
  npx tsx scripts/export-research.ts [bayroqlar]

${c.bold('Bayroqlar:')}
  --experiment=<id>      ${c.gray('Faqat shu eksperiment ishtirokchilari')}
  --cohort=<id>          ${c.gray('Faqat shu kohort')}
  --datasets=<a,b>       ${c.gray("Faqat tanlangan datasetlar (default: hammasi)")}
  --out=<yo'l>           ${c.gray("Chiqish papkasi (default: scripts/out/<sana>)")}
  --format=<xlsx,csv,sps>${c.gray(' Qaysi formatlar (default: hammasi)')}
  --include-events       ${c.gray("To'liq event logini ham chiqaradi (katta fayl)")}
  --dry-run              ${c.gray('Faqat qanday datasetlar borligini ko‘rsatadi')}
  --help                 ${c.gray('Shu yordam')}

${c.bold('Datasetlar')} ${c.gray('(PLAN 9.2)')}:
  participants, attempts_long, speaking_long, writing_long,
  ai_interactions, survey_items, events

${c.bold('Misollar:')}
  npx tsx scripts/export-research.ts --dry-run
  npx tsx scripts/export-research.ts --experiment=exp-2027-spring --format=xlsx,csv,sps
  npx tsx scripts/export-research.ts --datasets=participants,survey_items --out=./export

${c.yellow('Etika:')} eksportda ism/uid bo'lmasligi kerak — faqat participantCode (PLAN 9.4).
`

/* ------------------------------------------------------------------ */
/* Dataset shakli                                                       */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>

interface Dataset {
  name: string
  rows: Row[]
  columns: string[]
  /** SPSS uchun o'lchov darajasi */
  measures?: Record<string, 'nominal' | 'ordinal' | 'scale'>
  labels?: Record<string, string>
  valueLabels?: Record<string, Record<string | number, string>>
}

/** Modul topa oladigan dataset-quruvchi funksiya nomlari. */
const BUILDER_NAMES = [
  'buildResearchExport',
  'buildExportPackage',
  'buildAllDatasets',
  'buildDatasets',
  'exportResearchData',
  'buildResearchDatasets',
]

const EXCEL_NAMES = ['buildExcelWorkbook', 'buildExcel', 'toExcel', 'exportExcel']
const CSV_NAMES = ['datasetToCsv', 'toCsv', 'buildCsv']
const SPSS_NAMES = ['buildSpssSyntax', 'buildSpss', 'toSpss', 'buildSpsPackage']
const CODEBOOK_NAMES = ['buildCodebook', 'buildCodebookMarkdown']

type AnyFn = (...args: unknown[]) => unknown

function pick(mod: Record<string, unknown>, names: string[]): AnyFn | null {
  for (const name of names) {
    const fn = mod[name]
    if (typeof fn === 'function') return fn as AnyFn
  }
  return null
}

async function loadExportModule(): Promise<Record<string, unknown>> {
  const file = resolve(process.cwd(), MODULE_REL)
  const alt = resolve(process.cwd(), 'src/lib/export/excel.ts')

  if (!existsSync(file) && !existsSync(alt)) {
    throw new Error(
      `Eksport moduli topilmadi: ${MODULE_ALIAS}\n` +
        `  Kutilgan fayl: ${file}\n\n` +
        `  Bu skript quyidagilardan birini kutadi:\n` +
        `    export async function buildResearchExport(options) -> { datasets: Dataset[] }\n` +
        `  Dataset = { name, rows, columns, measures?, labels?, valueLabels? }\n\n` +
        `  Modul hali yozilmagan bo'lsa, --dry-run bilan rejani ko'ring.\n` +
        `  Qo'shimcha (ixtiyoriy) eksportlar: ${[...EXCEL_NAMES, ...CSV_NAMES, ...SPSS_NAMES].join(', ')}`
    )
  }

  const target = existsSync(file) ? file : alt
  try {
    return (await import(pathToFileURL(target).href)) as Record<string, unknown>
  } catch (err) {
    throw new Error(
      `${MODULE_ALIAS} yuklanmadi: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/** Modul turli shaklda qaytarishi mumkin — hammasini Dataset[] ga keltiramiz. */
function normaliseDatasets(result: unknown): Dataset[] {
  const toDataset = (name: string, value: unknown): Dataset | null => {
    if (Array.isArray(value)) {
      const rows = value as Row[]
      return { name, rows, columns: collectColumns(rows) }
    }
    if (value && typeof value === 'object') {
      const obj = value as Partial<Dataset> & { rows?: Row[]; data?: Row[] }
      const rows = obj.rows ?? obj.data
      if (Array.isArray(rows)) {
        return {
          name: obj.name ?? name,
          rows,
          columns: obj.columns?.length ? obj.columns : collectColumns(rows),
          measures: obj.measures,
          labels: obj.labels,
          valueLabels: obj.valueLabels,
        }
      }
    }
    return null
  }

  if (Array.isArray(result)) {
    return result
      .map((d, i) => toDataset((d as { name?: string })?.name ?? `dataset_${i + 1}`, d))
      .filter((d): d is Dataset => d !== null)
  }

  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>
    if (obj.datasets !== undefined) return normaliseDatasets(obj.datasets)
    if (obj.data !== undefined && obj.ok !== false) return normaliseDatasets(obj.data)
    if (obj.ok === false) throw new Error(`Eksport moduli xato qaytardi: ${String(obj.error)}`)

    const out: Dataset[] = []
    for (const [key, value] of Object.entries(obj)) {
      const ds = toDataset(key, value)
      if (ds) out.push(ds)
    }
    if (out.length) return out
  }

  throw new Error(
    'Eksport moduli kutilmagan natija qaytardi — { datasets: Dataset[] } yoki ' +
      '{ <nom>: Row[] } kutilgan edi.'
  )
}

function collectColumns(rows: Row[]): string[] {
  const set = new Set<string>()
  for (const row of rows.slice(0, 500)) for (const k of Object.keys(row)) set.add(k)
  return [...set]
}

/* ------------------------------------------------------------------ */
/* Yozuvchilar (modul o'zi bermasa, zaxira sifatida)                    */
/* ------------------------------------------------------------------ */

function cellToCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    const ts = value as { seconds?: number; toDate?: () => Date }
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString()
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString()
    return JSON.stringify(value)
  }
  return String(value)
}

function datasetToCsv(ds: Dataset): string {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const lines = [ds.columns.map(esc).join(',')]
  for (const row of ds.rows) {
    lines.push(ds.columns.map((col) => esc(cellToCsv(row[col]))).join(','))
  }
  return lines.join('\n')
}

async function writeWorkbook(datasets: Dataset[], file: string): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'LinguaEcon AI — export-research'
  wb.created = new Date()

  // Izoh varag'i (PLAN 9.3)
  const info = wb.addWorksheet('README')
  info.columns = [
    { header: 'Varaq', key: 'sheet', width: 24 },
    { header: 'Qatorlar', key: 'rows', width: 12 },
    { header: 'Ustunlar', key: 'cols', width: 12 },
    { header: 'Izoh', key: 'note', width: 70 },
  ]
  info.addRow({
    sheet: '(meta)',
    rows: '',
    cols: '',
    note: `Yaratildi: ${new Date().toISOString()} — LinguaEcon AI tadqiqot eksporti. Anonim: faqat participantCode.`,
  })
  for (const ds of datasets) {
    info.addRow({
      sheet: ds.name,
      rows: ds.rows.length,
      cols: ds.columns.length,
      note: ds.columns.slice(0, 12).join(', ') + (ds.columns.length > 12 ? ' ...' : ''),
    })
  }
  info.getRow(1).font = { bold: true }

  for (const ds of datasets) {
    // Excel varaq nomi 31 belgidan oshmasligi kerak
    const ws = wb.addWorksheet(ds.name.slice(0, 31))
    ws.columns = ds.columns.map((col) => ({ header: col, key: col, width: Math.min(28, Math.max(10, col.length + 4)) }))
    for (const row of ds.rows) {
      const flat: Row = {}
      for (const col of ds.columns) flat[col] = cellToCsv(row[col])
      ws.addRow(flat)
    }
    ws.getRow(1).font = { bold: true }
    ws.views = [{ state: 'frozen', ySplit: 1 }]
  }

  await wb.xlsx.writeFile(file)
}

/** SPSS o'zgaruvchi nomi: <= 64 belgi, harf bilan boshlanadi, faqat [A-Za-z0-9_] */
function spssName(col: string): string {
  const cleaned = col.replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+/, '')
  const safe = /^[A-Za-z]/.test(cleaned) ? cleaned : `v_${cleaned}`
  return safe.slice(0, 64)
}

function guessMeasure(col: string, rows: Row[]): 'nominal' | 'ordinal' | 'scale' {
  const lower = col.toLowerCase()
  if (/(group|code|id|type|skill|domain|topic|tag|status|gender|persona)/.test(lower)) return 'nominal'
  if (/(likert|m\d+$|a\d+$|s\d+$|difficulty|mood|rating|score_1_5)/.test(lower)) return 'ordinal'
  const sample = rows.slice(0, 200).map((r) => r[col])
  const numeric = sample.filter((v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)))
  return numeric.length >= sample.length * 0.8 && sample.length > 0 ? 'scale' : 'nominal'
}

function buildSpssSyntax(datasets: Dataset[]): string {
  const blocks: string[] = [
    '* ==================================================================.',
    '* LinguaEcon AI — SPSS import sintaksisi (PLAN 9.3).',
    `* Yaratildi: ${new Date().toISOString()}.`,
    '* Ishlatish: CSV fayllar shu .sps fayl bilan bir papkada bo\'lsin,',
    '*            SPSS -> File -> Open -> Syntax -> import.sps -> Run All.',
    '* Guruh kodi: 1 = experimental, 2 = control.',
    '* Teskari (reverse) Likert bandlari QAYTA KODLANISHI kerak: yangi = 6 - eski.',
    '* ==================================================================.',
    '',
  ]

  for (const ds of datasets) {
    const names = ds.columns.map(spssName)
    blocks.push(`* ---------- ${ds.name} (${ds.rows.length} qator) ----------.`)
    blocks.push('GET DATA')
    blocks.push("  /TYPE=TXT")
    blocks.push(`  /FILE="${ds.name}.csv"`)
    blocks.push('  /ENCODING="UTF8"')
    blocks.push('  /DELIMITERS=","')
    blocks.push('  /QUALIFIER=\'"\'')
    blocks.push('  /ARRANGEMENT=DELIMITED')
    blocks.push('  /FIRSTCASE=2')
    blocks.push('  /VARIABLES=')
    ds.columns.forEach((col, i) => {
      const measure = ds.measures?.[col] ?? guessMeasure(col, ds.rows)
      const type = measure === 'scale' || measure === 'ordinal' ? 'F8.2' : 'A64'
      blocks.push(`    ${names[i]} ${type}`)
    })
    blocks.push('  .')
    blocks.push(`DATASET NAME ${spssName(ds.name)} WINDOW=FRONT.`)
    blocks.push('')

    blocks.push('VARIABLE LABELS')
    ds.columns.forEach((col, i) => {
      const label = (ds.labels?.[col] ?? col).replace(/"/g, "'")
      blocks.push(`  ${names[i]} "${label}"`)
    })
    blocks.push('  .')
    blocks.push('')

    blocks.push('VARIABLE LEVEL')
    ds.columns.forEach((col, i) => {
      const measure = ds.measures?.[col] ?? guessMeasure(col, ds.rows)
      blocks.push(`  ${names[i]} (${measure.toUpperCase()})`)
    })
    blocks.push('  .')
    blocks.push('')

    const groupCol = ds.columns.find((col) => /^(exp_?group|group)$/i.test(col))
    if (groupCol) {
      blocks.push('VALUE LABELS')
      blocks.push(`  ${spssName(groupCol)} 1 "experimental" 2 "control".`)
      blocks.push('')
    }
    for (const [col, map] of Object.entries(ds.valueLabels ?? {})) {
      blocks.push('VALUE LABELS')
      blocks.push(
        `  ${spssName(col)} ` +
          Object.entries(map)
            .map(([k, v]) => `${k} "${String(v).replace(/"/g, "'")}"`)
            .join(' ') +
          '.'
      )
      blocks.push('')
    }
    blocks.push(`SAVE OUTFILE="${ds.name}.sav" /COMPRESSED.`)
    blocks.push('')
  }

  blocks.push('* Tavsiya etilgan dastlabki tahlil:.')
  blocks.push('* T-TEST PAIRS=pre_total WITH post_total (PAIRED).')
  blocks.push('* T-TEST GROUPS=exp_group(1 2) /VARIABLES=gain_total.')
  blocks.push('')
  return blocks.join('\n')
}

function buildCodebook(datasets: Dataset[]): string {
  const lines = [
    '# LinguaEcon AI — Codebook',
    '',
    `Yaratildi: ${new Date().toISOString()}`,
    '',
    'Anonimlik: eksportda `uid`, ism yoki email yo\'q — faqat `participantCode`.',
    'Guruh kodlari: `1 = experimental`, `2 = control`. Likert javoblari raqamli (1–5).',
    'Teskari (reverse) bandlar tahlildan oldin `6 - x` formulasi bilan qayta kodlanadi.',
    '',
  ]
  for (const ds of datasets) {
    lines.push(`## ${ds.name}`)
    lines.push('')
    lines.push(`Qatorlar: **${ds.rows.length}**, ustunlar: **${ds.columns.length}**`)
    lines.push('')
    lines.push('| SPSS nomi | Ustun | O\'lchov | Izoh |')
    lines.push('|---|---|---|---|')
    for (const col of ds.columns) {
      const measure = ds.measures?.[col] ?? guessMeasure(col, ds.rows)
      const label = ds.labels?.[col] ?? ''
      lines.push(`| \`${spssName(col)}\` | \`${col}\` | ${measure} | ${label} |`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/* ------------------------------------------------------------------ */
/* Asosiy oqim                                                          */
/* ------------------------------------------------------------------ */

const PII_COLUMNS = ['uid', 'email', 'displayname', 'fullname', 'name', 'phone']

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const dryRun = args.has('dry-run')
  const formats = new Set(args.list('format') ?? ['xlsx', 'csv', 'sps'])
  const only = args.list('datasets')
  const outDir = resolve(process.cwd(), args.get('out') ?? join('scripts', 'out', isoDate()))

  log.title('Tadqiqot ma\'lumotlarini eksport qilish')
  log.detail(`Loyiha: ${projectId()}`)
  log.detail(`Chiqish: ${outDir}`)

  if (dryRun) {
    log.blank()
    log.dry(`Modul yuklanar edi: ${MODULE_ALIAS}`)
    log.dry(`Formatlar: ${[...formats].join(', ')}`)
    log.dry(`Datasetlar: ${only ? only.join(', ') : '(hammasi)'}`)
    log.dry(`Fayllar ${outDir} papkasiga yozilar edi`)
    log.ok('Dry-run tugadi — Firestore o‘qilmadi, fayl yozilmadi.')
    return
  }

  initAdmin()
  const mod = await loadExportModule()
  log.ok(`${MODULE_ALIAS} yuklandi (${Object.keys(mod).length} ta eksport).`)

  const builder = pick(mod, BUILDER_NAMES)
  if (!builder) {
    throw new Error(
      `${MODULE_ALIAS} modulida dataset-quruvchi funksiya topilmadi.\n` +
        `  Kutilgan nomlardan biri: ${BUILDER_NAMES.join(', ')}\n` +
        `  Topilgan eksportlar: ${Object.keys(mod).join(', ') || '(yo‘q)'}`
    )
  }

  log.step('Datasetlar qurilmoqda (Firestore o‘qilmoqda)...')
  const raw = await builder({
    experimentId: args.get('experiment'),
    cohortId: args.get('cohort'),
    datasets: only,
    includeEvents: args.has('include-events'),
    anonymise: true,
  })

  let datasets = normaliseDatasets(raw)
  if (only) datasets = datasets.filter((d) => only.includes(d.name))
  if (!datasets.length) throw new Error('Hech qanday dataset qaytmadi.')

  // Anonimlik tekshiruvi
  for (const ds of datasets) {
    const leaks = ds.columns.filter((col) => PII_COLUMNS.includes(col.toLowerCase()))
    if (leaks.length) {
      log.warn(`"${ds.name}" datasetida shaxsiy ma'lumot ustunlari bor: ${leaks.join(', ')}`)
      log.detail('PLAN 9.4 bo\'yicha eksportda faqat participantCode bo\'lishi kerak.')
    }
  }

  log.blank()
  table(
    ['Dataset', 'Qator', 'Ustun'],
    datasets.map((d) => [d.name, d.rows.length, d.columns.length])
  )

  mkdirSync(outDir, { recursive: true })
  const written: string[] = []

  // CSV
  if (formats.has('csv') || formats.has('sps')) {
    const csvFn = pick(mod, CSV_NAMES)
    for (const ds of datasets) {
      const file = join(outDir, `${ds.name}.csv`)
      const text =
        csvFn && typeof csvFn === 'function'
          ? String(await csvFn(ds))
          : datasetToCsv(ds)
      writeFileSync(file, '﻿' + text, 'utf8')
      written.push(file)
    }
    log.ok(`${datasets.length} ta CSV yozildi.`)
  }

  // Excel
  if (formats.has('xlsx')) {
    const file = join(outDir, 'linguaecon-research.xlsx')
    const excelFn = pick(mod, EXCEL_NAMES)
    if (excelFn) {
      const result = await excelFn(datasets)
      if (result instanceof Buffer || result instanceof Uint8Array) {
        writeFileSync(file, Buffer.from(result as Uint8Array))
      } else {
        await writeWorkbook(datasets, file)
      }
    } else {
      await writeWorkbook(datasets, file)
    }
    written.push(file)
    log.ok('Excel workbook yozildi.')
  }

  // SPSS
  if (formats.has('sps')) {
    const spsFn = pick(mod, SPSS_NAMES)
    const sps = spsFn ? String(await spsFn(datasets)) : buildSpssSyntax(datasets)
    const spsFile = join(outDir, 'import.sps')
    writeFileSync(spsFile, sps, 'utf8')
    written.push(spsFile)

    const cbFn = pick(mod, CODEBOOK_NAMES)
    const codebook = cbFn ? String(await cbFn(datasets)) : buildCodebook(datasets)
    const cbFile = join(outDir, 'codebook.md')
    writeFileSync(cbFile, codebook, 'utf8')
    written.push(cbFile)
    log.ok('SPSS sintaksisi va codebook yozildi.')
  }

  log.blank()
  log.title('Tayyor')
  for (const file of written) log.detail(file)
  log.blank()
  log.ok(`${written.length} ta fayl: ${c.bold(outDir)}`)
  log.warn("Eksport auditga yoziladi. Fayllarni faqat tadqiqot doirasida saqlang.")
}

runMain(main)
