/**
 * scripts/import-users.ts — talabalarni CSV yoki XLSX fayldan ommaviy import qiladi.
 *
 *   npx tsx scripts/import-users.ts --file=./data/students.xlsx --cohort="2026-27 kuz"
 *
 * Kutilayotgan ustunlar (sarlavha qatori majburiy, katta-kichik harf farqi yo'q):
 *   fullName | email | groupName | expGroup
 *   Muqobil nomlar: fio/name/ism, mail, group/guruh, group_type/type/exp
 *
 * Nima qiladi (PLAN 2-bo'lim, "bulk import"):
 *   1. Yetishmayotgan kohort va guruhlarni yaratadi (feature flag'lar bilan);
 *   2. Har talaba uchun Auth hisobi + vaqtinchalik parol;
 *   3. custom claims: role=student, groupId, expGroup, participantCode (E-042 / C-017);
 *   4. `users/{uid}` hujjati (mustChangePassword: true, consent hali berilmagan);
 *   5. kirish fayli yonida `credentials.csv` — talabalarga tarqatish uchun.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'

import ExcelJS from 'exceljs'

import {
  adminAuth,
  adminDb,
  c,
  confirm,
  FieldValue,
  generatePassword,
  log,
  parseArgs,
  participantCode,
  projectId,
  runMain,
  showHelp,
  slugify,
  table,
  wantsHelp,
} from './_lib'
import {
  COL,
  EXPERIMENT_GROUPS,
  type ExperimentGroup,
} from '@/config/constants'
import { CONTROL_GROUP_FLAGS, EXPERIMENTAL_GROUP_FLAGS } from '@/types'

const HELP = `
${c.bold('import-users')} — talabalarni CSV/XLSX dan ommaviy import qiladi.

${c.bold('Ishlatish:')}
  npx tsx scripts/import-users.ts --file=<yo'l> [--cohort=<nom>] [--dry-run]

${c.bold('Bayroqlar:')}
  --file=<yo'l>          ${c.gray('(majburiy) .xlsx / .xls / .csv fayl')}
  --cohort=<nom|id>      ${c.gray("Kohort nomi yoki id (default: 'default-cohort')")}
  --university=<nom>     ${c.gray('Kohort universiteti (yangi kohort yaratilsa)')}
  --teacher=<uid>        ${c.gray("Yaratiladigan guruhlarga biriktiriladigan o'qituvchi uid")}
  --password-length=<n>  ${c.gray('Vaqtinchalik parol uzunligi (default: 10)')}
  --out=<yo'l>           ${c.gray("credentials.csv yo'li (default: kirish fayli yonida)")}
  --dry-run              ${c.gray("Hech narsa yozilmaydi; nima bo'lishini ko'rsatadi")}
  --yes                  ${c.gray("Tasdiqlashni o'tkazib yuboradi")}
  --help                 ${c.gray('Shu yordam')}

${c.bold('Fayl ustunlari:')}
  ${c.bold('fullName')}   ${c.gray("Talabaning to'liq ismi")}
  ${c.bold('email')}      ${c.gray('Elektron pochta (unikal)')}
  ${c.bold('groupName')}  ${c.gray("Guruh nomi, masalan 'IQT-21-01'")}
  ${c.bold('expGroup')}   ${c.gray("experimental | control (yoki 'E' / 'C')")}

${c.bold('Misol:')}
  npx tsx scripts/import-users.ts --file=./data/students.xlsx --cohort="2026-27 kuz" --dry-run
  npx tsx scripts/import-users.ts --file=./data/students.xlsx --cohort="2026-27 kuz" --yes

${c.yellow('Diqqat:')} credentials.csv da ochiq parollar bo'ladi — tarqatgandan keyin faylni o'chiring.
`

interface RawRow {
  fullName: string
  email: string
  groupName: string
  expGroup: ExperimentGroup
  rowNo: number
}

/* ------------------------------------------------------------------ */
/* Fayl o'qish                                                          */
/* ------------------------------------------------------------------ */

const HEADER_ALIASES: Record<string, keyof Omit<RawRow, 'rowNo'>> = {
  fullname: 'fullName',
  'full name': 'fullName',
  name: 'fullName',
  fio: 'fullName',
  'f.i.sh.': 'fullName',
  fish: 'fullName',
  ism: 'fullName',
  email: 'email',
  mail: 'email',
  'e-mail': 'email',
  pochta: 'email',
  groupname: 'groupName',
  'group name': 'groupName',
  group: 'groupName',
  guruh: 'groupName',
  expgroup: 'expGroup',
  'exp group': 'expGroup',
  exp: 'expGroup',
  type: 'expGroup',
  group_type: 'expGroup',
  turi: 'expGroup',
}

function normaliseCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  const obj = value as { text?: unknown; result?: unknown; richText?: Array<{ text: string }> }
  if (Array.isArray(obj.richText)) return obj.richText.map((r) => r.text).join('').trim()
  if (typeof obj.text === 'string') return obj.text.trim()
  if (obj.result !== undefined) return normaliseCell(obj.result)
  return String(value).trim()
}

function normaliseExpGroup(raw: string, rowNo: number): ExperimentGroup {
  const v = raw.trim().toLowerCase()
  if (['experimental', 'exp', 'e', 'eksperimental', '1'].includes(v)) return 'experimental'
  if (['control', 'ctrl', 'c', 'nazorat', '2'].includes(v)) return 'control'
  throw new Error(
    `${rowNo}-qator: expGroup qiymati tushunarsiz ("${raw}"). ` +
      `Ruxsat etilganlar: ${EXPERIMENT_GROUPS.join(', ')} (yoki E / C).`
  )
}

/** Oddiy CSV parser (vergul, qo'shtirnoqli maydonlarni qo'llab-quvvatlaydi). */
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',' || ch === ';') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function mapHeaders(headers: string[]): Array<keyof Omit<RawRow, 'rowNo'> | null> {
  return headers.map((h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? null)
}

function buildRows(
  headers: string[],
  dataRows: Array<{ cells: string[]; rowNo: number }>
): RawRow[] {
  const mapped = mapHeaders(headers)
  const missing = (['fullName', 'email', 'groupName', 'expGroup'] as const).filter(
    (k) => !mapped.includes(k)
  )
  if (missing.length) {
    throw new Error(
      `Faylda quyidagi ustunlar topilmadi: ${missing.join(', ')}.\n` +
        `Topilgan sarlavhalar: ${headers.join(' | ')}`
    )
  }

  const rows: RawRow[] = []
  for (const { cells, rowNo } of dataRows) {
    const rec: Record<string, string> = {}
    mapped.forEach((key, i) => {
      if (key) rec[key] = cells[i] ?? ''
    })
    if (!rec.email && !rec.fullName) continue // bo'sh qator
    if (!rec.email) throw new Error(`${rowNo}-qator: email bo'sh.`)
    if (!rec.fullName) throw new Error(`${rowNo}-qator: fullName bo'sh.`)
    if (!rec.groupName) throw new Error(`${rowNo}-qator: groupName bo'sh.`)
    rows.push({
      fullName: rec.fullName,
      email: rec.email.toLowerCase(),
      groupName: rec.groupName,
      expGroup: normaliseExpGroup(rec.expGroup, rowNo),
      rowNo,
    })
  }
  return rows
}

async function readInput(file: string): Promise<RawRow[]> {
  const ext = extname(file).toLowerCase()

  if (ext === '.csv' || ext === '.txt') {
    const text = readFileSync(file, 'utf8').replace(/^﻿/, '')
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) throw new Error('CSV faylda sarlavha va kamida bitta qator bo‘lishi kerak.')
    const headers = parseCsvLine(lines[0])
    return buildRows(
      headers,
      lines.slice(1).map((line, i) => ({ cells: parseCsvLine(line), rowNo: i + 2 }))
    )
  }

  if (ext === '.xlsx' || ext === '.xls' || ext === '.xlsm') {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(file)
    const ws = wb.worksheets[0]
    if (!ws) throw new Error('Excel faylda varaq topilmadi.')

    let headers: string[] = []
    const dataRows: Array<{ cells: string[]; rowNo: number }> = []
    ws.eachRow((row, rowNumber) => {
      const cells: string[] = []
      // row.values[0] har doim bo'sh (1-based)
      const values = row.values as unknown[]
      for (let i = 1; i < values.length; i++) cells.push(normaliseCell(values[i]))
      if (rowNumber === 1) headers = cells
      else dataRows.push({ cells, rowNo: rowNumber })
    })
    if (!headers.length) throw new Error('Excel faylda sarlavha qatori topilmadi.')
    return buildRows(headers, dataRows)
  }

  throw new Error(`Qo'llab-quvvatlanmaydigan fayl turi: ${ext}. .xlsx yoki .csv bering.`)
}

/* ------------------------------------------------------------------ */
/* Asosiy oqim                                                          */
/* ------------------------------------------------------------------ */

interface ImportResult {
  fullName: string
  email: string
  groupName: string
  groupId: string
  expGroup: ExperimentGroup
  participantCode: string
  password: string
  uid: string
  status: 'created' | 'updated' | 'skipped' | 'error'
  note?: string
}

/** Mavjud ishtirokchi kodlaridan keyingi raqamni topadi. */
async function nextCodeCounters(): Promise<Record<ExperimentGroup, number>> {
  const counters: Record<ExperimentGroup, number> = { experimental: 0, control: 0 }
  const snap = await adminDb().collection(COL.users).where('role', '==', 'student').get()
  for (const doc of snap.docs) {
    const code = doc.get('participantCode') as string | undefined
    if (!code) continue
    const m = /^([EC])-(\d+)$/.exec(code)
    if (!m) continue
    const group: ExperimentGroup = m[1] === 'E' ? 'experimental' : 'control'
    counters[group] = Math.max(counters[group], Number.parseInt(m[2], 10))
  }
  return counters
}

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const file = args.get('file')
  if (!file) throw new Error('--file=<yo‘l> berilishi shart. Yordam: --help')

  const filePath = resolve(process.cwd(), file)
  if (!existsSync(filePath)) throw new Error(`Fayl topilmadi: ${filePath}`)

  const dryRun = args.has('dry-run')
  const cohortName = args.get('cohort') ?? 'default-cohort'
  const cohortId = slugify(cohortName) || 'default-cohort'
  const university = args.get('university') ?? "O'zbekiston davlat jahon tillari universiteti"
  const teacherUid = args.get('teacher')
  const pwLength = args.int('password-length', 10)

  log.title('Talabalarni import qilish')
  log.detail(`Loyiha: ${projectId()}`)
  log.detail(`Fayl:   ${filePath}`)

  const rows = await readInput(filePath)
  log.ok(`${rows.length} ta qator o‘qildi.`)

  // Dublikat email tekshiruvi
  const seen = new Set<string>()
  for (const r of rows) {
    if (seen.has(r.email)) throw new Error(`Faylda takrorlangan email: ${r.email} (${r.rowNo}-qator)`)
    seen.add(r.email)
  }

  // Guruhlar bo'yicha xulosa
  const groupSummary = new Map<string, { expGroup: ExperimentGroup; count: number }>()
  for (const r of rows) {
    const entry = groupSummary.get(r.groupName) ?? { expGroup: r.expGroup, count: 0 }
    entry.count++
    if (entry.expGroup !== r.expGroup) {
      throw new Error(
        `"${r.groupName}" guruhida ikki xil expGroup bor (${entry.expGroup} va ${r.expGroup}). ` +
          'Bir guruh faqat bitta turga tegishli bo‘lishi kerak.'
      )
    }
    groupSummary.set(r.groupName, entry)
  }

  log.blank()
  table(
    ['Guruh', 'Turi', 'Talaba'],
    [...groupSummary.entries()].map(([name, v]) => [name, v.expGroup, v.count])
  )
  log.blank()
  log.info(`Kohort: ${c.bold(cohortName)} (${cohortId})`)

  if (dryRun) {
    log.dry(`${COL.cohorts}/${cohortId} yaratilar/yangilanar edi`)
    for (const [name, v] of groupSummary) {
      log.dry(`${COL.groups}/${slugify(name)} — ${v.expGroup}, ${v.count} talaba`)
    }
    log.dry(`${rows.length} ta Auth foydalanuvchi + ${COL.users} hujjati`)
    log.dry(`credentials.csv yozilar edi`)
    log.blank()
    log.ok('Dry-run tugadi — hech narsa o‘zgartirilmadi.')
    return
  }

  if (!(await confirm(`${rows.length} ta talaba import qilinsinmi?`, args.has('yes')))) {
    log.warn('Bekor qilindi.')
    return
  }

  const auth = adminAuth()
  const db = adminDb()

  // 1. Kohort
  await db
    .collection(COL.cohorts)
    .doc(cohortId)
    .set(
      {
        name: cohortName,
        university,
        teacherIds: teacherUid ? [teacherUid] : [],
        startDate: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  log.ok(`Kohort tayyor: ${COL.cohorts}/${cohortId}`)

  // 2. Guruhlar
  const groupIds = new Map<string, string>()
  for (const [name, v] of groupSummary) {
    const gid = slugify(name)
    groupIds.set(name, gid)
    await db
      .collection(COL.groups)
      .doc(gid)
      .set(
        {
          cohortId,
          name,
          type: v.expGroup,
          teacherId: teacherUid ?? null,
          studentCount: v.count,
          featureFlags:
            v.expGroup === 'experimental' ? EXPERIMENTAL_GROUP_FLAGS : CONTROL_GROUP_FLAGS,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
  }
  log.ok(`${groupIds.size} ta guruh tayyor.`)

  // 3. Talabalar
  const counters = await nextCodeCounters()
  log.detail(
    `Kod hisoblagichlari: E-${String(counters.experimental).padStart(3, '0')} / ` +
      `C-${String(counters.control).padStart(3, '0')} dan davom etadi`
  )

  const results: ImportResult[] = []
  let done = 0

  for (const row of rows) {
    const gid = groupIds.get(row.groupName)!
    const password = generatePassword(pwLength)
    let uid = ''
    let status: ImportResult['status'] = 'created'
    let note: string | undefined
    let code = ''

    try {
      let existing = null
      try {
        existing = await auth.getUserByEmail(row.email)
      } catch {
        existing = null
      }

      if (existing) {
        uid = existing.uid
        status = 'updated'
        const claims = (existing.customClaims ?? {}) as { participantCode?: string }
        code = claims.participantCode ?? ''
        await auth.updateUser(uid, { displayName: row.fullName, password })
        note = 'mavjud hisob yangilandi'
      } else {
        const user = await auth.createUser({
          email: row.email,
          password,
          displayName: row.fullName,
          emailVerified: false,
        })
        uid = user.uid
      }

      if (!code) {
        counters[row.expGroup] += 1
        code = participantCode(row.expGroup, counters[row.expGroup])
      }

      await auth.setCustomUserClaims(uid, {
        role: 'student',
        groupId: gid,
        expGroup: row.expGroup,
        participantCode: code,
      })

      await db
        .collection(COL.users)
        .doc(uid)
        .set(
          {
            uid,
            email: row.email,
            displayName: row.fullName,
            role: 'student',
            locale: 'uz',
            university,
            cohortId,
            groupId: gid,
            expGroup: row.expGroup,
            participantCode: code,
            consentGiven: false,
            consentAt: null,
            status: 'active',
            mustChangePassword: true,
            totalXp: 0,
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
    } catch (err) {
      status = 'error'
      note = err instanceof Error ? err.message : String(err)
      log.error(`${row.email}: ${note}`)
    }

    results.push({
      fullName: row.fullName,
      email: row.email,
      groupName: row.groupName,
      groupId: gid,
      expGroup: row.expGroup,
      participantCode: code,
      password,
      uid,
      status,
      note,
    })

    done++
    if (done % 20 === 0 || done === rows.length) {
      log.detail(`${done}/${rows.length} ...`)
    }
  }

  // 4. credentials.csv
  const outPath =
    args.get('out') ??
    resolve(dirname(filePath), `credentials-${basename(filePath, extname(filePath))}.csv`)

  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
  const csv = [
    'fullName,email,groupName,expGroup,participantCode,temporaryPassword,uid,status,note',
    ...results.map((r) =>
      [
        r.fullName,
        r.email,
        r.groupName,
        r.expGroup,
        r.participantCode,
        r.status === 'error' ? '' : r.password,
        r.uid,
        r.status,
        r.note ?? '',
      ]
        .map(esc)
        .join(',')
    ),
  ].join('\n')
  writeFileSync(outPath, '﻿' + csv, 'utf8')

  // 5. Xulosa
  const created = results.filter((r) => r.status === 'created').length
  const updated = results.filter((r) => r.status === 'updated').length
  const errors = results.filter((r) => r.status === 'error').length

  log.blank()
  log.title('Xulosa')
  table(
    ['Holat', 'Soni'],
    [
      ['Yaratildi', created],
      ['Yangilandi', updated],
      ['Xato', errors],
      ['Jami', results.length],
    ]
  )
  log.blank()
  log.ok(`Parollar fayli: ${c.bold(outPath)}`)
  log.warn('credentials.csv da ochiq parollar bor — tarqatgandan so‘ng faylni o‘chiring.')
  if (errors) log.warn(`${errors} ta qatorda xato — faylning "note" ustunini tekshiring.`)
}

runMain(main)
