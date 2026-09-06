/**
 * scripts/seed.ts — `src/content/` dagi seed kontentni Firestore'ga yozadi.
 *
 *   npx tsx scripts/seed.ts --dry-run
 *   npx tsx scripts/seed.ts --yes
 *   npx tsx scripts/seed.ts --only=lexicon,items --yes
 *
 * Xususiyatlari:
 *   - **Idempotent**: hujjat id lari deterministik (kontentdagi `id`), yozuv
 *     `merge: true` bilan amalga oshiriladi. Skriptni istalgan marta qayta
 *     ishga tushirish xavfsiz — statistika (`stats`) va o'qituvchi tahrirlari
 *     saqlanib qoladi.
 *   - **Bog'liqlik tartibi**: lug'at va mashqlar avval, ularga tayanadigan
 *     darslar va testlar keyin yoziladi.
 *   - **Tekshiruv**: takrorlangan id lar, darslar/testlardagi yo'q item yoki
 *     lug'at havolalari va parallel test variantlari yozishdan oldin
 *     tekshiriladi.
 */

import {
  SEED_BADGES,
  SEED_CASE_STUDIES,
  SEED_CONTENT_COUNTS,
  SEED_COURSES,
  SEED_GRAMMAR_LESSONS,
  SEED_ITEMS,
  SEED_LESSONS,
  SEED_LEXICON,
  SEED_MODULES,
  SEED_PROMPT_EXERCISES,
  SEED_SCENARIOS,
  SEED_SURVEYS,
  SEED_TESTS,
  checkParallelVariants,
  itemBankStats,
} from '@/content'
import { COL } from '@/config/constants'

import {
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

/** Grammatika darslari uchun kolleksiya (COL da yo'q — CMS va AI xizmatlari o'qiydi). */
const GRAMMAR_LESSONS_COLLECTION = 'grammarLessons'

const HELP = `
${c.bold('seed')} — src/content/ dagi o'quv kontentni Firestore'ga yozadi (idempotent).

${c.bold('Ishlatish:')}
  npx tsx scripts/seed.ts [bayroqlar]

${c.bold('Bayroqlar:')}
  --only=<a,b,...>   ${c.gray("Faqat tanlangan bloklar (pastdagi ro'yxat)")}
  --skip=<a,b,...>   ${c.gray('Tanlanganlaridan tashqari hammasi')}
  --force            ${c.gray("merge o'rniga to'liq qayta yozish (o'qituvchi tahrirlari yo'qoladi)")}
  --dry-run          ${c.gray("Tekshiradi va hisoblaydi, lekin yozmaydi")}
  --yes              ${c.gray("Tasdiqlashni o'tkazib yuboradi")}
  --no-verify        ${c.gray('Havolalar tekshiruvini o‘tkazib yuboradi')}
  --help             ${c.gray('Shu yordam')}

${c.bold('Bloklar (yozilish tartibi):')}
  lexicon, grammar, items, courses, modules, lessons,
  caseStudies, scenarios, promptExercises, surveys, tests, badges

${c.bold('Misollar:')}
  ${c.gray('# Nima yozilishini ko‘rish')}
  npx tsx scripts/seed.ts --dry-run

  ${c.gray('# Hammasini yozish')}
  npx tsx scripts/seed.ts --yes

  ${c.gray('# Faqat lug‘at va mashqlarni yangilash')}
  npx tsx scripts/seed.ts --only=lexicon,items --yes

${c.yellow('Eslatma:')} ${c.bold('--force')} hujjatni butunlay almashtiradi.
Odatda kerak emas — standart ${c.bold('merge: true')} rejimi statistika va
o'qituvchi tasdiqlarini saqlab qoladi.
`

/* ================================================================== */
/* Bloklar ta'rifi                                                     */
/* ================================================================== */

interface SeedBlock {
  key: string
  collection: string
  label: string
  docs: BatchDoc[]
}

/** `id` ni ajratib, qolgan maydonlarga `createdAt` qo'shadi. */
function withTimestamp<T extends { id: string }>(items: readonly T[]): BatchDoc[] {
  return items.map((item) => {
    const { id, ...rest } = item
    return {
      id,
      data: { ...rest, createdAt: FieldValue.serverTimestamp() } as Record<string, unknown>,
    }
  })
}

/** `id` ni ajratadi (createdAt maydoni bo'lmagan hujjatlar uchun). */
function withoutId<T extends { id: string }>(items: readonly T[]): BatchDoc[] {
  return items.map((item) => {
    const { id, ...rest } = item
    return { id, data: { ...rest } as Record<string, unknown> }
  })
}

function buildBlocks(): SeedBlock[] {
  return [
    {
      key: 'lexicon',
      collection: COL.lexicon,
      label: "Lug'at (so'z kartalari)",
      docs: withTimestamp(SEED_LEXICON),
    },
    {
      key: 'grammar',
      collection: GRAMMAR_LESSONS_COLLECTION,
      label: 'Grammatika darslari (8 mavzu)',
      docs: withTimestamp(SEED_GRAMMAR_LESSONS),
    },
    {
      key: 'items',
      collection: COL.items,
      label: 'Mashq banki (itemlar)',
      docs: withTimestamp(SEED_ITEMS),
    },
    {
      key: 'courses',
      collection: COL.courses,
      label: 'Kurslar',
      docs: withTimestamp(SEED_COURSES),
    },
    {
      key: 'modules',
      collection: COL.modules,
      label: 'Modullar',
      // ModuleDoc da createdAt maydoni yo'q
      docs: withoutId(SEED_MODULES),
    },
    {
      key: 'lessons',
      collection: COL.lessons,
      label: 'Darslar',
      docs: withTimestamp(SEED_LESSONS),
    },
    {
      key: 'caseStudies',
      collection: COL.caseStudies,
      label: 'Case study (integrativ loyihalar)',
      docs: withTimestamp(SEED_CASE_STUDIES),
    },
    {
      key: 'scenarios',
      collection: COL.scenarios,
      label: 'AI role-play stsenariylari',
      docs: withoutId(SEED_SCENARIOS),
    },
    {
      key: 'promptExercises',
      collection: COL.promptExercises,
      label: 'Prompt Practice Lab mashqlari',
      docs: withoutId(SEED_PROMPT_EXERCISES),
    },
    {
      key: 'surveys',
      collection: COL.surveys,
      label: "So'rovnomalar (tadqiqot vositalari)",
      docs: withTimestamp(SEED_SURVEYS),
    },
    {
      key: 'tests',
      collection: COL.tests,
      label: 'Testlar (diagnostic / pre / post)',
      docs: withTimestamp(SEED_TESTS),
    },
    {
      key: 'badges',
      collection: COL.badges,
      label: "Badge'lar (gamifikatsiya)",
      docs: withoutId(SEED_BADGES),
    },
  ]
}

/* ================================================================== */
/* Tekshiruv                                                           */
/* ================================================================== */

function verify(blocks: SeedBlock[]): string[] {
  const problems: string[] = []

  // 1. Blok ichida takrorlangan id
  for (const block of blocks) {
    const seen = new Set<string>()
    for (const doc of block.docs) {
      if (seen.has(doc.id)) problems.push(`${block.collection}: takrorlangan id "${doc.id}"`)
      seen.add(doc.id)
      if (!doc.id || /[/]/.test(doc.id)) {
        problems.push(`${block.collection}: yaroqsiz hujjat id "${doc.id}"`)
      }
    }
  }

  const itemIdSet = new Set(SEED_ITEMS.map((i) => i.id))
  const lexiconIdSet = new Set(SEED_LEXICON.map((l) => l.id))
  const moduleIdSet = new Set(SEED_MODULES.map((m) => m.id))
  const courseIdSet = new Set(SEED_COURSES.map((c2) => c2.id))

  // 2. Darslardagi havolalar
  for (const lesson of SEED_LESSONS) {
    if (!moduleIdSet.has(lesson.moduleId)) {
      problems.push(`lessons/${lesson.id}: moduleId "${lesson.moduleId}" topilmadi`)
    }
    if (!courseIdSet.has(lesson.courseId)) {
      problems.push(`lessons/${lesson.id}: courseId "${lesson.courseId}" topilmadi`)
    }
    for (const block of lesson.blocks) {
      if (block.kind === 'exercises') {
        if (block.itemIds.length === 0) {
          problems.push(`lessons/${lesson.id}: "${block.title ?? 'exercises'}" bloki bo'sh`)
        }
        for (const id of block.itemIds) {
          if (!itemIdSet.has(id)) problems.push(`lessons/${lesson.id}: item "${id}" topilmadi`)
        }
      }
      if (block.kind === 'vocab') {
        if (block.wordIds.length === 0) {
          problems.push(`lessons/${lesson.id}: vocab bloki bo'sh`)
        }
        for (const id of block.wordIds) {
          if (!lexiconIdSet.has(id)) problems.push(`lessons/${lesson.id}: so'z "${id}" topilmadi`)
        }
      }
    }
  }

  // 3. Modullarning kursi
  for (const mod of SEED_MODULES) {
    if (!courseIdSet.has(mod.courseId)) {
      problems.push(`modules/${mod.id}: courseId "${mod.courseId}" topilmadi`)
    }
  }

  // 4. Testlardagi item havolalari
  for (const test of SEED_TESTS) {
    for (const section of test.sections) {
      for (const id of section.itemIds) {
        if (!itemIdSet.has(id)) problems.push(`tests/${test.id}: item "${id}" topilmadi`)
      }
      if (section.itemIds.length === 0 && !section.openTask) {
        problems.push(`tests/${test.id}: "${section.title}" bo'limi bo'sh`)
      }
    }
  }

  // 5. Parallel variantlar
  const parallel = checkParallelVariants()
  problems.push(...parallel.problems)

  // 6. Har item to'liq izohga ega bo'lishi shart (metodikaning asosiy talabi)
  for (const item of SEED_ITEMS) {
    const e = item.explanation
    if (!e || !e.why?.trim() || !e.how?.trim() || !e.whereElse?.trim()) {
      problems.push(`items/${item.id}: explanation (why/how/whereElse) to'liq emas`)
    }
  }

  return problems
}

/* ================================================================== */
/* Asosiy oqim                                                         */
/* ================================================================== */

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const dryRun = args.has('dry-run')
  const force = args.has('force')
  const only = args.list('only')
  const skip = args.list('skip')

  log.title('Seed kontentni Firestore’ga yozish')
  log.detail(`Loyiha: ${projectId()}`)

  let blocks = buildBlocks()
  const knownKeys = blocks.map((b) => b.key)

  if (only) {
    const unknown = only.filter((k) => !knownKeys.includes(k))
    if (unknown.length) {
      throw new Error(
        `Nomaʼlum blok: ${unknown.join(', ')}\n  Mavjud bloklar: ${knownKeys.join(', ')}`
      )
    }
    blocks = blocks.filter((b) => only.includes(b.key))
  }
  if (skip) blocks = blocks.filter((b) => !skip.includes(b.key))
  if (!blocks.length) throw new Error('Yoziladigan blok qolmadi.')

  // Kontent statistikasi
  log.blank()
  log.info('Kontent hajmi:')
  const stats = itemBankStats()
  table(
    ['Kontent', 'Soni'],
    [
      ["Lug'at (so'z)", SEED_CONTENT_COUNTS.lexicon],
      ['Grammatika darslari', SEED_CONTENT_COUNTS.grammarLessons],
      ['Mashq itemlari', SEED_CONTENT_COUNTS.items],
      ['  — grammatika', stats.bySkill.grammar ?? 0],
      ['  — lug‘at', stats.bySkill.vocabulary ?? 0],
      ['  — boshqa ko‘nikmalar', SEED_CONTENT_COUNTS.items - (stats.bySkill.grammar ?? 0) - (stats.bySkill.vocabulary ?? 0)],
      ['  — mashq turlari', Object.keys(stats.byType).length],
      ['Kurslar', SEED_CONTENT_COUNTS.courses],
      ['Modullar', SEED_CONTENT_COUNTS.modules],
      ['Darslar', SEED_CONTENT_COUNTS.lessons],
      ['Case study', SEED_CONTENT_COUNTS.caseStudies],
      ['Role-play stsenariylari', SEED_CONTENT_COUNTS.scenarios],
      ['Prompt mashqlari', SEED_CONTENT_COUNTS.promptExercises],
      ["So'rovnomalar", SEED_CONTENT_COUNTS.surveys],
      ['  — savollar', SEED_CONTENT_COUNTS.surveyQuestions],
      ['Testlar', SEED_CONTENT_COUNTS.tests],
      ["Badge'lar", SEED_CONTENT_COUNTS.badges],
    ]
  )

  // Tekshiruv
  if (!args.has('no-verify')) {
    log.blank()
    log.step('Kontent tekshirilmoqda...')
    const problems = verify(buildBlocks())
    if (problems.length) {
      log.blank()
      for (const p of problems.slice(0, 40)) log.error(p)
      if (problems.length > 40) log.detail(`... va yana ${problems.length - 40} ta muammo`)
      throw new Error(
        `${problems.length} ta kontent muammosi topildi — hech narsa yozilmadi.\n` +
          '  Tekshiruvni o‘tkazib yuborish uchun: --no-verify'
      )
    }
    log.ok('Havolalar, id lar va parallel variantlar joyida.')
  }

  // Yozish rejasi
  log.blank()
  table(
    ['Blok', 'Kolleksiya', 'Hujjat'],
    blocks.map((b) => [b.label, b.collection, b.docs.length])
  )
  const totalDocs = blocks.reduce((n, b) => n + b.docs.length, 0)

  if (dryRun) {
    log.blank()
    log.dry(`${totalDocs} ta hujjat ${blocks.length} ta kolleksiyaga yozilar edi`)
    log.dry(force ? 'Rejim: to‘liq qayta yozish (--force)' : 'Rejim: merge (idempotent)')
    log.blank()
    log.ok('Dry-run tugadi — Firestore o‘zgartirilmadi.')
    return
  }

  log.blank()
  if (force) {
    log.warn('--force: mavjud hujjatlar butunlay almashtiriladi (stats va tahrirlar yo‘qoladi).')
  }
  if (
    !(await confirm(
      `${totalDocs} ta hujjat yozilsinmi? (${force ? 'qayta yozish' : 'merge'})`,
      args.has('yes')
    ))
  ) {
    log.warn('Bekor qilindi.')
    return
  }

  log.blank()
  const results: Array<Array<string | number>> = []
  const started = Date.now()

  for (const block of blocks) {
    process.stdout.write(`   ${block.label} ... `)
    const written = await batchWrite(block.collection, block.docs, { merge: !force })
    console.log(c.green(`${written} ta`))
    results.push([block.label, block.collection, written])
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1)

  log.blank()
  log.title('Xulosa')
  table(['Blok', 'Kolleksiya', 'Yozildi'], results)
  log.blank()
  log.ok(`${totalDocs} ta hujjat ${seconds}s ichida yozildi.`)
  log.detail('Skript idempotent — xavfsiz qayta ishga tushirish mumkin.')
  log.blank()
  log.info('Keyingi qadamlar:')
  log.detail('1) npx tsx scripts/create-admin.ts --email=... --name="..."')
  log.detail('2) npx tsx scripts/import-users.ts --file=./data/students.xlsx --dry-run')
  log.detail('3) npx tsx scripts/build-corpus.ts --dry-run')
}

runMain(main)
