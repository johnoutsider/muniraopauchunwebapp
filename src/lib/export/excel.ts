/**
 * Excel eksport (PLAN.md 9.3): bitta workbook, har dataset alohida varaq,
 * ustiga "Izoh" (readme) varag'i.
 *
 * NIMA UCHUN IZOH VARAG'I:
 * Eksport fayli tadqiqotchidan tashqari ilmiy rahbar, opponent va
 * statistik maslahatchiga ham boradi. Ular Firestore sxemasini bilmaydi,
 * shuning uchun workbook O'ZINI O'ZI TUSHUNTIRISHI kerak: qaysi eksperiment,
 * qachon, nechta ishtirokchi, har varaq nima, har o'zgaruvchi nimani anglatadi
 * va qanday kodlangan (1=eksperimental, 2=nazorat …).
 */

import ExcelJS from 'exceljs'

import type { ColumnDef, Dataset } from './datasets'

/** Eksport haqidagi metama'lumot (Izoh varag'i uchun). */
export interface ExportMeta {
  experimentId?: string
  experimentTitle?: string
  hypothesis?: string
  design?: string
  generatedAt?: Date
  /** Eksportni kim buyurtma qilgani (audit uchun — ism EMAS, rol). */
  generatedByRole?: string
  note?: string
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' },
}

const MIN_WIDTH = 10
const MAX_WIDTH = 55

/** Ustun kengligini mazmun bo'yicha taxminlash. */
function autoWidth(column: ColumnDef, rows: ReadonlyArray<Record<string, unknown>>): number {
  let width = column.name.length + 2
  const sample = rows.slice(0, 200)
  for (const row of sample) {
    const value = row[column.name]
    if (value === null || value === undefined) continue
    const length = String(value).length + 2
    if (length > width) width = length
  }
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
}

function styleHeader(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  header.fill = HEADER_FILL
  header.alignment = { vertical: 'middle', horizontal: 'left' }
  header.height = 20
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
}

/** Excel varaq nomi cheklovlari: ≤ 31 belgi, `\ / ? * [ ] :` taqiqlangan. */
export function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31)
}

/* ------------------------------------------------------------------ */
/* Izoh (readme) varag'i                                               */
/* ------------------------------------------------------------------ */

function addReadmeSheet(
  workbook: ExcelJS.Workbook,
  datasets: readonly Dataset[],
  meta: ExportMeta
): void {
  const sheet = workbook.addWorksheet('Izoh', { properties: { tabColor: { argb: 'FF1E3A5F' } } })
  sheet.columns = [
    { key: 'a', width: 28 },
    { key: 'b', width: 34 },
    { key: 'c', width: 70 },
    { key: 'd', width: 20 },
    { key: 'e', width: 40 },
  ]

  const title = sheet.addRow(['LinguaEcon AI — ilmiy ma‘lumotlar eksporti'])
  title.font = { bold: true, size: 16 }
  sheet.addRow([])

  const info: Array<[string, string]> = [
    ['Eksperiment', meta.experimentTitle ?? '—'],
    ['Eksperiment ID', meta.experimentId ?? '—'],
    ['Gipoteza', meta.hypothesis ?? '—'],
    ['Dizayn', meta.design ?? '—'],
    ['Yaratilgan sana', (meta.generatedAt ?? new Date()).toISOString()],
    ['Buyurtmachi roli', meta.generatedByRole ?? 'researcher'],
    ['Anonimlik', 'Faqat participantCode. Uid, email, ism va boshqa identifikatorlar YO‘Q.'],
    ['Guruh kodlari', '1 = eksperimental (AI yoqilgan), 2 = nazorat (AI o‘chirilgan)'],
    ['Mantiqiy maydonlar', '0 = yo‘q, 1 = ha'],
    ['Bo‘sh katak', 'Ma‘lumot yo‘q (SPSS: system-missing)'],
    ['Sana formati', 'ISO 8601, UTC (masalan 2027-03-14T09:12:00.000Z)'],
    ['Yakuniy tahlil', 'SPSS (codebook.md va import.sps fayllariga qarang)'],
  ]
  for (const [key, value] of info) {
    const row = sheet.addRow([key, value])
    row.getCell(1).font = { bold: true }
    row.getCell(2).alignment = { wrapText: true }
  }
  if (meta.note) {
    const row = sheet.addRow(['Izoh', meta.note])
    row.getCell(1).font = { bold: true }
  }

  sheet.addRow([])
  const datasetsTitle = sheet.addRow(['VARAQLAR'])
  datasetsTitle.font = { bold: true, size: 13 }
  const datasetHeader = sheet.addRow(['Varaq', 'Nomi', 'Tavsif', 'Qatorlar', 'Ustunlar'])
  datasetHeader.font = { bold: true }
  for (const dataset of datasets) {
    const row = sheet.addRow([
      dataset.name,
      dataset.label,
      dataset.description,
      dataset.rows.length,
      dataset.columns.length,
    ])
    row.getCell(3).alignment = { wrapText: true }
  }

  sheet.addRow([])
  const varsTitle = sheet.addRow(['O‘ZGARUVCHILAR (kodlash kitobi)'])
  varsTitle.font = { bold: true, size: 13 }
  const varsHeader = sheet.addRow([
    'Varaq',
    'O‘zgaruvchi',
    'Yorliq',
    'Tip / o‘lchov',
    'Qiymat yorliqlari',
  ])
  varsHeader.font = { bold: true }

  for (const dataset of datasets) {
    for (const column of dataset.columns) {
      const values = column.values
        ? Object.entries(column.values)
            .map(([key, label]) => `${key} = ${label}`)
            .join('; ')
        : ''
      const row = sheet.addRow([
        dataset.name,
        column.name,
        column.label,
        `${column.type} / ${column.measure}`,
        values,
      ])
      row.getCell(3).alignment = { wrapText: true }
      row.getCell(5).alignment = { wrapText: true }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Workbook                                                            */
/* ------------------------------------------------------------------ */

/**
 * Datasetlardan to'liq workbook yasash: "Izoh" varag'i + har dataset uchun
 * bitta varaq (qalin, muzlatilgan sarlavha, avtomatik kenglik, avtofiltr).
 */
export function toWorkbook(datasets: readonly Dataset[], meta: ExportMeta = {}): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'LinguaEcon AI'
  workbook.created = meta.generatedAt ?? new Date()
  workbook.properties.date1904 = false

  addReadmeSheet(workbook, datasets, meta)

  for (const dataset of datasets) {
    const sheet = workbook.addWorksheet(safeSheetName(dataset.name))
    sheet.columns = dataset.columns.map((column) => ({
      header: column.name,
      key: column.name,
      width: autoWidth(column, dataset.rows),
    }))

    for (const row of dataset.rows) {
      const values: Record<string, unknown> = {}
      for (const column of dataset.columns) {
        const value = row[column.name]
        values[column.name] = value === undefined || value === '' ? null : value
      }
      sheet.addRow(values)
    }

    styleHeader(sheet)

    if (dataset.rows.length) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: dataset.columns.length },
      }
    }
  }

  return workbook
}

/** Workbook'ni `Buffer` sifatida (Route Handler yoki Storage uchun). */
export async function toXlsxBuffer(
  datasets: readonly Dataset[],
  meta: ExportMeta = {}
): Promise<Buffer> {
  const workbook = toWorkbook(datasets, meta)
  const data = await workbook.xlsx.writeBuffer()
  return Buffer.from(data as ArrayBuffer)
}

/** Eksport fayli nomi: `linguaecon_export_2027-04-15.xlsx`. */
export function xlsxFileName(date: Date = new Date()): string {
  return `linguaecon_export_${date.toISOString().slice(0, 10)}.xlsx`
}
