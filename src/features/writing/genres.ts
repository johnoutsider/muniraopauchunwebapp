import type { WritingSubmissionDoc } from '@/types'

export type WritingGenre = WritingSubmissionDoc['genre']

export interface WritingTask {
  id: string
  genre: WritingGenre
  title: string
  prompt: string
  /** Tavsiya etilgan hajm (so'z) */
  minWords: number
  maxWords: number
  /** Talabaga eslatma: janr talablari */
  checklist: string[]
}

export const GENRE_LABELS: Record<
  WritingGenre,
  { uz: string; en: string; description: string; minWords: number; maxWords: number }
> = {
  email: {
    uz: 'Biznes e-mail',
    en: 'Business e-mail',
    description: 'Aniq maqsad, muloyim uslub, qisqa xatboshilar.',
    minWords: 80,
    maxWords: 150,
  },
  report: {
    uz: 'Hisobot',
    en: 'Report',
    description: 'Bo‘limlar, xolis uslub, ma’lumot → xulosa → tavsiya.',
    minWords: 180,
    maxWords: 300,
  },
  summary: {
    uz: 'Grafik tavsifi',
    en: 'Chart summary',
    description: 'Umumiy tendensiya, asosiy taqqoslashlar, shaxsiy fikrsiz.',
    minWords: 120,
    maxWords: 200,
  },
  memo: {
    uz: 'Ichki memo',
    en: 'Memo',
    description: 'To / From / Date / Subject, to‘g‘ridan-to‘g‘ri uslub, harakat bandlari.',
    minWords: 90,
    maxWords: 160,
  },
  case_solution: {
    uz: 'Case yechimi',
    en: 'Case solution',
    description: 'Muammo → tahlil → yechim → risklar → keyingi qadamlar.',
    minWords: 200,
    maxWords: 350,
  },
  essay: {
    uz: 'Akademik esse',
    en: 'Essay',
    description: 'Tezis, dalillar, bog‘lovchilar, ehtiyotkor xulosa.',
    minWords: 220,
    maxWords: 400,
  },
}

export const GENRE_ORDER: WritingGenre[] = [
  'email',
  'report',
  'summary',
  'memo',
  'case_solution',
  'essay',
]

export const BUILTIN_WRITING_TASKS: WritingTask[] = [
  {
    id: 'email-price-increase',
    genre: 'email',
    title: 'Narx oshishi haqida mijozga xat',
    prompt:
      'You work for a company that supplies office equipment. Because of rising production costs, prices will increase by 7% from 1 March. Write an e-mail to a long-standing client: explain the reason, state exactly what changes and when, and offer one option that softens the impact (for example a discount for early orders).',
    minWords: 90,
    maxWords: 150,
    checklist: [
      'Aniq subject line',
      'Muloyim murojaat va yakun',
      'Sabab → o‘zgarish → sana ketma-ketligi',
      'Bitta aniq taklif yoki yechim',
    ],
  },
  {
    id: 'email-meeting-request',
    genre: 'email',
    title: 'Uchrashuv so‘rovi (xalqaro hamkor)',
    prompt:
      'Write an e-mail to an international partner asking for an online meeting next week to discuss the results of the first quarter. Suggest two possible times, say what you want to cover, and ask them to confirm.',
    minWords: 80,
    maxWords: 130,
    checklist: [
      'Maqsad birinchi xatboshida',
      'Ikkita variant taklif qilingan',
      'Muloyim so‘rov shakllari (Could you…, Would it be possible…)',
      'Tasdiqlash so‘rovi bilan yakun',
    ],
  },
  {
    id: 'report-quarterly',
    genre: 'report',
    title: 'Chorak natijalari hisoboti',
    prompt:
      'Write a short report on your company’s performance in the last quarter. Revenue grew by 8%, operating costs grew by 12%, and market share stayed the same. Describe the findings, explain the most likely reasons, and give two recommendations for the next quarter.',
    minWords: 180,
    maxWords: 300,
    checklist: [
      'Sarlavhalar yoki aniq bo‘limlar',
      'Xolis, shaxssiz uslub',
      'Raqamlar aniq tasvirlangan',
      'Tavsiyalar xulosadan keyin',
    ],
  },
  {
    id: 'summary-inflation-chart',
    genre: 'summary',
    title: 'Grafik tavsifi: inflyatsiya (2019–2024)',
    prompt:
      'The line chart shows the annual inflation rate in three countries between 2019 and 2024. Country A rose from 3% to 14% and then fell to 6%; Country B stayed between 2% and 4%; Country C rose steadily from 5% to 11%. Write a summary: give an overview, then describe the main trends and comparisons. Do not give your opinion and do not invent data.',
    minWords: 120,
    maxWords: 200,
    checklist: [
      'Birinchi jumla — umumiy manzara',
      'O‘zgarish fe’llari va ravishlari (rose sharply, fell gradually)',
      'Taqqoslash tuzilmalari',
      'Shaxsiy fikr yo‘q',
    ],
  },
  {
    id: 'memo-cost-cutting',
    genre: 'memo',
    title: 'Xarajatlarni kamaytirish bo‘yicha memo',
    prompt:
      'Write an internal memo to the finance department. Operating costs rose 12% last quarter. Ask each team to submit a cost-reduction proposal by the end of the month, explain briefly why this is necessary, and list three areas to look at.',
    minWords: 90,
    maxWords: 160,
    checklist: [
      'To / From / Date / Subject sarlavhasi',
      'To‘g‘ridan-to‘g‘ri boshlanish',
      'Aniq muddat',
      'Harakat bandlari ro‘yxati',
    ],
  },
  {
    id: 'case-market-entry',
    genre: 'case_solution',
    title: 'Case: yangi bozorga chiqish',
    prompt:
      'A medium-sized Uzbek food producer wants to enter the Kazakh market. Costs will rise by 20% in the first year, but the market is three times larger. Write a case solution: state the problem, analyse the main risks and opportunities, propose a solution, and give the next three steps.',
    minWords: 200,
    maxWords: 350,
    checklist: [
      'Muammo aniq shakllantirilgan',
      'Tahlil ma’lumotga asoslangan',
      'Yechim va risklar ajratilgan',
      'Keyingi qadamlar ro‘yxati',
    ],
  },
  {
    id: 'essay-digital-currency',
    genre: 'essay',
    title: 'Esse: markaziy bank raqamli valyutasi',
    prompt:
      'Some economists argue that central bank digital currencies (CBDCs) will make monetary policy more effective; others warn about privacy and bank stability. Write an essay discussing both views and give your own position, supported by two arguments.',
    minWords: 220,
    maxWords: 400,
    checklist: [
      'Kirish qismida tezis',
      'Har xatboshi — bitta g‘oya',
      'Bog‘lovchi vositalar (however, therefore, in contrast)',
      'Ehtiyotkor xulosa (hedging)',
    ],
  },
]

export function tasksForGenre(genre: WritingGenre): WritingTask[] {
  return BUILTIN_WRITING_TASKS.filter((task) => task.genre === genre)
}

export function findWritingTask(taskId: string | undefined): WritingTask | null {
  if (!taskId) return null
  return BUILTIN_WRITING_TASKS.find((task) => task.id === taskId) ?? null
}
