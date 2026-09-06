import type { SpeakingTask, SpeakingTaskType } from './types'

/**
 * Platformaning o'z mashq to'plami (PLAN 8.3): so'z → gap → kasbiy dialog →
 * prezentatsiya. Lexicon va case study kontenti yetib kelmagan holatda ham
 * Speaking Lab hech qachon bo'sh qolmaydi — bu nazorat guruhi uchun ham
 * o'lchov vositasi (Azure ballari) sifatida muhim.
 */

export const TASK_TYPE_LABELS: Record<
  SpeakingTaskType,
  { uz: string; hint: string; icon: 'word' | 'sentence' | 'dialogue' | 'presentation' }
> = {
  word: {
    uz: 'Alohida so‘z',
    hint: 'Terminni transkripsiya va urg‘uga qarab talaffuz qiling.',
    icon: 'word',
  },
  sentence: {
    uz: 'Gap',
    hint: 'Butun gapni ravon o‘qing — urg‘u va ohangga e’tibor bering.',
    icon: 'sentence',
  },
  dialogue: {
    uz: 'Kasbiy dialog',
    hint: 'O‘z rolingizdagi replikalarni tabiiy ohang bilan o‘qing.',
    icon: 'dialogue',
  },
  presentation: {
    uz: 'Prezentatsiya',
    hint: '60–120 soniya erkin gapiring: matn yod olinmaydi, fikr muhim.',
    icon: 'presentation',
  },
}

export const BUILTIN_TASKS: SpeakingTask[] = [
  /* --- So'zlar (zaxira: lexicon bo'sh bo'lsa) --------------------- */
  {
    id: 'word-inflation',
    type: 'word',
    title: 'inflation',
    referenceText: 'inflation',
    ipa: '/ɪnˈfleɪʃn/',
    instruction: 'Ikkinchi bo‘g‘inga urg‘u bering: in-FLA-tion.',
    source: 'builtin',
    cefr: 'B1',
  },
  {
    id: 'word-revenue',
    type: 'word',
    title: 'revenue',
    referenceText: 'revenue',
    ipa: '/ˈrevənjuː/',
    instruction: 'Urg‘u birinchi bo‘g‘inda: RE-ve-nue.',
    source: 'builtin',
    cefr: 'B1',
  },
  {
    id: 'word-unemployment',
    type: 'word',
    title: 'unemployment',
    referenceText: 'unemployment',
    ipa: '/ˌʌnɪmˈplɔɪmənt/',
    instruction: 'Asosiy urg‘u — «ploy» bo‘g‘inida.',
    source: 'builtin',
    cefr: 'B1',
  },
  {
    id: 'word-purchasing-power',
    type: 'word',
    title: 'purchasing power',
    referenceText: 'purchasing power',
    ipa: '/ˈpɜːtʃəsɪŋ ˌpaʊə/',
    instruction: '«ch» tovushi /tʃ/ — «purchasing» so‘zida aniq eshitilsin.',
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'word-fluctuate',
    type: 'word',
    title: 'fluctuate',
    referenceText: 'fluctuate',
    ipa: '/ˈflʌktʃueɪt/',
    instruction: '«flu» — /flʌ/, «ch» tovushi bilan davom eting.',
    source: 'builtin',
    cefr: 'B2',
  },

  /* --- Gaplar ----------------------------------------------------- */
  {
    id: 'sentence-inflation-rate',
    type: 'sentence',
    title: 'Inflyatsiya darajasi haqida gap',
    referenceText: 'The inflation rate rose sharply to nine per cent in the third quarter.',
    instruction:
      'Mazmun so‘zlariga urg‘u bering: INflation, ROSE, SHARPly, NINE per CENT. Oxirida ohangni pasaytiring.',
    source: 'builtin',
    cefr: 'B1',
  },
  {
    id: 'sentence-market-share',
    type: 'sentence',
    title: 'Bozor ulushi haqida gap',
    referenceText:
      'Our market share has increased by twelve per cent since the new pricing strategy was introduced.',
    instruction: 'Present Perfect gapini uzmasdan o‘qing; «has increased» qismini bog‘lab ayting.',
    source: 'builtin',
    cefr: 'B1',
  },
  {
    id: 'sentence-costs',
    type: 'sentence',
    title: 'Xarajatlar haqida gap',
    referenceText:
      'If production costs continue to grow, we will have to review our pricing policy next year.',
    instruction: 'Shart ergash gapidan keyin qisqa pauza qiling: «…continue to grow, ↗ we will…».',
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'sentence-th-sound',
    type: 'sentence',
    title: '/θ/ va /ð/ tovushlari mashqi',
    referenceText:
      'The growth of the three northern banks strengthened the whole financial system this year.',
    instruction:
      'Tilingiz uchini tishlar orasiga qo‘ying: three, northern, the, this — /θ/ va /ð/ aniq bo‘lsin.',
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'sentence-v-w-sound',
    type: 'sentence',
    title: '/v/ va /w/ tovushlari mashqi',
    referenceText:
      'We reviewed the value of every investment and we will invest in western markets.',
    instruction: '«w» — lablar dumaloq, tishlar tegmaydi; «v» — pastki lab yuqori tishga tegadi.',
    source: 'builtin',
    cefr: 'B1',
  },

  /* --- Kasbiy dialog ---------------------------------------------- */
  {
    id: 'dialogue-client-meeting',
    type: 'dialogue',
    title: 'Mijoz bilan uchrashuv (sizning replikangiz)',
    referenceText:
      'Thank you for coming. Let me start with the key figures. Our revenue grew by eight per cent last quarter, and we expect a similar result this year. What are your main concerns about the new contract?',
    instruction:
      'Menejer rolida o‘qing: dastlabki jumlada iliq ohang, raqamlarda aniq urg‘u, savolda ko‘tarilgan ohang.',
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'dialogue-negotiation',
    type: 'dialogue',
    title: 'Muzokara: narxni kelishish',
    referenceText:
      'I understand your position, but a fifteen per cent discount is not possible for us. Could we agree on ten per cent if you extend the contract to two years?',
    instruction:
      'Muloyim, ammo qat’iy ohang. «Could we agree…» qismini ko‘tarilgan ohang bilan tugating.',
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'dialogue-interview',
    type: 'dialogue',
    title: 'Ish suhbati: o‘zingiz haqingizda',
    referenceText:
      'I am a final-year economics student. I have worked with financial reports and market analysis, and I am particularly interested in banking and risk management.',
    instruction: 'Ravon va ishonchli ohang; «I have worked» qismidagi bog‘lanishga e’tibor bering.',
    source: 'builtin',
    cefr: 'B1',
  },

  /* --- Prezentatsiya (erkin nutq) --------------------------------- */
  {
    id: 'presentation-chart',
    type: 'presentation',
    title: 'Grafikni izohlang: inflyatsiya dinamikasi',
    referenceText: '',
    instruction:
      'So‘nggi besh yildagi inflyatsiya grafigini tasavvur qiling va 60–120 soniya davomida izohlang: umumiy tendensiya, eng yuqori nuqta, sabablari va xulosa.',
    minSeconds: 60,
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'presentation-company',
    type: 'presentation',
    title: 'Kompaniya natijalarini taqdim eting',
    referenceText: '',
    instruction:
      'O‘zingiz tanlagan kompaniyaning yillik natijalarini taqdim eting: daromad, xarajatlar, foyda va keyingi yil rejasi. 60–120 soniya.',
    minSeconds: 60,
    source: 'builtin',
    cefr: 'B2',
  },
  {
    id: 'presentation-opinion',
    type: 'presentation',
    title: 'Fikringizni asoslang: raqamli valyuta',
    referenceText: '',
    instruction:
      'Markaziy banklarning raqamli valyutasi (CBDC) iqtisodiyot uchun foydalimi? Fikringizni ikkita dalil bilan asoslang. 60–120 soniya.',
    minSeconds: 60,
    source: 'builtin',
    cefr: 'B2',
  },
]

export function findTask(tasks: SpeakingTask[], taskId: string | undefined): SpeakingTask | null {
  if (!taskId) return null
  return tasks.find((task) => task.id === taskId) ?? null
}
