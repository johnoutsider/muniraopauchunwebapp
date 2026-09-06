/**
 * scripts/build-corpus.ts — Corpus Verification uchun mini-korpus quradi (PLAN 8.16).
 *
 *   npx tsx scripts/build-corpus.ts --min-count=3
 *
 * Oqim:
 *   scripts/corpus-src/ ichidagi .txt fayllar
 *     -> paragraf va gaplarga bo'lish
 *     -> tokenizatsiya + sodda (qoidaviy) lemmatizatsiya
 *     -> 2/3/4-gramm chastotasi + document frequency + 3 tagacha misol gap
 *     -> `corpusNgrams/{escaped-ngram}` va `corpusDocs/{docId}` kolleksiyalari.
 *
 * Natijadan foydalanish: talaba "make a profit" va "do a profit" ni taqqoslaydi —
 * platforma chastota va misol gaplarni ko'rsatadi ("verified" / "not attested").
 *
 * Ochiq manbalar ro'yxati: scripts/corpus-src/README.md (skript avtomatik yaratadi).
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

import {
  batchWrite,
  c,
  confirm,
  encodeDocId,
  FieldValue,
  log,
  parseArgs,
  projectId,
  runMain,
  showHelp,
  slugify,
  table,
  wantsHelp,
  type BatchDoc,
} from './_lib'
import { COL, DOMAINS, type Domain } from '@/config/constants'

const HELP = `
${c.bold('build-corpus')} — ochiq iqtisodiy matnlardan n-gramm indeksini quradi.

${c.bold('Ishlatish:')}
  npx tsx scripts/build-corpus.ts [bayroqlar]

${c.bold('Bayroqlar:')}
  --dir=<yo'l>          ${c.gray('Manba papkasi (default: scripts/corpus-src)')}
  --min-count=<n>       ${c.gray('Shu chastotadan past n-grammlar tashlanadi (default: 3)')}
  --max-ngrams=<n>      ${c.gray('Firestore ga yoziladigan maksimal n-gramm (default: 150000)')}
  --n=<2,3,4>           ${c.gray('Qaysi n-grammlar (default: 2,3,4)')}
  --domain=<domain>     ${c.gray(`Standart domain: ${DOMAINS.join(' | ')} (default: economics)`)}
  --out-json=<yo'l>     ${c.gray("Natijani JSON faylga ham saqlash (tekshirish uchun)")}
  --dry-run             ${c.gray("Hisoblanadi, lekin Firestore'ga yozilmaydi")}
  --yes                 ${c.gray("Tasdiqlashni o'tkazib yuboradi")}
  --help                ${c.gray('Shu yordam')}

${c.bold('Manba fayllari:')}
  scripts/corpus-src/ papkasiga ${c.bold('.txt')} fayllarni joylang (UTF-8, faqat matn).
  Fayl nomi domenni bildirishi mumkin: ${c.gray('imf-weo-2025_finance.txt -> domain=finance')}
  Ochiq manbalar ro'yxati: ${c.bold('scripts/corpus-src/README.md')}

${c.bold('Misollar:')}
  npx tsx scripts/build-corpus.ts --dry-run
  npx tsx scripts/build-corpus.ts --min-count=4 --max-ngrams=100000 --yes
`

/* ================================================================== */
/* 1. Tokenizatsiya va sodda lemmatizatsiya                            */
/* ================================================================== */

/** Tez-tez uchraydigan noto'g'ri fe'llar va ko'plik shakllari. */
const IRREGULAR: Record<string, string> = {
  is: 'be',
  are: 'be',
  was: 'be',
  were: 'be',
  been: 'be',
  being: 'be',
  has: 'have',
  had: 'have',
  having: 'have',
  does: 'do',
  did: 'do',
  done: 'do',
  doing: 'do',
  went: 'go',
  gone: 'go',
  goes: 'go',
  made: 'make',
  making: 'make',
  makes: 'make',
  took: 'take',
  taken: 'take',
  taking: 'take',
  rose: 'rise',
  risen: 'rise',
  rising: 'rise',
  fell: 'fall',
  fallen: 'fall',
  falling: 'fall',
  grew: 'grow',
  grown: 'grow',
  growing: 'grow',
  paid: 'pay',
  paying: 'pay',
  sold: 'sell',
  selling: 'sell',
  bought: 'buy',
  buying: 'buy',
  led: 'lead',
  leading: 'lead',
  met: 'meet',
  meeting: 'meet',
  held: 'hold',
  holding: 'hold',
  kept: 'keep',
  keeping: 'keep',
  lost: 'lose',
  losing: 'lose',
  found: 'find',
  finding: 'find',
  gave: 'give',
  given: 'give',
  giving: 'give',
  children: 'child',
  people: 'person',
  men: 'man',
  women: 'woman',
  analyses: 'analysis',
  crises: 'crisis',
  indices: 'index',
  criteria: 'criterion',
  taxes: 'tax',
  losses: 'loss',
}

/** Lemmatizatsiya qilinmaydigan so'zlar (kollokatsiya shakli uchun muhim). */
const KEEP_AS_IS = new Set([
  'a',
  'an',
  'the',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
  'from',
  'as',
  'this',
  'his',
  'its',
  'us',
  'gas',
  'thus',
  'less',
  'gross',
  'series',
  'business',
  'analysis',
  'process',
  'access',
  'success',
])

/**
 * Juda sodda qoidaviy lemmatizator (PLAN: "crude lemmatisation").
 * Maqsad — "makes a profit" / "made a profit" / "making a profit" ni bitta
 * n-grammga keltirish; mukammal morfologik tahlil emas.
 */
export function lemmatise(token: string): string {
  if (token.length <= 3) return token
  const irregular = IRREGULAR[token]
  if (irregular) return irregular
  if (KEEP_AS_IS.has(token)) return token

  // companies -> company, applied -> apply
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`
  if (token.endsWith('ied') && token.length > 4) return `${token.slice(0, -3)}y`

  // losses -> loss, branches -> branch, taxes -> tax
  if (/(sses|shes|ches|xes|zes)$/.test(token)) return token.slice(0, -2)

  // rising -> rise, growing -> grow, running -> run
  if (token.endsWith('ing') && token.length > 5) {
    const stem = token.slice(0, -3)
    if (/([bdfglmnprt])\1$/.test(stem)) return stem.slice(0, -1)
    if (/[bcdfgklmnprstvz]$/.test(stem) && /[aeiou][bcdfgklmnprstvz]$/.test(stem)) {
      return `${stem}e`
    }
    return stem
  }

  // increased -> increase, reported -> report, planned -> plan
  if (token.endsWith('ed') && token.length > 4) {
    const stem = token.slice(0, -2)
    if (/([bdfglmnprt])\1$/.test(stem)) return stem.slice(0, -1)
    if (/[csgzvu]$/.test(stem)) return `${stem}e`
    return stem
  }

  // loans -> loan (lekin -ss / -us / -is / -as emas)
  if (token.endsWith('s') && !/(ss|us|is|as)$/.test(token) && token.length > 3) {
    return token.slice(0, -1)
  }

  return token
}

const TOKEN_RE = /[a-z][a-z'-]*/g
/** Egri qo'shtirnoqlar (U+2018, U+2019) */
const SMART_QUOTE_RE = new RegExp(`[${String.fromCharCode(0x2018, 0x2019)}]`, 'g')
/** En/em tire (U+2013, U+2014) */
const DASH_RE = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`, 'g')

export function tokenise(sentence: string): string[] {
  const lowered = sentence.toLowerCase().replace(SMART_QUOTE_RE, "'").replace(DASH_RE, ' ')
  const matches = lowered.match(TOKEN_RE) ?? []
  return matches.map((t) => t.replace(/^[-']+|[-']+$/g, '')).filter((t) => t.length > 0)
}

/** Ulardan keyingi nuqta gap oxirini bildirmaydi. */
const ABBREVIATIONS = new Set([
  'no',
  'fig',
  'vol',
  'dr',
  'mr',
  'mrs',
  'ms',
  'st',
  'inc',
  'ltd',
  'co',
  'corp',
  'etc',
  'approx',
  'vs',
  'pp',
  'ch',
  'sec',
  'art',
  'e.g',
  'i.e',
  'cf',
  'al',
])

const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=["'(]?[A-Z0-9])/

/**
 * Matnni paragraf -> gap ketma-ketligiga ajratadi.
 * Qisqartmadan keyin noto'g'ri bo'lingan bo'laklar qayta birlashtiriladi.
 */
export function splitSentences(text: string): string[] {
  const paragraphs = text.replace(/\r\n?/g, '\n').split(/\n{2,}/)
  const out: string[] = []

  for (const paragraph of paragraphs) {
    const flat = paragraph.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim()
    if (!flat) continue

    const parts = flat.split(SENTENCE_BOUNDARY)
    let buffer = ''

    for (const part of parts) {
      buffer = buffer ? `${buffer} ${part}` : part
      const lastWord = /([A-Za-z.]+)\.$/.exec(buffer.trim())?.[1]?.toLowerCase()
      if (lastWord && ABBREVIATIONS.has(lastWord)) continue // qisqartma — davom etamiz
      out.push(buffer.trim())
      buffer = ''
    }
    if (buffer.trim()) out.push(buffer.trim())
  }

  return out.filter((s) => s.length >= 15 && s.length <= 400)
}

/* ================================================================== */
/* 2. N-gramm indeksi                                                  */
/* ================================================================== */

interface NgramEntry {
  ngram: string
  n: number
  count: number
  docs: Set<string>
  examples: Array<{ sentence: string; docId: string }>
}

class NgramIndex {
  private map = new Map<string, NgramEntry>()

  add(tokens: string[], n: number, sentence: string, docId: string): void {
    if (tokens.length < n) return
    for (let i = 0; i + n <= tokens.length; i++) {
      const key = tokens.slice(i, i + n).join(' ')
      let entry = this.map.get(key)
      if (!entry) {
        entry = { ngram: key, n, count: 0, docs: new Set<string>(), examples: [] }
        this.map.set(key, entry)
      }
      entry.count += 1
      entry.docs.add(docId)
      if (entry.examples.length < 3 && !entry.examples.some((e) => e.sentence === sentence)) {
        entry.examples.push({ sentence, docId })
      }
    }
  }

  get size(): number {
    return this.map.size
  }

  /** Xotirani bo'shatish uchun kamdan-kam uchraydiganlarni tashlaydi. */
  prune(minCount: number): void {
    for (const [key, entry] of this.map) {
      if (entry.count < minCount) this.map.delete(key)
    }
  }

  finalise(minCount: number, max: number): NgramEntry[] {
    const kept = [...this.map.values()].filter((e) => e.count >= minCount)
    kept.sort((a, b) => b.count - a.count || a.ngram.localeCompare(b.ngram))
    return kept.slice(0, max)
  }
}

/* ================================================================== */
/* 3. Manba fayllari                                                   */
/* ================================================================== */

function listTextFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (extname(name).toLowerCase() === '.txt') out.push(full)
    }
  }
  walk(dir)
  return out.sort()
}

/** `imf-weo-2025_finance.txt` -> domain=finance */
function domainFromFilename(file: string, fallback: Domain): Domain {
  const stem = basename(file, extname(file)).toLowerCase()
  for (const d of DOMAINS) {
    if (stem.endsWith(`_${d}`) || stem.endsWith(`-${d}`)) return d
  }
  return fallback
}

function titleFromFilename(file: string): string {
  return basename(file, extname(file))
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

const CORPUS_README = `# scripts/corpus-src — mini-korpus manbalari

Bu papkaga **ochiq litsenziyali** iqtisodiy matnlarni \`.txt\` (UTF-8) ko'rinishida joylang,
so'ng korpusni quring:

    npx tsx scripts/build-corpus.ts --min-count=3

Fayl nomining oxiriga domain qo'shsangiz, u avtomatik aniqlanadi:
\`imf-weo-2025_finance.txt\` -> \`domain=finance\`.
Ruxsat etilgan domenlar: ${DOMAINS.join(', ')}.

## Tavsiya etilgan ochiq manbalar

| Manba | Nima olinadi | Litsenziya / shart |
|---|---|---|
| **IMF** — World Economic Outlook, Global Financial Stability Report, Article IV (imf.org/publications) | Makroiqtisodiy tahlil, prognoz tili, grafik izohlari | Erkin yuklab olinadi; IMF nashr shartlariga rioya qiling va manbani ko'rsating |
| **World Bank Open Knowledge Repository** (openknowledge.worldbank.org) | Rivojlanish iqtisodiyoti hisobotlari, mamlakat sharhlari | Ko'p hujjatlar CC BY 3.0 IGO |
| **ECB** — Economic Bulletin, monetary policy statements (ecb.europa.eu) | Pul-kredit siyosati, inflyatsiya, foiz stavkalari leksikasi | Manba ko'rsatilgan holda qayta foydalanishga ruxsat |
| **OpenStax** — Principles of Economics / Macroeconomics (openstax.org) | Darslik registri, ta'riflar; B1–B2 uchun eng mos | CC BY 4.0 |
| **Wikipedia** — iqtisodiyot, moliya, bank ishi maqolalari | Terminologiya, keng qamrov | CC BY-SA 4.0 |
| **OECD** ochiq hisobotlari (oecd.org) | Siyosat tahlili, mehnat bozori, savdo | Ko'p hisobotlar ochiq |
| **Federal Reserve** — FOMC statements, Beige Book (federalreserve.gov) | Rasmiy bayonot registri | AQSh hukumati asari, public domain |
| **U.S. SEC EDGAR** — 10-K yillik hisobotlar (sec.gov/edgar) | Korporativ moliya, "annual report" registri | Public domain (topshirilgan hujjatlar) |
| **UNCTAD / WTO** statistik sharhlari | Xalqaro savdo leksikasi | Ochiq |

## Tayyorlash bo'yicha maslahatlar

1. PDF dan matnga: \`pdftotext -layout -enc UTF-8 file.pdf file.txt\` (poppler-utils).
2. Jadval, sahifa raqamlari, kolontitullarni olib tashlang — ular n-gramm statistikasini buzadi.
3. Bir fayl = bir hujjat (\`corpusDocs\` da bitta yozuv). 1–2 mln so'zlik korpus uchun
   taxminan 150–400 ta o'rtacha hajmli hisobot yetadi.
4. **Mualliflik huquqi:** yopiq litsenziyali darsliklar, pullik ma'lumotlar bazalari va
   yangilik agentliklari materiallarini joylashtirmang.
5. Fayl nomini ma'noli qo'ying — u \`title\` va \`source\` sifatida yoziladi.
`

/* ================================================================== */
/* 4. Asosiy oqim                                                      */
/* ================================================================== */

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const dryRun = args.has('dry-run')
  const dir = resolve(process.cwd(), args.get('dir') ?? 'scripts/corpus-src')
  const minCount = args.int('min-count', 3)
  const maxNgrams = args.int('max-ngrams', 150_000)
  const nSizes = (args.list('n') ?? ['2', '3', '4'])
    .map((x) => Number.parseInt(x, 10))
    .filter((x) => x >= 2 && x <= 5)
  const defaultDomain = (args.get('domain') ?? 'economics') as Domain
  if (!DOMAINS.includes(defaultDomain)) {
    throw new Error(`Nomaʼlum domain: ${defaultDomain} (${DOMAINS.join(', ')})`)
  }

  log.title('Mini-korpus qurish')
  log.detail(`Loyiha: ${projectId()}`)
  log.detail(`Manba:  ${dir}`)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    log.warn(`Papka yaratildi: ${dir}`)
  }
  const readmePath = join(dir, 'README.md')
  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, CORPUS_README, 'utf8')
    log.ok(`Manbalar ro'yxati yozildi: ${readmePath}`)
  }

  const files = listTextFiles(dir)
  if (files.length === 0) {
    log.blank()
    log.warn(`${dir} papkasida .txt fayl topilmadi.`)
    log.detail(`Ochiq manbalar ro'yxati: ${readmePath}`)
    log.detail('Masalan: OpenStax Principles of Economics, IMF WEO, ECB Economic Bulletin.')
    return
  }
  log.ok(`${files.length} ta matn fayli topildi.`)
  log.blank()

  const index = new NgramIndex()
  const docMetas: BatchDoc[] = []
  let totalWords = 0
  let totalSentences = 0

  for (const [i, file] of files.entries()) {
    const docId = slugify(basename(file, extname(file)))
    const sentences = splitSentences(readFileSync(file, 'utf8'))
    let words = 0

    for (const sentence of sentences) {
      const tokens = tokenise(sentence).map(lemmatise)
      words += tokens.length
      for (const n of nSizes) index.add(tokens, n, sentence, docId)
    }

    totalWords += words
    totalSentences += sentences.length

    docMetas.push({
      id: docId,
      data: {
        title: titleFromFilename(file),
        source: basename(file),
        domain: domainFromFilename(file, defaultDomain),
        wordCount: words,
        sentenceCount: sentences.length,
        addedAt: FieldValue.serverTimestamp(),
      },
    })

    log.detail(
      `[${i + 1}/${files.length}] ${basename(file)} — ${words.toLocaleString('en-US')} token, ` +
        `${sentences.length.toLocaleString('en-US')} gap`
    )

    // Xotira nazorati: juda katta korpusda oraliq tozalash
    if ((i + 1) % 25 === 0 && index.size > 2_000_000) {
      const before = index.size
      index.prune(2)
      log.detail(
        `   (xotira: ${before.toLocaleString('en-US')} -> ${index.size.toLocaleString('en-US')})`
      )
    }
  }

  const entries = index.finalise(minCount, maxNgrams)

  log.blank()
  table(
    ["Ko'rsatkich", 'Qiymat'],
    [
      ['Hujjatlar', files.length.toLocaleString('en-US')],
      ['Tokenlar', totalWords.toLocaleString('en-US')],
      ['Gaplar', totalSentences.toLocaleString('en-US')],
      ['Xom n-grammlar', index.size.toLocaleString('en-US')],
      [`Saqlanadigan (count >= ${minCount})`, entries.length.toLocaleString('en-US')],
      ...nSizes.map((n) => [
        `  ${n}-gramm`,
        entries.filter((e) => e.n === n).length.toLocaleString('en-US'),
      ]),
    ]
  )

  if (entries.length > 0) {
    log.blank()
    log.info("Eng chastotali 10 ta n-gramm:")
    table(
      ['N-gramm', 'n', 'Chastota', 'Hujjat'],
      entries.slice(0, 10).map((e) => [e.ngram, e.n, e.count, e.docs.size])
    )
  }

  const outJson = args.get('out-json')
  if (outJson) {
    writeFileSync(
      resolve(process.cwd(), outJson),
      JSON.stringify(
        entries.map((e) => ({
          ngram: e.ngram,
          n: e.n,
          count: e.count,
          docFreq: e.docs.size,
          examples: e.examples,
        })),
        null,
        2
      ),
      'utf8'
    )
    log.ok(`JSON saqlandi: ${outJson}`)
  }

  if (dryRun) {
    log.blank()
    log.dry(`${COL.corpusDocs}: ${docMetas.length} ta hujjat metama'lumoti`)
    log.dry(`${COL.corpusNgrams}: ${entries.length} ta n-gramm`)
    log.ok("Dry-run tugadi — Firestore'ga hech narsa yozilmadi.")
    return
  }

  if (entries.length === 0) {
    log.warn(`Hech qanday n-gramm --min-count=${minCount} shartidan o'tmadi.`)
    return
  }

  log.blank()
  if (
    !(await confirm(
      `${entries.length.toLocaleString('en-US')} ta n-gramm Firestore'ga yozilsinmi?`,
      args.has('yes')
    ))
  ) {
    log.warn('Bekor qilindi.')
    return
  }

  const ngramDocs: BatchDoc[] = entries.map((e) => ({
    id: encodeDocId(e.ngram),
    data: {
      ngram: e.ngram,
      n: e.n,
      count: e.count,
      docFreq: e.docs.size,
      examples: e.examples,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }))

  log.blank()
  const metaWritten = await batchWrite(COL.corpusDocs, docMetas)
  log.ok(`${COL.corpusDocs}: ${metaWritten} ta hujjat yozildi.`)

  const written = await batchWrite(COL.corpusNgrams, ngramDocs, {
    onProgress: (done, total) => {
      if (done % 4500 === 0 || done === total) {
        log.detail(
          `${COL.corpusNgrams}: ${done.toLocaleString('en-US')}/${total.toLocaleString('en-US')}`
        )
      }
    },
  })

  log.blank()
  log.title('Tayyor')
  log.ok(`${written.toLocaleString('en-US')} ta n-gramm ${COL.corpusNgrams} ga yozildi.`)
  log.ok(`${metaWritten} ta manba hujjati ${COL.corpusDocs} ga yozildi.`)
  log.detail("Corpus Verification endi 'make a profit' kabi iboralarni tekshira oladi.")
}

runMain(main)
