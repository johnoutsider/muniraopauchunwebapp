import type { PromptLevel } from '@/config/constants'

/**
 * Prompt Practice Lab kontenti (PLAN 8.15, 3-bosqich).
 * `promptExercises` kolleksiyasi bo'sh bo'lsa ham modul to'liq ishlaydi.
 */

/* ------------------------------------------------------------------ */
/* 1. Kirish moduli: AI nima qila oladi va nima qila olmaydi           */
/* ------------------------------------------------------------------ */

export interface IntroSection {
  id: string
  title: string
  points: string[]
}

export const INTRO_SECTIONS: IntroSection[] = [
  {
    id: 'can',
    title: 'AI nimani yaxshi bajaradi',
    points: [
      'Grammatik qoidani misollar bilan tushuntirish va darajangizga moslashtirish.',
      'Bir mavzu bo‘yicha ko‘p mashq yaratish (gap to‘ldirish, transformatsiya, xatoni topish).',
      'Yozgan matningizdagi xatolarni ko‘rsatib, nima uchun xato ekanini izohlash.',
      'Kasbiy vaziyat uchun iboralar, kollokatsiyalar va gap namunalarini taklif qilish.',
      'Rol o‘ynab, suhbat mashqi qilish (mijoz, menejer, investor).',
    ],
  },
  {
    id: 'cannot',
    title: 'AI nimani ishonchli bajara olmaydi',
    points: [
      'Aniq raqam va statistikani kafolatlash — u ma’lumotni «ishonchli ko‘rinishda» to‘qib chiqarishi mumkin.',
      'Manba va iqtiboslarni to‘g‘ri keltirish — havolalar ko‘pincha mavjud bo‘lmaydi.',
      'Kam uchraydigan iborani «ingliz tilida shunday deyiladi» deb tasdiqlash — buni korpus tekshiradi.',
      'Sizning o‘rningizga fikr yuritish va yozma ishingizni yozib berish (akademik halollik buzilishi).',
      'Uzbek tilidagi terminlarning yagona to‘g‘ri variantini belgilash.',
    ],
  },
  {
    id: 'verify',
    title: 'AI javobini qanday tekshirish kerak',
    points: [
      'Har bir raqam va faktni mustaqil manbadan tekshiring (statistika, rasmiy hisobot).',
      'Kollokatsiyani Corpus Verification vidjeti orqali tekshiring: ibora haqiqatan ishlatiladimi?',
      'Grammatik qoidani darslikdagi tushuntirish bilan solishtiring.',
      'AI javobini o‘qituvchingizga ko‘rsating — ayniqsa terminologiya bo‘yicha.',
      'Ikkinchi marta so‘rang: «Are you sure? Give me the source.» — javob o‘zgarsa, ishonch past.',
    ],
  },
  {
    id: 'honesty',
    title: 'Akademik halollik qoidalari',
    points: [
      'AI yozgan matnni o‘zingizniki sifatida topshirish mumkin emas.',
      'AI’dan yo‘naltirish, tushuntirish va feedback so‘rang — tayyor javob emas.',
      'Ishingizda AI’dan foydalanganingizni oshkor qiling (platformada bu avtomatik belgilanadi).',
      'AI yaratgan mashqlar o‘qituvchi tasdiqlagandan keyingina rasmiy hisoblanadi.',
      'Imtihon va nazorat ishlarida AI’dan foydalanish taqiqlanadi.',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 2. Bad vs good prompt (PLAN 8.15 misoli)                            */
/* ------------------------------------------------------------------ */

export interface PromptComparison {
  bad: string
  good: string
  whyBad: string[]
  whyGood: string[]
}

export const SHOWCASE: PromptComparison = {
  bad: 'Give me English exercises',
  good: 'Create five B1–B2 grammar exercises about inflation for economics students',
  whyBad: [
    'Qaysi ko‘nikma? Grammatika, lug‘at yoki o‘qishmi — noma’lum.',
    'Daraja ko‘rsatilmagan: A1 uchunmi yoki C1 uchunmi?',
    'Mavzu yo‘q — kasbiy kontekst umuman berilmagan.',
    'Format va miqdor yo‘q: nechta va qanday ko‘rinishda?',
    'Natijani tekshirib bo‘lmaydi — nima kutilayotgani aytilmagan.',
  ],
  whyGood: [
    'Aniq son: beshta mashq.',
    'Daraja: B1–B2 (CEFR bo‘yicha).',
    'Ko‘nikma: grammatika.',
    'Mavzu va kasbiy kontekst: inflyatsiya, iqtisodiyot talabalari.',
    'Natijani tekshirish oson: mashqlar mavzuga va darajaga mos keldimi?',
  ],
}

/* ------------------------------------------------------------------ */
/* 3. Guided daraja shabloni                                           */
/* ------------------------------------------------------------------ */

export interface TemplateField {
  id: 'task' | 'level' | 'topic' | 'format'
  label: string
  hint: string
  placeholder: string
  options: string[]
}

export const TEMPLATE_FIELDS: TemplateField[] = [
  {
    id: 'task',
    label: 'Vazifa (nima qilib berishi kerak)',
    hint: 'Fe’l bilan boshlang: create, explain, correct, compare…',
    placeholder: 'Create five grammar exercises',
    options: [
      'Create five grammar exercises',
      'Explain the rule with three examples',
      'Correct my sentences and explain each mistake',
      'Give me ten collocations with example sentences',
      'Ask me five questions and check my answers',
    ],
  },
  {
    id: 'level',
    label: 'Daraja',
    hint: 'CEFR darajasini aniq ayting — javob shunga moslashadi.',
    placeholder: 'at B1–B2 level',
    options: ['at A2 level', 'at B1 level', 'at B1–B2 level', 'at B2 level', 'at C1 level'],
  },
  {
    id: 'topic',
    label: 'Mavzu va kasbiy kontekst',
    hint: 'Iqtisodiy mavzu qo‘shing — misollar kasbiy bo‘ladi.',
    placeholder: 'about inflation for economics students',
    options: [
      'about inflation for economics students',
      'about company performance and revenue',
      'about banking and credit risk',
      'about marketing and market share',
      'about business negotiations',
    ],
  },
  {
    id: 'format',
    label: 'Format va natija ko‘rinishi',
    hint: 'Nechta, qanday ko‘rinishda, javoblar bilanmi?',
    placeholder: 'as gap-fill items with an answer key and a short explanation for each',
    options: [
      'as gap-fill items with an answer key and a short explanation for each',
      'as a numbered list with one example sentence per item',
      'as a table with the term, the definition and a collocation',
      'as a short dialogue of eight turns',
      'as feedback in the order: why → how to fix → where else it applies',
    ],
  },
]

export function buildTemplatePrompt(values: Record<TemplateField['id'], string>): string {
  return [values.task, values.level, values.topic, values.format]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/* ------------------------------------------------------------------ */
/* 4. Zaxira mashqlar (promptExercises bo'sh bo'lsa)                   */
/* ------------------------------------------------------------------ */

export interface PromptExerciseItem {
  id: string
  level: PromptLevel
  task: string
  badPromptExample: string
  goodPromptExample: string
  rubric: string[]
  hints: string[]
  order: number
}

export const BUILTIN_EXERCISES: PromptExerciseItem[] = [
  {
    id: 'builtin-simple-1',
    level: 'simple',
    task: 'Siz Present Perfect zamonini kompaniya natijalari kontekstida mashq qilmoqchisiz. Qaysi prompt yaxshiroq?',
    badPromptExample: 'Explain Present Perfect.',
    goodPromptExample:
      'Explain Present Perfect at B1 level using three examples about company results (revenue, market share, costs), then give me two sentences to complete.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: ['Qaysi promptda daraja, mavzu va kutilayotgan format bor?'],
    order: 1,
  },
  {
    id: 'builtin-simple-2',
    level: 'simple',
    task: 'Siz yozgan biznes e-mailingizga feedback olmoqchisiz. Qaysi prompt yaxshiroq?',
    badPromptExample: 'Fix my email.',
    goodPromptExample:
      'Here is my business e-mail at B1 level. Do NOT rewrite it. Point out at most five mistakes and for each one explain why it is wrong, how to fix it and where else the same rule applies.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: ['Akademik halollik: AI matnni qayta yozib bermasligi kerak.'],
    order: 2,
  },
  {
    id: 'builtin-simple-3',
    level: 'simple',
    task: 'Siz «inflation» so‘zi atrofidagi lug‘atni o‘rganmoqchisiz. Qaysi prompt yaxshiroq?',
    badPromptExample: 'Words about economy.',
    goodPromptExample:
      'Give me eight B1–B2 collocations with the word "inflation" used in economic reports. For each: the collocation, one example sentence and one combination that English does NOT use.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: ['Yaxshi promptda miqdor va natija ko‘rinishi ko‘rsatiladi.'],
    order: 3,
  },
  {
    id: 'builtin-guided-1',
    level: 'guided',
    task: 'Shablon yordamida prompt tuzing: iqtisodiyot talabalari uchun grammatik mashqlar so‘rang.',
    badPromptExample: 'Give me English exercises',
    goodPromptExample:
      'Create five B1–B2 grammar exercises about inflation for economics students as gap-fill items with an answer key and a short explanation for each.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: [
      'Vazifa + daraja + mavzu + format — to‘rttasi ham bo‘lishi kerak.',
      'Format qismida javoblar kalitini so‘rashni unutmang.',
    ],
    order: 4,
  },
  {
    id: 'builtin-guided-2',
    level: 'guided',
    task: 'Shablon yordamida prompt tuzing: talaffuz mashqi so‘rang (urg‘u va muammoli tovushlar).',
    badPromptExample: 'Help me with pronunciation',
    goodPromptExample:
      'Give me ten B1 economics terms with IPA and stress marks, grouped by stress pattern, and tell me which sounds Uzbek speakers usually get wrong in them.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: ['Talaffuz uchun IPA va urg‘u belgilarini alohida so‘rang.'],
    order: 5,
  },
  {
    id: 'builtin-independent-1',
    level: 'independent',
    task: 'Ertaga xalqaro hamkor bilan chorak natijalari bo‘yicha uchrashuvingiz bor. Tayyorgarlik uchun AI’ga o‘zingiz prompt yozing.',
    badPromptExample: 'Help me with my meeting',
    goodPromptExample:
      'I am a B2 economics student. Tomorrow I have an online meeting with an international partner about our Q1 results (revenue +8%, costs +12%). Give me: (1) ten phrases for presenting figures, (2) five questions they are likely to ask, (3) one practice question for me to answer. Do not write my presentation for me.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: [
      'Vaziyatni va raqamlarni bering — AI kontekstsiz umumiy javob beradi.',
      'Oxirida «Do not write it for me» deb halollik chegarasini belgilang.',
    ],
    order: 6,
  },
  {
    id: 'builtin-independent-2',
    level: 'independent',
    task: 'Yozgan case yechimingizdagi takrorlanuvchi grammatik xatolarni aniqlash uchun prompt yozing.',
    badPromptExample: 'Check my text',
    goodPromptExample:
      'Here is my B1 case solution. Find the grammar mistakes I repeat most often, group them by type (tense, articles, prepositions), and for each group explain why → how to fix → where else it applies. Do not rewrite my text.',
    rubric: ['Aniqlik', 'Kontekst', 'Daraja', 'Format', 'Halollik'],
    hints: [
      'Xatolarni turlar bo‘yicha guruhlashni so‘rang — bu takrorlanuvchi xatolarni ko‘rsatadi.',
    ],
    order: 7,
  },
]

/* ------------------------------------------------------------------ */
/* 5. AI javobini tekshirish mashqlari                                 */
/* ------------------------------------------------------------------ */

export interface VerificationExercise {
  id: string
  title: string
  /** Talaba AI'ga bergan savol */
  question: string
  /** AI javobi — gaplarga ajratilgan; bittasida ataylab xato bor */
  sentences: string[]
  errorIndex: number
  errorKind: 'factual' | 'linguistic'
  explanation: string
  correction: string
}

export const VERIFICATION_EXERCISES: VerificationExercise[] = [
  {
    id: 'verify-collocation',
    title: 'Kollokatsiyadagi xato',
    question: '"Give me collocations with the word profit for a business report."',
    sentences: [
      'The most common verb + noun combinations with "profit" are: make a profit, increase profit and maximise profit.',
      'You can also say "a profit margin" when you talk about the percentage of revenue that becomes profit.',
      'In British business writing you normally say "do a profit" when the company earns money in a given year.',
      'The opposite of making a profit is making a loss, for example: "The company made a loss of $2 million."',
    ],
    errorIndex: 2,
    errorKind: 'linguistic',
    explanation:
      'Ingliz tilida «do a profit» ishlatilmaydi. To‘g‘ri kollokatsiya — «make a profit». Bu xatoni Corpus Verification vidjetida darhol tekshirish mumkin: «make a profit» korpusda yuzlab marta uchraydi, «do a profit» esa umuman uchramaydi.',
    correction: 'make a profit',
  },
  {
    id: 'verify-fact',
    title: 'Faktdagi xato',
    question: '"Explain what inflation means and how it is measured."',
    sentences: [
      'Inflation is a general increase in prices, which means that the purchasing power of money falls.',
      'It is usually measured by the Consumer Price Index (CPI), which tracks the price of a basket of goods and services.',
      'Central banks in most countries aim for an inflation target of around 2% per year.',
      'When inflation rises, central banks normally lower the interest rate to slow the economy down.',
    ],
    errorIndex: 3,
    errorKind: 'factual',
    explanation:
      'Fakt xato: inflyatsiya oshganda markaziy banklar foiz stavkasini PASAYTIRMAYDI, balki OSHIRADI — bu kredit qimmatlashib, talabni va shu orqali narxlarni jilovlaydi. AI javobi grammatik jihatdan benuqson bo‘lsa ham, mazmunan noto‘g‘ri bo‘lishi mumkin.',
    correction: 'central banks normally raise the interest rate',
  },
  {
    id: 'verify-grammar',
    title: 'Grammatik xato',
    question: '"Give me example sentences with the Present Perfect about company results."',
    sentences: [
      'Our revenue has increased by twelve per cent since January.',
      'The company has opened three new branches this year.',
      'We have signed the contract last week, so the project can start.',
      'Costs have risen steadily over the last two quarters.',
    ],
    errorIndex: 2,
    errorKind: 'linguistic',
    explanation:
      '«Last week» — tugagan aniq vaqt ifodasi, u Present Perfect bilan ishlatilmaydi. To‘g‘risi: «We signed the contract last week» (Past Simple). AI ba’zan o‘zi tushuntirgan qoidani misolda buzadi — shuning uchun misollarni ham tekshirish kerak.',
    correction: 'We signed the contract last week',
  },
]
