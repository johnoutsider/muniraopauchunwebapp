/**
 * scripts/_lib.ts — barcha CLI skriptlar uchun umumiy yordamchilar.
 *
 * Bu fayl `tsx` orqali Node muhitida ishlaydi (Next.js emas), shuning uchun
 * `@/lib/firebase/admin` (u `server-only` importiga ega) ishlatilmaydi —
 * Admin SDK shu yerda mustaqil initsializatsiya qilinadi.
 *
 * Ishlatish:
 *   import { initAdmin, adminDb, log, batchWrite, parseArgs } from './_lib'
 */

import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import process from 'node:process'

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type Firestore,
  type WriteBatch,
} from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

export { FieldValue, Timestamp }

/* ================================================================== */
/* 1. Ranglar va log                                                   */
/* ================================================================== */

const NO_COLOR = Boolean(process.env.NO_COLOR) || !process.stdout.isTTY

/** ANSI escape belgisi */
const ESC = ''

function paint(code: string, text: string): string {
  return NO_COLOR ? text : `${ESC}[${code}m${text}${ESC}[0m`
}

export const c = {
  bold: (t: string) => paint('1', t),
  dim: (t: string) => paint('2', t),
  red: (t: string) => paint('31', t),
  green: (t: string) => paint('32', t),
  yellow: (t: string) => paint('33', t),
  blue: (t: string) => paint('34', t),
  magenta: (t: string) => paint('35', t),
  cyan: (t: string) => paint('36', t),
  gray: (t: string) => paint('90', t),
}

export const log = {
  /** Oddiy xabar */
  info: (msg: string) => console.log(`${c.blue('i')}  ${msg}`),
  /** Muvaffaqiyat */
  ok: (msg: string) => console.log(`${c.green('✓')}  ${msg}`),
  /** Ogohlantirish */
  warn: (msg: string) => console.log(`${c.yellow('!')}  ${msg}`),
  /** Xato */
  error: (msg: string) => console.error(`${c.red('✗')}  ${msg}`),
  /** Qadam / bosqich */
  step: (msg: string) => console.log(`${c.magenta('→')}  ${c.bold(msg)}`),
  /** Qo'shimcha tafsilot */
  detail: (msg: string) => console.log(`   ${c.gray(msg)}`),
  /** Bo'sh qator */
  blank: () => console.log(''),
  /** Sarlavha bloki */
  title: (msg: string) => {
    const line = '─'.repeat(Math.max(msg.length + 4, 40))
    console.log('')
    console.log(c.cyan(line))
    console.log(c.cyan(`  ${c.bold(msg)}`))
    console.log(c.cyan(line))
  },
  /** DRY-RUN belgisi bilan */
  dry: (msg: string) => console.log(`${c.yellow('~')}  ${c.dim('[dry-run]')} ${msg}`),
}

/** Oddiy matnli jadval chizadi (summary uchun). */
export function table(headers: string[], rows: Array<Array<string | number>>): void {
  const all: string[][] = [headers, ...rows.map((r) => r.map((cell) => String(cell ?? '')))]
  const widths = headers.map((_, i) => Math.max(...all.map((r) => (r[i] ?? '').length)))

  const border = (left: string, mid: string, right: string) =>
    left + widths.map((w) => '─'.repeat(w + 2)).join(mid) + right

  const render = (cells: string[], bold = false) =>
    '│' +
    cells
      .map((cell, i) => {
        const pad = i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i])
        return ` ${bold ? c.bold(pad) : pad} `
      })
      .join('│') +
    '│'

  console.log(border('┌', '┬', '┐'))
  console.log(render(headers, true))
  console.log(border('├', '┼', '┤'))
  for (const row of all.slice(1)) console.log(render(row))
  console.log(border('└', '┴', '┘'))
}

/* ================================================================== */
/* 2. .env.local yuklash (dotenv paketisiz)                            */
/* ================================================================== */

let envLoaded = false

/**
 * `.env.local` → `.env` faylini o'qib `process.env` ga qo'shadi.
 * Allaqachon mavjud o'zgaruvchilar ustidan yozilmaydi (shell ustunroq).
 */
export function loadEnv(root = process.cwd()): void {
  if (envLoaded) return
  envLoaded = true

  const candidates = ['.env.local', '.env']
  let found = false

  for (const name of candidates) {
    const file = resolve(root, name)
    if (!existsSync(file)) continue
    found = true
    const raw = readFileSync(file, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim().replace(/^export\s+/, '')
      let value = trimmed.slice(eq + 1).trim()
      // Qo'shtirnoqlarni olib tashlash
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
    log.detail(`${name} yuklandi`)
  }

  if (!found) {
    log.warn(
      `.env.local topilmadi (${root}). Muhit o'zgaruvchilari shell orqali berilgan bo'lishi kerak.`
    )
  }
}

/* ================================================================== */
/* 3. Firebase Admin SDK                                               */
/* ================================================================== */

let _app: App | null = null

function loadServiceAccount(): {
  project_id: string
  client_email: string
  private_key: string
} {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (b64) return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) return JSON.parse(raw)

  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (path && existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'))

  throw new Error(
    "Service account topilmadi.\n" +
      "  .env.local faylida FIREBASE_SERVICE_ACCOUNT_BASE64 ni to'ldiring\n" +
      '  (Firebase Console → Project settings → Service accounts → Generate new private key,\n' +
      "   keyin JSON faylni base64 ga o'giring).\n" +
      '  Muqobil: FIREBASE_SERVICE_ACCOUNT (xom JSON) yoki GOOGLE_APPLICATION_CREDENTIALS (fayl yo\'li).'
  )
}

/** Admin SDK ni bir marta initsializatsiya qiladi. */
export function initAdmin(): App {
  if (_app) return _app
  loadEnv()

  const existing = getApps()
  if (existing.length) {
    _app = existing[0]
    return _app
  }

  const sa = loadServiceAccount()
  _app = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, '\n'),
    }),
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${sa.project_id}.firebasestorage.app`,
  })
  log.detail(`Firebase loyihasi: ${c.bold(sa.project_id)}`)
  return _app
}

let _db: Firestore | null = null

export function adminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(initAdmin())
    try {
      _db.settings({ ignoreUndefinedProperties: true })
    } catch {
      /* settings faqat bir marta chaqiriladi */
    }
  }
  return _db
}

export function adminAuth(): Auth {
  return getAuth(initAdmin())
}

export function adminBucket() {
  return getStorage(initAdmin()).bucket()
}

/** Joriy loyiha id sini qaytaradi (log uchun). */
export function projectId(): string {
  try {
    return loadServiceAccount().project_id
  } catch {
    return '(nomaʼlum)'
  }
}

/* ================================================================== */
/* 4. Batch yozish (500 op limiti)                                     */
/* ================================================================== */

/** Firestore bitta batch'da maksimal 500 ta operatsiya qabul qiladi. */
export const BATCH_LIMIT = 450

export interface BatchDoc {
  id: string
  data: Record<string, unknown>
}

export interface BatchWriteOptions {
  /** true bo'lsa hech narsa yozilmaydi, faqat hisoblanadi */
  dryRun?: boolean
  /** merge: true (default) — idempotent seed uchun */
  merge?: boolean
  /** Har batch yozilgandan keyin chaqiriladi */
  onProgress?: (written: number, total: number) => void
}

/**
 * Hujjatlarni 450 tadan bo'lib `collection` ga yozadi.
 * Deterministik `id` + `merge: true` → skriptni qayta ishga tushirish xavfsiz.
 */
export async function batchWrite(
  collection: string,
  docs: BatchDoc[],
  options: BatchWriteOptions = {}
): Promise<number> {
  const { dryRun = false, merge = true, onProgress } = options
  if (docs.length === 0) return 0
  if (dryRun) {
    onProgress?.(docs.length, docs.length)
    return docs.length
  }

  const db = adminDb()
  const col = db.collection(collection)
  let written = 0

  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const slice = docs.slice(i, i + BATCH_LIMIT)
    const batch: WriteBatch = db.batch()
    for (const doc of slice) {
      batch.set(col.doc(doc.id), doc.data, { merge })
    }
    await batch.commit()
    written += slice.length
    onProgress?.(written, docs.length)
  }

  return written
}

/**
 * Bir nechta kolleksiyaga tegishli yozuvlarni bitta tranzaksiyasiz oqimda yozadi.
 * `path` — to'liq hujjat yo'li (masalan `users/abc` yoki `mastery/uid/skills/x`).
 */
export async function batchWritePaths(
  docs: Array<{ path: string; data: Record<string, unknown> }>,
  options: BatchWriteOptions = {}
): Promise<number> {
  const { dryRun = false, merge = true } = options
  if (docs.length === 0) return 0
  if (dryRun) return docs.length

  const db = adminDb()
  let written = 0
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const slice = docs.slice(i, i + BATCH_LIMIT)
    const batch = db.batch()
    for (const doc of slice) batch.set(db.doc(doc.path), doc.data, { merge })
    await batch.commit()
    written += slice.length
  }
  return written
}

/** Kolleksiyadagi hujjatlar sonini qaytaradi (count aggregation). */
export async function countDocs(collection: string): Promise<number> {
  const snap = await adminDb().collection(collection).count().get()
  return snap.data().count
}

/* ================================================================== */
/* 5. CLI argumentlari                                                 */
/* ================================================================== */

export interface ParsedArgs {
  /** --key=value va --key value juftliklari */
  flags: Record<string, string>
  /** --flag (qiymatsiz) */
  bools: Set<string>
  /** qolgan pozitsion argumentlar */
  positional: string[]
  /** Yordamchi: qiymat yoki undefined */
  get(name: string): string | undefined
  /** Yordamchi: boolean bayroq */
  has(name: string): boolean
  /** Yordamchi: vergul bilan ajratilgan ro'yxat */
  list(name: string): string[] | undefined
  /** Yordamchi: butun son */
  int(name: string, fallback: number): number
}

export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const flags: Record<string, string> = {}
  const bools = new Set<string>()
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      positional.push(arg)
      continue
    }
    const body = arg.slice(2)
    const eq = body.indexOf('=')
    if (eq !== -1) {
      flags[body.slice(0, eq)] = body.slice(eq + 1)
      continue
    }
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      flags[body] = next
      i++
    } else {
      bools.add(body)
    }
  }

  return {
    flags,
    bools,
    positional,
    get: (name) => flags[name],
    has: (name) => bools.has(name) || flags[name] === 'true',
    list: (name) =>
      flags[name] === undefined
        ? undefined
        : flags[name]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    int: (name, fallback) => {
      const raw = flags[name]
      if (raw === undefined) return fallback
      const n = Number.parseInt(raw, 10)
      return Number.isFinite(n) ? n : fallback
    },
  }
}

/** `--help` yoki `-h` berilganmi? */
export function wantsHelp(argv: string[] = process.argv.slice(2)): boolean {
  return argv.includes('--help') || argv.includes('-h')
}

/** Yordam matnini chiqarib, jarayonni tugatadi. */
export function showHelp(text: string): never {
  console.log(text.trimEnd())
  console.log('')
  process.exit(0)
}

/* ================================================================== */
/* 6. Tasdiqlash so'rovi                                               */
/* ================================================================== */

/**
 * Terminalda "Davom etilsinmi? (ha/yo'q)" so'raydi.
 * `--yes` bayrog'i berilgan bo'lsa yoki TTY bo'lmasa (CI) — avtomatik.
 */
export async function confirm(question: string, autoYes = false): Promise<boolean> {
  if (autoYes) {
    log.detail(`${question} → avtomatik tasdiqlandi (--yes)`)
    return true
  }
  if (!process.stdin.isTTY) {
    log.warn(`${question} → TTY yo'q, bekor qilindi. Avtomatik tasdiq uchun --yes bering.`)
    return false
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>((res) => {
    rl.question(`${c.yellow('?')}  ${question} ${c.dim("[ha/yo'q]")} `, (a) => {
      rl.close()
      res(a.trim().toLowerCase())
    })
  })
  return ['ha', 'h', 'y', 'yes', 'ok'].includes(answer)
}

/** Terminalda erkin matn so'raydi. */
export async function ask(question: string, fallback = ''): Promise<string> {
  if (!process.stdin.isTTY) return fallback
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>((res) => {
    rl.question(`${c.cyan('?')}  ${question} `, (a) => {
      rl.close()
      res(a.trim())
    })
  })
  return answer || fallback
}

/* ================================================================== */
/* 7. Turli yordamchilar                                               */
/* ================================================================== */

/** Matnni Firestore hujjat id siga yaroqli holga keltiradi. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

/**
 * N-gramm kabi matnni hujjat id siga aylantiradi:
 * `/` va bo'shliqlar Firestore'da muammo tug'diradi.
 */
export function encodeDocId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\//g, '~2F')
    .replace(/\s+/g, '_')
    .replace(/\./g, '~2E')
    .replace(/[[\]*#?]/g, '')
}

export function decodeDocId(id: string): string {
  return id.replace(/~2F/g, '/').replace(/~2E/g, '.').replace(/_/g, ' ')
}

/** Ishtirokchi kodi: E-042 / C-017 */
export function participantCode(group: 'experimental' | 'control', n: number): string {
  return `${group === 'experimental' ? 'E' : 'C'}-${String(n).padStart(3, '0')}`
}

/** O'qish oson vaqtinchalik parol (talabalarga tarqatish uchun). */
export function generatePassword(length = 10): string {
  // Chalkash belgilar (0/O, 1/l/I) chiqarib tashlangan
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  const chars = [pick(upper), pick(lower), pick(digits), pick(digits)]
  while (chars.length < length) chars.push(pick(all))
  // Aralashtirish
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/** Massivni bo'laklarga bo'ladi. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Xatoni tushunarli qilib chiqarib, 1 kod bilan chiqadi. */
export function fail(err: unknown): never {
  log.blank()
  if (err instanceof Error) {
    log.error(err.message)
    if (process.env.DEBUG) console.error(err.stack)
  } else {
    log.error(String(err))
  }
  process.exit(1)
}

/** Skript kirish nuqtasi uchun standart o'ram. */
export function runMain(main: () => Promise<void>): void {
  main()
    .then(() => process.exit(0))
    .catch(fail)
}

/** ISO sana (fayl nomlari uchun): 2027-01-15 */
export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** Fayl nomlari uchun vaqt tamg'asi: 2027-01-15_1432 */
export function fileStamp(d: Date = new Date()): string {
  const iso = d.toISOString()
  return `${iso.slice(0, 10)}_${iso.slice(11, 13)}${iso.slice(14, 16)}`
}
