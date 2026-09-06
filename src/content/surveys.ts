/**
 * LinguaEcon AI — so'rovnomalar (seed).
 *
 * MUHIM OGOHLANTIRISH (ilmiy metodologiya):
 * Bu yerdagi uchta so'rovnoma — MOSLASHTIRILGAN QORALAMA (adapted draft) instrumentlar.
 * Ular hali validatsiyadan o'tgan emas va shu holicha asosiy eksperiment ma'lumotlarini
 * yig'ish uchun ishlatilmasligi kerak. Asosiy tajribadan oldin quyidagilar shart:
 *   1) Mazmuniy validlik ekspertizasi (content validity) — kamida 3 nafar metodist va
 *      1 nafar iqtisodiyot yo'nalishi mutaxassisi tomonidan bandlarni ko'rib chiqish;
 *   2) Pilot sinov — kamida 30-50 nafar talabadan iborat namunada (asosiy tanlanmadan
 *      tashqarida) sinab ko'rish;
 *   3) Ichki izchillik — har bir shkala uchun Cronbach alfa >= .70 bo'lishi;
 *      alfa past chiqsa, muammoli bandlar qayta yozilishi yoki olib tashlanishi kerak;
 *   4) O'zbekcha tarjima uchun back-translation (teskari tarjima) tekshiruvi.
 *
 * BALLASH QOIDASI:
 *   - Likert-5 bandlari 1..5 oralig'ida ballanadi.
 *   - `reverse: true` bandlari YIG'INDIDAN OLDIN qayta kodlanadi: yangi_ball = 6 - x.
 *     (Likert-7 uchun: 8 - x.) Qayta kodlashsiz yig'indi noto'g'ri bo'ladi.
 *   - `mcq` bilim savollari 0/1 ball (to'g'ri javob = 1) va Likert yig'indisiga
 *     QO'SHILMAYDI — ular alohida bilim ko'rsatkichi sifatida hisoblanadi.
 *   - `open` savollar sifat tahlili (thematic coding) uchun, ballanmaydi.
 *
 * MANBALAR (bandlar shu tan olingan shkalalar ta'sirida yozilgan, ulardan
 * to'g'ridan-to'g'ri ko'chirilmagan):
 *   - AMTB (Attitude/Motivation Test Battery, Gardner) — integrativ va instrumental motivatsiya;
 *   - MSLQ (Pintrich va boshq.) — self-efficacy va effort regulation qism shkalalari;
 *   - IMI (Intrinsic Motivation Inventory) — ichki qiziqish/zavq o'lchovi;
 *   - FLCAS (Horwitz) — chet tili tashvishi (anxiety) bandlari uchun;
 *   - Meta-AI-Literacy Scale (Carolus va boshq.) va AI Literacy Scale (Wang va boshq.) —
 *     AI savodxonligi bandlari uchun;
 *   - Technology Acceptance Model (Davis) va CSUQ/UMUX qoniqish an'anasi —
 *     qoniqish so'rovnomasi uchun.
 *
 * Bu fayl instrumentlarning VALIDATSIYA QILINGANLIGINI da'vo qilmaydi.
 */

import type { SurveyDoc } from '@/types'

/** Seed so'rovnoma — `createdAt` seed skriptida qo'shiladi. */
export type SeedSurvey = Omit<SurveyDoc, 'createdAt'> & { id: string }

/** Barcha Likert-5 bandlari uchun yagona shkala matni. */
const LIKERT5_SCALE =
  '1 = Strongly disagree, 2 = Disagree, 3 = Neither agree nor disagree, 4 = Agree, 5 = Strongly agree'

export const SEED_SURVEYS: SeedSurvey[] = [
  /* ================================================================ */
  /* 1. MOTIVATSIYA — 12 band, 4 tasi teskari ballanadi                */
  /* ================================================================ */
  {
    id: 'sv-motivation',
    title: 'Motivation for Learning Professional English',
    titleUz: 'Kasbiy ingliz tilini o‘rganishga motivatsiya',
    description:
      'Adapted draft instrument measuring five facets of motivation for learning professional English: intrinsic interest (items 1-2), instrumental and professional motivation (3-4), self-efficacy (5-6), effort and persistence (7-8, item 8 negatively worded) and language anxiety together with amotivation (9-11, negatively worded). 12 Likert-5 items; four items (m8, m9, m10, m11) are reverse-scored and must be recoded as 6 - x before any total is calculated. A higher total score indicates stronger and more self-determined motivation. Pilot and validate (content review, Cronbach alpha >= .70) before use in the main experiment.',
    type: 'motivation',
    active: true,
    questions: [
      {
        id: 'm1',
        type: 'likert5',
        text: 'I enjoy learning English even when it is not required for a grade.',
        textUz: 'Baho uchun talab qilinmasa ham, ingliz tilini o‘rganish menga yoqadi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm2',
        type: 'likert5',
        text: 'I find it genuinely interesting to read about economics and business in English.',
        textUz: 'Iqtisodiyot va biznes haqidagi matnlarni ingliz tilida o‘qish menga chinakam qiziq.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm3',
        type: 'likert5',
        text: 'Good English will help me to get a better job in finance, banking or management.',
        textUz:
          'Ingliz tilini yaxshi bilish moliya, bank yoki menejment sohasida yaxshiroq ish topishimga yordam beradi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm4',
        type: 'likert5',
        text: 'I need professional English in order to read the reports and research in my field.',
        textUz: 'O‘z sohamdagi hisobot va ilmiy ishlarni o‘qish uchun menga kasbiy ingliz tili zarur.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm5',
        type: 'likert5',
        text: 'I am confident that I can understand an English business text with the help of a dictionary.',
        textUz: 'Lug‘at yordamida inglizcha biznes matnini tushuna olishimga ishonaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm6',
        type: 'likert5',
        text: 'Even when a task in English is difficult, I am sure I can complete it if I make enough effort.',
        textUz:
          'Ingliz tilidagi topshiriq qiyin bo‘lsa ham, yetarlicha harakat qilsam, uni uddalay olishimga aminman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm7',
        type: 'likert5',
        text: 'I keep working on an English task even when I do not see progress straight away.',
        textUz: 'Natija darrov ko‘rinmasa ham, ingliz tilidagi topshiriq ustida ishlashda davom etaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm8',
        type: 'likert5',
        text: 'I usually leave my English homework until the last moment.',
        textUz: 'Ingliz tilidan uyga vazifani odatda eng oxirgi daqiqaga qoldiraman.',
        reverse: true,
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm9',
        type: 'likert5',
        text: 'I feel nervous when I have to speak English in front of my group.',
        textUz: 'Guruhim oldida ingliz tilida gapirishim kerak bo‘lganda hayajonlanaman.',
        reverse: true,
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm10',
        type: 'likert5',
        text: 'I am afraid of making mistakes when I write in English.',
        textUz: 'Ingliz tilida yozganimda xato qilishdan qo‘rqaman.',
        reverse: true,
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm11',
        type: 'likert5',
        text: 'I only study English because it is a compulsory subject.',
        textUz: 'Ingliz tilini faqat majburiy fan bo‘lgani uchun o‘rganaman.',
        reverse: true,
        scale: LIKERT5_SCALE,
      },
      {
        id: 'm12',
        type: 'likert5',
        text: 'I intend to go on improving my English after this course has finished.',
        textUz: 'Ushbu kurs tugagach ham ingliz tilimni oshirishda davom etish niyatidaman.',
        scale: LIKERT5_SCALE,
      },
    ],
  },

  /* ================================================================ */
  /* 2. AI SAVODXONLIGI — 8 Likert + 2 bilim savoli                    */
  /* ================================================================ */
  {
    id: 'sv-ai-literacy',
    title: 'AI Literacy in Language Learning',
    titleUz: 'Til o‘rganishda sun’iy intellekt savodxonligi',
    description:
      'Adapted draft instrument measuring self-reported AI literacy in the context of language learning: prompt writing, critical evaluation of AI output, awareness of hallucinations and of the limits of AI, and academic-honesty awareness. 10 items in total: 8 Likert-5 items (a1-a8), of which a7 is negatively worded and must be recoded as 6 - x before the scale total is calculated, and 2 multiple-choice knowledge items (a9-a10) scored 0 or 1 and reported separately from the Likert total. A higher Likert total indicates greater self-assessed AI literacy. Pilot and validate (content review, Cronbach alpha >= .70) before use in the main experiment.',
    type: 'ai_literacy',
    active: true,
    questions: [
      {
        id: 'a1',
        type: 'likert5',
        text: 'I can write a clear, detailed prompt that tells an AI tool exactly what I need.',
        textUz: 'Sun’iy intellekt vositasiga aynan nima kerakligini aniq va batafsil so‘rov (prompt) yoza olaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a2',
        type: 'likert5',
        text: 'I can judge whether an answer produced by an AI tool is accurate enough to use in my coursework.',
        textUz:
          'Sun’iy intellekt bergan javob o‘quv ishimda foydalanish uchun yetarlicha ishonchli yoki yo‘qligini baholay olaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a3',
        type: 'likert5',
        text: 'I can recognise when an AI tool has invented a fact, a figure or a source.',
        textUz: 'Sun’iy intellekt qachon faktni, raqamni yoki manbani o‘zi to‘qib chiqarganini payqay olaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a4',
        type: 'likert5',
        text: 'I understand what today’s AI language tools cannot do reliably.',
        textUz: 'Bugungi sun’iy intellekt vositalari nimani ishonchli bajara olmasligini tushunaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a5',
        type: 'likert5',
        text: 'I know which ways of using an AI tutor are academically honest and which count as cheating.',
        textUz:
          'AI o‘qituvchidan foydalanishning qaysi usullari halol, qaysilari esa akademik firibgarlik hisoblanishini bilaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a6',
        type: 'likert5',
        text: 'I can improve a weak prompt by adding context, a role and an example.',
        textUz: 'Kontekst, rol va namuna qo‘shish orqali zaif promptni yaxshilay olaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a7',
        type: 'likert5',
        text: 'If an AI tool answers confidently, I usually accept the answer without checking it.',
        textUz: 'Sun’iy intellekt javobni ishonch bilan bersa, odatda uni tekshirmasdan qabul qilaman.',
        reverse: true,
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a8',
        type: 'likert5',
        text: 'I could explain to a classmate how to use an AI tutor responsibly for language practice.',
        textUz:
          'Kursdoshimga AI o‘qituvchidan til mashqi uchun mas’uliyat bilan qanday foydalanishni tushuntira olaman.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 'a9',
        type: 'mcq',
        text: 'When people work with AI language tools, a "hallucination" means:',
        textUz: 'Sun’iy intellekt bilan ishlaganda "gallyutsinatsiya" (hallucination) nimani anglatadi?',
        options: [
          'An answer that sounds convincing but contains invented facts, figures or sources.',
          'An answer that is written in a language the user did not ask for.',
          'A delay in the response caused by a slow internet connection.',
          'A refusal by the system to answer a sensitive question.',
        ],
      },
      {
        id: 'a10',
        type: 'mcq',
        text: 'Which of these ways of using an AI tutor is academically honest?',
        textUz: 'AI o‘qituvchidan foydalanishning quyidagi usullaridan qaysi biri akademik jihatdan halol?',
        options: [
          'Asking the tutor to explain why your sentence is wrong, and then rewriting the sentence yourself.',
          'Asking the tutor to write your case-study report and submitting it as your own work.',
          'Asking the tutor for answers while a graded test is still in progress.',
          'Copying a classmate’s AI-generated answer to the writing task and changing a few words.',
        ],
      },
    ],
  },

  /* ================================================================ */
  /* 3. QONIQISH — 8 Likert + 2 ochiq savol                            */
  /* ================================================================ */
  {
    id: 'sv-satisfaction',
    title: 'Course and Platform Satisfaction',
    titleUz: 'Kurs va platformadan qoniqish',
    description:
      'Adapted draft end-of-course instrument measuring satisfaction with the AI tutor and perceived gains: usefulness of the tutor, quality of feedback, clarity of explanations, perceived improvement in vocabulary, grammar, pronunciation and speaking confidence, and willingness to recommend. 10 questions: 8 Likert-5 items (s1-s8, none reverse-scored, so a higher total means greater satisfaction) and 2 open questions (s9-s10) analysed qualitatively by thematic coding rather than scored. Pilot and validate (content review, Cronbach alpha >= .70) before use in the main experiment.',
    type: 'satisfaction',
    active: true,
    questions: [
      {
        id: 's1',
        type: 'likert5',
        text: 'The AI tutor was useful for my learning of professional English.',
        textUz: 'AI o‘qituvchi kasbiy ingliz tilini o‘rganishimda foydali bo‘ldi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's2',
        type: 'likert5',
        text: 'The feedback I received on my writing was clear and helpful.',
        textUz: 'Yozma ishlarimga berilgan izohlar tushunarli va foydali edi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's3',
        type: 'likert5',
        text: 'The explanations of grammar and vocabulary were easy to understand.',
        textUz: 'Grammatika va lug‘at bo‘yicha tushuntirishlarni tushunish oson edi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's4',
        type: 'likert5',
        text: 'My professional vocabulary has improved during this course.',
        textUz: 'Ushbu kurs davomida kasbiy lug‘at boyligim oshdi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's5',
        type: 'likert5',
        text: 'My grammatical accuracy in written English has improved during this course.',
        textUz: 'Ushbu kurs davomida ingliz tilida yozishdagi grammatik aniqligim yaxshilandi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's6',
        type: 'likert5',
        text: 'My pronunciation has improved thanks to the speaking practice and the feedback on it.',
        textUz: 'Gapirish mashqlari va ularga berilgan izohlar tufayli talaffuzim yaxshilandi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's7',
        type: 'likert5',
        text: 'I feel more confident speaking English about economic and business topics than I did before the course.',
        textUz:
          'Kursdan oldingiga qaraganda iqtisodiy va biznes mavzularida ingliz tilida gapirishga ishonchim ortdi.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's8',
        type: 'likert5',
        text: 'I would recommend this platform to other students in my faculty.',
        textUz: 'Bu platformani fakultetimdagi boshqa talabalarga tavsiya qilgan bo‘lardim.',
        scale: LIKERT5_SCALE,
      },
      {
        id: 's9',
        type: 'open',
        text: 'What helped you most, and why?',
        textUz: 'Sizga eng ko‘p nima yordam berdi va nima uchun?',
      },
      {
        id: 's10',
        type: 'open',
        text: 'What should be improved before the platform is used with other groups?',
        textUz: 'Platforma boshqa guruhlarda qo‘llanishidan oldin nimani yaxshilash kerak?',
      },
    ],
  },
]
