/**
 * CSV eksport (PLAN.md 9.3).
 *
 * ILMIY TALAB:
 * SPSS `GET DATA /TYPE=TXT` bilan muammosiz o'qilishi uchun format qat'iy:
 *   • UTF-8 + BOM — o'zbekcha yorliqlar va inglizcha matn Windows'dagi
 *     SPSS/Excel'da to'g'ri ko'rinishi uchun (BOMsiz kirill/lotin buziladi);
 *   • ajratgich — vergul (`,`), qatorlar CRLF (RFC 4180);
 *   • sanalar — ISO 8601 (`2027-03-14T09:12:00.000Z`), mahalliy format emas;
 *   • bo'sh qiymat — bo'sh katak (SPSS'da system-missing bo'lib o'qiladi);
 *   • tirnoq ichidagi tirnoq ikkilantiriladi (`""`).
 *
 * Modul TOZA (pure) — matn qaytaradi, faylga yozish chaqiruvchi tomonda.
 */

import type { ColumnDef } from './datasets'

const SEPARATOR = ','
const EOL = '\r\n'
/** UTF-8 Byte Order Mark. */
export const BOM = '﻿'

/** Bitta katakni CSV qoidalari bo'yicha formatlash. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (Array.isArray(value)) return escape(value.join(';'))
  if (typeof value === 'object') return escape(JSON.stringify(value))
  return escape(String(value))
}

function escape(text: string): string {
  const normalised = text.replace(/\r\n|\r|\n/g, '\n')
  const needsQuotes =
    normalised.includes(SEPARATOR) ||
    normalised.includes('"') ||
    normalised.includes('\n') ||
    normalised !== normalised.trim()
  if (!needsQuotes) return normalised
  return `"${normalised.replace(/"/g, '""')}"`
}

export interface CsvOptions {
  /** BOM qo'shilsinmi (standart: ha). */
  bom?: boolean
  /** Sarlavha qatori chiqsinmi (standart: ha). */
  header?: boolean
}

/**
 * Datasetni CSV matniga aylantirish.
 * Ustunlar tartibi `columns` bo'yicha — SPSS sintaksisi ham shu tartibda
 * generatsiya qilinadi, shuning uchun ikkalasi doim mos keladi.
 */
export function toCsv(
  columns: readonly ColumnDef[],
  rows: ReadonlyArray<Record<string, unknown>>,
  options: CsvOptions = {}
): string {
  const { bom = true, header = true } = options
  const lines: string[] = []

  if (header) {
    lines.push(columns.map((column) => csvCell(column.name)).join(SEPARATOR))
  }
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column.name])).join(SEPARATOR))
  }

  return `${bom ? BOM : ''}${lines.join(EOL)}${lines.length ? EOL : ''}`
}

/** CSV matnini `Buffer` sifatida (Route Handler javobi yoki Storage uchun). */
export function toCsvBuffer(
  columns: readonly ColumnDef[],
  rows: ReadonlyArray<Record<string, unknown>>,
  options?: CsvOptions
): Buffer {
  return Buffer.from(toCsv(columns, rows, options), 'utf8')
}

/** Eksport fayli nomi: `linguaecon_participants_2027-04-15.csv`. */
export function csvFileName(datasetName: string, date: Date = new Date()): string {
  return `linguaecon_${datasetName}_${date.toISOString().slice(0, 10)}.csv`
}
