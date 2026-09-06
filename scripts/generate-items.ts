/**
 * scripts/generate-items.ts — AI yordamida mashq banki uchun item generatsiya qiladi.
 *
 *   npx tsx scripts/generate-items.ts --skill=grammar --topic=present_perfect --count=8 --difficulty=2,3
 *
 * Oqim (PLAN 7.2, 8.2 — human-in-the-loop):
 *   topic × difficulty matritsasi → `generateExercises` (Claude) → zod validatsiya →
 *   `items` kolleksiyasiga `status: 'draft'`, `source: 'ai'` bilan yoziladi →
 *   o'qituvchi Teacher Dashboard → Content approval sahifasida tasdiqlaydi.
 *
 * Xizmat (`src/ai/services/exercises.ts`) hali yozilmagan bo'lsa, skript aniq
 * xato xabari bilan to'xtaydi va hech narsa yozmaydi.
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  adminDb,
  batchWrite,
  c,
  confirm,
  FieldValue,
  log,
  parseArgs,
  projectId,
  runMain,
  showHelp,
  table,
  wantsHelp,
  type BatchDoc,
} from './_lib'
import {
  CEFR_LEVELS,
  COL,
  DIFFICULTY_CEFR,
  DOMAINS,
  GRAMMAR_TOPICS,
  SKILLS,
  type CefrLevel,
  type Domain,
  type Skill,
} from '@/config/constants'

/** Loyiha ildizidan hisoblanadi — skriptlar `npx tsx scripts/...` bilan ildizdan ishga tushiriladi. */
const SERVICE_REL = 'src/ai/services/exercises.ts'
const SERVICE_ALIAS = '@/ai/services/exercises'

const HELP = `
${c.bold('generate-items')} — Claude bilan mashq itemlari generatsiya qiladi (status: draft).

${c.bold('Ishlatish:')}
  npx tsx scripts/generate-items.ts --skill=<skill> --topic=<topic> [bayroqlar]

${c.bold('Bayroqlar:')}
  --skill=<skill>          ${c.gray(`${SKILLS.join(' | ')} (default: grammar)`)}
  --topic=<t1,t2|all>      ${c.gray("Mavzu(lar). 'all' — 8 ta grammatik mavzu")}
  --difficulty=<1..5>      ${c.gray("Bir yoki bir nechta: --difficulty=2,3,4 (default: 1,2,3,4,5)")}
  --count=<n>              ${c.gray('Har (mavzu × difficulty) katak uchun item soni (default: 5)')}
  --domain=<d1,d2>         ${c.gray(`${DOMAINS.join(' | ')} (default: economics,finance)`)}
  --cefr=<A2..C1>          ${c.gray("Majburiy CEFR; berilmasa difficulty'dan olinadi")}
  --model=<nom>            ${c.gray('AI_MODEL_MAIN o‘rniga boshqa model')}
  --out-json=<yo'l>        ${c.gray("Firestore o'rniga (yoki bilan birga) JSON faylga saqlash")}
  --dry-run                ${c.gray("Generatsiya qilinadi, lekin Firestore'ga yozilmaydi")}
  --yes                    ${c.gray("Tasdiqlashni o'tkazib yuboradi")}
  --help                   ${c.gray('Shu yordam')}

${c.bold('Misollar:')}
  ${c.gray('# Bitta mavzu, 3 daraja, har biriga 6 ta item')}
  npx tsx scripts/generate-items.ts --skill=grammar --topic=passive_voice --difficulty=2,3,4 --count=6

  ${c.gray('# 8 ta grammatik mavzu × 5 difficulty × 8 item = 320 item (PLAN 8.2 maqsadi)')}
  npx tsx scripts/generate-items.ts --skill=grammar --topic=all --count=8

  ${c.gray('# Lug‘at itemlari, bank sohasi')}
  npx tsx scripts/generate-items.ts --skill=vocabulary --topic=vocab_banking --domain=banking --count=10

${c.yellow('Eslatma:')} barcha itemlar ${c.bold("status: 'draft'")} bilan yoziladi.
O'qituvchi tasdiqlamaguncha talabalarga ko'rinmaydi (PLAN 7.4).
`

/** `generateExercises` xizmatining kutilayotgan imzosi. */
interface GenerateParams {
  skill: Skill
  topic: string
  domain: Domain
  cefr: CefrLevel
  difficulty: number
  count: number
  model?: string
}

type GeneratedItem = Record<string, unknown> & {
  type: string
  skill: string
  topic: string
  domain: string
  cefr: string
  difficulty: number
  stem: string
  answerKey: string[]
  explanation: { why: string; how: string; whereElse: string }
}

type GenerateFn = (params: GenerateParams) => Promise<unknown>

/**
 * Xizmatni dinamik yuklaydi. Boshqa agent uni yozmagan bo'lsa —
 * tushunarli xato bilan to'xtaydi.
 */
async function loadService(): Promise<GenerateFn> {
  const file = resolve(process.cwd(), SERVICE_REL)
  if (!existsSync(file)) {
    throw new Error(
      `AI xizmati topilmadi: ${SERVICE_ALIAS}\n` +
        `  Kutilgan fayl: ${file}\n\n` +
        `  Bu skript ${c.bold('generateExercises')} funksiyasiga tayanadi.\n` +
        `  U hali yozilmagan bo'lsa:\n` +
        `    1) src/ai/services/exercises.ts faylini yarating va\n` +
        `       export async function generateExercises(params) — ExerciseSetSchema qaytarsin;\n` +
        `    2) yoki --dry-run bilan faqat matritsani ko'rib chiqing.\n` +
        `  Sxema tayyor: src/ai/schemas/exercise.ts (ExerciseSetSchema).`
    )
  }

  let mod: Record<string, unknown>
  try {
    mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>
  } catch (err) {
    throw new Error(
      `${SERVICE_ALIAS} yuklanmadi: ${err instanceof Error ? err.message : String(err)}\n` +
        `  ANTHROPIC_API_KEY va AI_MODEL_MAIN .env.local da to'ldirilganini tekshiring.`
    )
  }

  const fn = mod.generateExercises ?? mod.default
  if (typeof fn !== 'function') {
    throw new Error(
      `${SERVICE_ALIAS} faylida ${c.bold('generateExercises')} eksport qilinmagan.\n` +
        `  Topilgan eksportlar: ${Object.keys(mod).join(', ') || '(yo‘q)'}`
    )
  }
  return fn as GenerateFn
}

/** Xizmat turli shaklda qaytarishi mumkin: {items:[...]} | [...] | {ok, data:{items}} */
function extractItems(result: unknown): GeneratedItem[] {
  if (Array.isArray(result)) return result as GeneratedItem[]
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as GeneratedItem[]
    if (obj.data && typeof obj.data === 'object') return extractItems(obj.data)
    if (obj.ok === false) {
      throw new Error(`Xizmat xato qaytardi: ${String(obj.error ?? 'nomaʻlum')}`)
    }
  }
  throw new Error(
    "generateExercises kutilmagan natija qaytardi — {items: ExerciseItem[]} kutilgan edi."
  )
}

/** Deterministik bo'lmagan (AI) itemlar uchun barqaror id. */
function itemId(skill: string, topic: string, difficulty: number, index: number): string {
  const stamp = Date.now().toString(36)
  return `ai-${skill}-${topic}-d${difficulty}-${stamp}-${String(index).padStart(2, '0')}`
}

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const dryRun = args.has('dry-run')

  const skill = (args.get('skill') ?? 'grammar') as Skill
  if (!SKILLS.includes(skill)) throw new Error(`Nomaʻlum skill: ${skill} (${SKILLS.join(', ')})`)

  const topicArg = args.get('topic') ?? 'all'
  const topics =
    topicArg === 'all'
      ? GRAMMAR_TOPICS.map((t) => t.id as string)
      : topicArg.split(',').map((t) => t.trim()).filter(Boolean)
  if (!topics.length) throw new Error('--topic berilishi shart (yoki --topic=all).')

  const difficulties = (args.list('difficulty') ?? ['1', '2', '3', '4', '5'])
    .map((d) => Number.parseInt(d, 10))
    .filter((d) => Number.isFinite(d) && d >= 1 && d <= 5)
  if (!difficulties.length) throw new Error('--difficulty 1..5 oralig‘ida bo‘lishi kerak.')

  const domains = (args.list('domain') ?? ['economics', 'finance']) as Domain[]
  for (const d of domains) {
    if (!DOMAINS.includes(d)) throw new Error(`Nomaʻlum domain: ${d} (${DOMAINS.join(', ')})`)
  }

  const forcedCefr = args.get('cefr') as CefrLevel | undefined
  if (forcedCefr && !CEFR_LEVELS.includes(forcedCefr)) {
    throw new Error(`Nomaʻlum CEFR: ${forcedCefr} (${CEFR_LEVELS.join(', ')})`)
  }

  const count = args.int('count', 5)
  const model = args.get('model')

  // Matritsa
  const cells: GenerateParams[] = []
  topics.forEach((topic, ti) => {
    for (const difficulty of difficulties) {
      cells.push({
        skill,
        topic,
        difficulty,
        domain: domains[ti % domains.length],
        cefr: forcedCefr ?? DIFFICULTY_CEFR[difficulty] ?? 'B1',
        count,
        model,
      })
    }
  })

  log.title('AI mashq generatsiyasi')
  log.detail(`Loyiha: ${projectId()}`)
  log.blank()
  log.info(`Skill ......... ${c.bold(skill)}`)
  log.info(`Mavzular ...... ${topics.join(', ')}`)
  log.info(`Difficulty .... ${difficulties.join(', ')}`)
  log.info(`Domenlar ...... ${domains.join(', ')}`)
  log.info(`Har katakda ... ${count} item`)
  log.info(`Kataklar ...... ${cells.length}`)
  log.info(`Jami (maks) ... ${c.bold(String(cells.length * count))} item`)
  log.blank()

  if (dryRun) {
    table(
      ['Mavzu', 'Diff', 'CEFR', 'Domain', 'Item'],
      cells.map((cell) => [cell.topic, cell.difficulty, cell.cefr, cell.domain, cell.count])
    )
    log.blank()
    log.dry(`${COL.items} kolleksiyasiga status='draft' bilan yozilar edi.`)
    log.ok("Dry-run tugadi — AI chaqirilmadi, hech narsa yozilmadi.")
    return
  }

  if (
    !(await confirm(
      `${cells.length} ta katak uchun AI chaqirilsinmi? (taxminan ${cells.length * count} item, pullik)`,
      args.has('yes')
    ))
  ) {
    log.warn('Bekor qilindi.')
    return
  }

  const generateExercises = await loadService()
  log.ok(`${SERVICE_ALIAS} yuklandi.`)
  log.blank()

  const docs: BatchDoc[] = []
  const rows: Array<Array<string | number>> = []
  let failures = 0

  for (const [i, cell] of cells.entries()) {
    const label = `${cell.topic} d${cell.difficulty} (${cell.cefr}/${cell.domain})`
    process.stdout.write(`   ${c.gray(`[${i + 1}/${cells.length}]`)} ${label} ... `)
    try {
      const result = await generateExercises(cell)
      const items = extractItems(result)
      items.forEach((item, idx) => {
        const id = itemId(cell.skill, cell.topic, cell.difficulty, docs.length + idx)
        docs.push({
          id,
          data: {
            ...item,
            skill: item.skill ?? cell.skill,
            topic: item.topic ?? cell.topic,
            domain: item.domain ?? cell.domain,
            cefr: item.cefr ?? cell.cefr,
            difficulty: item.difficulty ?? cell.difficulty,
            errorTags: item.errorTags ?? [],
            tags: item.tags ?? [cell.topic, cell.domain],
            source: 'ai',
            status: 'draft',
            generatedFromPrompt: `skill=${cell.skill} topic=${cell.topic} cefr=${cell.cefr} difficulty=${cell.difficulty} domain=${cell.domain} count=${cell.count}`,
            createdBy: 'generate-items-cli',
            stats: { attempts: 0, correct: 0 },
            createdAt: FieldValue.serverTimestamp(),
          },
        })
      })
      console.log(c.green(`${items.length} ta`))
      rows.push([cell.topic, cell.difficulty, cell.cefr, cell.domain, items.length])
    } catch (err) {
      failures++
      console.log(c.red('xato'))
      log.error(`   ${label}: ${err instanceof Error ? err.message : String(err)}`)
      rows.push([cell.topic, cell.difficulty, cell.cefr, cell.domain, 'xato'])
    }
  }

  log.blank()
  table(['Mavzu', 'Diff', 'CEFR', 'Domain', 'Natija'], rows)
  log.blank()

  const outJson = args.get('out-json')
  if (outJson) {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(
      resolve(process.cwd(), outJson),
      JSON.stringify(
        docs.map((d) => ({ id: d.id, ...d.data, createdAt: undefined })),
        null,
        2
      ),
      'utf8'
    )
    log.ok(`JSON saqlandi: ${outJson}`)
  }

  if (!docs.length) {
    log.warn('Hech qanday item generatsiya qilinmadi.')
    return
  }

  const written = await batchWrite(COL.items, docs, { merge: false })
  log.ok(`${written} ta item ${COL.items} kolleksiyasiga yozildi (status: draft).`)
  if (failures) log.warn(`${failures} ta katak xato bilan tugadi.`)

  const drafts = await adminDb()
    .collection(COL.items)
    .where('status', '==', 'draft')
    .count()
    .get()
  log.blank()
  log.info(`Tasdiqlash navbatida jami: ${c.bold(String(drafts.data().count))} ta draft item.`)
  log.detail('Teacher Dashboard → Content approval sahifasida tasdiqlang.')
}

runMain(main)
