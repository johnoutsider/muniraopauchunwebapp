/**
 * LinguaEcon AI — kasbiy ingliz tili lug'at bazasi (seed).
 * Iqtisodiyot yo'nalishi talabalari uchun 8 ta kasbiy soha bo'yicha yozuvlar.
 * Imlo: Britaniya inglizchasi (analyse, behaviour, per cent, organisation).
 */

import type { LexiconDoc } from '@/types'

/** Seed lug'at yozuvi — `createdAt` seed skriptida qo'shiladi. */
export type SeedLexiconEntry = Omit<LexiconDoc, 'createdAt'> & { id: string }

export const SEED_LEXICON: SeedLexiconEntry[] = [
  /* ================================================================ */
  /* 1. GENERAL — grafik va tendensiya tili                            */
  /* ================================================================ */
  {
    id: 'lx-increase',
    word: 'increase',
    lemma: 'increase',
    pos: 'verb',
    ipa: '/ɪnˈkriːs/',
    definitions: [
      {
        text: 'To become larger in amount, number or level, or to make something larger.',
        textUz: "oshmoq, ko'paymoq — miqdor yoki darajaning kattalashuvi",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics'],
    cefr: 'B1',
    collocations: [
      { text: 'increase sharply', corpusCount: 1240, verified: true },
      { text: 'increase steadily', corpusCount: 860, verified: true },
      { text: 'a significant increase', corpusCount: 1510, verified: true },
      { text: 'increase by 5 per cent' },
    ],
    synonyms: ['rise', 'grow', 'go up'],
    antonyms: ['decrease', 'fall', 'decline'],
    wordFamily: ['increase', 'increased', 'increasing', 'increasingly'],
    examples: [
      {
        sentence: 'Household energy costs increased by 7.2 per cent over the twelve months to June.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Uy xo'jaliklarining energiya xarajatlari iyungacha bo'lgan o'n ikki oyda 7,2 foizga oshdi.",
      },
      {
        sentence: 'The group increased its share of the domestic market for a third consecutive year.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An economics graduate uses this verb when presenting a chart and describing how a figure has changed over a reporting period.',
    communicativeTask:
      'Write one sentence describing a figure that has increased in your country over the last year, and say by how much.',
    semanticLinks: [
      { word: 'decrease', relation: 'opposite' },
      { word: 'trend', relation: 'related' },
      { word: 'prices', relation: 'collocate' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-decrease',
    word: 'decrease',
    lemma: 'decrease',
    pos: 'verb',
    ipa: '/dɪˈkriːs/',
    definitions: [
      {
        text: 'To become smaller in amount, number or level, or to make something smaller.',
        textUz: "kamaymoq, pasaymoq — miqdor yoki darajaning kichrayishi",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics'],
    cefr: 'B1',
    collocations: [
      { text: 'decrease significantly', corpusCount: 940, verified: true },
      { text: 'a slight decrease', corpusCount: 720, verified: true },
      { text: 'decrease in demand' },
      { text: 'decrease year on year' },
    ],
    synonyms: ['fall', 'decline', 'drop'],
    antonyms: ['increase', 'rise', 'grow'],
    wordFamily: ['decrease', 'decreased', 'decreasing', 'decreasingly'],
    examples: [
      {
        sentence: 'Exports of manufactured goods decreased slightly in the final quarter of the year.',
        source: 'business press (style)',
        translationUz: "Yilning so'nggi choragida sanoat mahsulotlari eksporti biroz kamaydi.",
      },
      {
        sentence: 'Operating costs decreased by 4 per cent following the closure of two regional offices.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A market analyst uses this verb in a written commentary explaining why sales figures have gone down.',
    communicativeTask:
      'Write one sentence about something that has decreased in your local economy, and give a possible reason.',
    semanticLinks: [
      { word: 'increase', relation: 'opposite' },
      { word: 'decline', relation: 'related' },
      { word: 'demand', relation: 'collocate' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-trend',
    word: 'trend',
    lemma: 'trend',
    pos: 'noun',
    ipa: '/trend/',
    definitions: [
      {
        text: 'The general direction in which something is changing or developing over a period of time.',
        textUz: "tendensiya — biror ko'rsatkichning vaqt davomidagi umumiy yo'nalishi",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics', 'marketing'],
    cefr: 'B1',
    collocations: [
      { text: 'an upward trend', corpusCount: 1320, verified: true },
      { text: 'a downward trend', corpusCount: 1180, verified: true },
      { text: 'reverse a trend', corpusCount: 310, verified: true },
      { text: 'the underlying trend' },
      { text: 'follow a trend' },
    ],
    synonyms: ['tendency', 'pattern', 'direction'],
    antonyms: [],
    wordFamily: ['trend', 'trending', 'trendy'],
    examples: [
      {
        sentence: 'The underlying trend in core inflation remains broadly unchanged.',
        source: 'central bank statement (style)',
        translationUz: "Bazaviy inflyatsiyadagi asosiy tendensiya umuman o'zgarmagan.",
      },
      {
        sentence: 'Online sales continued their upward trend, rising for the eighth consecutive quarter.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A junior economist uses this noun when summarising a time-series chart for a management meeting.',
    communicativeTask:
      'Describe in one sentence the trend in unemployment or prices in your region over the last three years.',
    semanticLinks: [
      { word: 'forecast', relation: 'related' },
      { word: 'fluctuate', relation: 'related' },
      { word: 'economic growth', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-forecast',
    word: 'forecast',
    lemma: 'forecast',
    pos: 'noun',
    ipa: '/ˈfɔːkɑːst/',
    definitions: [
      {
        text: 'A statement about what is expected to happen in the future, based on data and analysis.',
        textUz: "prognoz — ma'lumotlar tahliliga asoslangan kelajak bashorati",
        domain: 'general',
      },
      {
        text: 'To say what you expect to happen in the future on the basis of current information.',
        textUz: "prognoz qilmoq, bashorat qilmoq",
        domain: 'economics',
      },
    ],
    domains: ['general', 'economics', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'revise a forecast', corpusCount: 480, verified: true },
      { text: 'a growth forecast', corpusCount: 910, verified: true },
      { text: 'in line with forecasts', corpusCount: 640, verified: true },
      { text: 'a gloomy forecast' },
    ],
    synonyms: ['projection', 'prediction', 'outlook'],
    antonyms: [],
    wordFamily: ['forecast', 'forecaster', 'forecasting'],
    examples: [
      {
        sentence: 'The Fund has revised its growth forecast for the region down to 3.1 per cent.',
        source: 'IMF World Economic Outlook (style)',
        translationUz: "Fond mintaqa uchun o'sish prognozini 3,1 foizga pasaytirdi.",
      },
      {
        sentence: 'Full-year results were broadly in line with the forecasts issued in January.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A financial planner uses this word when presenting the expected revenue figures to the board.',
    communicativeTask:
      'Write one sentence forecasting what will happen to prices in your country next year, and justify it briefly.',
    semanticLinks: [
      { word: 'estimate', relation: 'related' },
      { word: 'trend', relation: 'related' },
      { word: 'economic growth', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-estimate',
    word: 'estimate',
    lemma: 'estimate',
    pos: 'verb',
    ipa: '/ˈestɪmeɪt/',
    definitions: [
      {
        text: 'To calculate an approximate value or quantity when the exact figure is not known.',
        textUz: "taxminiy hisoblamoq — aniq raqam noma'lum bo'lganda taxminiy qiymatni chiqarmoq",
        domain: 'general',
      },
    ],
    domains: ['general', 'academic', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'a conservative estimate', corpusCount: 520, verified: true },
      { text: 'estimate the cost', corpusCount: 780, verified: true },
      { text: 'a rough estimate', corpusCount: 690, verified: true },
      { text: 'estimates suggest that' },
    ],
    synonyms: ['calculate', 'approximate', 'gauge'],
    antonyms: [],
    wordFamily: ['estimate', 'estimation', 'estimated', 'overestimate', 'underestimate'],
    examples: [
      {
        sentence: 'The authors estimate that the reform will raise household income by around 2 per cent.',
        source: 'World Bank working paper (style)',
        translationUz:
          "Mualliflar islohot uy xo'jaliklari daromadini taxminan 2 foizga oshirishini taxmin qilmoqda.",
      },
      {
        sentence: 'Management estimates the total cost of the restructuring at 40 million euros.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A project economist uses this verb when preparing a budget for a proposal where exact costs are still unknown.',
    communicativeTask:
      'Estimate in one sentence how much a typical student in your city spends on transport each month.',
    semanticLinks: [
      { word: 'forecast', relation: 'related' },
      { word: 'approximately', relation: 'collocate' },
      { word: 'data', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-approximately',
    word: 'approximately',
    lemma: 'approximately',
    pos: 'adverb',
    ipa: '/əˈprɒksɪmətli/',
    definitions: [
      {
        text: 'Used before a number to show that it is close to the real figure but not exact.',
        textUz: "taxminan — aniq bo'lmagan, taqribiy raqamni bildiradi",
        domain: 'general',
      },
    ],
    domains: ['general', 'academic'],
    cefr: 'B1',
    collocations: [
      { text: 'approximately half', corpusCount: 830, verified: true },
      { text: 'approximately 20 per cent', corpusCount: 610, verified: true },
      { text: 'approximately equal to' },
      { text: 'approximately one third' },
    ],
    synonyms: ['about', 'roughly', 'around'],
    antonyms: ['exactly', 'precisely'],
    wordFamily: ['approximate', 'approximately', 'approximation'],
    examples: [
      {
        sentence: 'Approximately 60 per cent of respondents reported a fall in real household income.',
        source: 'World Bank survey report (style)',
        translationUz:
          "So'rovda qatnashganlarning taxminan 60 foizi real oilaviy daromad kamayganini bildirdi.",
      },
      {
        sentence: 'The group employs approximately 4,500 staff across eleven countries.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An analyst uses this adverb in a written report to signal that a figure is an approximation rather than an audited number.',
    communicativeTask:
      'Write one sentence using "approximately" to describe the size of the population of your home city.',
    semanticLinks: [
      { word: 'estimate', relation: 'related' },
      { word: 'data', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-fluctuate',
    word: 'fluctuate',
    lemma: 'fluctuate',
    pos: 'verb',
    ipa: '/ˈflʌktʃueɪt/',
    definitions: [
      {
        text: 'To rise and fall repeatedly and irregularly rather than staying at one level.',
        textUz: "tebranmoq — qiymatning bir tekis emas, balki goh oshib, goh kamayib turishi",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'fluctuate widely', corpusCount: 340, verified: true },
      { text: 'prices fluctuate', corpusCount: 420, verified: true },
      { text: 'fluctuate between' },
      { text: 'fluctuate sharply' },
    ],
    synonyms: ['vary', 'oscillate', 'swing'],
    antonyms: ['stabilise', 'remain stable'],
    wordFamily: ['fluctuate', 'fluctuation', 'fluctuating'],
    examples: [
      {
        sentence: 'Commodity prices fluctuated widely during the first half of the year.',
        source: 'IMF World Economic Outlook (style)',
        translationUz: "Yilning birinchi yarmida xomashyo narxlari keng doirada tebrandi.",
      },
      {
        sentence: 'The exchange rate fluctuated between 11,900 and 12,400 over the reporting period.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A treasury officer uses this verb when explaining to management why the value of foreign currency holdings changes from day to day.',
    communicativeTask:
      'Write one sentence describing a price that fluctuates a lot in your country and explain why.',
    semanticLinks: [
      { word: 'stable', relation: 'opposite' },
      { word: 'exchange rate', relation: 'related' },
      { word: 'prices', relation: 'collocate' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-peak',
    word: 'peak',
    lemma: 'peak',
    pos: 'noun',
    ipa: '/piːk/',
    definitions: [
      {
        text: 'The highest point or level that something reaches before it starts to fall.',
        textUz: "cho'qqi, eng yuqori nuqta — pasayishdan oldingi eng katta qiymat",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'reach a peak', corpusCount: 760, verified: true },
      { text: 'at its peak', corpusCount: 890, verified: true },
      { text: 'peak demand', corpusCount: 410, verified: true },
      { text: 'a record peak' },
    ],
    synonyms: ['high point', 'maximum', 'summit'],
    antonyms: ['trough', 'low point'],
    wordFamily: ['peak', 'peaked', 'peaking'],
    examples: [
      {
        sentence: 'Headline inflation reached a peak of 11.4 per cent in October before easing.',
        source: 'central bank statement (style)',
        translationUz:
          "Umumiy inflyatsiya oktyabrda 11,4 foiz bilan eng yuqori cho'qqiga chiqib, keyin sekinlashdi.",
      },
      {
        sentence: 'Energy consumption is managed carefully during periods of peak demand.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An energy analyst uses this noun when describing the moment in a chart at which consumption or prices were highest.',
    communicativeTask:
      'Write one sentence saying when prices in your country reached their peak and what happened afterwards.',
    semanticLinks: [
      { word: 'decline', relation: 'opposite' },
      { word: 'trend', relation: 'part_of' },
      { word: 'inflation', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-decline',
    word: 'decline',
    lemma: 'decline',
    pos: 'noun',
    ipa: '/dɪˈklaɪn/',
    definitions: [
      {
        text: 'A steady fall in the amount, quality or importance of something.',
        textUz: "pasayish — miqdor, sifat yoki ahamiyatning barqaror kamayishi",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'a sharp decline', corpusCount: 1050, verified: true },
      { text: 'a gradual decline', corpusCount: 580, verified: true },
      { text: 'reverse the decline', corpusCount: 210, verified: true },
      { text: 'a decline in output' },
    ],
    synonyms: ['fall', 'drop', 'downturn'],
    antonyms: ['rise', 'growth', 'recovery'],
    wordFamily: ['decline', 'declining', 'declined'],
    examples: [
      {
        sentence: 'The report notes a sharp decline in industrial output across the eurozone.',
        source: 'business press (style)',
        translationUz: "Hisobotda evrozona bo'ylab sanoat ishlab chiqarishining keskin pasayishi qayd etilgan.",
      },
      {
        sentence: 'Revenue in the print division continued its gradual decline, falling 6 per cent.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A consultant uses this noun in a diagnostic report describing a market segment that is losing value year after year.',
    communicativeTask:
      'Write one sentence about an industry in decline in your country and suggest one reason for it.',
    semanticLinks: [
      { word: 'peak', relation: 'opposite' },
      { word: 'recession', relation: 'related' },
      { word: 'decrease', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-stable',
    word: 'stable',
    lemma: 'stable',
    pos: 'adjective',
    ipa: '/ˈsteɪbl/',
    definitions: [
      {
        text: 'Staying at the same level and not likely to change suddenly.',
        textUz: "barqaror — o'zgarmaydigan, keskin tebranmaydigan",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics', 'banking'],
    cefr: 'B1',
    collocations: [
      { text: 'remain stable', corpusCount: 1120, verified: true },
      { text: 'stable prices', corpusCount: 690, verified: true },
      { text: 'a stable economy', corpusCount: 540, verified: true },
      { text: 'broadly stable' },
    ],
    synonyms: ['steady', 'constant', 'unchanged'],
    antonyms: ['volatile', 'unstable'],
    wordFamily: ['stable', 'stability', 'stabilise', 'stabilisation', 'unstable'],
    examples: [
      {
        sentence: 'Unemployment remained broadly stable at 5.3 per cent throughout the quarter.',
        source: 'central bank statement (style)',
        translationUz: "Chorak davomida ishsizlik 5,3 foiz darajasida umuman barqaror qoldi.",
      },
      {
        sentence: 'The company maintained a stable dividend despite weaker trading conditions.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A central bank communications officer uses this adjective when reassuring the public that a key indicator has not moved.',
    communicativeTask:
      'Name one economic indicator in your country that has stayed stable, and write a sentence about it.',
    semanticLinks: [
      { word: 'fluctuate', relation: 'opposite' },
      { word: 'monetary policy', relation: 'related' },
      { word: 'prices', relation: 'collocate' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-gradually',
    word: 'gradually',
    lemma: 'gradually',
    pos: 'adverb',
    ipa: '/ˈɡrædʒuəli/',
    definitions: [
      {
        text: 'Slowly and in small steps over a period of time, rather than suddenly.',
        textUz: "asta-sekin — birdaniga emas, bosqichma-bosqich",
        domain: 'general',
      },
    ],
    domains: ['general', 'academic'],
    cefr: 'B1',
    collocations: [
      { text: 'gradually increase', corpusCount: 720, verified: true },
      { text: 'gradually decline', corpusCount: 430, verified: true },
      { text: 'gradually improve', corpusCount: 510, verified: true },
      { text: 'gradually phase out' },
    ],
    synonyms: ['steadily', 'slowly', 'progressively'],
    antonyms: ['suddenly', 'sharply', 'abruptly'],
    wordFamily: ['gradual', 'gradually'],
    examples: [
      {
        sentence: 'Policy support will be gradually withdrawn as inflation returns to target.',
        source: 'central bank statement (style)',
        translationUz: "Inflyatsiya maqsadli darajaga qaytgani sari siyosiy qo'llab-quvvatlash asta-sekin qisqartiriladi.",
      },
      {
        sentence: 'Margins gradually improved as the cost-reduction programme took effect.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A report writer uses this adverb to describe the pace of a change when presenting results to non-specialists.',
    communicativeTask:
      'Write one sentence using "gradually" to describe a change in your own study or work habits this year.',
    semanticLinks: [
      { word: 'sharply', relation: 'opposite' },
      { word: 'trend', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-sharply',
    word: 'sharply',
    lemma: 'sharply',
    pos: 'adverb',
    ipa: '/ˈʃɑːpli/',
    definitions: [
      {
        text: 'By a large amount and very quickly, used to describe a sudden change in a figure.',
        textUz: "keskin — katta miqdorda va juda tez o'zgarishni bildiradi",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics', 'finance'],
    cefr: 'B1',
    collocations: [
      { text: 'rise sharply', corpusCount: 1340, verified: true },
      { text: 'fall sharply', corpusCount: 1260, verified: true },
      { text: 'sharply higher', corpusCount: 380, verified: true },
      { text: 'contract sharply' },
    ],
    synonyms: ['steeply', 'dramatically', 'abruptly'],
    antonyms: ['gradually', 'slightly'],
    wordFamily: ['sharp', 'sharply', 'sharpness'],
    examples: [
      {
        sentence: 'Food prices rose sharply in the second quarter, driven by higher import costs.',
        source: 'IMF World Economic Outlook (style)',
        translationUz: "Ikkinchi chorakda import xarajatlari oshgani sababli oziq-ovqat narxlari keskin ko'tarildi.",
      },
      {
        sentence: 'The share price fell sharply after the profit warning was published.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A financial journalist uses this adverb when writing a headline sentence about a large one-day movement in a market.',
    communicativeTask:
      'Write one sentence describing something whose price has risen sharply in your country recently.',
    semanticLinks: [
      { word: 'gradually', relation: 'opposite' },
      { word: 'prices', relation: 'collocate' },
      { word: 'decline', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-overall',
    word: 'overall',
    lemma: 'overall',
    pos: 'adjective',
    ipa: '/ˌəʊvərˈɔːl/',
    definitions: [
      {
        text: 'Considering everything together rather than one particular part.',
        textUz: "umumiy — alohida qismlar emas, hammasini birga hisobga olgan holda",
        domain: 'general',
      },
    ],
    domains: ['general', 'academic', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'the overall picture', corpusCount: 620, verified: true },
      { text: 'overall performance', corpusCount: 880, verified: true },
      { text: 'an overall increase', corpusCount: 450, verified: true },
      { text: 'overall, the results show' },
    ],
    synonyms: ['total', 'general', 'aggregate'],
    antonyms: ['partial', 'individual'],
    wordFamily: ['overall'],
    examples: [
      {
        sentence: 'Overall, the results confirm that the reform improved access to credit for small firms.',
        source: 'World Bank working paper (style)',
        translationUz:
          "Umuman olganda, natijalar islohot kichik firmalar uchun kreditga kirishni yaxshilaganini tasdiqlaydi.",
      },
      {
        sentence: 'Overall performance was satisfactory, although two divisions missed their targets.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A team leader uses this word when opening the summary paragraph of a quarterly performance report.',
    communicativeTask:
      'Write one summary sentence starting with "Overall" about your progress in English this semester.',
    semanticLinks: [
      { word: 'executive summary', relation: 'related' },
      { word: 'findings', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-compare',
    word: 'compare',
    lemma: 'compare',
    pos: 'verb',
    ipa: '/kəmˈpeə/',
    definitions: [
      {
        text: 'To look at two or more things in order to see how they are similar or different.',
        textUz: "solishtirmoq — ikki yoki undan ortiq narsaning o'xshash va farqli tomonlarini ko'rish",
        domain: 'general',
      },
    ],
    domains: ['general', 'academic'],
    cefr: 'A2',
    collocations: [
      { text: 'compared with last year', corpusCount: 1180, verified: true },
      { text: 'compare favourably', corpusCount: 320, verified: true },
      { text: 'compare prices', corpusCount: 540, verified: true },
      { text: 'compare the two options' },
    ],
    synonyms: ['contrast', 'weigh up'],
    antonyms: [],
    wordFamily: ['compare', 'comparison', 'comparative', 'comparable', 'comparatively'],
    examples: [
      {
        sentence: 'Compared with the same period last year, exports were up by 9 per cent.',
        source: 'business press (style)',
        translationUz: "O'tgan yilning shu davri bilan solishtirganda eksport 9 foizga oshdi.",
      },
      {
        sentence: 'The study compares labour productivity in three neighbouring economies.',
        source: 'academic journal (style)',
      },
    ],
    professionalContext:
      'A market researcher uses this verb when writing the section of a report that sets two suppliers side by side.',
    communicativeTask:
      'Compare the price of one everyday product in your city today with its price two years ago, in one sentence.',
    semanticLinks: [
      { word: 'prices', relation: 'collocate' },
      { word: 'market research', relation: 'related' },
      { word: 'analyse', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-buy',
    word: 'buy',
    lemma: 'buy',
    pos: 'verb',
    ipa: '/baɪ/',
    definitions: [
      {
        text: 'To obtain something by paying money for it.',
        textUz: "sotib olmoq — pul to'lab biror narsani olmoq",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics'],
    cefr: 'A2',
    collocations: [
      { text: 'buy on credit', corpusCount: 260, verified: true },
      { text: 'buy in bulk', corpusCount: 340, verified: true },
      { text: 'buy shares', corpusCount: 720, verified: true },
      { text: 'buy at a discount' },
    ],
    synonyms: ['purchase', 'acquire'],
    antonyms: ['sell'],
    wordFamily: ['buy', 'buyer', 'buying', 'buyout'],
    examples: [
      {
        sentence: 'Households are buying fewer imported goods as the currency weakens.',
        source: 'business press (style)',
        translationUz: "Valyuta qadrsizlangani sari uy xo'jaliklari kamroq import mahsulot sotib olmoqda.",
      },
      {
        sentence: 'The company bought a controlling stake in its main regional distributor.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A purchasing assistant uses this verb in everyday emails when confirming an order with a supplier.',
    communicativeTask:
      'Write one sentence saying what you bought most recently and whether you think the price was fair.',
    semanticLinks: [
      { word: 'consumer spending', relation: 'related' },
      { word: 'prices', relation: 'collocate' },
      { word: 'demand', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-cost',
    word: 'cost',
    lemma: 'cost',
    pos: 'noun',
    ipa: '/kɒst/',
    definitions: [
      {
        text: 'The amount of money that is needed to buy, make or do something.',
        textUz: "xarajat, tannarx — biror narsani sotib olish yoki ishlab chiqarish uchun kerak bo'lgan pul",
        domain: 'general',
      },
    ],
    domains: ['general', 'finance', 'economics'],
    cefr: 'A2',
    collocations: [
      { text: 'cut costs', corpusCount: 1420, verified: true },
      { text: 'operating costs', corpusCount: 1260, verified: true },
      { text: 'rising costs', corpusCount: 980, verified: true },
      { text: 'cover the cost of' },
    ],
    synonyms: ['expense', 'expenditure', 'outlay'],
    antonyms: ['income', 'revenue'],
    wordFamily: ['cost', 'costly', 'costing'],
    examples: [
      {
        sentence: 'Rising input costs continue to squeeze margins in the manufacturing sector.',
        source: 'business press (style)',
        translationUz: "Xomashyo xarajatlarining o'sishi ishlab chiqarish sohasida foyda marjasini siqib bormoqda.",
      },
      {
        sentence: 'The group reduced operating costs by 8 per cent through office consolidation.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A cost accountant uses this noun when explaining to a department head why their budget has been exceeded.',
    communicativeTask:
      'Write one sentence explaining one cost that has risen for students in your country this year.',
    semanticLinks: [
      { word: 'revenue', relation: 'opposite' },
      { word: 'profit', relation: 'related' },
      { word: 'inflation', relation: 'caused_by' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-rise',
    word: 'rise',
    lemma: 'rise',
    pos: 'verb',
    ipa: '/raɪz/',
    definitions: [
      {
        text: 'To go up to a higher level or amount.',
        textUz: "ko'tarilmoq, o'smoq — yuqoriroq darajaga chiqmoq",
        domain: 'general',
      },
    ],
    domains: ['general', 'economics', 'finance'],
    cefr: 'B1',
    collocations: [
      { text: 'prices rise', corpusCount: 1580, verified: true },
      { text: 'rise steadily', corpusCount: 740, verified: true },
      { text: 'a rise in unemployment', corpusCount: 620, verified: true },
      { text: 'rise above expectations' },
    ],
    synonyms: ['increase', 'go up', 'climb'],
    antonyms: ['fall', 'decline', 'drop'],
    wordFamily: ['rise', 'rising', 'risen'],
    examples: [
      {
        sentence: 'Consumer prices rose by 0.4 per cent on the month and 6.1 per cent on the year.',
        source: 'central bank statement (style)',
        translationUz: "Iste'mol narxlari oyiga 0,4 foizga, yiliga esa 6,1 foizga ko'tarildi.",
      },
      {
        sentence: 'Group revenue rose for the fourth year running, supported by strong export demand.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A statistician uses this verb in the opening line of a monthly press release announcing new price data.',
    communicativeTask:
      'Write one sentence describing something whose price has risen in your country, using a percentage.',
    semanticLinks: [
      { word: 'decline', relation: 'opposite' },
      { word: 'inflation', relation: 'related' },
      { word: 'prices', relation: 'collocate' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 2. ACADEMIC — ilmiy matn va tadqiqot tili                         */
  /* ================================================================ */
  {
    id: 'lx-analyse',
    word: 'analyse',
    lemma: 'analyse',
    pos: 'verb',
    ipa: '/ˈænəlaɪz/',
    definitions: [
      {
        text: 'To examine something in detail in order to understand it or explain what it means.',
        textUz: "tahlil qilmoq — biror narsani tushunish uchun uni qismlarga ajratib o'rganmoq",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'analyse the data', corpusCount: 1460, verified: true },
      { text: 'analyse trends', corpusCount: 610, verified: true },
      { text: 'critically analyse', corpusCount: 480, verified: true },
      { text: 'analyse the results' },
    ],
    synonyms: ['examine', 'study', 'investigate'],
    antonyms: [],
    wordFamily: ['analyse', 'analysis', 'analyst', 'analytical', 'analytically'],
    examples: [
      {
        sentence: 'This paper analyses the relationship between public investment and regional employment.',
        source: 'academic journal (style)',
        translationUz:
          "Ushbu maqola davlat investitsiyalari va mintaqaviy bandlik o'rtasidagi bog'liqlikni tahlil qiladi.",
      },
      {
        sentence: 'The team analysed twelve years of quarterly data before drawing any conclusions.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A research assistant uses this verb when describing in a methods section how the collected figures were processed.',
    communicativeTask:
      'Write one sentence explaining what data you would analyse to study youth unemployment in your region.',
    semanticLinks: [
      { word: 'data', relation: 'related' },
      { word: 'findings', relation: 'related' },
      { word: 'methodology', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-hypothesis',
    word: 'hypothesis',
    lemma: 'hypothesis',
    pos: 'noun',
    ipa: '/haɪˈpɒθəsɪs/',
    definitions: [
      {
        text: 'An idea that is suggested as a possible explanation and then tested against evidence.',
        textUz: "gipoteza — dalillar bilan tekshiriladigan taxminiy tushuntirish",
        domain: 'academic',
      },
    ],
    domains: ['academic'],
    cefr: 'C1',
    collocations: [
      { text: 'test a hypothesis', corpusCount: 890, verified: true },
      { text: 'reject the null hypothesis', corpusCount: 540, verified: true },
      { text: 'formulate a hypothesis', corpusCount: 320, verified: true },
      { text: 'support the hypothesis' },
    ],
    synonyms: ['proposition', 'conjecture'],
    antonyms: [],
    wordFamily: ['hypothesis', 'hypotheses', 'hypothesise', 'hypothetical', 'hypothetically'],
    examples: [
      {
        sentence: 'The central hypothesis is that higher minimum wages reduce staff turnover in retail.',
        source: 'academic journal (style)',
        translationUz:
          "Asosiy gipoteza shundan iboratki, yuqori minimal ish haqi chakana savdoda kadrlar almashinuvini kamaytiradi.",
      },
      {
        sentence: 'The data allow us to reject the null hypothesis at the 5 per cent level.',
        source: 'academic journal (style)',
      },
    ],
    professionalContext:
      'A postgraduate economist uses this noun when defending the research design of a dissertation chapter.',
    communicativeTask:
      'Formulate one hypothesis about how AI tools affect students of economics, in a single sentence.',
    semanticLinks: [
      { word: 'methodology', relation: 'related' },
      { word: 'variable', relation: 'related' },
      { word: 'significant', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-methodology',
    word: 'methodology',
    lemma: 'methodology',
    pos: 'noun',
    ipa: '/ˌmeθəˈdɒlədʒi/',
    definitions: [
      {
        text: 'The set of methods and principles used to carry out a piece of research.',
        textUz: "metodologiya — tadqiqotni olib borishda qo'llaniladigan usullar va tamoyillar tizimi",
        domain: 'academic',
      },
    ],
    domains: ['academic'],
    cefr: 'C1',
    collocations: [
      { text: 'research methodology', corpusCount: 1180, verified: true },
      { text: 'a mixed-methods methodology', corpusCount: 240, verified: true },
      { text: 'describe the methodology', corpusCount: 360, verified: true },
      { text: 'a robust methodology' },
    ],
    synonyms: ['approach', 'method', 'procedure'],
    antonyms: [],
    wordFamily: ['method', 'methodology', 'methodological', 'methodologically'],
    examples: [
      {
        sentence: 'The methodology combines a household survey with administrative tax records.',
        source: 'World Bank working paper (style)',
        translationUz:
          "Metodologiya uy xo'jaliklari so'rovini soliq idorasi ma'lumotlari bilan birlashtiradi.",
      },
      {
        sentence: 'Section three sets out the methodology and explains how the sample was selected.',
        source: 'academic journal (style)',
      },
    ],
    professionalContext:
      'A researcher uses this noun when writing the chapter that justifies how a study was designed and carried out.',
    communicativeTask:
      'In one sentence, describe the methodology you would use to find out how students learn new economic terms.',
    semanticLinks: [
      { word: 'hypothesis', relation: 'related' },
      { word: 'sample', relation: 'part_of' },
      { word: 'empirical', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-findings',
    word: 'findings',
    lemma: 'finding',
    pos: 'noun',
    ipa: '/ˈfaɪndɪŋz/',
    definitions: [
      {
        text: 'The results and conclusions that come out of a piece of research or an investigation.',
        textUz: "tadqiqot natijalari — o'rganish yakunida olingan xulosalar",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'business_communication'],
    cefr: 'B2',
    collocations: [
      { text: 'present the findings', corpusCount: 780, verified: true },
      { text: 'key findings', corpusCount: 1240, verified: true },
      { text: 'the findings suggest that', corpusCount: 960, verified: true },
      { text: 'preliminary findings' },
    ],
    synonyms: ['results', 'conclusions', 'outcomes'],
    antonyms: [],
    wordFamily: ['find', 'finding', 'findings'],
    examples: [
      {
        sentence: 'The findings suggest that access to credit is the main constraint on small firms.',
        source: 'World Bank working paper (style)',
        translationUz:
          "Natijalar kichik firmalar uchun asosiy to'siq kreditga kirish imkoniyati ekanini ko'rsatadi.",
      },
      {
        sentence: 'Key findings from the customer survey are summarised on page four.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A consultant uses this noun when opening the results section of a report delivered to a client.',
    communicativeTask:
      'Write one sentence beginning "The findings suggest that..." about a small survey you could run in your class.',
    semanticLinks: [
      { word: 'analyse', relation: 'caused_by' },
      { word: 'evidence', relation: 'related' },
      { word: 'executive summary', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-cite',
    word: 'cite',
    lemma: 'cite',
    pos: 'verb',
    ipa: '/saɪt/',
    definitions: [
      {
        text: 'To mention a book, article or author as the source of information you are using.',
        textUz: "iqtibos keltirmoq, manbaga havola qilmoq",
        domain: 'academic',
      },
    ],
    domains: ['academic'],
    cefr: 'B2',
    collocations: [
      { text: 'cite a source', corpusCount: 620, verified: true },
      { text: 'widely cited', corpusCount: 540, verified: true },
      { text: 'cite evidence', corpusCount: 410, verified: true },
      { text: 'cite the literature' },
    ],
    synonyms: ['quote', 'reference', 'refer to'],
    antonyms: [],
    wordFamily: ['cite', 'citation', 'cited'],
    examples: [
      {
        sentence: 'The author cites three earlier studies of price stability in transition economies.',
        source: 'academic journal (style)',
        translationUz:
          "Muallif o'tish iqtisodiyotlaridagi narx barqarorligi bo'yicha uchta oldingi tadqiqotga havola qiladi.",
      },
      {
        sentence: 'Papers that cite official statistics must give the release date of the dataset.',
        source: 'academic style guide (style)',
      },
    ],
    professionalContext:
      'A student economist uses this verb when explaining to a supervisor how sources are acknowledged in a term paper.',
    communicativeTask:
      'Write one sentence citing a real statistical source you could use for an essay about your country.',
    semanticLinks: [
      { word: 'literature review', relation: 'part_of' },
      { word: 'evidence', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-correlation',
    word: 'correlation',
    lemma: 'correlation',
    pos: 'noun',
    ipa: '/ˌkɒrəˈleɪʃn/',
    definitions: [
      {
        text: 'A statistical relationship in which two things tend to change together.',
        textUz: "korrelyatsiya — ikki ko'rsatkichning birga o'zgarish darajasini bildiruvchi statistik bog'liqlik",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'a strong correlation', corpusCount: 1080, verified: true },
      { text: 'a weak correlation', corpusCount: 460, verified: true },
      { text: 'a positive correlation', corpusCount: 890, verified: true },
      { text: 'correlation does not imply causation' },
    ],
    synonyms: ['association', 'relationship'],
    antonyms: [],
    wordFamily: ['correlate', 'correlation', 'correlated', 'correlational'],
    examples: [
      {
        sentence: 'There is a strong positive correlation between years of schooling and lifetime earnings.',
        source: 'academic journal (style)',
        translationUz:
          "Ta'lim yillari va umr bo'yi olinadigan daromad o'rtasida kuchli musbat korrelyatsiya mavjud.",
      },
      {
        sentence: 'The report stresses that this correlation does not prove a causal relationship.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A data analyst uses this noun when warning colleagues that two indicators move together but one may not cause the other.',
    communicativeTask:
      'Name two economic indicators you think are correlated and write one sentence explaining why.',
    semanticLinks: [
      { word: 'variable', relation: 'related' },
      { word: 'significant', relation: 'related' },
      { word: 'data', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-significant',
    word: 'significant',
    lemma: 'significant',
    pos: 'adjective',
    ipa: '/sɪɡˈnɪfɪkənt/',
    definitions: [
      {
        text: 'Large or important enough to have a real effect or to be worth noticing.',
        textUz: "sezilarli, muhim — e'tiborga loyiq darajada katta",
        domain: 'general',
      },
      {
        text: 'In statistics, unlikely to have happened by chance alone.',
        textUz: "statistik ahamiyatli — tasodif natijasi bo'lishi ehtimoli past",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'general'],
    cefr: 'B2',
    collocations: [
      { text: 'statistically significant', corpusCount: 1620, verified: true },
      { text: 'a significant increase', corpusCount: 1340, verified: true },
      { text: 'significant impact', corpusCount: 1100, verified: true },
      { text: 'significant at the 1 per cent level' },
    ],
    synonyms: ['considerable', 'substantial', 'notable'],
    antonyms: ['negligible', 'insignificant', 'marginal'],
    wordFamily: ['significance', 'significant', 'significantly', 'insignificant'],
    examples: [
      {
        sentence: 'The effect of the subsidy on rural incomes is statistically significant and positive.',
        source: 'academic journal (style)',
        translationUz: "Subsidiyaning qishloq daromadlariga ta'siri statistik jihatdan ahamiyatli va musbat.",
      },
      {
        sentence: 'The group made significant progress in reducing its carbon footprint during the year.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A researcher uses this adjective when reporting whether an observed difference is strong enough to be trusted.',
    communicativeTask:
      'Write one sentence about a significant change in the economy of your country, and say why it matters.',
    semanticLinks: [
      { word: 'correlation', relation: 'related' },
      { word: 'evidence', relation: 'related' },
      { word: 'findings', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-framework',
    word: 'framework',
    lemma: 'framework',
    pos: 'noun',
    ipa: '/ˈfreɪmwɜːk/',
    definitions: [
      {
        text: 'A set of ideas, rules or principles that is used as a basis for analysis or decisions.',
        textUz: "asosiy tizim, konseptual doira — tahlil yoki qarorlar uchun tayanch g'oyalar majmuasi",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'management', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'a theoretical framework', corpusCount: 1240, verified: true },
      { text: 'a regulatory framework', corpusCount: 980, verified: true },
      { text: 'within the framework of', corpusCount: 720, verified: true },
      { text: 'develop a framework' },
    ],
    synonyms: ['structure', 'model', 'system'],
    antonyms: [],
    wordFamily: ['frame', 'framework'],
    examples: [
      {
        sentence: 'The paper develops a theoretical framework for analysing informal labour markets.',
        source: 'academic journal (style)',
        translationUz: "Maqolada norasmiy mehnat bozorlarini tahlil qilish uchun nazariy asos ishlab chiqilgan.",
      },
      {
        sentence: 'A clearer regulatory framework would encourage long-term foreign investment.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A policy adviser uses this noun when describing the set of rules under which an industry operates.',
    communicativeTask:
      'Describe in one sentence the regulatory framework that governs banks in your country.',
    semanticLinks: [
      { word: 'methodology', relation: 'related' },
      { word: 'monetary policy', relation: 'related' },
      { word: 'accountability', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-empirical',
    word: 'empirical',
    lemma: 'empirical',
    pos: 'adjective',
    ipa: '/ɪmˈpɪrɪkl/',
    definitions: [
      {
        text: 'Based on observation, measurement or experiment rather than on theory alone.',
        textUz: "empirik — nazariyaga emas, kuzatuv va o'lchovlarga asoslangan",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'economics'],
    cefr: 'C1',
    collocations: [
      { text: 'empirical evidence', corpusCount: 1520, verified: true },
      { text: 'empirical analysis', corpusCount: 1140, verified: true },
      { text: 'empirical findings', corpusCount: 620, verified: true },
      { text: 'the empirical literature' },
    ],
    synonyms: ['observed', 'experimental', 'evidence-based'],
    antonyms: ['theoretical', 'speculative'],
    wordFamily: ['empirical', 'empirically', 'empiricism'],
    examples: [
      {
        sentence: 'Empirical evidence on the effect of trade liberalisation remains mixed.',
        source: 'academic journal (style)',
        translationUz: "Savdo liberallashuvining ta'siri bo'yicha empirik dalillar hamon qarama-qarshi.",
      },
      {
        sentence: 'The empirical analysis draws on a panel of 34 economies observed from 2005 to 2023.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A dissertation author uses this adjective when distinguishing a data-based chapter from a purely theoretical one.',
    communicativeTask:
      'Write one sentence explaining what empirical evidence you would need to prove that AI helps language learning.',
    semanticLinks: [
      { word: 'evidence', relation: 'related' },
      { word: 'methodology', relation: 'related' },
      { word: 'data', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-literature-review',
    word: 'literature review',
    lemma: 'literature review',
    pos: 'noun phrase',
    ipa: '/ˈlɪtrətʃə rɪˌvjuː/',
    definitions: [
      {
        text: 'A part of a research paper that summarises and evaluates what other authors have already published on the topic.',
        textUz: "adabiyotlar sharhi — mavzu bo'yicha oldin chop etilgan ishlarni umumlashtirib baholovchi bo'lim",
        domain: 'academic',
      },
    ],
    domains: ['academic'],
    cefr: 'C1',
    collocations: [
      { text: 'conduct a literature review', corpusCount: 480, verified: true },
      { text: 'a systematic literature review', corpusCount: 620, verified: true },
      { text: 'the literature review shows', corpusCount: 210, verified: true },
      { text: 'gaps in the literature' },
    ],
    synonyms: ['review of the literature', 'state of the art'],
    antonyms: [],
    wordFamily: ['literature', 'review', 'reviewer'],
    examples: [
      {
        sentence: 'The literature review identifies a clear gap in research on vocabulary transfer in ESP courses.',
        source: 'academic journal (style)',
        translationUz:
          "Adabiyotlar sharhi kasbiy ingliz tili kurslarida lug'at ko'chishi bo'yicha tadqiqotlarda aniq bo'shliq borligini ko'rsatadi.",
      },
      {
        sentence: 'Chapter two presents a systematic literature review covering the period 2010 to 2024.',
        source: 'dissertation (style)',
      },
    ],
    professionalContext:
      'A postgraduate student uses this term when planning the second chapter of a dissertation with a supervisor.',
    communicativeTask:
      'Write one sentence naming a gap in the research that your own literature review could address.',
    semanticLinks: [
      { word: 'cite', relation: 'part_of' },
      { word: 'methodology', relation: 'related' },
      { word: 'hypothesis', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-variable',
    word: 'variable',
    lemma: 'variable',
    pos: 'noun',
    ipa: '/ˈveəriəbl/',
    definitions: [
      {
        text: 'A factor in a study that can take different values and that can be measured or controlled.',
        textUz: "o'zgaruvchi — tadqiqotda turli qiymat oladigan va o'lchanadigan omil",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'a dependent variable', corpusCount: 1080, verified: true },
      { text: 'an independent variable', corpusCount: 1020, verified: true },
      { text: 'control for a variable', corpusCount: 540, verified: true },
      { text: 'an explanatory variable' },
    ],
    synonyms: ['factor', 'parameter'],
    antonyms: ['constant'],
    wordFamily: ['vary', 'variable', 'variation', 'variability', 'variably'],
    examples: [
      {
        sentence: 'The dependent variable is the annual growth rate of real household consumption.',
        source: 'academic journal (style)',
        translationUz: "Bog'liq o'zgaruvchi — real oilaviy iste'molning yillik o'sish sur'ati.",
      },
      {
        sentence: 'The model controls for variables such as firm size, sector and region.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'An econometrician uses this noun when explaining a regression model to colleagues in a seminar.',
    communicativeTask:
      'Name one dependent and one independent variable for a study of student performance, in one sentence.',
    semanticLinks: [
      { word: 'correlation', relation: 'related' },
      { word: 'hypothesis', relation: 'related' },
      { word: 'sample', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-sample',
    word: 'sample',
    lemma: 'sample',
    pos: 'noun',
    ipa: '/ˈsɑːmpl/',
    definitions: [
      {
        text: 'A smaller group chosen from a larger population so that it can be studied and used to draw wider conclusions.',
        textUz: "tanlanma — katta guruhdan o'rganish uchun ajratib olingan kichik qism",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'marketing'],
    cefr: 'B2',
    collocations: [
      { text: 'a representative sample', corpusCount: 940, verified: true },
      { text: 'sample size', corpusCount: 1360, verified: true },
      { text: 'a random sample', corpusCount: 880, verified: true },
      { text: 'draw a sample from' },
    ],
    synonyms: ['subset', 'selection'],
    antonyms: ['population'],
    wordFamily: ['sample', 'sampling', 'sampled'],
    examples: [
      {
        sentence: 'The sample consists of 1,200 households selected at random from the national register.',
        source: 'World Bank survey report (style)',
        translationUz:
          "Tanlanma milliy reyestrdan tasodifiy tanlab olingan 1 200 ta uy xo'jaligidan iborat.",
      },
      {
        sentence: 'Results should be treated with caution because of the small sample size.',
        source: 'academic journal (style)',
      },
    ],
    professionalContext:
      'A market researcher uses this noun when explaining to a client how many customers were surveyed and how they were chosen.',
    communicativeTask:
      'Describe in one sentence how you would select a representative sample of students at your university.',
    semanticLinks: [
      { word: 'methodology', relation: 'part_of' },
      { word: 'data', relation: 'related' },
      { word: 'market research', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-abstract',
    word: 'abstract',
    lemma: 'abstract',
    pos: 'noun',
    ipa: '/ˈæbstrækt/',
    definitions: [
      {
        text: 'A short summary at the beginning of an academic paper that states its aim, method and main results.',
        textUz: "annotatsiya — ilmiy maqola boshidagi maqsad, usul va asosiy natijalarni bayon qiluvchi qisqa xulosa",
        domain: 'academic',
      },
    ],
    domains: ['academic'],
    cefr: 'B2',
    collocations: [
      { text: 'write an abstract', corpusCount: 320, verified: true },
      { text: 'a structured abstract', corpusCount: 180, verified: true },
      { text: 'submit an abstract', corpusCount: 240, verified: true },
      { text: 'the abstract summarises' },
    ],
    synonyms: ['summary', 'synopsis'],
    antonyms: [],
    wordFamily: ['abstract', 'abstraction'],
    examples: [
      {
        sentence: 'The abstract must not exceed 250 words and should state the main contribution clearly.',
        source: 'academic style guide (style)',
        translationUz:
          "Annotatsiya 250 so'zdan oshmasligi va asosiy hissani aniq bayon qilishi kerak.",
      },
      {
        sentence: 'Reviewers often decide whether to read a paper on the basis of its abstract alone.',
        source: 'academic journal (style)',
      },
    ],
    professionalContext:
      'A young researcher uses this term when preparing a submission to an international economics conference.',
    communicativeTask:
      'Write a one-sentence abstract for a study on how students learn economic vocabulary with AI.',
    semanticLinks: [
      { word: 'executive summary', relation: 'related' },
      { word: 'findings', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-evidence',
    word: 'evidence',
    lemma: 'evidence',
    pos: 'noun',
    ipa: '/ˈevɪdəns/',
    definitions: [
      {
        text: 'Facts or information that show whether a statement or belief is true.',
        textUz: "dalil — biror fikrning to'g'ri yoki noto'g'riligini ko'rsatuvchi ma'lumot",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'general'],
    cefr: 'B1',
    collocations: [
      { text: 'strong evidence', corpusCount: 1280, verified: true },
      { text: 'there is little evidence that', corpusCount: 760, verified: true },
      { text: 'provide evidence', corpusCount: 1040, verified: true },
      { text: 'anecdotal evidence' },
    ],
    synonyms: ['proof', 'data', 'support'],
    antonyms: [],
    wordFamily: ['evidence', 'evident', 'evidently', 'evidence-based'],
    examples: [
      {
        sentence: 'There is little evidence that the tax cut raised long-run investment.',
        source: 'IMF World Economic Outlook (style)',
        translationUz: "Soliq qisqartirishi uzoq muddatli investitsiyani oshirgani haqida dalil kam.",
      },
      {
        sentence: 'Evidence from three pilot regions supports a wider rollout of the programme.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A policy analyst uses this noun when justifying a recommendation to a ministry with data rather than opinion.',
    communicativeTask:
      'Write one sentence presenting evidence for or against the claim that online learning improves results.',
    semanticLinks: [
      { word: 'empirical', relation: 'related' },
      { word: 'findings', relation: 'related' },
      { word: 'cite', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-assumption',
    word: 'assumption',
    lemma: 'assumption',
    pos: 'noun',
    ipa: '/əˈsʌmpʃn/',
    definitions: [
      {
        text: 'Something that is accepted as true without proof, and on which an argument or model is built.',
        textUz: "farazlar, taxmin — isbotsiz qabul qilinadigan va model asosiga qo'yiladigan fikr",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'a key assumption', corpusCount: 680, verified: true },
      { text: 'underlying assumptions', corpusCount: 740, verified: true },
      { text: 'challenge an assumption', corpusCount: 260, verified: true },
      { text: 'on the assumption that' },
    ],
    synonyms: ['presupposition', 'premise'],
    antonyms: ['proof', 'fact'],
    wordFamily: ['assume', 'assumption', 'assumed'],
    examples: [
      {
        sentence: 'The forecast rests on the assumption that energy prices remain broadly unchanged.',
        source: 'central bank statement (style)',
        translationUz: "Prognoz energiya narxlari o'zgarmasligi haqidagi farazga asoslanadi.",
      },
      {
        sentence: 'The valuation model and its underlying assumptions are set out in note 14.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A financial modeller uses this noun when listing, at the start of a business case, the conditions the numbers depend on.',
    communicativeTask:
      'State one assumption behind a budget you have made, and write a sentence about what happens if it is wrong.',
    semanticLinks: [
      { word: 'forecast', relation: 'related' },
      { word: 'hypothesis', relation: 'related' },
      { word: 'framework', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-data',
    word: 'data',
    lemma: 'data',
    pos: 'noun',
    ipa: '/ˈdeɪtə/',
    definitions: [
      {
        text: 'Facts and figures that are collected in order to be examined and used for analysis.',
        textUz: "ma'lumotlar — tahlil qilish uchun to'plangan faktlar va raqamlar",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'economics', 'management'],
    cefr: 'B1',
    collocations: [
      { text: 'collect data', corpusCount: 1840, verified: true },
      { text: 'raw data', corpusCount: 920, verified: true },
      { text: 'the latest data show', corpusCount: 1120, verified: true },
      { text: 'data set' },
    ],
    synonyms: ['figures', 'statistics', 'information'],
    antonyms: [],
    wordFamily: ['data', 'database', 'dataset'],
    examples: [
      {
        sentence: 'The latest data show that private consumption grew more slowly than expected.',
        source: 'central bank statement (style)',
        translationUz: "So'nggi ma'lumotlar xususiy iste'mol kutilganidan sekinroq o'sganini ko'rsatadi.",
      },
      {
        sentence: 'Sales data are collected weekly from all 320 retail outlets.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A business analyst uses this noun daily when requesting figures from other departments to build a report.',
    communicativeTask:
      'Write one sentence saying what data you would need in order to describe inflation in your country.',
    semanticLinks: [
      { word: 'analyse', relation: 'related' },
      { word: 'evidence', relation: 'hypernym' },
      { word: 'key performance indicator', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-conclude',
    word: 'conclude',
    lemma: 'conclude',
    pos: 'verb',
    ipa: '/kənˈkluːd/',
    definitions: [
      {
        text: 'To decide that something is true after considering all the available information.',
        textUz: "xulosa chiqarmoq — barcha ma'lumotlarni ko'rib chiqib qaror qilmoq",
        domain: 'academic',
      },
    ],
    domains: ['academic', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'the study concludes that', corpusCount: 640, verified: true },
      { text: 'conclude an agreement', corpusCount: 380, verified: true },
      { text: 'safely conclude', corpusCount: 190, verified: true },
      { text: 'conclude from the evidence' },
    ],
    synonyms: ['deduce', 'infer', 'determine'],
    antonyms: [],
    wordFamily: ['conclude', 'conclusion', 'conclusive', 'conclusively', 'inconclusive'],
    examples: [
      {
        sentence: 'The study concludes that targeted subsidies are more efficient than universal ones.',
        source: 'World Bank working paper (style)',
        translationUz:
          "Tadqiqot maqsadli subsidiyalar umumiy subsidiyalarga qaraganda samaraliroq degan xulosaga keladi.",
      },
      {
        sentence: 'The two parties concluded a five-year supply agreement in November.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A report writer uses this verb in the final paragraph that states what the analysis has shown.',
    communicativeTask:
      'Write one concluding sentence for a short report on prices in your local market.',
    semanticLinks: [
      { word: 'findings', relation: 'related' },
      { word: 'evidence', relation: 'related' },
      { word: 'executive summary', relation: 'related' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 3. ECONOMICS — makro va mikroiqtisodiyot                          */
  /* ================================================================ */
  {
    id: 'lx-inflation',
    word: 'inflation',
    lemma: 'inflation',
    pos: 'noun',
    ipa: '/ɪnˈfleɪʃn/',
    definitions: [
      {
        text: 'A general and continuing rise in the prices of goods and services, which reduces what money can buy.',
        textUz: "inflyatsiya — narxlarning umumiy va barqaror o'sishi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'banking', 'general'],
    cefr: 'B2',
    collocations: [
      { text: 'curb inflation', corpusCount: 640, verified: true },
      { text: 'the inflation rate', corpusCount: 2100, verified: true },
      { text: 'rising inflation', corpusCount: 1480, verified: true },
      { text: 'bring inflation back to target' },
      { text: 'core inflation' },
    ],
    synonyms: ['price growth', 'rising prices'],
    antonyms: ['deflation'],
    wordFamily: ['inflate', 'inflation', 'inflationary', 'deflate', 'deflation'],
    examples: [
      {
        sentence: 'Inflation fell to 4.6 per cent in March, its lowest level in almost two years.',
        source: 'central bank statement (style)',
        translationUz: "Inflyatsiya mart oyida 4,6 foizga tushdi, bu deyarli ikki yildagi eng past ko'rsatkich.",
      },
      {
        sentence: 'Persistent inflation continues to erode the purchasing power of low-income households.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A macroeconomic analyst uses this term when briefing management on how rising prices will affect the cost base for next year.',
    communicativeTask:
      'Write one sentence explaining how inflation has affected prices in your country over the last year.',
    semanticLinks: [
      { word: 'prices', relation: 'measure_of' },
      { word: 'purchasing power', relation: 'related' },
      { word: 'monetary policy', relation: 'caused_by' },
      { word: 'deflation', relation: 'opposite' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-prices',
    word: 'prices',
    lemma: 'price',
    pos: 'noun',
    ipa: '/ˈpraɪsɪz/',
    definitions: [
      {
        text: 'The amounts of money that goods and services cost in a market.',
        textUz: "narxlar — bozorda tovar va xizmatlar uchun to'lanadigan pul miqdorlari",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'general', 'marketing'],
    cefr: 'A2',
    collocations: [
      { text: 'consumer prices', corpusCount: 1920, verified: true },
      { text: 'prices rise', corpusCount: 1580, verified: true },
      { text: 'cut prices', corpusCount: 880, verified: true },
      { text: 'keep prices down' },
      { text: 'a price increase' },
    ],
    synonyms: ['costs', 'charges', 'rates'],
    antonyms: [],
    wordFamily: ['price', 'prices', 'pricing', 'priceless', 'overpriced'],
    examples: [
      {
        sentence: 'Consumer prices rose faster than wages for the third year in a row.',
        source: 'IMF World Economic Outlook (style)',
        translationUz: "Iste'mol narxlari ketma-ket uchinchi yil ish haqidan tezroq o'sdi.",
      },
      {
        sentence: 'The retailer held prices flat in order to defend its share of the value segment.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A pricing analyst uses this word when reporting to a commercial director on how competitors have changed their price lists.',
    communicativeTask:
      'Describe in one sentence how prices of one everyday product have changed in your city this year.',
    semanticLinks: [
      { word: 'inflation', relation: 'measure_of' },
      { word: 'purchasing power', relation: 'related' },
      { word: 'demand', relation: 'caused_by' },
      { word: 'pricing strategy', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-purchasing-power',
    word: 'purchasing power',
    lemma: 'purchasing power',
    pos: 'noun phrase',
    ipa: '/ˈpɜːtʃəsɪŋ ˌpaʊə/',
    definitions: [
      {
        text: 'The quantity of goods and services that a given amount of money can buy.',
        textUz: "sotib olish qobiliyati — ma'lum miqdordagi pulga olish mumkin bo'lgan tovar va xizmatlar hajmi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'erode purchasing power', corpusCount: 380, verified: true },
      { text: 'lose purchasing power', corpusCount: 420, verified: true },
      { text: 'purchasing power parity', corpusCount: 960, verified: true },
      { text: 'restore purchasing power' },
    ],
    synonyms: ['buying power', 'real income'],
    antonyms: [],
    wordFamily: ['purchase', 'purchaser', 'purchasing', 'power'],
    examples: [
      {
        sentence: 'Double-digit inflation has eroded the purchasing power of pensions across the region.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Ikki xonali inflyatsiya mintaqa bo'ylab pensiyalarning sotib olish qobiliyatini yemirdi.",
      },
      {
        sentence: 'Wage settlements above 8 per cent should restore some purchasing power next year.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A labour economist uses this phrase when advising a trade union on whether a proposed pay rise keeps up with prices.',
    communicativeTask:
      'Write one sentence explaining whether the purchasing power of an average salary in your country has risen or fallen.',
    semanticLinks: [
      { word: 'inflation', relation: 'caused_by' },
      { word: 'prices', relation: 'related' },
      { word: 'consumer spending', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-consumer-spending',
    word: 'consumer spending',
    lemma: 'consumer spending',
    pos: 'noun phrase',
    ipa: '/kənˈsjuːmə ˌspendɪŋ/',
    definitions: [
      {
        text: 'The total amount of money that households spend on goods and services.',
        textUz: "iste'mol xarajatlari — uy xo'jaliklari tovar va xizmatlarga sarflaydigan umumiy pul",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'marketing'],
    cefr: 'B2',
    collocations: [
      { text: 'weak consumer spending', corpusCount: 460, verified: true },
      { text: 'boost consumer spending', corpusCount: 380, verified: true },
      { text: 'consumer spending growth', corpusCount: 520, verified: true },
      { text: 'a slowdown in consumer spending' },
    ],
    synonyms: ['household consumption', 'private consumption'],
    antonyms: ['household saving'],
    wordFamily: ['consume', 'consumer', 'consumption', 'spend', 'spending'],
    examples: [
      {
        sentence: 'Consumer spending slowed markedly in the second half as real incomes fell.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Real daromadlar kamaygani sababli yilning ikkinchi yarmida iste'mol xarajatlari sezilarli sekinlashdi.",
      },
      {
        sentence: 'Weak consumer spending was the main reason for the decline in like-for-like sales.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A retail analyst uses this phrase when explaining to investors why store sales have slowed in a particular quarter.',
    communicativeTask:
      'Write one sentence describing what has happened to consumer spending in your country and why.',
    semanticLinks: [
      { word: 'purchasing power', relation: 'caused_by' },
      { word: 'demand', relation: 'related' },
      { word: 'gross domestic product', relation: 'part_of' },
      { word: 'prices', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-monetary-policy',
    word: 'monetary policy',
    lemma: 'monetary policy',
    pos: 'noun phrase',
    ipa: '/ˈmʌnɪtri ˈpɒləsi/',
    definitions: [
      {
        text: 'The actions a central bank takes, mainly through interest rates, to control the money supply and keep prices stable.',
        textUz: "monetar siyosat — markaziy bankning foiz stavkalari orqali pul massasi va narx barqarorligini boshqarishi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'banking'],
    cefr: 'C1',
    collocations: [
      { text: 'tighten monetary policy', corpusCount: 720, verified: true },
      { text: 'loosen monetary policy', corpusCount: 340, verified: true },
      { text: 'the monetary policy stance', corpusCount: 810, verified: true },
      { text: 'monetary policy transmission' },
    ],
    synonyms: ['interest rate policy'],
    antonyms: ['fiscal policy'],
    wordFamily: ['money', 'monetary', 'monetarist', 'policy'],
    examples: [
      {
        sentence: 'The Committee judged that monetary policy needs to remain restrictive for some time.',
        source: 'central bank statement (style)',
        translationUz:
          "Qo'mita monetar siyosat yana bir muddat cheklovchi bo'lib qolishi kerak deb hisobladi.",
      },
      {
        sentence: 'Tighter monetary policy has begun to slow credit growth in the household sector.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A bank economist uses this term when writing the weekly commentary that explains a central bank decision to corporate clients.',
    communicativeTask:
      'Explain in one sentence what your central bank has done with interest rates recently and why.',
    semanticLinks: [
      { word: 'inflation', relation: 'related' },
      { word: 'interest rate', relation: 'part_of' },
      { word: 'central bank', relation: 'related' },
      { word: 'fiscal policy', relation: 'opposite' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-deflation',
    word: 'deflation',
    lemma: 'deflation',
    pos: 'noun',
    ipa: '/diːˈfleɪʃn/',
    definitions: [
      {
        text: 'A continuing fall in the general level of prices in an economy.',
        textUz: "deflyatsiya — iqtisodiyotda umumiy narx darajasining davomli pasayishi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'the risk of deflation', corpusCount: 420, verified: true },
      { text: 'fall into deflation', corpusCount: 180, verified: true },
      { text: 'a deflationary spiral', corpusCount: 240, verified: true },
      { text: 'combat deflation' },
    ],
    synonyms: ['falling prices'],
    antonyms: ['inflation'],
    wordFamily: ['deflate', 'deflation', 'deflationary', 'inflate', 'inflation'],
    examples: [
      {
        sentence: 'Persistent deflation makes it harder for firms and households to service their debts.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Uzoq davom etgan deflyatsiya firmalar va uy xo'jaliklariga qarzlarini to'lashni qiyinlashtiradi.",
      },
      {
        sentence: 'The bank cut rates aggressively to reduce the risk of deflation taking hold.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A macroeconomist uses this term when explaining to policymakers why falling prices can be as damaging as rising ones.',
    communicativeTask:
      'Write one sentence explaining why deflation can be dangerous for people who have taken out loans.',
    semanticLinks: [
      { word: 'inflation', relation: 'opposite' },
      { word: 'prices', relation: 'measure_of' },
      { word: 'monetary policy', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-recession',
    word: 'recession',
    lemma: 'recession',
    pos: 'noun',
    ipa: '/rɪˈseʃn/',
    definitions: [
      {
        text: 'A period in which economic activity falls for at least two quarters in a row.',
        textUz: "retsessiya — iqtisodiy faollikning kamida ikki chorak davomida pasayishi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'slip into recession', corpusCount: 460, verified: true },
      { text: 'a deep recession', corpusCount: 680, verified: true },
      { text: 'emerge from recession', corpusCount: 320, verified: true },
      { text: 'the risk of recession' },
    ],
    synonyms: ['downturn', 'slump', 'contraction'],
    antonyms: ['boom', 'expansion', 'recovery'],
    wordFamily: ['recession', 'recessionary', 'recede'],
    examples: [
      {
        sentence: 'The economy slipped into recession after two consecutive quarters of falling output.',
        source: 'business press (style)',
        translationUz:
          "Ishlab chiqarish ketma-ket ikki chorak kamaygach, iqtisodiyot retsessiyaga tushdi.",
      },
      {
        sentence: 'Growth is projected to remain weak, although a deep recession is not the baseline scenario.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A risk officer uses this term when preparing a scenario analysis of how a downturn would affect the loan book.',
    communicativeTask:
      'Write one sentence naming two signs that would tell you an economy is entering a recession.',
    semanticLinks: [
      { word: 'economic growth', relation: 'opposite' },
      { word: 'unemployment rate', relation: 'causes' },
      { word: 'gross domestic product', relation: 'measure_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-gross-domestic-product',
    word: 'gross domestic product',
    lemma: 'gross domestic product',
    pos: 'noun phrase',
    ipa: '/ˌɡrəʊs dəˈmestɪk ˈprɒdʌkt/',
    definitions: [
      {
        text: 'The total value of all goods and services produced inside a country during a given period.',
        textUz: "yalpi ichki mahsulot — mamlakat ichida ma'lum davrda ishlab chiqarilgan barcha tovar va xizmatlarning umumiy qiymati",
        domain: 'economics',
      },
    ],
    domains: ['economics'],
    cefr: 'B2',
    collocations: [
      { text: 'gross domestic product per capita', corpusCount: 1080, verified: true },
      { text: 'as a share of gross domestic product', corpusCount: 1240, verified: true },
      { text: 'real gross domestic product', corpusCount: 940, verified: true },
      { text: 'gross domestic product growth' },
    ],
    synonyms: ['GDP', 'national output'],
    antonyms: [],
    wordFamily: ['product', 'production', 'productive', 'domestic'],
    examples: [
      {
        sentence: 'Real gross domestic product expanded by 4.8 per cent, supported by strong investment.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Kuchli investitsiyalar hisobiga real yalpi ichki mahsulot 4,8 foizga o'sdi.",
      },
      {
        sentence: 'Public debt now stands at 42 per cent of gross domestic product.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'A government economist uses this term when preparing the macroeconomic section of an annual budget document.',
    communicativeTask:
      'Write one sentence stating the approximate size of GDP growth in your country last year.',
    semanticLinks: [
      { word: 'economic growth', relation: 'measure_of' },
      { word: 'consumer spending', relation: 'part_of' },
      { word: 'recession', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-supply',
    word: 'supply',
    lemma: 'supply',
    pos: 'noun',
    ipa: '/səˈplaɪ/',
    definitions: [
      {
        text: 'The quantity of a good or service that producers are willing to sell at a given price.',
        textUz: "taklif — ishlab chiqaruvchilar ma'lum narxda sotishga tayyor bo'lgan tovar miqdori",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'management'],
    cefr: 'B1',
    collocations: [
      { text: 'supply and demand', corpusCount: 2240, verified: true },
      { text: 'a supply shortage', corpusCount: 520, verified: true },
      { text: 'supply chain', corpusCount: 2680, verified: true },
      { text: 'increase supply' },
    ],
    synonyms: ['provision', 'stock'],
    antonyms: ['demand'],
    wordFamily: ['supply', 'supplier', 'supplied', 'oversupply'],
    examples: [
      {
        sentence: 'Global supply of semiconductors remains tight despite new capacity coming on stream.',
        source: 'business press (style)',
        translationUz:
          "Yangi quvvatlar ishga tushirilganiga qaramay, jahonda yarim o'tkazgichlar taklifi hamon tang.",
      },
      {
        sentence: 'Disruption to supply chains added around one percentage point to input costs.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A procurement manager uses this noun when explaining to production staff why materials are arriving late.',
    communicativeTask:
      'Write one sentence describing a product whose supply is limited in your country and explain the effect on its price.',
    semanticLinks: [
      { word: 'demand', relation: 'opposite' },
      { word: 'market equilibrium', relation: 'part_of' },
      { word: 'prices', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-demand',
    word: 'demand',
    lemma: 'demand',
    pos: 'noun',
    ipa: '/dɪˈmɑːnd/',
    definitions: [
      {
        text: 'The quantity of a good or service that buyers are willing and able to purchase at a given price.',
        textUz: "talab — xaridorlar ma'lum narxda sotib olishga tayyor bo'lgan tovar miqdori",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'marketing'],
    cefr: 'B1',
    collocations: [
      { text: 'strong demand', corpusCount: 1640, verified: true },
      { text: 'meet demand', corpusCount: 1180, verified: true },
      { text: 'a fall in demand', corpusCount: 720, verified: true },
      { text: 'demand for credit' },
      { text: 'domestic demand' },
    ],
    synonyms: ['appetite', 'need', 'requirement'],
    antonyms: ['supply'],
    wordFamily: ['demand', 'demanding', 'demanded'],
    examples: [
      {
        sentence: 'Domestic demand has held up better than expected despite higher borrowing costs.',
        source: 'central bank statement (style)',
        translationUz:
          "Qarz olish qimmatlashganiga qaramay, ichki talab kutilganidan yaxshiroq saqlanib qoldi.",
      },
      {
        sentence: 'Strong demand for the new product line allowed the company to raise prices twice.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A sales planner uses this noun when forecasting how many units the company will need to produce next quarter.',
    communicativeTask:
      'Write one sentence about a product for which demand has grown quickly in your country recently.',
    semanticLinks: [
      { word: 'supply', relation: 'opposite' },
      { word: 'market equilibrium', relation: 'part_of' },
      { word: 'consumer spending', relation: 'related' },
      { word: 'prices', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-fiscal-policy',
    word: 'fiscal policy',
    lemma: 'fiscal policy',
    pos: 'noun phrase',
    ipa: '/ˈfɪskl ˈpɒləsi/',
    definitions: [
      {
        text: 'The use of government spending and taxation to influence the level of activity in an economy.',
        textUz: "fiskal siyosat — davlat xarajatlari va soliqlar orqali iqtisodiyotga ta'sir qilish",
        domain: 'economics',
      },
    ],
    domains: ['economics'],
    cefr: 'C1',
    collocations: [
      { text: 'tighten fiscal policy', corpusCount: 420, verified: true },
      { text: 'expansionary fiscal policy', corpusCount: 560, verified: true },
      { text: 'fiscal consolidation', corpusCount: 780, verified: true },
      { text: 'fiscal stimulus' },
    ],
    synonyms: ['budgetary policy', 'tax and spending policy'],
    antonyms: ['monetary policy'],
    wordFamily: ['fiscal', 'fiscally', 'policy'],
    examples: [
      {
        sentence: 'Fiscal policy is expected to tighten gradually as pandemic support measures expire.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Pandemiya davridagi yordam choralari tugagani sari fiskal siyosat asta-sekin qattiqlashishi kutilmoqda.",
      },
      {
        sentence: 'The government announced a fiscal stimulus package worth 1.5 per cent of GDP.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A ministry of finance analyst uses this term when explaining how a new tax measure fits the overall strategy of the government.',
    communicativeTask:
      'Write one sentence describing one fiscal policy measure your government has taken recently.',
    semanticLinks: [
      { word: 'monetary policy', relation: 'opposite' },
      { word: 'subsidy', relation: 'part_of' },
      { word: 'gross domestic product', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-unemployment-rate',
    word: 'unemployment rate',
    lemma: 'unemployment rate',
    pos: 'noun phrase',
    ipa: '/ˌʌnɪmˈplɔɪmənt reɪt/',
    definitions: [
      {
        text: 'The percentage of people in the labour force who are looking for work but do not have a job.',
        textUz: "ishsizlik darajasi — ish qidirayotgan, biroq ishi yo'q kishilarning mehnat resurslaridagi ulushi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'management'],
    cefr: 'B1',
    collocations: [
      { text: 'the youth unemployment rate', corpusCount: 640, verified: true },
      { text: 'a rise in the unemployment rate', corpusCount: 480, verified: true },
      { text: 'the unemployment rate fell to', corpusCount: 720, verified: true },
      { text: 'a record low unemployment rate' },
    ],
    synonyms: ['jobless rate'],
    antonyms: ['employment rate'],
    wordFamily: ['employ', 'employment', 'unemployment', 'unemployed', 'employer'],
    examples: [
      {
        sentence: 'The unemployment rate fell to 4.9 per cent, the lowest reading since 2019.',
        source: 'central bank statement (style)',
        translationUz: "Ishsizlik darajasi 4,9 foizga tushdi — bu 2019 yildan beri eng past ko'rsatkich.",
      },
      {
        sentence: 'Youth unemployment remains more than twice the national unemployment rate.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'A labour market analyst uses this term when presenting monthly statistics at a ministry briefing.',
    communicativeTask:
      'Write one sentence stating the unemployment rate in your country and how it has changed.',
    semanticLinks: [
      { word: 'recession', relation: 'caused_by' },
      { word: 'economic growth', relation: 'related' },
      { word: 'data', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-economic-growth',
    word: 'economic growth',
    lemma: 'economic growth',
    pos: 'noun phrase',
    ipa: '/ˌiːkəˈnɒmɪk ɡrəʊθ/',
    definitions: [
      {
        text: 'An increase over time in the amount of goods and services an economy produces.',
        textUz: "iqtisodiy o'sish — iqtisodiyotda ishlab chiqarilayotgan tovar va xizmatlar hajmining ortishi",
        domain: 'economics',
      },
    ],
    domains: ['economics'],
    cefr: 'B1',
    collocations: [
      { text: 'sustainable economic growth', corpusCount: 860, verified: true },
      { text: 'drive economic growth', corpusCount: 620, verified: true },
      { text: 'slow economic growth', corpusCount: 940, verified: true },
      { text: 'the pace of economic growth' },
    ],
    synonyms: ['expansion', 'output growth'],
    antonyms: ['recession', 'contraction'],
    wordFamily: ['economy', 'economic', 'economics', 'economist', 'grow', 'growth'],
    examples: [
      {
        sentence: 'Economic growth in emerging markets is projected to moderate to 4.2 per cent.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Rivojlanayotgan bozorlarda iqtisodiy o'sish 4,2 foizgacha sekinlashishi prognoz qilinmoqda.",
      },
      {
        sentence: 'Higher productivity, not just more workers, is what drives long-run economic growth.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'An economist uses this phrase when writing the opening paragraph of a country outlook for investors.',
    communicativeTask:
      'Write one sentence naming the main driver of economic growth in your country and explain why.',
    semanticLinks: [
      { word: 'gross domestic product', relation: 'measure_of' },
      { word: 'recession', relation: 'opposite' },
      { word: 'productivity', relation: 'caused_by' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-scarcity',
    word: 'scarcity',
    lemma: 'scarcity',
    pos: 'noun',
    ipa: '/ˈskeəsəti/',
    definitions: [
      {
        text: 'The situation in which resources are limited while human wants are unlimited.',
        textUz: "cheklanganlik, taqchillik — resurslar cheklangan, ehtiyojlar esa cheksiz bo'lgan holat",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'academic'],
    cefr: 'B2',
    collocations: [
      { text: 'water scarcity', corpusCount: 980, verified: true },
      { text: 'the scarcity of resources', corpusCount: 420, verified: true },
      { text: 'relative scarcity', corpusCount: 160, verified: true },
      { text: 'a scarcity of skilled labour' },
    ],
    synonyms: ['shortage', 'lack', 'limited supply'],
    antonyms: ['abundance', 'surplus'],
    wordFamily: ['scarce', 'scarcely', 'scarcity'],
    examples: [
      {
        sentence: 'Scarcity of skilled labour is now the main constraint on expansion in the sector.',
        source: 'World Bank country report (style)',
        translationUz:
          "Malakali ishchi kuchining taqchilligi hozir sohadagi kengayishga asosiy to'siq bo'lmoqda.",
      },
      {
        sentence: 'Economics begins from the fact of scarcity: societies must choose between competing uses.',
        source: 'academic textbook (style)',
      },
    ],
    professionalContext:
      'A lecturer or trainee economist uses this term when explaining why every economic decision involves a trade-off.',
    communicativeTask:
      'Write one sentence naming a resource that is scarce in your region and explaining one consequence.',
    semanticLinks: [
      { word: 'supply', relation: 'related' },
      { word: 'demand', relation: 'related' },
      { word: 'prices', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-market-equilibrium',
    word: 'market equilibrium',
    lemma: 'market equilibrium',
    pos: 'noun phrase',
    ipa: '/ˈmɑːkɪt ˌiːkwɪˈlɪbriəm/',
    definitions: [
      {
        text: 'The state of a market in which the quantity supplied equals the quantity demanded, so the price is stable.',
        textUz: "bozor muvozanati — taklif va talab teng bo'lib, narx barqaror turgan holat",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'academic'],
    cefr: 'C1',
    collocations: [
      { text: 'reach market equilibrium', corpusCount: 140, verified: true },
      { text: 'the equilibrium price', corpusCount: 620, verified: true },
      { text: 'restore equilibrium', corpusCount: 260, verified: true },
      { text: 'move away from equilibrium' },
    ],
    synonyms: ['market balance'],
    antonyms: ['disequilibrium', 'market failure'],
    wordFamily: ['equilibrium', 'equilibrate', 'market'],
    examples: [
      {
        sentence: 'At the equilibrium price of 12 dollars, supply and demand are exactly balanced.',
        source: 'academic textbook (style)',
        translationUz: "12 dollarlik muvozanat narxida taklif va talab to'liq teng bo'ladi.",
      },
      {
        sentence: 'Price controls prevent the market from returning to equilibrium after a supply shock.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A regulatory economist uses this concept when arguing whether a price cap will create shortages.',
    communicativeTask:
      'Explain in one sentence what happens to the price when demand rises but supply stays the same.',
    semanticLinks: [
      { word: 'supply', relation: 'part_of' },
      { word: 'demand', relation: 'part_of' },
      { word: 'prices', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-subsidy',
    word: 'subsidy',
    lemma: 'subsidy',
    pos: 'noun',
    ipa: '/ˈsʌbsədi/',
    definitions: [
      {
        text: 'Money paid by a government to producers or consumers in order to keep a price lower than it would otherwise be.',
        textUz: "subsidiya — narxni pasaytirish uchun davlat tomonidan beriladigan moliyaviy yordam",
        domain: 'economics',
      },
    ],
    domains: ['economics'],
    cefr: 'B2',
    collocations: [
      { text: 'phase out subsidies', corpusCount: 380, verified: true },
      { text: 'a fuel subsidy', corpusCount: 620, verified: true },
      { text: 'receive a subsidy', corpusCount: 440, verified: true },
      { text: 'targeted subsidies' },
    ],
    synonyms: ['grant', 'support payment'],
    antonyms: ['tax', 'levy'],
    wordFamily: ['subsidy', 'subsidise', 'subsidised', 'subsidiary'],
    examples: [
      {
        sentence: 'The government plans to phase out energy subsidies over a three-year period.',
        source: 'IMF World Economic Outlook (style)',
        translationUz: "Hukumat energiya subsidiyalarini uch yil ichida bosqichma-bosqich bekor qilishni rejalashtirmoqda.",
      },
      {
        sentence: 'Targeted subsidies protect poorer households more cheaply than universal price caps.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A public finance specialist uses this noun when advising a ministry on how to reduce budget spending without harming poor households.',
    communicativeTask:
      'Write one sentence naming a subsidy that exists in your country and stating who benefits from it.',
    semanticLinks: [
      { word: 'fiscal policy', relation: 'part_of' },
      { word: 'tariff', relation: 'related' },
      { word: 'prices', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-tariff',
    word: 'tariff',
    lemma: 'tariff',
    pos: 'noun',
    ipa: '/ˈtærɪf/',
    definitions: [
      {
        text: 'A tax that a government charges on goods coming into or going out of a country.',
        textUz: "bojxona tarifi — mamlakatga kiritilayotgan yoki chiqarilayotgan tovarlarga solinadigan soliq",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'business_communication'],
    cefr: 'B2',
    collocations: [
      { text: 'impose a tariff', corpusCount: 720, verified: true },
      { text: 'lift tariffs', corpusCount: 340, verified: true },
      { text: 'an import tariff', corpusCount: 880, verified: true },
      { text: 'tariff barriers' },
    ],
    synonyms: ['duty', 'customs duty', 'levy'],
    antonyms: ['free trade'],
    wordFamily: ['tariff', 'tariffication'],
    examples: [
      {
        sentence: 'New tariffs on imported steel raised input costs for the construction industry.',
        source: 'business press (style)',
        translationUz:
          "Import po'latga joriy etilgan yangi tariflar qurilish sanoatida xomashyo xarajatlarini oshirdi.",
      },
      {
        sentence: 'The agreement removes tariffs on 92 per cent of goods traded between the two countries.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'An export manager uses this noun when calculating the landed cost of goods for a foreign customer.',
    communicativeTask:
      'Write one sentence explaining how an import tariff would affect the price of a product you buy.',
    semanticLinks: [
      { word: 'trade deficit', relation: 'related' },
      { word: 'subsidy', relation: 'related' },
      { word: 'prices', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-productivity',
    word: 'productivity',
    lemma: 'productivity',
    pos: 'noun',
    ipa: '/ˌprɒdʌkˈtɪvəti/',
    definitions: [
      {
        text: 'How much output is produced for each unit of input, especially for each hour of work.',
        textUz: "unumdorlik — sarflangan har bir resurs, ayniqsa ish soatiga to'g'ri keladigan mahsulot hajmi",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'labour productivity', corpusCount: 1420, verified: true },
      { text: 'raise productivity', corpusCount: 680, verified: true },
      { text: 'productivity growth', corpusCount: 1260, verified: true },
      { text: 'a productivity gap' },
    ],
    synonyms: ['efficiency', 'output per worker'],
    antonyms: [],
    wordFamily: ['produce', 'product', 'production', 'productive', 'productivity'],
    examples: [
      {
        sentence: 'Labour productivity growth has slowed across most advanced economies since 2008.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "2008 yildan beri aksariyat rivojlangan iqtisodiyotlarda mehnat unumdorligi o'sishi sekinlashdi.",
      },
      {
        sentence: 'Investment in automation raised productivity in the packaging plant by 18 per cent.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An operations manager uses this noun when justifying investment in new equipment to the finance department.',
    communicativeTask:
      'Suggest in one sentence one practical way a company in your country could raise productivity.',
    semanticLinks: [
      { word: 'economic growth', relation: 'causes' },
      { word: 'key performance indicator', relation: 'related' },
      { word: 'workflow', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-stagflation',
    word: 'stagflation',
    lemma: 'stagflation',
    pos: 'noun',
    ipa: '/stæɡˈfleɪʃn/',
    definitions: [
      {
        text: 'A situation in which prices rise quickly at the same time as growth is weak and unemployment is high.',
        textUz: "stagflyatsiya — yuqori inflyatsiya, sust o'sish va yuqori ishsizlik bir vaqtda kuzatiladigan holat",
        domain: 'economics',
      },
    ],
    domains: ['economics'],
    cefr: 'C1',
    collocations: [
      { text: 'the risk of stagflation', corpusCount: 180, verified: true },
      { text: 'a stagflationary shock', corpusCount: 90, verified: true },
      { text: 'fears of stagflation', corpusCount: 140, verified: true },
      { text: 'avoid stagflation' },
    ],
    synonyms: [],
    antonyms: [],
    wordFamily: ['stagnate', 'stagnation', 'stagflation', 'stagflationary'],
    examples: [
      {
        sentence: 'A prolonged energy shock raises the risk of stagflation in import-dependent economies.',
        source: 'IMF World Economic Outlook (style)',
        translationUz:
          "Uzoq davom etgan energiya inqirozi importga bog'liq iqtisodiyotlarda stagflyatsiya xavfini oshiradi.",
      },
      {
        sentence: 'Policymakers face a difficult trade-off when inflation and unemployment rise together.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A strategist uses this term when warning clients that fighting inflation may deepen a slowdown.',
    communicativeTask:
      'Explain in one sentence why stagflation is harder for a central bank to fight than ordinary inflation.',
    semanticLinks: [
      { word: 'inflation', relation: 'part_of' },
      { word: 'unemployment rate', relation: 'part_of' },
      { word: 'recession', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-consumer-price-index',
    word: 'consumer price index',
    lemma: 'consumer price index',
    pos: 'noun phrase',
    ipa: '/kənˈsjuːmə ˈpraɪs ˌɪndeks/',
    definitions: [
      {
        text: 'A measure of the average change in the prices of a fixed basket of goods and services bought by households.',
        textUz: "iste'mol narxlari indeksi — uy xo'jaliklari sotib oladigan tovarlar savatining o'rtacha narx o'zgarishini o'lchovchi ko'rsatkich",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'academic'],
    cefr: 'C1',
    collocations: [
      { text: 'the consumer price index rose', corpusCount: 640, verified: true },
      { text: 'measured by the consumer price index', corpusCount: 380, verified: true },
      { text: 'the headline consumer price index', corpusCount: 220, verified: true },
      { text: 'a basket of goods' },
    ],
    synonyms: ['CPI', 'cost-of-living index'],
    antonyms: [],
    wordFamily: ['consume', 'consumer', 'price', 'index', 'indexation'],
    examples: [
      {
        sentence: 'The consumer price index rose 0.3 per cent on the month and 5.9 per cent on the year.',
        source: 'central bank statement (style)',
        translationUz: "Iste'mol narxlari indeksi oyiga 0,3 foizga, yiliga 5,9 foizga oshdi.",
      },
      {
        sentence: 'Pensions are indexed annually to the change in the consumer price index.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'A statistics office analyst uses this term when publishing the monthly inflation release.',
    communicativeTask:
      'Name three items you would put in a consumer price basket for students, and say why, in one sentence.',
    semanticLinks: [
      { word: 'inflation', relation: 'measure_of' },
      { word: 'prices', relation: 'measure_of' },
      { word: 'purchasing power', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-trade-deficit',
    word: 'trade deficit',
    lemma: 'trade deficit',
    pos: 'noun phrase',
    ipa: '/ˈtreɪd ˌdefɪsɪt/',
    definitions: [
      {
        text: 'The situation in which a country imports goods and services worth more than the ones it exports.',
        textUz: "savdo taqchilligi — import qiymati eksport qiymatidan yuqori bo'lgan holat",
        domain: 'economics',
      },
    ],
    domains: ['economics', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'narrow the trade deficit', corpusCount: 260, verified: true },
      { text: 'a widening trade deficit', corpusCount: 340, verified: true },
      { text: 'run a trade deficit', corpusCount: 420, verified: true },
      { text: 'the trade deficit as a share of GDP' },
    ],
    synonyms: ['negative trade balance'],
    antonyms: ['trade surplus'],
    wordFamily: ['trade', 'trader', 'trading', 'deficit'],
    examples: [
      {
        sentence: 'The trade deficit widened to 6.2 per cent of GDP as import volumes rose.',
        source: 'World Bank country report (style)',
        translationUz: "Import hajmi oshgani sababli savdo taqchilligi YaIMning 6,2 foiziga yetdi.",
      },
      {
        sentence: 'A weaker currency should help narrow the trade deficit over the medium term.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A balance-of-payments analyst uses this term when explaining to journalists why the national currency is under pressure.',
    communicativeTask:
      'Write one sentence stating whether your country runs a trade deficit or surplus and with which partners.',
    semanticLinks: [
      { word: 'tariff', relation: 'related' },
      { word: 'exchange rate', relation: 'causes' },
      { word: 'gross domestic product', relation: 'related' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 4. FINANCE — moliya va hisobot                                    */
  /* ================================================================ */
  {
    id: 'lx-profit',
    word: 'profit',
    lemma: 'profit',
    pos: 'noun',
    ipa: '/ˈprɒfɪt/',
    definitions: [
      {
        text: 'The money a business has left after all its costs have been paid.',
        textUz: "foyda — barcha xarajatlar qoplangandan keyin qoladigan pul",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'general'],
    cefr: 'B1',
    collocations: [
      { text: 'make a profit', corpusCount: 2240, verified: true },
      { text: 'net profit', corpusCount: 1860, verified: true },
      { text: 'profit margin', corpusCount: 1540, verified: true },
      { text: 'boost profits' },
      { text: 'a fall in profits' },
    ],
    synonyms: ['earnings', 'net income', 'surplus'],
    antonyms: ['loss'],
    wordFamily: ['profit', 'profitable', 'profitability', 'profitably', 'unprofitable'],
    examples: [
      {
        sentence: 'The group made a pre-tax profit of 118 million dollars, up 9 per cent on the year.',
        source: 'annual report',
        translationUz: "Guruh soliqdan oldingi 118 million dollar foyda oldi, bu yiliga 9 foizga ko'p.",
      },
      {
        sentence: 'Profits in the banking sector were supported by wider interest margins.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A financial controller uses this noun when presenting the year-end results to shareholders at the annual meeting.',
    communicativeTask:
      'Write one sentence explaining the difference between revenue and profit in your own words.',
    semanticLinks: [
      { word: 'revenue', relation: 'related' },
      { word: 'net profit margin', relation: 'measure_of' },
      { word: 'cost', relation: 'caused_by' },
      { word: 'dividend', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-revenue',
    word: 'revenue',
    lemma: 'revenue',
    pos: 'noun',
    ipa: '/ˈrevənjuː/',
    definitions: [
      {
        text: 'The total money a company receives from selling its goods or services, before any costs are taken off.',
        textUz: "tushum, daromad — xarajatlar chegirilmasdan oldin sotuvdan olingan umumiy pul",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'marketing'],
    cefr: 'B1',
    collocations: [
      { text: 'generate revenue', corpusCount: 1680, verified: true },
      { text: 'revenue growth', corpusCount: 1920, verified: true },
      { text: 'annual revenue', corpusCount: 1440, verified: true },
      { text: 'a decline in revenue' },
    ],
    synonyms: ['turnover', 'sales', 'income'],
    antonyms: ['expenditure', 'cost'],
    wordFamily: ['revenue', 'revenues'],
    examples: [
      {
        sentence: 'Group revenue reached 2.4 billion euros, an increase of 11 per cent at constant currency.',
        source: 'annual report',
        translationUz: "Guruh tushumi 2,4 milliard evroga yetdi, bu o'zgarmas valyuta kursida 11 foiz o'sish.",
      },
      {
        sentence: 'Digital services now account for almost a third of total revenue.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A financial analyst uses this noun when comparing the top line of two competing companies in a valuation model.',
    communicativeTask:
      'Write one sentence describing how a company you know generates most of its revenue.',
    semanticLinks: [
      { word: 'profit', relation: 'related' },
      { word: 'cost', relation: 'opposite' },
      { word: 'cash flow', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-asset',
    word: 'asset',
    lemma: 'asset',
    pos: 'noun',
    ipa: '/ˈæset/',
    definitions: [
      {
        text: 'Something valuable that a company or person owns and that can produce economic benefit.',
        textUz: "aktiv — kompaniya yoki shaxsga tegishli, iqtisodiy naf keltiruvchi qimmatli mulk",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'fixed assets', corpusCount: 1520, verified: true },
      { text: 'current assets', corpusCount: 1380, verified: true },
      { text: 'total assets', corpusCount: 1740, verified: true },
      { text: 'dispose of an asset' },
      { text: 'asset management' },
    ],
    synonyms: ['holding', 'property', 'resource'],
    antonyms: ['liability'],
    wordFamily: ['asset', 'assets'],
    examples: [
      {
        sentence: 'Total assets rose to 6.1 billion dollars, mainly because of the new distribution centre.',
        source: 'annual report',
        translationUz:
          "Yangi taqsimlash markazi hisobiga umumiy aktivlar 6,1 milliard dollarga yetdi.",
      },
      {
        sentence: 'Banks are required to hold high-quality liquid assets against short-term outflows.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'An accountant uses this noun when classifying items on the left-hand side of a balance sheet.',
    communicativeTask:
      'List two assets a small café would own and write one sentence explaining why they are assets.',
    semanticLinks: [
      { word: 'liability', relation: 'opposite' },
      { word: 'balance sheet', relation: 'part_of' },
      { word: 'equity', relation: 'related' },
      { word: 'depreciation', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-liability',
    word: 'liability',
    lemma: 'liability',
    pos: 'noun',
    ipa: '/ˌlaɪəˈbɪləti/',
    definitions: [
      {
        text: 'An amount of money that a company or person owes to somebody else.',
        textUz: "majburiyat, passiv — kompaniya yoki shaxs boshqalarga to'lashi lozim bo'lgan summa",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'current liabilities', corpusCount: 1240, verified: true },
      { text: 'long-term liabilities', corpusCount: 860, verified: true },
      { text: 'assets and liabilities', corpusCount: 1620, verified: true },
      { text: 'settle a liability' },
    ],
    synonyms: ['obligation', 'debt'],
    antonyms: ['asset'],
    wordFamily: ['liable', 'liability', 'liabilities'],
    examples: [
      {
        sentence: 'Current liabilities exceeded current assets, raising questions about short-term liquidity.',
        source: 'annual report',
        translationUz:
          "Joriy majburiyatlar joriy aktivlardan oshib ketdi, bu qisqa muddatli likvidlik borasida savol tug'dirdi.",
      },
      {
        sentence: 'Pension liabilities are measured using a discount rate of 4.1 per cent.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An auditor uses this noun when checking that all amounts owed by a company have been correctly recorded.',
    communicativeTask:
      'Write one sentence naming a liability that a typical student might have.',
    semanticLinks: [
      { word: 'asset', relation: 'opposite' },
      { word: 'balance sheet', relation: 'part_of' },
      { word: 'loan', relation: 'hyponym' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-equity',
    word: 'equity',
    lemma: 'equity',
    pos: 'noun',
    ipa: '/ˈekwəti/',
    definitions: [
      {
        text: 'The value of a company that belongs to its owners after all debts have been subtracted.',
        textUz: "o'z kapitali — barcha qarzlar chegirilgandan keyin egalarga tegishli bo'lgan qiymat",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'shareholders equity', corpusCount: 1180, verified: true },
      { text: 'return on equity', corpusCount: 1460, verified: true },
      { text: 'raise equity', corpusCount: 520, verified: true },
      { text: 'private equity' },
    ],
    synonyms: ['shareholders funds', 'net worth', 'ownership capital'],
    antonyms: ['debt'],
    wordFamily: ['equity', 'equities', 'equitable'],
    examples: [
      {
        sentence: 'Return on equity improved to 13.4 per cent from 11.8 per cent a year earlier.',
        source: 'annual report',
        translationUz: "O'z kapitali rentabelligi bir yil oldingi 11,8 foizdan 13,4 foizga yaxshilandi.",
      },
      {
        sentence: 'The company chose to raise equity rather than take on additional debt.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A corporate finance adviser uses this noun when comparing the cost of issuing shares with the cost of borrowing.',
    communicativeTask:
      'Explain in one sentence what happens to equity if a company takes on more debt but its assets stay the same.',
    semanticLinks: [
      { word: 'asset', relation: 'related' },
      { word: 'liability', relation: 'related' },
      { word: 'shareholder', relation: 'related' },
      { word: 'balance sheet', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-cash-flow',
    word: 'cash flow',
    lemma: 'cash flow',
    pos: 'noun phrase',
    ipa: '/ˈkæʃ fləʊ/',
    definitions: [
      {
        text: 'The movement of money into and out of a business over a period of time.',
        textUz: "pul oqimi — ma'lum davrda korxonaga kirib chiqadigan pul harakati",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'free cash flow', corpusCount: 1620, verified: true },
      { text: 'cash flow from operations', corpusCount: 1140, verified: true },
      { text: 'improve cash flow', corpusCount: 640, verified: true },
      { text: 'a cash flow problem' },
    ],
    synonyms: ['cash generation'],
    antonyms: [],
    wordFamily: ['cash', 'flow', 'cashflow'],
    examples: [
      {
        sentence: 'Free cash flow of 210 million dollars allowed the group to reduce net debt.',
        source: 'annual report',
        translationUz:
          "210 million dollarlik erkin pul oqimi guruhga sof qarzni kamaytirish imkonini berdi.",
      },
      {
        sentence: 'Many profitable small firms fail because of weak cash flow rather than weak sales.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A treasurer uses this term when explaining to a bank why the company needs a short-term credit line despite being profitable.',
    communicativeTask:
      'Write one sentence explaining why a profitable business can still run out of cash.',
    semanticLinks: [
      { word: 'liquidity', relation: 'related' },
      { word: 'profit', relation: 'related' },
      { word: 'revenue', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-dividend',
    word: 'dividend',
    lemma: 'dividend',
    pos: 'noun',
    ipa: '/ˈdɪvɪdend/',
    definitions: [
      {
        text: 'A part of the profit of a company that is paid to the people who own its shares.',
        textUz: "dividend — kompaniya foydasining aksiyadorlarga to'lanadigan qismi",
        domain: 'finance',
      },
    ],
    domains: ['finance'],
    cefr: 'B2',
    collocations: [
      { text: 'pay a dividend', corpusCount: 1340, verified: true },
      { text: 'cut the dividend', corpusCount: 620, verified: true },
      { text: 'dividend yield', corpusCount: 980, verified: true },
      { text: 'an interim dividend' },
    ],
    synonyms: ['payout', 'distribution'],
    antonyms: [],
    wordFamily: ['divide', 'dividend', 'dividends'],
    examples: [
      {
        sentence: 'The board proposed a final dividend of 0.42 dollars per share, up 5 per cent.',
        source: 'annual report',
        translationUz: "Kengash har bir aksiya uchun 0,42 dollar yakuniy dividend taklif qildi, bu 5 foizga ko'p.",
      },
      {
        sentence: 'Several utilities cut their dividends in order to fund the transition to renewables.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'An investor relations officer uses this noun when answering shareholder questions about how profits will be shared.',
    communicativeTask:
      'Write one sentence explaining why a growing company might decide not to pay a dividend.',
    semanticLinks: [
      { word: 'shareholder', relation: 'related' },
      { word: 'profit', relation: 'caused_by' },
      { word: 'yield', relation: 'measure_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-shareholder',
    word: 'shareholder',
    lemma: 'shareholder',
    pos: 'noun',
    ipa: '/ˈʃeəhəʊldə/',
    definitions: [
      {
        text: 'A person or organisation that owns shares in a company and therefore owns part of it.',
        textUz: "aksiyador — kompaniya aksiyalariga ega bo'lgan va shu orqali uning bir qismiga egalik qiluvchi shaxs",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'shareholder value', corpusCount: 1420, verified: true },
      { text: 'a majority shareholder', corpusCount: 720, verified: true },
      { text: 'the annual shareholders meeting', corpusCount: 480, verified: true },
      { text: 'return cash to shareholders' },
    ],
    synonyms: ['stockholder', 'investor'],
    antonyms: ['creditor'],
    wordFamily: ['share', 'shareholder', 'shareholding'],
    examples: [
      {
        sentence: 'Shareholders approved the remuneration report with 94 per cent of votes in favour.',
        source: 'annual report',
        translationUz:
          "Aksiyadorlar ovozlarning 94 foizi bilan mukofotlash hisobotini tasdiqladi.",
      },
      {
        sentence: 'The strategy is designed to create long-term value for shareholders and employees alike.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A company secretary uses this noun when preparing the notice and voting papers for the annual general meeting.',
    communicativeTask:
      'Write one sentence explaining one right that a shareholder has in a company.',
    semanticLinks: [
      { word: 'equity', relation: 'related' },
      { word: 'dividend', relation: 'related' },
      { word: 'stakeholder', relation: 'hyponym' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-balance-sheet',
    word: 'balance sheet',
    lemma: 'balance sheet',
    pos: 'noun phrase',
    ipa: '/ˈbæləns ʃiːt/',
    definitions: [
      {
        text: 'A financial statement showing what a company owns and owes on a particular date.',
        textUz: "balans hisoboti — ma'lum sanada kompaniyaning aktivlari va majburiyatlarini ko'rsatuvchi moliyaviy hisobot",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'a strong balance sheet', corpusCount: 1160, verified: true },
      { text: 'repair the balance sheet', corpusCount: 280, verified: true },
      { text: 'off balance sheet', corpusCount: 640, verified: true },
      { text: 'balance sheet total' },
    ],
    synonyms: ['statement of financial position'],
    antonyms: [],
    wordFamily: ['balance', 'balanced', 'sheet'],
    examples: [
      {
        sentence: 'The company enters the downturn with a strong balance sheet and low net debt.',
        source: 'annual report',
        translationUz: "Kompaniya inqirozga mustahkam balans va past sof qarz bilan kirmoqda.",
      },
      {
        sentence: 'Banks have continued to strengthen their balance sheets since the last stress test.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A credit analyst uses this term when assessing whether a corporate borrower can survive a period of weak trading.',
    communicativeTask:
      'Name the three main sections of a balance sheet and write one sentence about what each shows.',
    semanticLinks: [
      { word: 'asset', relation: 'part_of' },
      { word: 'liability', relation: 'part_of' },
      { word: 'equity', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-capital-expenditure',
    word: 'capital expenditure',
    lemma: 'capital expenditure',
    pos: 'noun phrase',
    ipa: '/ˈkæpɪtl ɪkˈspendɪtʃə/',
    definitions: [
      {
        text: 'Money a company spends on buying or improving long-term assets such as buildings and machinery.',
        textUz: "kapital xarajatlar — bino va uskuna kabi uzoq muddatli aktivlarni sotib olish yoki yaxshilashga sarflanadigan pul",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'management'],
    cefr: 'C1',
    collocations: [
      { text: 'capital expenditure programme', corpusCount: 420, verified: true },
      { text: 'cut capital expenditure', corpusCount: 340, verified: true },
      { text: 'capital expenditure of', corpusCount: 560, verified: true },
      { text: 'approve capital expenditure' },
    ],
    synonyms: ['capex', 'capital investment'],
    antonyms: ['operating expenditure'],
    wordFamily: ['capital', 'capitalise', 'expend', 'expenditure'],
    examples: [
      {
        sentence: 'Capital expenditure of 340 million dollars was directed mainly at plant modernisation.',
        source: 'annual report',
        translationUz:
          "340 million dollarlik kapital xarajatlar asosan zavodni modernizatsiya qilishga yo'naltirildi.",
      },
      {
        sentence: 'Firms have postponed capital expenditure until borrowing costs fall.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A budget manager uses this term when asking the board to approve spending on new equipment.',
    communicativeTask:
      'Write one sentence distinguishing capital expenditure from everyday operating costs, with an example.',
    semanticLinks: [
      { word: 'asset', relation: 'related' },
      { word: 'depreciation', relation: 'causes' },
      { word: 'cash flow', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-net-profit-margin',
    word: 'net profit margin',
    lemma: 'net profit margin',
    pos: 'noun phrase',
    ipa: '/ˌnet ˈprɒfɪt ˌmɑːdʒɪn/',
    definitions: [
      {
        text: 'Profit after all costs and taxes expressed as a percentage of total revenue.',
        textUz: "sof foyda marjasi — barcha xarajat va soliqlardan keyingi foydaning tushumga nisbatan foizi",
        domain: 'finance',
      },
    ],
    domains: ['finance'],
    cefr: 'C1',
    collocations: [
      { text: 'a net profit margin of', corpusCount: 380, verified: true },
      { text: 'improve the net profit margin', corpusCount: 210, verified: true },
      { text: 'a thin margin', corpusCount: 460, verified: true },
      { text: 'margin pressure' },
    ],
    synonyms: ['net margin', 'profit ratio'],
    antonyms: [],
    wordFamily: ['net', 'profit', 'margin', 'marginal'],
    examples: [
      {
        sentence: 'The net profit margin narrowed to 6.3 per cent as energy and wage costs rose.',
        source: 'annual report',
        translationUz:
          "Energiya va ish haqi xarajatlari oshgani sababli sof foyda marjasi 6,3 foizgacha qisqardi.",
      },
      {
        sentence: 'Discount retailers typically operate on a net profit margin of under 3 per cent.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A management accountant uses this ratio when benchmarking a division against competitors in the same sector.',
    communicativeTask:
      'Calculate and describe in one sentence the net profit margin of a firm with revenue of 200 and profit of 14.',
    semanticLinks: [
      { word: 'profit', relation: 'measure_of' },
      { word: 'revenue', relation: 'related' },
      { word: 'key performance indicator', relation: 'hyponym' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-break-even-point',
    word: 'break-even point',
    lemma: 'break-even point',
    pos: 'noun phrase',
    ipa: '/ˌbreɪk ˈiːvn pɔɪnt/',
    definitions: [
      {
        text: 'The level of sales at which total revenue exactly covers total costs, so there is neither profit nor loss.',
        textUz: "zararsizlik nuqtasi — tushum xarajatlarni to'liq qoplaydigan, foyda ham, zarar ham bo'lmaydigan sotuv darajasi",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'reach break-even point', corpusCount: 260, verified: true },
      { text: 'calculate the break-even point', corpusCount: 180, verified: true },
      { text: 'break-even analysis', corpusCount: 420, verified: true },
      { text: 'operate below break-even' },
    ],
    synonyms: ['breakeven', 'zero-profit point'],
    antonyms: [],
    wordFamily: ['break', 'break-even', 'even'],
    examples: [
      {
        sentence: 'The new plant is expected to reach break-even point in its third year of operation.',
        source: 'annual report',
        translationUz: "Yangi zavod faoliyatining uchinchi yilida zararsizlik nuqtasiga chiqishi kutilmoqda.",
      },
      {
        sentence: 'Break-even analysis shows that the café must serve 85 customers a day to cover its costs.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'A start-up founder uses this term when showing an investor how many units must be sold before the business becomes viable.',
    communicativeTask:
      'Write one sentence explaining what would happen to a break-even point if fixed costs increased.',
    semanticLinks: [
      { word: 'cost', relation: 'part_of' },
      { word: 'revenue', relation: 'part_of' },
      { word: 'profit', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-depreciation',
    word: 'depreciation',
    lemma: 'depreciation',
    pos: 'noun',
    ipa: '/dɪˌpriːʃiˈeɪʃn/',
    definitions: [
      {
        text: 'The gradual loss in the value of a fixed asset, recorded as a cost over its useful life.',
        textUz: "amortizatsiya — asosiy vositaning xizmat muddati davomida qiymati asta-sekin kamayishi",
        domain: 'finance',
      },
      {
        text: 'A fall in the value of a currency against other currencies.',
        textUz: "valyuta qadrsizlanishi — milliy valyuta kursining boshqa valyutalarga nisbatan pasayishi",
        domain: 'banking',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'C1',
    collocations: [
      { text: 'depreciation and amortisation', corpusCount: 1240, verified: true },
      { text: 'charge depreciation', corpusCount: 240, verified: true },
      { text: 'currency depreciation', corpusCount: 860, verified: true },
      { text: 'straight-line depreciation' },
    ],
    synonyms: ['write-down', 'devaluation'],
    antonyms: ['appreciation'],
    wordFamily: ['depreciate', 'depreciation', 'depreciated', 'appreciate', 'appreciation'],
    examples: [
      {
        sentence: 'Depreciation and amortisation charges rose to 96 million dollars after the acquisition.',
        source: 'annual report',
        translationUz:
          "Sotib olishdan so'ng amortizatsiya xarajatlari 96 million dollarga ko'tarildi.",
      },
      {
        sentence: 'Sharp currency depreciation pushed up the local price of imported medicines.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'An accountant uses this noun when explaining to a client why a profit figure is lower than the cash actually generated.',
    communicativeTask:
      'Write one sentence explaining why depreciation is treated as a cost even though no cash leaves the company.',
    semanticLinks: [
      { word: 'asset', relation: 'related' },
      { word: 'capital expenditure', relation: 'caused_by' },
      { word: 'exchange rate', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-portfolio',
    word: 'portfolio',
    lemma: 'portfolio',
    pos: 'noun',
    ipa: '/pɔːtˈfəʊliəʊ/',
    definitions: [
      {
        text: 'The whole collection of investments or products held by a person, fund or company.',
        textUz: "portfel — shaxs, fond yoki kompaniya egallab turgan investitsiyalar yoki mahsulotlar majmuasi",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking', 'marketing'],
    cefr: 'B2',
    collocations: [
      { text: 'diversify a portfolio', corpusCount: 540, verified: true },
      { text: 'an investment portfolio', corpusCount: 1180, verified: true },
      { text: 'the loan portfolio', corpusCount: 920, verified: true },
      { text: 'portfolio performance' },
    ],
    synonyms: ['holdings', 'range'],
    antonyms: [],
    wordFamily: ['portfolio', 'portfolios'],
    examples: [
      {
        sentence: 'The fund diversified its portfolio by increasing exposure to emerging market bonds.',
        source: 'business press (style)',
        translationUz:
          "Fond rivojlanayotgan bozor obligatsiyalaridagi ulushini oshirib, portfelini diversifikatsiya qildi.",
      },
      {
        sentence: 'Impaired loans represent 3.2 per cent of the total loan portfolio of the bank.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A wealth adviser uses this noun when reviewing with a client how their savings are spread across different investments.',
    communicativeTask:
      'Write one sentence explaining why an investor should diversify a portfolio.',
    semanticLinks: [
      { word: 'asset', relation: 'part_of' },
      { word: 'yield', relation: 'measure_of' },
      { word: 'loan', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-yield',
    word: 'yield',
    lemma: 'yield',
    pos: 'noun',
    ipa: '/jiːld/',
    definitions: [
      {
        text: 'The income earned from an investment, shown as a percentage of the money invested.',
        textUz: "daromadlilik — investitsiyadan olinadigan daromadning sarflangan pulga nisbatan foizi",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'C1',
    collocations: [
      { text: 'bond yields', corpusCount: 1680, verified: true },
      { text: 'a dividend yield of', corpusCount: 620, verified: true },
      { text: 'yields rose', corpusCount: 1120, verified: true },
      { text: 'the yield curve' },
    ],
    synonyms: ['return', 'rate of return'],
    antonyms: [],
    wordFamily: ['yield', 'yielding', 'high-yield'],
    examples: [
      {
        sentence: 'Ten-year government bond yields rose 30 basis points after the inflation release.',
        source: 'business press (style)',
        translationUz:
          "Inflyatsiya ma'lumotlari e'lon qilingach, o'n yillik davlat obligatsiyalari daromadliligi 30 bazis punktga oshdi.",
      },
      {
        sentence: 'The shares now offer a dividend yield of 4.6 per cent at the current price.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A fixed-income analyst uses this noun when explaining to clients how bond prices and returns move in opposite directions.',
    communicativeTask:
      'Write one sentence explaining what happens to the yield of a bond when its market price falls.',
    semanticLinks: [
      { word: 'interest rate', relation: 'related' },
      { word: 'bond', relation: 'measure_of' },
      { word: 'dividend', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-audit',
    word: 'audit',
    lemma: 'audit',
    pos: 'noun',
    ipa: '/ˈɔːdɪt/',
    definitions: [
      {
        text: 'An official examination of the financial records of an organisation to check that they are accurate.',
        textUz: "audit — tashkilot moliyaviy hisobotlarining to'g'riligini rasmiy tekshirish",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'carry out an audit', corpusCount: 520, verified: true },
      { text: 'an internal audit', corpusCount: 940, verified: true },
      { text: 'the audit committee', corpusCount: 1080, verified: true },
      { text: 'an unqualified audit opinion' },
    ],
    synonyms: ['inspection', 'review', 'examination'],
    antonyms: [],
    wordFamily: ['audit', 'auditor', 'auditing', 'auditable'],
    examples: [
      {
        sentence: 'The external audit found no material misstatements in the consolidated accounts.',
        source: 'annual report',
        translationUz:
          "Tashqi audit konsolidatsiyalangan hisobotlarda jiddiy xatolik topmadi.",
      },
      {
        sentence: 'The audit committee met six times during the year to review internal controls.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A junior auditor uses this noun when explaining to a client company what documents will be examined and when.',
    communicativeTask:
      'Write one sentence explaining why investors trust financial statements that have been audited.',
    semanticLinks: [
      { word: 'balance sheet', relation: 'related' },
      { word: 'accountability', relation: 'related' },
      { word: 'findings', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-invest',
    word: 'invest',
    lemma: 'invest',
    pos: 'verb',
    ipa: '/ɪnˈvest/',
    definitions: [
      {
        text: 'To put money into a business, project or financial product in order to earn a return.',
        textUz: "investitsiya kiritmoq — daromad olish maqsadida biznes yoki loyihaga pul sarflamoq",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'economics'],
    cefr: 'B1',
    collocations: [
      { text: 'invest heavily in', corpusCount: 980, verified: true },
      { text: 'invest in infrastructure', corpusCount: 620, verified: true },
      { text: 'foreign direct investment', corpusCount: 1740, verified: true },
      { text: 'invest for the long term' },
    ],
    synonyms: ['put money into', 'fund', 'back'],
    antonyms: ['divest', 'withdraw'],
    wordFamily: ['invest', 'investment', 'investor', 'investable', 'divest'],
    examples: [
      {
        sentence: 'The group will invest 500 million dollars in renewable generation over five years.',
        source: 'annual report',
        translationUz:
          "Guruh besh yil ichida qayta tiklanuvchi energetikaga 500 million dollar investitsiya kiritadi.",
      },
      {
        sentence: 'Countries that invest consistently in education tend to grow faster over the long run.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'An investment officer uses this verb when writing the recommendation section of a project appraisal.',
    communicativeTask:
      'Write one sentence saying what you would invest in if you had 1,000 dollars, and why.',
    semanticLinks: [
      { word: 'portfolio', relation: 'related' },
      { word: 'capital expenditure', relation: 'related' },
      { word: 'economic growth', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-bond',
    word: 'bond',
    lemma: 'bond',
    pos: 'noun',
    ipa: '/bɒnd/',
    definitions: [
      {
        text: 'A certificate showing that an investor has lent money to a government or company and will be repaid with interest.',
        textUz: "obligatsiya — investorning davlat yoki kompaniyaga qarz berganini va foiz bilan qaytarilishini tasdiqlovchi qimmatli qog'oz",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'B2',
    collocations: [
      { text: 'issue a bond', corpusCount: 1140, verified: true },
      { text: 'government bonds', corpusCount: 1920, verified: true },
      { text: 'a corporate bond', corpusCount: 1060, verified: true },
      { text: 'redeem a bond' },
    ],
    synonyms: ['debt security', 'note'],
    antonyms: ['share'],
    wordFamily: ['bond', 'bondholder', 'bonded'],
    examples: [
      {
        sentence: 'The ministry issued a ten-year bond worth 600 million dollars at a coupon of 6.5 per cent.',
        source: 'business press (style)',
        translationUz:
          "Vazirlik 6,5 foizli kupon bilan 600 million dollarlik o'n yillik obligatsiya chiqardi.",
      },
      {
        sentence: 'Investors moved into government bonds as expectations of rate cuts increased.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A debt capital markets analyst uses this noun when advising a company on how to raise long-term funding.',
    communicativeTask:
      'Write one sentence explaining the main difference between buying a bond and buying a share.',
    semanticLinks: [
      { word: 'yield', relation: 'related' },
      { word: 'interest rate', relation: 'related' },
      { word: 'equity', relation: 'opposite' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-securitisation',
    word: 'securitisation',
    lemma: 'securitisation',
    pos: 'noun',
    ipa: '/sɪˌkjʊərɪtaɪˈzeɪʃn/',
    definitions: [
      {
        text: 'The practice of turning a group of loans into tradable securities that investors can buy.',
        textUz: "sekyuritizatsiya — kreditlar to'plamini investorlar sotib oladigan qimmatli qog'ozlarga aylantirish",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'banking'],
    cefr: 'C1',
    collocations: [
      { text: 'mortgage securitisation', corpusCount: 220, verified: true },
      { text: 'the securitisation market', corpusCount: 340, verified: true },
      { text: 'securitisation of assets', corpusCount: 160, verified: true },
      { text: 'a securitisation vehicle' },
    ],
    synonyms: ['asset-backed financing'],
    antonyms: [],
    wordFamily: ['secure', 'security', 'securities', 'securitise', 'securitisation'],
    examples: [
      {
        sentence: 'Securitisation allows banks to move loans off the balance sheet and free up capital.',
        source: 'central bank statement (style)',
        translationUz:
          "Sekyuritizatsiya banklarga kreditlarni balansdan chiqarib, kapitalni bo'shatish imkonini beradi.",
      },
      {
        sentence: 'Poorly understood securitisation of subprime mortgages was central to the 2008 crisis.',
        source: 'academic textbook (style)',
      },
    ],
    professionalContext:
      'A structured finance specialist uses this term when explaining to a supervisor how a bank has funded its mortgage book.',
    communicativeTask:
      'Explain in one sentence one benefit and one risk of securitisation for a bank.',
    semanticLinks: [
      { word: 'mortgage', relation: 'related' },
      { word: 'liquidity', relation: 'causes' },
      { word: 'balance sheet', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-working-capital',
    word: 'working capital',
    lemma: 'working capital',
    pos: 'noun phrase',
    ipa: '/ˌwɜːkɪŋ ˈkæpɪtl/',
    definitions: [
      {
        text: 'The money a business needs for its day-to-day operations, calculated as current assets minus current liabilities.',
        textUz: "aylanma mablag' — kundalik faoliyat uchun zarur pul; joriy aktivlardan joriy majburiyatlar ayirilgan qiymat",
        domain: 'finance',
      },
    ],
    domains: ['finance', 'management'],
    cefr: 'C1',
    collocations: [
      { text: 'working capital requirements', corpusCount: 520, verified: true },
      { text: 'manage working capital', corpusCount: 380, verified: true },
      { text: 'a working capital facility', corpusCount: 260, verified: true },
      { text: 'tie up working capital' },
    ],
    synonyms: ['operating capital'],
    antonyms: [],
    wordFamily: ['work', 'working', 'capital', 'capitalise'],
    examples: [
      {
        sentence: 'Tighter inventory control released 45 million dollars of working capital during the year.',
        source: 'annual report',
        translationUz:
          "Zaxiralar ustidan qattiqroq nazorat yil davomida 45 million dollar aylanma mablag' bo'shatdi.",
      },
      {
        sentence: 'Small exporters often need a working capital facility to bridge long payment terms.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'A relationship manager uses this term when structuring a short-term credit line for a trading company.',
    communicativeTask:
      'Write one sentence explaining why a company with growing sales may still need more working capital.',
    semanticLinks: [
      { word: 'cash flow', relation: 'related' },
      { word: 'liquidity', relation: 'related' },
      { word: 'asset', relation: 'part_of' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 5. BANKING — bank ishi va kredit                                  */
  /* ================================================================ */
  {
    id: 'lx-loan',
    word: 'loan',
    lemma: 'loan',
    pos: 'noun',
    ipa: '/ləʊn/',
    definitions: [
      {
        text: 'A sum of money borrowed from a bank or other lender that must be paid back with interest.',
        textUz: "kredit, qarz — bankdan olinadigan va foizi bilan qaytariladigan pul mablag'i",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'B1',
    collocations: [
      { text: 'apply for a loan', corpusCount: 1240, verified: true },
      { text: 'repay a loan', corpusCount: 980, verified: true },
      { text: 'issue a loan', corpusCount: 420, verified: true },
      { text: 'a loan agreement' },
      { text: 'take out a loan' },
    ],
    synonyms: ['credit', 'advance', 'borrowing'],
    antonyms: ['deposit'],
    wordFamily: ['loan', 'lend', 'lender', 'lending', 'borrower'],
    examples: [
      {
        sentence: 'The bank issued 12,400 new consumer loans during the second half of the year.',
        source: 'annual report',
        translationUz: "Bank yilning ikkinchi yarmida 12 400 ta yangi iste'mol krediti berdi.",
      },
      {
        sentence: 'Households are finding it harder to repay loans as interest rates rise.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A loan officer uses this noun when guiding a small business customer through the application process.',
    communicativeTask:
      'Write one sentence explaining what documents a student would need to apply for a loan in your country.',
    semanticLinks: [
      { word: 'interest rate', relation: 'related' },
      { word: 'collateral', relation: 'part_of' },
      { word: 'default', relation: 'causes' },
      { word: 'deposit', relation: 'opposite' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-interest-rate',
    word: 'interest rate',
    lemma: 'interest rate',
    pos: 'noun phrase',
    ipa: '/ˈɪntrəst reɪt/',
    definitions: [
      {
        text: 'The percentage charged for borrowing money or paid for keeping money in an account.',
        textUz: "foiz stavkasi — qarz olish uchun undiriladigan yoki omonatga to'lanadigan foiz",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'economics'],
    cefr: 'B1',
    collocations: [
      { text: 'raise interest rates', corpusCount: 1860, verified: true },
      { text: 'cut interest rates', corpusCount: 1620, verified: true },
      { text: 'a fixed interest rate', corpusCount: 940, verified: true },
      { text: 'the base interest rate' },
    ],
    synonyms: ['rate of interest', 'borrowing rate'],
    antonyms: [],
    wordFamily: ['interest', 'interest-bearing', 'rate'],
    examples: [
      {
        sentence: 'The central bank raised its key interest rate by 50 basis points to 14 per cent.',
        source: 'central bank statement (style)',
        translationUz: "Markaziy bank asosiy foiz stavkasini 50 bazis punktga oshirib, 14 foizga yetkazdi.",
      },
      {
        sentence: 'Higher interest rates have begun to cool demand for mortgages.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A credit analyst uses this term when explaining to a client why the interest rate on their loan has changed.',
    communicativeTask:
      'Write one sentence explaining how a rise in interest rates affects people who have a mortgage.',
    semanticLinks: [
      { word: 'monetary policy', relation: 'part_of' },
      { word: 'loan', relation: 'related' },
      { word: 'inflation', relation: 'related' },
      { word: 'central bank', relation: 'caused_by' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-mortgage',
    word: 'mortgage',
    lemma: 'mortgage',
    pos: 'noun',
    ipa: '/ˈmɔːɡɪdʒ/',
    definitions: [
      {
        text: 'A long-term loan used to buy property, where the property itself acts as security for the lender.',
        textUz: "ipoteka — uy-joy sotib olish uchun beriladigan va shu mulk garovga qo'yiladigan uzoq muddatli kredit",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'take out a mortgage', corpusCount: 780, verified: true },
      { text: 'mortgage repayments', corpusCount: 920, verified: true },
      { text: 'a fixed-rate mortgage', corpusCount: 640, verified: true },
      { text: 'mortgage arrears' },
    ],
    synonyms: ['home loan', 'property loan'],
    antonyms: [],
    wordFamily: ['mortgage', 'mortgagor', 'mortgagee'],
    examples: [
      {
        sentence: 'New mortgage lending fell by 22 per cent as borrowing costs reached a ten-year high.',
        source: 'central bank statement (style)',
        translationUz:
          "Qarz olish narxi o'n yildagi eng yuqori darajaga chiqqach, yangi ipoteka kreditlari 22 foizga kamaydi.",
      },
      {
        sentence: 'Most borrowers in the portfolio hold fixed-rate mortgages maturing after 2030.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A mortgage adviser uses this noun when comparing fixed and variable products for a first-time buyer.',
    communicativeTask:
      'Write one sentence advising a friend whether to choose a fixed or a variable mortgage, with a reason.',
    semanticLinks: [
      { word: 'loan', relation: 'hyponym' },
      { word: 'collateral', relation: 'part_of' },
      { word: 'interest rate', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-collateral',
    word: 'collateral',
    lemma: 'collateral',
    pos: 'noun',
    ipa: '/kəˈlætərəl/',
    definitions: [
      {
        text: 'Property or other valuable items promised to a lender, which can be taken if the loan is not repaid.',
        textUz: "garov — kredit qaytarilmasa, qarz beruvchiga o'tadigan qimmatli mulk",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'C1',
    collocations: [
      { text: 'provide collateral', corpusCount: 480, verified: true },
      { text: 'a lack of collateral', corpusCount: 320, verified: true },
      { text: 'accept property as collateral', corpusCount: 180, verified: true },
      { text: 'the value of the collateral' },
    ],
    synonyms: ['security', 'pledge', 'guarantee'],
    antonyms: ['unsecured credit'],
    wordFamily: ['collateral', 'collateralise', 'collateralised'],
    examples: [
      {
        sentence: 'Many small firms cannot borrow because they lack acceptable collateral.',
        source: 'World Bank country report (style)',
        translationUz:
          "Ko'plab kichik firmalar maqbul garovga ega bo'lmagani uchun kredit ola olmaydi.",
      },
      {
        sentence: 'The facility is secured by collateral valued at 1.4 times the outstanding balance.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A credit committee member uses this noun when deciding whether a business loan application carries acceptable risk.',
    communicativeTask:
      'Write one sentence explaining why a bank asks for collateral before granting a large loan.',
    semanticLinks: [
      { word: 'loan', relation: 'part_of' },
      { word: 'mortgage', relation: 'related' },
      { word: 'default', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-credit-rating',
    word: 'credit rating',
    lemma: 'credit rating',
    pos: 'noun phrase',
    ipa: '/ˈkredɪt ˌreɪtɪŋ/',
    definitions: [
      {
        text: 'An assessment of how likely a borrower is to repay debts, expressed as a grade such as AAA or BB.',
        textUz: "kredit reytingi — qarzdorning to'lov qobiliyatini AAA yoki BB kabi baho bilan ifodalovchi baholash",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'downgrade a credit rating', corpusCount: 520, verified: true },
      { text: 'a sovereign credit rating', corpusCount: 680, verified: true },
      { text: 'improve a credit rating', corpusCount: 340, verified: true },
      { text: 'a credit rating agency' },
    ],
    synonyms: ['credit score', 'debt rating'],
    antonyms: [],
    wordFamily: ['credit', 'creditor', 'rate', 'rating', 'creditworthiness'],
    examples: [
      {
        sentence: 'The agency downgraded the sovereign credit rating to BB with a negative outlook.',
        source: 'business press (style)',
        translationUz:
          "Agentlik davlat kredit reytingini salbiy prognoz bilan BB darajasiga tushirdi.",
      },
      {
        sentence: 'A stronger credit rating allowed the group to refinance at a lower coupon.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A treasury analyst uses this term when explaining to the board how a downgrade would raise the cost of borrowing.',
    communicativeTask:
      'Write one sentence naming two factors that could improve the credit rating of a company.',
    semanticLinks: [
      { word: 'creditworthiness', relation: 'measure_of' },
      { word: 'default', relation: 'related' },
      { word: 'bond', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-deposit',
    word: 'deposit',
    lemma: 'deposit',
    pos: 'noun',
    ipa: '/dɪˈpɒzɪt/',
    definitions: [
      {
        text: 'Money placed in a bank account, usually to be kept safe and to earn interest.',
        textUz: "omonat, depozit — bank hisobiga saqlash va foiz olish uchun qo'yilgan pul",
        domain: 'banking',
      },
    ],
    domains: ['banking'],
    cefr: 'B1',
    collocations: [
      { text: 'make a deposit', corpusCount: 640, verified: true },
      { text: 'a term deposit', corpusCount: 820, verified: true },
      { text: 'deposit account', corpusCount: 1140, verified: true },
      { text: 'attract deposits' },
    ],
    synonyms: ['savings', 'balance'],
    antonyms: ['withdrawal', 'loan'],
    wordFamily: ['deposit', 'depositor', 'deposited'],
    examples: [
      {
        sentence: 'Customer deposits grew 8 per cent as households moved savings into higher-rate accounts.',
        source: 'annual report',
        translationUz:
          "Uy xo'jaliklari jamg'armalarini yuqori foizli hisoblarga o'tkazgani sababli mijoz omonatlari 8 foizga o'sdi.",
      },
      {
        sentence: 'Deposits up to 200 million are covered by the national guarantee scheme.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A branch adviser uses this noun when explaining savings products and guarantee limits to a walk-in customer.',
    communicativeTask:
      'Write one sentence comparing a current account and a term deposit for someone saving for one year.',
    semanticLinks: [
      { word: 'withdraw', relation: 'opposite' },
      { word: 'interest rate', relation: 'related' },
      { word: 'bank statement', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-overdraft',
    word: 'overdraft',
    lemma: 'overdraft',
    pos: 'noun',
    ipa: '/ˈəʊvədrɑːft/',
    definitions: [
      {
        text: 'An arrangement that lets a customer take more money out of an account than it contains, up to an agreed limit.',
        textUz: "overdraft — hisobdagi mablag'dan ortiq, kelishilgan chegaragacha pul olish imkoniyati",
        domain: 'banking',
      },
    ],
    domains: ['banking'],
    cefr: 'B2',
    collocations: [
      { text: 'an overdraft facility', corpusCount: 420, verified: true },
      { text: 'go into overdraft', corpusCount: 260, verified: true },
      { text: 'an agreed overdraft limit', corpusCount: 180, verified: true },
      { text: 'overdraft charges' },
    ],
    synonyms: ['credit line', 'overdraft facility'],
    antonyms: [],
    wordFamily: ['overdraw', 'overdrawn', 'overdraft'],
    examples: [
      {
        sentence: 'The company arranged a 5 million overdraft facility to cover seasonal working capital needs.',
        source: 'annual report',
        translationUz:
          "Kompaniya mavsumiy aylanma mablag' ehtiyojini qoplash uchun 5 millionlik overdraft liniyasini rasmiylashtirdi.",
      },
      {
        sentence: 'Unauthorised overdraft charges were reduced after a review by the regulator.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A business banking adviser uses this noun when offering a small firm a flexible alternative to a fixed-term loan.',
    communicativeTask:
      'Write one sentence explaining when an overdraft is more suitable than a long-term loan.',
    semanticLinks: [
      { word: 'loan', relation: 'related' },
      { word: 'working capital', relation: 'related' },
      { word: 'transaction fee', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-default',
    word: 'default',
    lemma: 'default',
    pos: 'noun',
    ipa: '/dɪˈfɔːlt/',
    definitions: [
      {
        text: 'A failure to make the loan or interest payments that a borrower has agreed to make.',
        textUz: "defolt — qarzdorning kelishilgan to'lovlarni amalga oshira olmasligi",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'C1',
    collocations: [
      { text: 'the risk of default', corpusCount: 940, verified: true },
      { text: 'default on a loan', corpusCount: 620, verified: true },
      { text: 'the default rate', corpusCount: 780, verified: true },
      { text: 'a sovereign default' },
    ],
    synonyms: ['non-payment', 'failure to pay'],
    antonyms: ['repayment'],
    wordFamily: ['default', 'defaulter', 'defaulting'],
    examples: [
      {
        sentence: 'The default rate on unsecured consumer lending rose to 3.8 per cent.',
        source: 'central bank statement (style)',
        translationUz: "Ta'minlanmagan iste'mol kreditlari bo'yicha defolt darajasi 3,8 foizga ko'tarildi.",
      },
      {
        sentence: 'Provisions were increased to reflect a higher expected probability of default.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A risk manager uses this noun when reporting to the credit committee on the quality of the loan book.',
    communicativeTask:
      'Write one sentence naming two things a bank can do when a borrower goes into default.',
    semanticLinks: [
      { word: 'loan', relation: 'caused_by' },
      { word: 'collateral', relation: 'related' },
      { word: 'credit rating', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-liquidity',
    word: 'liquidity',
    lemma: 'liquidity',
    pos: 'noun',
    ipa: '/lɪˈkwɪdəti/',
    definitions: [
      {
        text: 'The ability to turn assets into cash quickly, or the amount of cash available to meet immediate obligations.',
        textUz: "likvidlik — aktivlarni tez naqd pulga aylantira olish yoki joriy majburiyatlar uchun naqd mablag' yetarliligi",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'provide liquidity', corpusCount: 720, verified: true },
      { text: 'a liquidity shortage', corpusCount: 480, verified: true },
      { text: 'market liquidity', corpusCount: 1160, verified: true },
      { text: 'the liquidity coverage ratio' },
    ],
    synonyms: ['cash availability', 'marketability'],
    antonyms: ['illiquidity'],
    wordFamily: ['liquid', 'liquidity', 'liquidate', 'liquidation', 'illiquid'],
    examples: [
      {
        sentence: 'The central bank provided emergency liquidity to two mid-sized institutions.',
        source: 'central bank statement (style)',
        translationUz: "Markaziy bank ikkita o'rta bankka favqulodda likvidlik taqdim etdi.",
      },
      {
        sentence: 'The group maintained ample liquidity, with 1.2 billion in undrawn credit facilities.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A treasury officer uses this noun when reporting daily on whether the bank can meet expected outflows.',
    communicativeTask:
      'Write one sentence explaining why a company can be profitable and still face a liquidity problem.',
    semanticLinks: [
      { word: 'cash flow', relation: 'related' },
      { word: 'central bank', relation: 'related' },
      { word: 'asset', relation: 'measure_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-central-bank',
    word: 'central bank',
    lemma: 'central bank',
    pos: 'noun phrase',
    ipa: '/ˌsentrəl ˈbæŋk/',
    definitions: [
      {
        text: 'The national institution that issues currency, sets interest rates and supervises the banking system.',
        textUz: "markaziy bank — milliy valyutani chiqaradigan, foiz stavkalarini belgilaydigan va bank tizimini nazorat qiladigan muassasa",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'the central bank raised rates', corpusCount: 1240, verified: true },
      { text: 'central bank independence', corpusCount: 680, verified: true },
      { text: 'central bank reserves', corpusCount: 820, verified: true },
      { text: 'intervene in the market' },
    ],
    synonyms: ['monetary authority', 'reserve bank'],
    antonyms: ['commercial bank'],
    wordFamily: ['bank', 'banker', 'banking', 'central'],
    examples: [
      {
        sentence: 'The central bank left its policy rate unchanged for the third meeting in a row.',
        source: 'central bank statement (style)',
        translationUz: "Markaziy bank ketma-ket uchinchi yig'ilishda siyosat stavkasini o'zgartirmadi.",
      },
      {
        sentence: 'Central bank independence is widely seen as a precondition for stable inflation.',
        source: 'academic textbook (style)',
      },
    ],
    professionalContext:
      'A financial journalist uses this term when reporting the outcome of a rate-setting meeting to a general audience.',
    communicativeTask:
      'Write one sentence describing the two main responsibilities of the central bank in your country.',
    semanticLinks: [
      { word: 'monetary policy', relation: 'related' },
      { word: 'interest rate', relation: 'causes' },
      { word: 'inflation', relation: 'related' },
      { word: 'quantitative easing', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-exchange-rate',
    word: 'exchange rate',
    lemma: 'exchange rate',
    pos: 'noun phrase',
    ipa: '/ɪksˈtʃeɪndʒ reɪt/',
    definitions: [
      {
        text: 'The price of one currency expressed in terms of another currency.',
        textUz: "valyuta kursi — bir valyutaning boshqa valyutada ifodalangan narxi",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'economics'],
    cefr: 'B1',
    collocations: [
      { text: 'a floating exchange rate', corpusCount: 620, verified: true },
      { text: 'exchange rate volatility', corpusCount: 540, verified: true },
      { text: 'the exchange rate against the dollar', corpusCount: 880, verified: true },
      { text: 'a fixed exchange rate' },
    ],
    synonyms: ['currency rate', 'forex rate'],
    antonyms: [],
    wordFamily: ['exchange', 'exchangeable', 'rate'],
    examples: [
      {
        sentence: 'The exchange rate against the dollar weakened by 6 per cent over the year.',
        source: 'central bank statement (style)',
        translationUz: "Dollarga nisbatan valyuta kursi yil davomida 6 foizga zaiflashdi.",
      },
      {
        sentence: 'Revenue rose by 4 per cent, or 9 per cent at constant exchange rates.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An export sales manager uses this term when quoting prices to a foreign buyer and agreeing who bears the currency risk.',
    communicativeTask:
      'Write one sentence explaining how a weaker national currency affects exporters in your country.',
    semanticLinks: [
      { word: 'trade deficit', relation: 'related' },
      { word: 'inflation', relation: 'causes' },
      { word: 'central bank', relation: 'related' },
      { word: 'fluctuate', relation: 'collocate' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-transaction-fee',
    word: 'transaction fee',
    lemma: 'transaction fee',
    pos: 'noun phrase',
    ipa: '/trænˈzækʃn fiː/',
    definitions: [
      {
        text: 'A charge made by a bank or payment provider each time money is transferred or a payment is processed.',
        textUz: "tranzaksiya to'lovi — har bir pul o'tkazmasi uchun bank oladigan komissiya",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'charge a transaction fee', corpusCount: 320, verified: true },
      { text: 'waive the transaction fee', corpusCount: 140, verified: true },
      { text: 'a flat transaction fee', corpusCount: 110, verified: true },
      { text: 'transaction fees apply' },
    ],
    synonyms: ['commission', 'processing charge'],
    antonyms: [],
    wordFamily: ['transact', 'transaction', 'transactional', 'fee'],
    examples: [
      {
        sentence: 'The bank agreed to waive transaction fees on international transfers for corporate clients.',
        source: 'business press (style)',
        translationUz:
          "Bank korporativ mijozlar uchun xalqaro o'tkazmalardagi tranzaksiya to'lovlarini bekor qilishga rozi bo'ldi.",
      },
      {
        sentence: 'Lower transaction fees on card payments reduced fee income by 12 million.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A payments product manager uses this term when writing the tariff section of a customer agreement.',
    communicativeTask:
      'Write one sentence asking a bank politely to explain the transaction fees on your account.',
    semanticLinks: [
      { word: 'bank statement', relation: 'related' },
      { word: 'invoice', relation: 'related' },
      { word: 'deposit', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-creditworthiness',
    word: 'creditworthiness',
    lemma: 'creditworthiness',
    pos: 'noun',
    ipa: '/ˈkredɪtˌwɜːðinəs/',
    definitions: [
      {
        text: 'The extent to which a person or company can be trusted to repay borrowed money.',
        textUz: "kreditga layoqatlilik — shaxs yoki kompaniyaning qarzni qaytara olish ishonchliligi",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'finance'],
    cefr: 'C1',
    collocations: [
      { text: 'assess creditworthiness', corpusCount: 380, verified: true },
      { text: 'demonstrate creditworthiness', corpusCount: 120, verified: true },
      { text: 'a creditworthiness check', corpusCount: 90, verified: true },
      { text: 'improve creditworthiness' },
    ],
    synonyms: ['credit standing', 'financial reliability'],
    antonyms: [],
    wordFamily: ['credit', 'creditor', 'creditworthy', 'creditworthiness'],
    examples: [
      {
        sentence: 'Lenders assess creditworthiness using income records, payment history and existing debt.',
        source: 'central bank statement (style)',
        translationUz:
          "Kredit beruvchilar kreditga layoqatlilikni daromad, to'lovlar tarixi va mavjud qarz asosida baholaydi.",
      },
      {
        sentence: 'Digital records have improved the creditworthiness assessment of informal traders.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'A credit analyst uses this noun when writing the recommendation paragraph of a loan appraisal.',
    communicativeTask:
      'Write one sentence naming three pieces of evidence a bank could use to check creditworthiness.',
    semanticLinks: [
      { word: 'credit rating', relation: 'related' },
      { word: 'default', relation: 'opposite' },
      { word: 'loan', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-bank-statement',
    word: 'bank statement',
    lemma: 'bank statement',
    pos: 'noun phrase',
    ipa: '/ˈbæŋk ˌsteɪtmənt/',
    definitions: [
      {
        text: 'A document from a bank listing all the money paid into and out of an account over a period.',
        textUz: "bank ko'chirmasi — hisobdagi barcha kirim va chiqimlarni ko'rsatuvchi hujjat",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'request a bank statement', corpusCount: 210, verified: true },
      { text: 'check your bank statement', corpusCount: 180, verified: true },
      { text: 'a monthly bank statement', corpusCount: 260, verified: true },
      { text: 'reconcile the bank statement' },
    ],
    synonyms: ['account statement'],
    antonyms: [],
    wordFamily: ['bank', 'banking', 'state', 'statement'],
    examples: [
      {
        sentence: 'Applicants must provide six months of bank statements with the loan application.',
        source: 'bank customer agreement (style)',
        translationUz:
          "Ariza beruvchilar kredit hujjatlari bilan birga olti oylik bank ko'chirmalarini taqdim etishi shart.",
      },
      {
        sentence: 'The accounts department reconciles bank statements against the ledger every month.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A bookkeeper uses this term when matching payments recorded in the accounts with what the bank actually received.',
    communicativeTask:
      'Write one polite email sentence asking your bank to send a statement for the last three months.',
    semanticLinks: [
      { word: 'deposit', relation: 'related' },
      { word: 'transaction fee', relation: 'related' },
      { word: 'audit', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-quantitative-easing',
    word: 'quantitative easing',
    lemma: 'quantitative easing',
    pos: 'noun phrase',
    ipa: '/ˌkwɒntɪtətɪv ˈiːzɪŋ/',
    definitions: [
      {
        text: 'A policy in which a central bank buys large amounts of bonds in order to put more money into the economy.',
        textUz: "miqdoriy yumshatish — markaziy bankning iqtisodiyotga pul kiritish uchun obligatsiyalarni katta hajmda sotib olishi",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'economics'],
    cefr: 'C1',
    collocations: [
      { text: 'a programme of quantitative easing', corpusCount: 240, verified: true },
      { text: 'unwind quantitative easing', corpusCount: 120, verified: true },
      { text: 'launch quantitative easing', corpusCount: 160, verified: true },
      { text: 'asset purchase programme' },
    ],
    synonyms: ['asset purchases', 'QE'],
    antonyms: ['quantitative tightening'],
    wordFamily: ['quantity', 'quantitative', 'ease', 'easing'],
    examples: [
      {
        sentence: 'Quantitative easing lowered long-term yields but had a limited effect on bank lending.',
        source: 'central bank statement (style)',
        translationUz:
          "Miqdoriy yumshatish uzoq muddatli daromadlilikni pasaytirdi, biroq bank kreditlariga ta'siri cheklangan bo'ldi.",
      },
      {
        sentence: 'The bank has begun to unwind quantitative easing by allowing bonds to mature.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A macro strategist uses this term when explaining to clients why bond yields fell even though the policy rate was unchanged.',
    communicativeTask:
      'Explain quantitative easing in one sentence as you would to a first-year student.',
    semanticLinks: [
      { word: 'monetary policy', relation: 'hyponym' },
      { word: 'central bank', relation: 'caused_by' },
      { word: 'bond', relation: 'related' },
      { word: 'yield', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-instalment',
    word: 'instalment',
    lemma: 'instalment',
    pos: 'noun',
    ipa: '/ɪnˈstɔːlmənt/',
    definitions: [
      {
        text: 'One of a series of regular payments made until a debt or purchase price is fully paid.',
        textUz: "bo'lib to'lash qismi — qarz to'liq qoplanguncha muntazam to'lanadigan to'lovlardan biri",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'general'],
    cefr: 'B2',
    collocations: [
      { text: 'pay in instalments', corpusCount: 460, verified: true },
      { text: 'a monthly instalment', corpusCount: 620, verified: true },
      { text: 'miss an instalment', corpusCount: 140, verified: true },
      { text: 'the final instalment' },
    ],
    synonyms: ['repayment', 'payment'],
    antonyms: ['lump sum'],
    wordFamily: ['instal', 'instalment', 'instalments'],
    examples: [
      {
        sentence: 'The loan is repayable in 36 equal monthly instalments including interest.',
        source: 'bank customer agreement (style)',
        translationUz: "Kredit foizi bilan birga 36 ta teng oylik to'lovda qaytariladi.",
      },
      {
        sentence: 'Retailers reported strong demand for goods sold on interest-free instalment plans.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A sales finance officer uses this noun when setting out a repayment schedule for a customer buying equipment.',
    communicativeTask:
      'Write one sentence explaining the advantage and the disadvantage of paying in instalments.',
    semanticLinks: [
      { word: 'loan', relation: 'part_of' },
      { word: 'interest rate', relation: 'related' },
      { word: 'default', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-withdraw',
    word: 'withdraw',
    lemma: 'withdraw',
    pos: 'verb',
    ipa: '/wɪðˈdrɔː/',
    definitions: [
      {
        text: 'To take money out of a bank account.',
        textUz: "yechib olmoq — bank hisobidan pul olmoq",
        domain: 'banking',
      },
    ],
    domains: ['banking', 'general'],
    cefr: 'B1',
    collocations: [
      { text: 'withdraw cash', corpusCount: 540, verified: true },
      { text: 'withdraw funds', corpusCount: 620, verified: true },
      { text: 'withdraw an offer', corpusCount: 280, verified: true },
      { text: 'withdraw from an account' },
    ],
    synonyms: ['take out', 'draw down'],
    antonyms: ['deposit', 'pay in'],
    wordFamily: ['withdraw', 'withdrawal', 'withdrawn'],
    examples: [
      {
        sentence: 'Depositors withdrew almost 400 million from the institution in a single week.',
        source: 'business press (style)',
        translationUz: "Omonatchilar bir hafta ichida muassasadan deyarli 400 million pul yechib oldi.",
      },
      {
        sentence: 'Customers may withdraw funds from a term deposit early, subject to a penalty.',
        source: 'bank customer agreement (style)',
      },
    ],
    professionalContext:
      'A cashier or online banking support agent uses this verb when explaining daily limits to a customer.',
    communicativeTask:
      'Write one sentence explaining the conditions for withdrawing money early from a term deposit.',
    semanticLinks: [
      { word: 'deposit', relation: 'opposite' },
      { word: 'liquidity', relation: 'related' },
      { word: 'bank statement', relation: 'related' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 6. MARKETING — bozor va mijoz                                     */
  /* ================================================================ */
  {
    id: 'lx-brand',
    word: 'brand',
    lemma: 'brand',
    pos: 'noun',
    ipa: '/brænd/',
    definitions: [
      {
        text: 'The name, design and reputation that make the products of one company recognisable and different from others.',
        textUz: "brend — kompaniya mahsulotini tanitadigan va boshqalardan ajratadigan nom, dizayn va obro'",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'build a brand', corpusCount: 940, verified: true },
      { text: 'a strong brand', corpusCount: 1280, verified: true },
      { text: 'brand image', corpusCount: 1060, verified: true },
      { text: 'damage the brand' },
    ],
    synonyms: ['label', 'trademark', 'make'],
    antonyms: ['generic product'],
    wordFamily: ['brand', 'branded', 'branding', 'rebrand', 'unbranded'],
    examples: [
      {
        sentence: 'The group invested 60 million in building its brand in three new export markets.',
        source: 'annual report',
        translationUz:
          "Guruh uchta yangi eksport bozorida brendini qurish uchun 60 million investitsiya kiritdi.",
      },
      {
        sentence: 'A strong brand allows a producer to charge a premium over unbranded alternatives.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'A marketing assistant uses this noun when briefing an agency on how a product should be presented to customers.',
    communicativeTask:
      'Name a brand you trust and write one sentence explaining what makes it different from its competitors.',
    semanticLinks: [
      { word: 'brand awareness', relation: 'measure_of' },
      { word: 'advertising', relation: 'related' },
      { word: 'competitive advantage', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-campaign',
    word: 'campaign',
    lemma: 'campaign',
    pos: 'noun',
    ipa: '/kæmˈpeɪn/',
    definitions: [
      {
        text: 'A planned series of marketing activities carried out over a set period to achieve a particular aim.',
        textUz: "kampaniya — muayyan maqsadga erishish uchun ma'lum davrda o'tkaziladigan rejalashtirilgan marketing tadbirlari",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'launch a campaign', corpusCount: 1420, verified: true },
      { text: 'an advertising campaign', corpusCount: 1680, verified: true },
      { text: 'run a campaign', corpusCount: 940, verified: true },
      { text: 'a successful campaign' },
    ],
    synonyms: ['drive', 'promotion', 'initiative'],
    antonyms: [],
    wordFamily: ['campaign', 'campaigner', 'campaigning'],
    examples: [
      {
        sentence: 'The autumn campaign reached 3.4 million users and lifted online orders by 17 per cent.',
        source: 'annual report',
        translationUz:
          "Kuzgi kampaniya 3,4 million foydalanuvchini qamrab oldi va onlayn buyurtmalarni 17 foizga oshirdi.",
      },
      {
        sentence: 'The company launched a digital campaign targeted at first-time buyers under 30.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A campaign manager uses this noun when reporting to a client on how a promotion performed against its objectives.',
    communicativeTask:
      'Describe in one sentence a marketing campaign you have seen recently and say whether it worked.',
    semanticLinks: [
      { word: 'advertising', relation: 'part_of' },
      { word: 'target audience', relation: 'related' },
      { word: 'brand awareness', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-target-audience',
    word: 'target audience',
    lemma: 'target audience',
    pos: 'noun phrase',
    ipa: '/ˈtɑːɡɪt ˈɔːdiəns/',
    definitions: [
      {
        text: 'The particular group of people that a product or message is aimed at.',
        textUz: "maqsadli auditoriya — mahsulot yoki xabar mo'ljallangan aniq iste'molchilar guruhi",
        domain: 'marketing',
      },
    ],
    domains: ['marketing'],
    cefr: 'B2',
    collocations: [
      { text: 'define the target audience', corpusCount: 420, verified: true },
      { text: 'reach the target audience', corpusCount: 580, verified: true },
      { text: 'a narrow target audience', corpusCount: 140, verified: true },
      { text: 'appeal to a target audience' },
    ],
    synonyms: ['target market', 'target group'],
    antonyms: [],
    wordFamily: ['target', 'targeted', 'targeting', 'audience'],
    examples: [
      {
        sentence: 'The target audience for the new savings product is customers aged 25 to 40.',
        source: 'business case study (style)',
        translationUz:
          "Yangi jamg'arma mahsulotining maqsadli auditoriyasi 25-40 yoshli mijozlardir.",
      },
      {
        sentence: 'Social media allowed the brand to reach its target audience at a much lower cost.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A brand planner uses this phrase when writing the first section of a creative brief for an agency.',
    communicativeTask:
      'Define the target audience for a language-learning app in one sentence, giving age and needs.',
    semanticLinks: [
      { word: 'segmentation', relation: 'caused_by' },
      { word: 'campaign', relation: 'related' },
      { word: 'consumer behaviour', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-market-share',
    word: 'market share',
    lemma: 'market share',
    pos: 'noun phrase',
    ipa: '/ˈmɑːkɪt ʃeə/',
    definitions: [
      {
        text: 'The proportion of total sales in a market that belongs to one company or product.',
        textUz: "bozor ulushi — bozordagi umumiy sotuvlarda bitta kompaniya yoki mahsulotga to'g'ri keladigan qism",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'gain market share', corpusCount: 1140, verified: true },
      { text: 'lose market share', corpusCount: 980, verified: true },
      { text: 'a market share of', corpusCount: 1260, verified: true },
      { text: 'defend market share' },
    ],
    synonyms: ['share of market'],
    antonyms: [],
    wordFamily: ['market', 'marketing', 'share'],
    examples: [
      {
        sentence: 'The company gained 1.8 percentage points of market share in the premium segment.',
        source: 'annual report',
        translationUz: "Kompaniya premium segmentda bozor ulushini 1,8 foiz punktga oshirdi.",
      },
      {
        sentence: 'Discounters continue to take market share from traditional supermarket chains.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A commercial analyst uses this phrase when reporting to the sales director on performance against competitors.',
    communicativeTask:
      'Write one sentence naming the company with the largest market share in one sector in your country.',
    semanticLinks: [
      { word: 'competitive advantage', relation: 'caused_by' },
      { word: 'market research', relation: 'related' },
      { word: 'revenue', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-customer-retention',
    word: 'customer retention',
    lemma: 'customer retention',
    pos: 'noun phrase',
    ipa: '/ˈkʌstəmə rɪˈtenʃn/',
    definitions: [
      {
        text: 'The ability of a company to keep its existing customers buying from it over time.',
        textUz: "mijozlarni saqlab qolish — mavjud xaridorlarni uzoq muddat o'z mijozi bo'lib qolishiga erishish",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'management'],
    cefr: 'C1',
    collocations: [
      { text: 'improve customer retention', corpusCount: 320, verified: true },
      { text: 'the customer retention rate', corpusCount: 480, verified: true },
      { text: 'customer retention strategy', corpusCount: 210, verified: true },
      { text: 'retention and acquisition' },
    ],
    synonyms: ['customer loyalty', 'client retention'],
    antonyms: ['customer churn'],
    wordFamily: ['retain', 'retention', 'customer'],
    examples: [
      {
        sentence: 'The customer retention rate improved to 87 per cent after the loyalty scheme was relaunched.',
        source: 'annual report',
        translationUz:
          "Sodiqlik dasturi qayta ishga tushirilgach, mijozlarni saqlab qolish darajasi 87 foizga yaxshilandi.",
      },
      {
        sentence: 'Retaining an existing customer typically costs far less than acquiring a new one.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'A customer experience manager uses this phrase when presenting to the board why service quality affects revenue.',
    communicativeTask:
      'Suggest in one sentence one practical way a mobile operator could improve customer retention.',
    semanticLinks: [
      { word: 'customer loyalty', relation: 'related' },
      { word: 'key performance indicator', relation: 'hyponym' },
      { word: 'revenue', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-product-launch',
    word: 'product launch',
    lemma: 'product launch',
    pos: 'noun phrase',
    ipa: '/ˈprɒdʌkt lɔːntʃ/',
    definitions: [
      {
        text: 'The occasion when a company makes a new product available to customers for the first time.',
        textUz: "mahsulot taqdimoti — yangi mahsulotning bozorga birinchi marta chiqarilishi",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'a successful product launch', corpusCount: 340, verified: true },
      { text: 'delay a product launch', corpusCount: 180, verified: true },
      { text: 'plan a product launch', corpusCount: 220, verified: true },
      { text: 'a launch date' },
    ],
    synonyms: ['product release', 'rollout'],
    antonyms: ['product withdrawal'],
    wordFamily: ['launch', 'launching', 'relaunch', 'product'],
    examples: [
      {
        sentence: 'The product launch was delayed by one quarter because of component shortages.',
        source: 'annual report',
        translationUz:
          "Butlovchi qismlar taqchilligi sababli mahsulot taqdimoti bir chorakka kechiktirildi.",
      },
      {
        sentence: 'A carefully staged product launch generated strong media coverage in six markets.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A product manager uses this phrase when coordinating marketing, production and sales teams before a release date.',
    communicativeTask:
      'Write one sentence listing three things a team must prepare before a product launch.',
    semanticLinks: [
      { word: 'campaign', relation: 'related' },
      { word: 'deadline', relation: 'related' },
      { word: 'target audience', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-segmentation',
    word: 'segmentation',
    lemma: 'segmentation',
    pos: 'noun',
    ipa: '/ˌseɡmenˈteɪʃn/',
    definitions: [
      {
        text: 'The process of dividing a market into smaller groups of customers with similar needs or behaviour.',
        textUz: "segmentatsiya — bozorni o'xshash ehtiyojli mijoz guruhlariga bo'lish jarayoni",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'academic'],
    cefr: 'C1',
    collocations: [
      { text: 'market segmentation', corpusCount: 1080, verified: true },
      { text: 'customer segmentation', corpusCount: 620, verified: true },
      { text: 'segmentation criteria', corpusCount: 180, verified: true },
      { text: 'behavioural segmentation' },
    ],
    synonyms: ['market division', 'grouping'],
    antonyms: ['mass marketing'],
    wordFamily: ['segment', 'segmentation', 'segmented'],
    examples: [
      {
        sentence: 'Segmentation by income and location identified three underserved customer groups.',
        source: 'business case study (style)',
        translationUz:
          "Daromad va joylashuv bo'yicha segmentatsiya uchta yetarli xizmat ko'rsatilmagan mijoz guruhini aniqladi.",
      },
      {
        sentence: 'The bank refined its segmentation model using transaction data from mobile users.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A market research analyst uses this noun when explaining how customer data was grouped before a campaign was designed.',
    communicativeTask:
      'Divide the students at your university into two market segments and describe them in one sentence.',
    semanticLinks: [
      { word: 'target audience', relation: 'causes' },
      { word: 'market research', relation: 'part_of' },
      { word: 'consumer behaviour', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-pricing-strategy',
    word: 'pricing strategy',
    lemma: 'pricing strategy',
    pos: 'noun phrase',
    ipa: '/ˈpraɪsɪŋ ˌstrætədʒi/',
    definitions: [
      {
        text: 'The plan a company follows when deciding what to charge for its products.',
        textUz: "narx strategiyasi — kompaniya mahsulot narxini belgilashda amal qiladigan reja",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'finance'],
    cefr: 'B2',
    collocations: [
      { text: 'adopt a pricing strategy', corpusCount: 210, verified: true },
      { text: 'a premium pricing strategy', corpusCount: 260, verified: true },
      { text: 'review the pricing strategy', corpusCount: 140, verified: true },
      { text: 'penetration pricing' },
    ],
    synonyms: ['price policy'],
    antonyms: [],
    wordFamily: ['price', 'pricing', 'strategy', 'strategic'],
    examples: [
      {
        sentence: 'The group adopted a premium pricing strategy to protect margins in a shrinking market.',
        source: 'annual report',
        translationUz:
          "Guruh qisqarayotgan bozorda foydani himoya qilish uchun premium narx strategiyasini qabul qildi.",
      },
      {
        sentence: 'Penetration pricing helped the newcomer win 5 per cent of the market within a year.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'A pricing manager uses this phrase when recommending to the commercial board how a new product should be positioned.',
    communicativeTask:
      'Recommend a pricing strategy for a new coffee shop in your city and justify it in one sentence.',
    semanticLinks: [
      { word: 'prices', relation: 'related' },
      { word: 'competitive advantage', relation: 'related' },
      { word: 'net profit margin', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-advertising',
    word: 'advertising',
    lemma: 'advertising',
    pos: 'noun',
    ipa: '/ˈædvətaɪzɪŋ/',
    definitions: [
      {
        text: 'The activity of telling the public about a product or service in order to persuade them to buy it.',
        textUz: "reklama — mahsulot yoki xizmatni sotib olishga ko'ndirish maqsadida ommaga tanishtirish faoliyati",
        domain: 'marketing',
      },
    ],
    domains: ['marketing'],
    cefr: 'B1',
    collocations: [
      { text: 'an advertising budget', corpusCount: 780, verified: true },
      { text: 'online advertising', corpusCount: 1620, verified: true },
      { text: 'advertising spend', corpusCount: 940, verified: true },
      { text: 'misleading advertising' },
    ],
    synonyms: ['publicity', 'promotion'],
    antonyms: [],
    wordFamily: ['advertise', 'advertisement', 'advertiser', 'advertising'],
    examples: [
      {
        sentence: 'Advertising spend rose 14 per cent, with almost three quarters going to digital channels.',
        source: 'annual report',
        translationUz:
          "Reklama xarajatlari 14 foizga oshdi, uning deyarli to'rtdan uch qismi raqamli kanallarga yo'naltirildi.",
      },
      {
        sentence: 'Regulators fined the retailer for advertising that misstated the true annual cost of credit.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A media buyer uses this noun when negotiating rates and placements with television and online platforms.',
    communicativeTask:
      'Write one sentence describing an advertisement that persuaded you to buy something, and explain why.',
    semanticLinks: [
      { word: 'campaign', relation: 'hypernym' },
      { word: 'brand awareness', relation: 'causes' },
      { word: 'promotion', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-consumer-behaviour',
    word: 'consumer behaviour',
    lemma: 'consumer behaviour',
    pos: 'noun phrase',
    ipa: '/kənˈsjuːmə bɪˈheɪvjə/',
    definitions: [
      {
        text: 'The way people decide what to buy, when to buy it and how much to spend.',
        textUz: "iste'molchi xulqi — odamlar nimani, qachon va qancha pulga sotib olishni qanday hal qilishi",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'academic', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'changes in consumer behaviour', corpusCount: 620, verified: true },
      { text: 'study consumer behaviour', corpusCount: 340, verified: true },
      { text: 'consumer behaviour patterns', corpusCount: 260, verified: true },
      { text: 'shift in consumer behaviour' },
    ],
    synonyms: ['buying behaviour', 'shopping habits'],
    antonyms: [],
    wordFamily: ['consume', 'consumer', 'consumption', 'behave', 'behaviour', 'behavioural'],
    examples: [
      {
        sentence: 'Changes in consumer behaviour during the pandemic accelerated the shift to online shopping.',
        source: 'business press (style)',
        translationUz:
          "Pandemiya davridagi iste'molchi xulqidagi o'zgarishlar onlayn savdoga o'tishni tezlashtirdi.",
      },
      {
        sentence: 'The study models consumer behaviour under conditions of high and persistent inflation.',
        source: 'academic journal (style)',
      },
    ],
    professionalContext:
      'A consumer insights specialist uses this phrase when presenting survey results that explain a change in demand.',
    communicativeTask:
      'Describe in one sentence one way consumer behaviour in your country has changed in the last five years.',
    semanticLinks: [
      { word: 'consumer spending', relation: 'related' },
      { word: 'segmentation', relation: 'related' },
      { word: 'demand', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-competitive-advantage',
    word: 'competitive advantage',
    lemma: 'competitive advantage',
    pos: 'noun phrase',
    ipa: '/kəmˈpetətɪv ədˈvɑːntɪdʒ/',
    definitions: [
      {
        text: 'Something that allows a company to perform better than its rivals, such as lower costs or a stronger brand.',
        textUz: "raqobat ustunligi — kompaniyaga raqiblardan ustun bo'lish imkonini beruvchi omil",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'management', 'economics'],
    cefr: 'C1',
    collocations: [
      { text: 'gain a competitive advantage', corpusCount: 940, verified: true },
      { text: 'a sustainable competitive advantage', corpusCount: 620, verified: true },
      { text: 'lose competitive advantage', corpusCount: 180, verified: true },
      { text: 'a source of competitive advantage' },
    ],
    synonyms: ['edge', 'strategic advantage'],
    antonyms: ['competitive disadvantage'],
    wordFamily: ['compete', 'competition', 'competitive', 'competitor', 'advantage'],
    examples: [
      {
        sentence: 'Its distribution network remains the main source of competitive advantage in rural markets.',
        source: 'annual report',
        translationUz:
          "Uning taqsimot tarmog'i qishloq bozorlarida asosiy raqobat ustunligi bo'lib qolmoqda.",
      },
      {
        sentence: 'Cheap labour is rarely a sustainable competitive advantage as wages rise with development.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'A strategy consultant uses this phrase when explaining to a client why one competitor consistently wins contracts.',
    communicativeTask:
      'Name one competitive advantage of a company in your country and explain it in one sentence.',
    semanticLinks: [
      { word: 'market share', relation: 'causes' },
      { word: 'brand', relation: 'caused_by' },
      { word: 'productivity', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-sales-funnel',
    word: 'sales funnel',
    lemma: 'sales funnel',
    pos: 'noun phrase',
    ipa: '/ˈseɪlz ˌfʌnl/',
    definitions: [
      {
        text: 'The series of stages a potential customer passes through, from first hearing about a product to buying it.',
        textUz: "sotuv voronkasi — mijozning mahsulot haqida bilishdan sotib olishgacha bo'lgan bosqichlari",
        domain: 'marketing',
      },
    ],
    domains: ['marketing'],
    cefr: 'C1',
    collocations: [
      { text: 'move down the sales funnel', corpusCount: 90, verified: true },
      { text: 'the top of the funnel', corpusCount: 240, verified: true },
      { text: 'funnel conversion rate', corpusCount: 160, verified: true },
      { text: 'optimise the sales funnel' },
    ],
    synonyms: ['purchase funnel', 'conversion funnel'],
    antonyms: [],
    wordFamily: ['sell', 'sales', 'funnel'],
    examples: [
      {
        sentence: 'Only 4 per cent of visitors who enter the sales funnel complete a purchase.',
        source: 'business case study (style)',
        translationUz:
          "Sotuv voronkasiga kirgan tashrifchilarning atigi 4 foizi xaridni yakunlaydi.",
      },
      {
        sentence: 'Improving the checkout page raised conversion at the bottom of the funnel by a third.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A digital marketing specialist uses this phrase when showing where potential customers stop engaging on a website.',
    communicativeTask:
      'Describe in one sentence the stages of a sales funnel for an online course.',
    semanticLinks: [
      { word: 'target audience', relation: 'related' },
      { word: 'customer retention', relation: 'related' },
      { word: 'advertising', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-market-research',
    word: 'market research',
    lemma: 'market research',
    pos: 'noun phrase',
    ipa: '/ˈmɑːkɪt rɪˌsɜːtʃ/',
    definitions: [
      {
        text: 'The collection and analysis of information about customers, competitors and market conditions.',
        textUz: "bozor tadqiqoti — mijozlar, raqiblar va bozor holati haqidagi ma'lumotlarni to'plash va tahlil qilish",
        domain: 'marketing',
      },
    ],
    domains: ['marketing', 'academic'],
    cefr: 'B2',
    collocations: [
      { text: 'conduct market research', corpusCount: 680, verified: true },
      { text: 'market research findings', corpusCount: 240, verified: true },
      { text: 'qualitative market research', corpusCount: 180, verified: true },
      { text: 'commission market research' },
    ],
    synonyms: ['consumer research', 'market study'],
    antonyms: [],
    wordFamily: ['market', 'marketing', 'research', 'researcher'],
    examples: [
      {
        sentence: 'Market research showed that price, not brand, was the main driver of choice in this segment.',
        source: 'business case study (style)',
        translationUz:
          "Bozor tadqiqoti bu segmentda tanlovning asosiy omili brend emas, narx ekanini ko'rsatdi.",
      },
      {
        sentence: 'The company commissioned market research in four countries before entering the region.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A research executive uses this phrase when proposing a survey to a client who is planning a new product.',
    communicativeTask:
      'Write one sentence explaining what market research you would do before opening a shop near your university.',
    semanticLinks: [
      { word: 'sample', relation: 'part_of' },
      { word: 'segmentation', relation: 'causes' },
      { word: 'findings', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-brand-awareness',
    word: 'brand awareness',
    lemma: 'brand awareness',
    pos: 'noun phrase',
    ipa: '/ˈbrænd əˌweənəs/',
    definitions: [
      {
        text: 'How well customers recognise and remember a particular brand.',
        textUz: "brendni tanish darajasi — iste'molchilar brendni qanchalik yaxshi biladi va eslay oladi",
        domain: 'marketing',
      },
    ],
    domains: ['marketing'],
    cefr: 'B2',
    collocations: [
      { text: 'raise brand awareness', corpusCount: 540, verified: true },
      { text: 'build brand awareness', corpusCount: 480, verified: true },
      { text: 'brand awareness increased', corpusCount: 160, verified: true },
      { text: 'unprompted brand awareness' },
    ],
    synonyms: ['brand recognition'],
    antonyms: [],
    wordFamily: ['brand', 'branding', 'aware', 'awareness'],
    examples: [
      {
        sentence: 'Brand awareness among under-35s rose from 31 to 48 per cent after the sponsorship deal.',
        source: 'annual report',
        translationUz:
          "Homiylik shartnomasidan so'ng 35 yoshgacha bo'lganlar orasida brendni tanish 31 foizdan 48 foizga o'sdi.",
      },
      {
        sentence: 'Sponsorship of the national league was chosen mainly to build brand awareness quickly.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A brand manager uses this phrase when reporting whether a sponsorship or campaign has increased recognition.',
    communicativeTask:
      'Suggest in one sentence one low-cost way a small business could raise brand awareness.',
    semanticLinks: [
      { word: 'brand', relation: 'measure_of' },
      { word: 'advertising', relation: 'caused_by' },
      { word: 'campaign', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-promotion',
    word: 'promotion',
    lemma: 'promotion',
    pos: 'noun',
    ipa: '/prəˈməʊʃn/',
    definitions: [
      {
        text: 'Activity intended to increase sales, such as a discount, a special offer or extra publicity.',
        textUz: "aksiya, rag'batlantirish — chegirma yoki maxsus taklif orqali sotuvni oshirish tadbiri",
        domain: 'marketing',
      },
      {
        text: 'A move to a more senior job inside an organisation.',
        textUz: "lavozimda ko'tarilish — tashkilotda yuqoriroq vazifaga o'tish",
        domain: 'management',
      },
    ],
    domains: ['marketing', 'management'],
    cefr: 'B1',
    collocations: [
      { text: 'run a promotion', corpusCount: 420, verified: true },
      { text: 'a sales promotion', corpusCount: 680, verified: true },
      { text: 'get a promotion', corpusCount: 940, verified: true },
      { text: 'a special promotion' },
    ],
    synonyms: ['special offer', 'advancement'],
    antonyms: ['demotion'],
    wordFamily: ['promote', 'promotion', 'promotional', 'promoter'],
    examples: [
      {
        sentence: 'A three-week promotion lifted volumes by 22 per cent but reduced the average selling price.',
        source: 'annual report',
        translationUz:
          "Uch haftalik aksiya hajmni 22 foizga oshirdi, lekin o'rtacha sotuv narxini pasaytirdi.",
      },
      {
        sentence: 'Internal promotion filled 62 per cent of management vacancies during the year.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A trade marketing officer uses this noun when planning seasonal offers with retail partners.',
    communicativeTask:
      'Write one sentence describing a sales promotion you would run to sell unsold winter stock.',
    semanticLinks: [
      { word: 'advertising', relation: 'related' },
      { word: 'prices', relation: 'related' },
      { word: 'performance review', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-customer-loyalty',
    word: 'customer loyalty',
    lemma: 'customer loyalty',
    pos: 'noun phrase',
    ipa: '/ˈkʌstəmə ˈlɔɪəlti/',
    definitions: [
      {
        text: 'The tendency of customers to keep choosing the same company rather than switching to a competitor.',
        textUz: "mijoz sodiqligi — xaridorlarning raqobatchiga o'tmasdan bir kompaniyani tanlab qolishi",
        domain: 'marketing',
      },
    ],
    domains: ['marketing'],
    cefr: 'B2',
    collocations: [
      { text: 'build customer loyalty', corpusCount: 380, verified: true },
      { text: 'a loyalty programme', corpusCount: 720, verified: true },
      { text: 'reward customer loyalty', corpusCount: 210, verified: true },
      { text: 'erode customer loyalty' },
    ],
    synonyms: ['brand loyalty', 'customer retention'],
    antonyms: ['customer churn'],
    wordFamily: ['loyal', 'loyalty', 'customer'],
    examples: [
      {
        sentence: 'The loyalty programme now has 2.1 million active members, up from 1.4 million.',
        source: 'annual report',
        translationUz:
          "Sodiqlik dasturida hozir 1,4 milliondan 2,1 milliongacha o'sgan faol a'zolar bor.",
      },
      {
        sentence: 'Repeated stock shortages have begun to erode customer loyalty in urban stores.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A retail marketing manager uses this phrase when justifying the cost of a rewards scheme to the finance team.',
    communicativeTask:
      'Write one sentence explaining why customer loyalty is cheaper for a company than winning new customers.',
    semanticLinks: [
      { word: 'customer retention', relation: 'related' },
      { word: 'brand', relation: 'caused_by' },
      { word: 'revenue', relation: 'causes' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 7. MANAGEMENT — boshqaruv va jamoa                                */
  /* ================================================================ */
  {
    id: 'lx-stakeholder',
    word: 'stakeholder',
    lemma: 'stakeholder',
    pos: 'noun',
    ipa: '/ˈsteɪkhəʊldə/',
    definitions: [
      {
        text: 'Any person or group that is affected by, or has an interest in, what an organisation does.',
        textUz: "manfaatdor tomon — tashkilot faoliyatidan ta'sirlanadigan yoki unga qiziqadigan shaxs yoki guruh",
        domain: 'management',
      },
    ],
    domains: ['management', 'business_communication'],
    cefr: 'B2',
    collocations: [
      { text: 'key stakeholders', corpusCount: 1420, verified: true },
      { text: 'consult stakeholders', corpusCount: 620, verified: true },
      { text: 'stakeholder engagement', corpusCount: 980, verified: true },
      { text: 'internal and external stakeholders' },
    ],
    synonyms: ['interested party', 'constituent'],
    antonyms: [],
    wordFamily: ['stake', 'stakeholder', 'shareholder'],
    examples: [
      {
        sentence: 'The board consulted key stakeholders before approving the restructuring plan.',
        source: 'annual report',
        translationUz:
          "Kengash qayta tuzish rejasini tasdiqlashdan oldin asosiy manfaatdor tomonlar bilan maslahatlashdi.",
      },
      {
        sentence: 'Stakeholder engagement now covers suppliers, regulators and local communities.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A project manager uses this noun when mapping out who must be informed and consulted before a change is made.',
    communicativeTask:
      'List three stakeholders of your university and write one sentence about what each one wants.',
    semanticLinks: [
      { word: 'shareholder', relation: 'hypernym' },
      { word: 'accountability', relation: 'related' },
      { word: 'decision-making', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-delegate',
    word: 'delegate',
    lemma: 'delegate',
    pos: 'verb',
    ipa: '/ˈdelɪɡeɪt/',
    definitions: [
      {
        text: 'To give part of your work or authority to somebody else so that they can act on your behalf.',
        textUz: "vakolat bermoq, topshirmoq — o'z ishi yoki vakolatining bir qismini boshqaga berish",
        domain: 'management',
      },
    ],
    domains: ['management', 'business_communication'],
    cefr: 'B2',
    collocations: [
      { text: 'delegate responsibility', corpusCount: 540, verified: true },
      { text: 'delegate authority', corpusCount: 620, verified: true },
      { text: 'delegate tasks to', corpusCount: 380, verified: true },
      { text: 'delegate effectively' },
    ],
    synonyms: ['assign', 'entrust', 'hand over'],
    antonyms: ['micromanage', 'retain'],
    wordFamily: ['delegate', 'delegation', 'delegated'],
    examples: [
      {
        sentence: 'Authority to approve spending below 50,000 has been delegated to divisional directors.',
        source: 'annual report',
        translationUz:
          "50 000 dan past xarajatlarni tasdiqlash vakolati bo'lim direktorlariga berilgan.",
      },
      {
        sentence: 'Managers who delegate effectively free up time for planning and coaching.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'A team leader uses this verb when reorganising the workload of a team before a busy reporting period.',
    communicativeTask:
      'Write one sentence delegating a task to a colleague, saying clearly what and by when.',
    semanticLinks: [
      { word: 'accountability', relation: 'related' },
      { word: 'leadership', relation: 'part_of' },
      { word: 'resource allocation', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-performance-review',
    word: 'performance review',
    lemma: 'performance review',
    pos: 'noun phrase',
    ipa: '/pəˈfɔːməns rɪˌvjuː/',
    definitions: [
      {
        text: 'A regular meeting in which a manager and an employee discuss how well the employee has worked and what to improve.',
        textUz: "ish faoliyati baholovi — xodim ishining natijalari va yaxshilash yo'llari muhokama qilinadigan muntazam suhbat",
        domain: 'management',
      },
    ],
    domains: ['management', 'business_communication'],
    cefr: 'B2',
    collocations: [
      { text: 'conduct a performance review', corpusCount: 340, verified: true },
      { text: 'an annual performance review', corpusCount: 420, verified: true },
      { text: 'performance review feedback', corpusCount: 180, verified: true },
      { text: 'set objectives at a review' },
    ],
    synonyms: ['appraisal', 'performance appraisal'],
    antonyms: [],
    wordFamily: ['perform', 'performance', 'review', 'reviewer'],
    examples: [
      {
        sentence: 'All staff took part in a structured performance review during the first quarter.',
        source: 'annual report',
        translationUz:
          "Barcha xodimlar birinchi chorakda tizimli ish faoliyati baholovidan o'tdi.",
      },
      {
        sentence: 'Objectives agreed at the performance review are linked to the annual bonus scheme.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A line manager uses this term when preparing feedback and objectives for a member of their team.',
    communicativeTask:
      'Write one sentence of constructive feedback you could give a colleague in a performance review.',
    semanticLinks: [
      { word: 'key performance indicator', relation: 'related' },
      { word: 'accountability', relation: 'related' },
      { word: 'promotion', relation: 'causes' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-workflow',
    word: 'workflow',
    lemma: 'workflow',
    pos: 'noun',
    ipa: '/ˈwɜːkfləʊ/',
    definitions: [
      {
        text: 'The sequence of steps through which a piece of work passes from start to completion.',
        textUz: "ish jarayoni — vazifaning boshidan oxirigacha o'tadigan bosqichlari ketma-ketligi",
        domain: 'management',
      },
    ],
    domains: ['management'],
    cefr: 'B2',
    collocations: [
      { text: 'streamline the workflow', corpusCount: 280, verified: true },
      { text: 'an approval workflow', corpusCount: 340, verified: true },
      { text: 'automate a workflow', corpusCount: 460, verified: true },
      { text: 'a bottleneck in the workflow' },
    ],
    synonyms: ['process', 'procedure'],
    antonyms: [],
    wordFamily: ['work', 'workflow', 'flow'],
    examples: [
      {
        sentence: 'Automating the invoice approval workflow cut processing time from nine days to two.',
        source: 'annual report',
        translationUz:
          "Hisob-faktura tasdiqlash jarayonini avtomatlashtirish ishlov berish muddatini to'qqiz kundan ikki kunga qisqartirdi.",
      },
      {
        sentence: 'The audit identified a bottleneck in the workflow between sales and logistics.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'An operations analyst uses this noun when mapping how a document moves between departments before approval.',
    communicativeTask:
      'Describe the workflow for submitting an assignment at your university in one sentence.',
    semanticLinks: [
      { word: 'productivity', relation: 'causes' },
      { word: 'deadline', relation: 'related' },
      { word: 'resource allocation', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-deadline',
    word: 'deadline',
    lemma: 'deadline',
    pos: 'noun',
    ipa: '/ˈdedlaɪn/',
    definitions: [
      {
        text: 'The date or time by which a task must be finished.',
        textUz: "muddat — vazifa tugatilishi kerak bo'lgan oxirgi sana yoki vaqt",
        domain: 'management',
      },
    ],
    domains: ['management', 'business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'meet a deadline', corpusCount: 1240, verified: true },
      { text: 'miss a deadline', corpusCount: 860, verified: true },
      { text: 'a tight deadline', corpusCount: 940, verified: true },
      { text: 'extend the deadline' },
    ],
    synonyms: ['due date', 'cut-off date', 'time limit'],
    antonyms: [],
    wordFamily: ['deadline', 'deadlines'],
    examples: [
      {
        sentence: 'The team met every reporting deadline despite the change of accounting system.',
        source: 'annual report',
        translationUz:
          "Buxgalteriya tizimi almashganiga qaramay, jamoa barcha hisobot muddatlariga rioya qildi.",
      },
      {
        sentence: 'Suppliers were warned that a missed deadline would trigger contractual penalties.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A project coordinator uses this noun in daily emails when confirming when deliverables are expected.',
    communicativeTask:
      'Write one sentence telling a colleague about a deadline and asking them to confirm they can meet it.',
    semanticLinks: [
      { word: 'deadline extension', relation: 'related' },
      { word: 'workflow', relation: 'related' },
      { word: 'follow up', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-resource-allocation',
    word: 'resource allocation',
    lemma: 'resource allocation',
    pos: 'noun phrase',
    ipa: '/rɪˈzɔːs ˌæləˈkeɪʃn/',
    definitions: [
      {
        text: 'The way an organisation decides how to share money, staff and equipment between competing activities.',
        textUz: "resurslarni taqsimlash — pul, kadr va uskunani turli vazifalar o'rtasida bo'lish jarayoni",
        domain: 'management',
      },
    ],
    domains: ['management', 'economics'],
    cefr: 'C1',
    collocations: [
      { text: 'efficient resource allocation', corpusCount: 480, verified: true },
      { text: 'review resource allocation', corpusCount: 140, verified: true },
      { text: 'resource allocation decisions', corpusCount: 220, verified: true },
      { text: 'allocate resources to' },
    ],
    synonyms: ['resourcing', 'distribution of resources'],
    antonyms: [],
    wordFamily: ['resource', 'allocate', 'allocation', 'reallocate'],
    examples: [
      {
        sentence: 'More efficient resource allocation across divisions released 30 staff for the new project.',
        source: 'annual report',
        translationUz:
          "Bo'limlar o'rtasida resurslarni samaraliroq taqsimlash yangi loyiha uchun 30 xodimni bo'shatdi.",
      },
      {
        sentence: 'Markets are usually a more efficient mechanism for resource allocation than central planning.',
        source: 'academic textbook (style)',
      },
    ],
    professionalContext:
      'A department head uses this phrase when arguing for a larger share of the annual budget.',
    communicativeTask:
      'Explain in one sentence how you would allocate resources between two projects with equal deadlines.',
    semanticLinks: [
      { word: 'scarcity', relation: 'caused_by' },
      { word: 'delegate', relation: 'related' },
      { word: 'decision-making', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-leadership',
    word: 'leadership',
    lemma: 'leadership',
    pos: 'noun',
    ipa: '/ˈliːdəʃɪp/',
    definitions: [
      {
        text: 'The ability to guide and motivate a group of people towards a shared goal.',
        textUz: "yetakchilik — jamoani umumiy maqsad sari yo'naltirish va ilhomlantirish qobiliyati",
        domain: 'management',
      },
    ],
    domains: ['management'],
    cefr: 'B2',
    collocations: [
      { text: 'strong leadership', corpusCount: 1180, verified: true },
      { text: 'leadership skills', corpusCount: 1320, verified: true },
      { text: 'a change of leadership', corpusCount: 620, verified: true },
      { text: 'demonstrate leadership' },
    ],
    synonyms: ['guidance', 'direction', 'management'],
    antonyms: [],
    wordFamily: ['lead', 'leader', 'leadership', 'leading'],
    examples: [
      {
        sentence: 'The turnaround is widely credited to strong leadership at divisional level.',
        source: 'business press (style)',
        translationUz:
          "Vaziyatning yaxshilanishi ko'p jihatdan bo'lim darajasidagi kuchli yetakchilik bilan bog'lanadi.",
      },
      {
        sentence: 'The group invested in leadership training for 240 middle managers.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An HR business partner uses this noun when designing development programmes for future managers.',
    communicativeTask:
      'Write one sentence describing one quality of good leadership and give a short reason.',
    semanticLinks: [
      { word: 'delegate', relation: 'related' },
      { word: 'decision-making', relation: 'related' },
      { word: 'accountability', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-restructuring',
    word: 'restructuring',
    lemma: 'restructuring',
    pos: 'noun',
    ipa: '/ˌriːˈstrʌktʃərɪŋ/',
    definitions: [
      {
        text: 'The process of changing the way an organisation or a debt is arranged in order to make it work better.',
        textUz: "qayta tuzish — tashkilot yoki qarz tuzilmasini samaraliroq qilish uchun o'zgartirish jarayoni",
        domain: 'management',
      },
    ],
    domains: ['management', 'finance'],
    cefr: 'C1',
    collocations: [
      { text: 'a restructuring programme', corpusCount: 640, verified: true },
      { text: 'debt restructuring', corpusCount: 1140, verified: true },
      { text: 'restructuring costs', corpusCount: 820, verified: true },
      { text: 'announce a restructuring' },
    ],
    synonyms: ['reorganisation', 'overhaul'],
    antonyms: [],
    wordFamily: ['structure', 'restructure', 'restructuring', 'structural'],
    examples: [
      {
        sentence: 'Restructuring costs of 78 million were charged against operating profit in the period.',
        source: 'annual report',
        translationUz:
          "Davr davomida 78 million qayta tuzish xarajati operatsion foydadan chegirildi.",
      },
      {
        sentence: 'The country reached a debt restructuring agreement with its official creditors.',
        source: 'IMF World Economic Outlook (style)',
      },
    ],
    professionalContext:
      'A change manager uses this noun when communicating to staff why departments are being merged.',
    communicativeTask:
      'Write one sentence announcing a restructuring to staff in a clear and respectful tone.',
    semanticLinks: [
      { word: 'staff turnover', relation: 'causes' },
      { word: 'stakeholder', relation: 'related' },
      { word: 'cost', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-key-performance-indicator',
    word: 'key performance indicator',
    lemma: 'key performance indicator',
    pos: 'noun phrase',
    ipa: '/ˌkiː pəˈfɔːməns ˈɪndɪkeɪtə/',
    definitions: [
      {
        text: 'A specific measure used to track how well a company, team or process is achieving its objectives.',
        textUz: "asosiy samaradorlik ko'rsatkichi — maqsadlarga erishish darajasini o'lchaydigan aniq mezon",
        domain: 'management',
      },
    ],
    domains: ['management', 'business_communication'],
    cefr: 'C1',
    collocations: [
      { text: 'set key performance indicators', corpusCount: 380, verified: true },
      { text: 'meet the key performance indicators', corpusCount: 220, verified: true },
      { text: 'track performance against KPIs', corpusCount: 160, verified: true },
      { text: 'a financial KPI' },
    ],
    synonyms: ['KPI', 'performance measure', 'metric'],
    antonyms: [],
    wordFamily: ['perform', 'performance', 'indicate', 'indicator'],
    examples: [
      {
        sentence: 'Executive pay is linked to four key performance indicators, two of them non-financial.',
        source: 'annual report',
        translationUz:
          "Rahbariyat ish haqi to'rtta asosiy samaradorlik ko'rsatkichiga bog'langan, ulardan ikkitasi moliyaviy emas.",
      },
      {
        sentence: 'The department reports monthly against a small set of clearly defined KPIs.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A business analyst uses this term when agreeing with a client which numbers will be reported each month.',
    communicativeTask:
      'Propose two key performance indicators for a university language course in one sentence.',
    semanticLinks: [
      { word: 'performance review', relation: 'related' },
      { word: 'net profit margin', relation: 'hypernym' },
      { word: 'data', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-accountability',
    word: 'accountability',
    lemma: 'accountability',
    pos: 'noun',
    ipa: '/əˌkaʊntəˈbɪləti/',
    definitions: [
      {
        text: 'The duty to explain and take responsibility for decisions and results.',
        textUz: "javobgarlik, hisobdorlik — qaror va natijalar uchun javob berish va tushuntirish majburiyati",
        domain: 'management',
      },
    ],
    domains: ['management', 'academic'],
    cefr: 'C1',
    collocations: [
      { text: 'a lack of accountability', corpusCount: 620, verified: true },
      { text: 'strengthen accountability', corpusCount: 420, verified: true },
      { text: 'clear lines of accountability', corpusCount: 280, verified: true },
      { text: 'hold someone to account' },
    ],
    synonyms: ['responsibility', 'answerability'],
    antonyms: ['impunity'],
    wordFamily: ['account', 'accountable', 'accountability'],
    examples: [
      {
        sentence: 'The reform strengthens accountability by requiring quarterly reporting to parliament.',
        source: 'World Bank country report (style)',
        translationUz:
          "Islohot parlamentga har chorakda hisobot berishni talab qilib, hisobdorlikni kuchaytiradi.",
      },
      {
        sentence: 'Clear lines of accountability were introduced after the internal audit findings.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A governance officer uses this noun when defining who answers for a decision in a new organisational structure.',
    communicativeTask:
      'Write one sentence explaining who should be accountable if a team project misses its deadline.',
    semanticLinks: [
      { word: 'stakeholder', relation: 'related' },
      { word: 'audit', relation: 'related' },
      { word: 'leadership', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-decision-making',
    word: 'decision-making',
    lemma: 'decision-making',
    pos: 'noun',
    ipa: '/dɪˈsɪʒn ˌmeɪkɪŋ/',
    definitions: [
      {
        text: 'The process of choosing between options after weighing up the available information.',
        textUz: "qaror qabul qilish — mavjud ma'lumotni tortib ko'rib, variantlardan birini tanlash jarayoni",
        domain: 'management',
      },
    ],
    domains: ['management', 'academic'],
    cefr: 'B2',
    collocations: [
      { text: 'evidence-based decision-making', corpusCount: 420, verified: true },
      { text: 'speed up decision-making', corpusCount: 180, verified: true },
      { text: 'the decision-making process', corpusCount: 1240, verified: true },
      { text: 'devolved decision-making' },
    ],
    synonyms: ['judgement', 'choice-making'],
    antonyms: [],
    wordFamily: ['decide', 'decision', 'decisive', 'decision-making'],
    examples: [
      {
        sentence: 'Devolving decision-making to regional teams shortened response times considerably.',
        source: 'annual report',
        translationUz:
          "Qaror qabul qilishni mintaqaviy jamoalarga topshirish javob berish vaqtini sezilarli qisqartirdi.",
      },
      {
        sentence: 'The framework promotes evidence-based decision-making at every level of government.',
        source: 'World Bank country report (style)',
      },
    ],
    professionalContext:
      'A management consultant uses this noun when recommending which decisions should be taken locally rather than centrally.',
    communicativeTask:
      'Describe in one sentence the steps you would follow in making an important decision at work.',
    semanticLinks: [
      { word: 'data', relation: 'related' },
      { word: 'leadership', relation: 'part_of' },
      { word: 'resource allocation', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-staff-turnover',
    word: 'staff turnover',
    lemma: 'staff turnover',
    pos: 'noun phrase',
    ipa: '/ˈstɑːf ˌtɜːnəʊvə/',
    definitions: [
      {
        text: 'The rate at which employees leave an organisation and are replaced by new ones.',
        textUz: "kadrlar almashinuvi — xodimlarning ishdan ketishi va yangilari bilan almashinishi darajasi",
        domain: 'management',
      },
    ],
    domains: ['management'],
    cefr: 'B2',
    collocations: [
      { text: 'high staff turnover', corpusCount: 480, verified: true },
      { text: 'reduce staff turnover', corpusCount: 320, verified: true },
      { text: 'the staff turnover rate', corpusCount: 240, verified: true },
      { text: 'voluntary turnover' },
    ],
    synonyms: ['employee turnover', 'attrition'],
    antonyms: ['staff retention'],
    wordFamily: ['staff', 'staffing', 'turnover'],
    examples: [
      {
        sentence: 'Staff turnover fell from 19 to 13 per cent after the introduction of flexible working.',
        source: 'annual report',
        translationUz:
          "Moslashuvchan ish tartibi joriy etilgach, kadrlar almashinuvi 19 foizdan 13 foizga tushdi.",
      },
      {
        sentence: 'High turnover in customer-facing roles raised recruitment and training costs.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'An HR manager uses this phrase when presenting workforce statistics and their cost impact to the board.',
    communicativeTask:
      'Suggest in one sentence two measures a company could take to reduce staff turnover.',
    semanticLinks: [
      { word: 'recruitment', relation: 'causes' },
      { word: 'incentive', relation: 'related' },
      { word: 'restructuring', relation: 'caused_by' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-recruitment',
    word: 'recruitment',
    lemma: 'recruitment',
    pos: 'noun',
    ipa: '/rɪˈkruːtmənt/',
    definitions: [
      {
        text: 'The process of finding, selecting and hiring new employees.',
        textUz: "ishga qabul qilish — yangi xodimlarni izlash, tanlash va yollash jarayoni",
        domain: 'management',
      },
    ],
    domains: ['management', 'business_communication'],
    cefr: 'B2',
    collocations: [
      { text: 'the recruitment process', corpusCount: 1080, verified: true },
      { text: 'recruitment costs', corpusCount: 520, verified: true },
      { text: 'freeze recruitment', corpusCount: 180, verified: true },
      { text: 'a recruitment campaign' },
    ],
    synonyms: ['hiring', 'staffing'],
    antonyms: ['redundancy', 'dismissal'],
    wordFamily: ['recruit', 'recruiter', 'recruitment'],
    examples: [
      {
        sentence: 'The recruitment process was shortened from eleven weeks to five after digitalisation.',
        source: 'annual report',
        translationUz:
          "Raqamlashtirishdan so'ng ishga qabul qilish jarayoni o'n bir haftadan besh haftaga qisqardi.",
      },
      {
        sentence: 'A recruitment freeze was introduced in support functions while sales roles were expanded.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'An HR specialist uses this noun when reporting how long it takes to fill a vacancy and at what cost.',
    communicativeTask:
      'Write one sentence describing the stages of a fair recruitment process for a junior analyst.',
    semanticLinks: [
      { word: 'staff turnover', relation: 'caused_by' },
      { word: 'performance review', relation: 'related' },
      { word: 'cost', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-outsource',
    word: 'outsource',
    lemma: 'outsource',
    pos: 'verb',
    ipa: '/ˈaʊtsɔːs/',
    definitions: [
      {
        text: 'To arrange for work that was done inside a company to be done by an outside supplier.',
        textUz: "autsorsingga bermoq — kompaniya ichida bajarilgan ishni tashqi ta'minotchiga topshirmoq",
        domain: 'management',
      },
    ],
    domains: ['management', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'outsource production', corpusCount: 420, verified: true },
      { text: 'outsource IT services', corpusCount: 380, verified: true },
      { text: 'outsource to a third party', corpusCount: 240, verified: true },
      { text: 'bring services back in house' },
    ],
    synonyms: ['contract out', 'subcontract'],
    antonyms: ['insource'],
    wordFamily: ['source', 'outsource', 'outsourcing', 'insource'],
    examples: [
      {
        sentence: 'The group outsourced payroll processing to a specialist provider in 2023.',
        source: 'annual report',
        translationUz:
          "Guruh 2023 yilda ish haqi hisob-kitobini ixtisoslashgan provayderga autsorsingga berdi.",
      },
      {
        sentence: 'Firms increasingly outsource routine tasks while keeping design and analysis in house.',
        source: 'World Bank working paper (style)',
      },
    ],
    professionalContext:
      'An operations director uses this verb when presenting the cost and risk case for using an external supplier.',
    communicativeTask:
      'Write one sentence giving one advantage and one risk of outsourcing customer support.',
    semanticLinks: [
      { word: 'cost', relation: 'related' },
      { word: 'supply', relation: 'related' },
      { word: 'tender', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-supervise',
    word: 'supervise',
    lemma: 'supervise',
    pos: 'verb',
    ipa: '/ˈsuːpəvaɪz/',
    definitions: [
      {
        text: 'To watch over and be responsible for the work of a person or a group.',
        textUz: "nazorat qilmoq — shaxs yoki guruh ishini kuzatib borish va unga javobgar bo'lish",
        domain: 'management',
      },
    ],
    domains: ['management', 'academic'],
    cefr: 'B1',
    collocations: [
      { text: 'supervise a team', corpusCount: 420, verified: true },
      { text: 'closely supervised', corpusCount: 260, verified: true },
      { text: 'supervise the work of', corpusCount: 340, verified: true },
      { text: 'supervise a project' },
    ],
    synonyms: ['oversee', 'manage', 'monitor'],
    antonyms: [],
    wordFamily: ['supervise', 'supervisor', 'supervision', 'supervisory'],
    examples: [
      {
        sentence: 'She supervises a team of eleven analysts across two regional offices.',
        source: 'annual report',
        translationUz: "U ikki mintaqaviy ofisdagi o'n bir tahlilchidan iborat jamoani nazorat qiladi.",
      },
      {
        sentence: 'The regulator supervises credit institutions and publishes an annual stability review.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A department manager uses this verb when describing reporting lines in a job advertisement.',
    communicativeTask:
      'Write one sentence describing what you would check first when supervising a new colleague.',
    semanticLinks: [
      { word: 'leadership', relation: 'related' },
      { word: 'delegate', relation: 'related' },
      { word: 'accountability', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-incentive',
    word: 'incentive',
    lemma: 'incentive',
    pos: 'noun',
    ipa: '/ɪnˈsentɪv/',
    definitions: [
      {
        text: 'Something, usually money or a reward, that encourages a person or company to act in a particular way.',
        textUz: "rag'bat — shaxs yoki kompaniyani ma'lum tarzda harakat qilishga undovchi mukofot",
        domain: 'management',
      },
    ],
    domains: ['management', 'economics'],
    cefr: 'B2',
    collocations: [
      { text: 'provide an incentive', corpusCount: 780, verified: true },
      { text: 'tax incentives', corpusCount: 1140, verified: true },
      { text: 'a financial incentive', corpusCount: 920, verified: true },
      { text: 'incentive scheme' },
    ],
    synonyms: ['inducement', 'motivation', 'reward'],
    antonyms: ['disincentive', 'deterrent'],
    wordFamily: ['incentive', 'incentivise', 'disincentive'],
    examples: [
      {
        sentence: 'Tax incentives for research spending raised private investment in the sector by 12 per cent.',
        source: 'World Bank working paper (style)',
        translationUz:
          "Tadqiqot xarajatlari uchun soliq imtiyozlari sohadagi xususiy investitsiyani 12 foizga oshirdi.",
      },
      {
        sentence: 'The new incentive scheme links a quarter of managerial pay to customer satisfaction.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A reward specialist uses this noun when designing a bonus scheme that supports the strategy of the company.',
    communicativeTask:
      'Write one sentence proposing an incentive that would encourage students to practise English daily.',
    semanticLinks: [
      { word: 'staff turnover', relation: 'related' },
      { word: 'subsidy', relation: 'related' },
      { word: 'performance review', relation: 'related' },
    ],
    status: 'approved',
  },
  /* ================================================================ */
  /* 8. BUSINESS COMMUNICATION — yozishmalar, majlis, muzokara         */
  /* ================================================================ */
  {
    id: 'lx-negotiate',
    word: 'negotiate',
    lemma: 'negotiate',
    pos: 'verb',
    ipa: '/nɪˈɡəʊʃieɪt/',
    definitions: [
      {
        text: 'To discuss something formally with another party in order to reach an agreement.',
        textUz: "muzokara olib bormoq — kelishuvga erishish uchun boshqa tomon bilan rasmiy muhokama qilmoq",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'negotiate a contract', corpusCount: 1180, verified: true },
      { text: 'negotiate terms', corpusCount: 860, verified: true },
      { text: 'negotiate a discount', corpusCount: 320, verified: true },
      { text: 'negotiate in good faith' },
    ],
    synonyms: ['bargain', 'discuss terms'],
    antonyms: [],
    wordFamily: ['negotiate', 'negotiation', 'negotiator', 'negotiable', 'non-negotiable'],
    examples: [
      {
        sentence: 'The two sides negotiated a three-year supply contract with fixed annual volumes.',
        source: 'business press (style)',
        translationUz:
          "Ikki tomon yillik hajmi belgilangan uch yillik ta'minot shartnomasi bo'yicha muzokara olib bordi.",
      },
      {
        sentence: 'Management negotiated better payment terms with its two largest suppliers.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A purchasing manager uses this verb when agreeing prices, volumes and payment terms with a supplier.',
    communicativeTask:
      'Write one sentence you could use to open a negotiation about a longer payment period.',
    semanticLinks: [
      { word: 'proposal', relation: 'related' },
      { word: 'tender', relation: 'related' },
      { word: 'clarify', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-agenda',
    word: 'agenda',
    lemma: 'agenda',
    pos: 'noun',
    ipa: '/əˈdʒendə/',
    definitions: [
      {
        text: 'A list of the topics to be discussed at a meeting, in the order they will be taken.',
        textUz: "kun tartibi — majlisda muhokama qilinadigan mavzular ro'yxati",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'B1',
    collocations: [
      { text: 'set the agenda', corpusCount: 940, verified: true },
      { text: 'an item on the agenda', corpusCount: 620, verified: true },
      { text: 'circulate the agenda', corpusCount: 180, verified: true },
      { text: 'add an item to the agenda' },
    ],
    synonyms: ['programme', 'schedule', 'order of business'],
    antonyms: [],
    wordFamily: ['agenda', 'agendas'],
    examples: [
      {
        sentence: 'Please find attached the agenda for Thursday, together with the minutes of last month.',
        source: 'business email (style)',
        translationUz: "Ilova qilinmoqda: payshanba kuni uchun kun tartibi va o'tgan oy bayonnomasi.",
      },
      {
        sentence: 'Sustainability reporting was the first item on the agenda of the board meeting.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A meeting organiser uses this noun when circulating documents to participants a day before a meeting.',
    communicativeTask:
      'Write a three-item agenda for a short team meeting about a delayed project.',
    semanticLinks: [
      { word: 'minutes', relation: 'related' },
      { word: 'conference call', relation: 'related' },
      { word: 'follow up', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-minutes',
    word: 'minutes',
    lemma: 'minutes',
    pos: 'noun',
    ipa: '/ˈmɪnɪts/',
    definitions: [
      {
        text: 'The written record of what was said and decided at a meeting.',
        textUz: "majlis bayonnomasi — yig'ilishda aytilgan va qabul qilingan qarorlarning yozma qaydi",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'take the minutes', corpusCount: 340, verified: true },
      { text: 'approve the minutes', corpusCount: 420, verified: true },
      { text: 'the minutes of the meeting', corpusCount: 980, verified: true },
      { text: 'circulate the minutes' },
    ],
    synonyms: ['record', 'proceedings'],
    antonyms: [],
    wordFamily: ['minute', 'minutes', 'minute-taker'],
    examples: [
      {
        sentence: 'The minutes of the meeting record that the proposal was approved unanimously.',
        source: 'business email (style)',
        translationUz:
          "Majlis bayonnomasida taklif bir ovozdan tasdiqlangani qayd etilgan.",
      },
      {
        sentence: 'Published minutes of the rate-setting meeting showed a three-to-two split.',
        source: 'central bank statement (style)',
      },
    ],
    professionalContext:
      'A committee secretary uses this noun when writing up decisions and action points after a meeting.',
    communicativeTask:
      'Write two sentences of meeting minutes recording a decision and who is responsible for it.',
    semanticLinks: [
      { word: 'agenda', relation: 'related' },
      { word: 'follow up', relation: 'related' },
      { word: 'memorandum', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-proposal',
    word: 'proposal',
    lemma: 'proposal',
    pos: 'noun',
    ipa: '/prəˈpəʊzl/',
    definitions: [
      {
        text: 'A formal written plan or suggestion put forward for other people to consider.',
        textUz: "taklif hujjati — boshqalar ko'rib chiqishi uchun taqdim etilgan rasmiy yozma reja",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'submit a proposal', corpusCount: 1060, verified: true },
      { text: 'reject a proposal', corpusCount: 720, verified: true },
      { text: 'a detailed proposal', corpusCount: 480, verified: true },
      { text: 'put forward a proposal' },
    ],
    synonyms: ['offer', 'submission', 'plan'],
    antonyms: [],
    wordFamily: ['propose', 'proposal', 'proposed', 'proposer'],
    examples: [
      {
        sentence: 'We should be grateful if you would consider the enclosed proposal by 15 October.',
        source: 'business email (style)',
        translationUz:
          "Ilova qilingan taklifni 15 oktyabrgacha ko'rib chiqishingizni so'raymiz.",
      },
      {
        sentence: 'The board rejected the proposal on the grounds that the payback period was too long.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A business development officer uses this noun when sending a costed plan to a prospective client.',
    communicativeTask:
      'Write one opening sentence for a proposal offering training services to a company.',
    semanticLinks: [
      { word: 'tender', relation: 'related' },
      { word: 'negotiate', relation: 'related' },
      { word: 'executive summary', relation: 'part_of' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-follow-up',
    word: 'follow up',
    lemma: 'follow up',
    pos: 'verb phrase',
    ipa: '/ˌfɒləʊ ˈʌp/',
    definitions: [
      {
        text: 'To contact somebody again about something discussed earlier, in order to check progress.',
        textUz: "keyingi aloqani davom ettirmoq — avval muhokama qilingan masala yuzasidan qayta murojaat qilmoq",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'follow up on an email', corpusCount: 320, verified: true },
      { text: 'follow up with a client', corpusCount: 280, verified: true },
      { text: 'a follow-up meeting', corpusCount: 460, verified: true },
      { text: 'follow up in writing' },
    ],
    synonyms: ['chase up', 'check back'],
    antonyms: [],
    wordFamily: ['follow', 'follow-up', 'following'],
    examples: [
      {
        sentence: 'I am writing to follow up on my email of 3 April regarding the outstanding invoice.',
        source: 'business email (style)',
        translationUz:
          "3 aprelda yuborgan xatimga qaytib, to'lanmagan hisob-faktura yuzasidan yozmoqdaman.",
      },
      {
        sentence: 'A follow-up meeting was scheduled for the end of the month to review progress.',
        source: 'business email (style)',
      },
    ],
    professionalContext:
      'A sales representative uses this phrase when politely reminding a client who has not yet replied.',
    communicativeTask:
      'Write one polite follow-up sentence to a client who has not answered your email for two weeks.',
    semanticLinks: [
      { word: 'clarify', relation: 'related' },
      { word: 'deadline', relation: 'related' },
      { word: 'minutes', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-clarify',
    word: 'clarify',
    lemma: 'clarify',
    pos: 'verb',
    ipa: '/ˈklærɪfaɪ/',
    definitions: [
      {
        text: 'To make something easier to understand by giving more detail or removing confusion.',
        textUz: "aniqlik kiritmoq — qo'shimcha ma'lumot berib, tushunarli qilmoq",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'academic'],
    cefr: 'B2',
    collocations: [
      { text: 'clarify a point', corpusCount: 420, verified: true },
      { text: 'could you clarify', corpusCount: 380, verified: true },
      { text: 'clarify the terms', corpusCount: 240, verified: true },
      { text: 'clarify expectations' },
    ],
    synonyms: ['explain', 'spell out', 'elucidate'],
    antonyms: ['confuse', 'obscure'],
    wordFamily: ['clear', 'clarify', 'clarification', 'clarity'],
    examples: [
      {
        sentence: 'Could you please clarify whether the price quoted includes delivery and insurance?',
        source: 'business email (style)',
        translationUz:
          "Iltimos, aniqlik kiriting: ko'rsatilgan narx yetkazib berish va sug'urtani o'z ichiga oladimi?",
      },
      {
        sentence: 'The bank issued a note clarifying how the new charges would be applied.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'An account manager uses this verb when politely asking a client for missing details before quoting a price.',
    communicativeTask:
      'Write one polite sentence asking a supplier to clarify an unclear point in their offer.',
    semanticLinks: [
      { word: 'confirm', relation: 'related' },
      { word: 'follow up', relation: 'related' },
      { word: 'negotiate', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-deadline-extension',
    word: 'deadline extension',
    lemma: 'deadline extension',
    pos: 'noun phrase',
    ipa: '/ˈdedlaɪn ɪkˌstenʃn/',
    definitions: [
      {
        text: 'Extra time granted beyond the original date by which something had to be completed.',
        textUz: "muddatni uzaytirish — dastlabki belgilangan sanadan keyin beriladigan qo'shimcha vaqt",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'B2',
    collocations: [
      { text: 'request a deadline extension', corpusCount: 140, verified: true },
      { text: 'grant an extension', corpusCount: 380, verified: true },
      { text: 'a two-week extension', corpusCount: 120, verified: true },
      { text: 'apply for an extension' },
    ],
    synonyms: ['extension of time', 'grace period'],
    antonyms: [],
    wordFamily: ['extend', 'extension', 'extended', 'deadline'],
    examples: [
      {
        sentence: 'We should be grateful for a two-week deadline extension owing to a delay in customs.',
        source: 'business email (style)',
        translationUz:
          "Bojxonadagi kechikish sababli muddatni ikki haftaga uzaytirishingizni so'raymiz.",
      },
      {
        sentence: 'The regulator granted an extension for the submission of the annual return.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A contract administrator uses this phrase when formally asking a client for more time and giving a reason.',
    communicativeTask:
      'Write one polite email sentence requesting a deadline extension and giving a clear reason.',
    semanticLinks: [
      { word: 'deadline', relation: 'related' },
      { word: 'apologise', relation: 'related' },
      { word: 'clarify', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-executive-summary',
    word: 'executive summary',
    lemma: 'executive summary',
    pos: 'noun phrase',
    ipa: '/ɪɡˌzekjətɪv ˈsʌməri/',
    definitions: [
      {
        text: 'A short section at the start of a report that gives the main points and recommendations for busy readers.',
        textUz: "qisqacha xulosa — hisobot boshidagi asosiy fikr va tavsiyalarni beruvchi qisqa bo'lim",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'academic'],
    cefr: 'C1',
    collocations: [
      { text: 'write an executive summary', corpusCount: 220, verified: true },
      { text: 'a one-page executive summary', corpusCount: 140, verified: true },
      { text: 'as set out in the executive summary', corpusCount: 90, verified: true },
      { text: 'summarise the key recommendations' },
    ],
    synonyms: ['management summary', 'overview'],
    antonyms: [],
    wordFamily: ['execute', 'executive', 'summary', 'summarise'],
    examples: [
      {
        sentence: 'The executive summary sets out three recommendations and their estimated cost.',
        source: 'business case study (style)',
        translationUz:
          "Qisqacha xulosada uchta tavsiya va ularning taxminiy narxi keltirilgan.",
      },
      {
        sentence: 'Directors are asked to read the executive summary before the board meeting on Friday.',
        source: 'business email (style)',
      },
    ],
    professionalContext:
      'A consultant uses this term when writing the first page of a report, since it may be the only part senior managers read.',
    communicativeTask:
      'Write a two-sentence executive summary of a report on rising prices in your city.',
    semanticLinks: [
      { word: 'proposal', relation: 'part_of' },
      { word: 'findings', relation: 'related' },
      { word: 'overall', relation: 'collocate' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-tender',
    word: 'tender',
    lemma: 'tender',
    pos: 'noun',
    ipa: '/ˈtendə/',
    definitions: [
      {
        text: 'A formal written offer to supply goods or services at a stated price, made in competition with others.',
        textUz: "tender taklifi — belgilangan narxda tovar yoki xizmat yetkazib berish bo'yicha raqobat asosida beriladigan rasmiy taklif",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'C1',
    collocations: [
      { text: 'submit a tender', corpusCount: 480, verified: true },
      { text: 'win a tender', corpusCount: 360, verified: true },
      { text: 'invite tenders', corpusCount: 280, verified: true },
      { text: 'a competitive tender process' },
    ],
    synonyms: ['bid', 'offer'],
    antonyms: [],
    wordFamily: ['tender', 'tenderer', 'tendering'],
    examples: [
      {
        sentence: 'The ministry invited tenders for the construction of three regional logistics centres.',
        source: 'business press (style)',
        translationUz:
          "Vazirlik uchta mintaqaviy logistika markazini qurish uchun tender e\\'lon qildi.",
      },
      {
        sentence: 'The group won a five-year tender to supply metering equipment to the utility.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'A bid manager uses this noun when preparing documents that must meet strict public procurement rules.',
    communicativeTask:
      'Write one sentence stating why your company should win a tender, mentioning price and experience.',
    semanticLinks: [
      { word: 'proposal', relation: 'related' },
      { word: 'negotiate', relation: 'related' },
      { word: 'outsource', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-invoice',
    word: 'invoice',
    lemma: 'invoice',
    pos: 'noun',
    ipa: '/ˈɪnvɔɪs/',
    definitions: [
      {
        text: 'A document sent to a customer listing goods or services supplied and the amount that must be paid.',
        textUz: "hisob-faktura — yetkazilgan tovar yoki xizmat va to'lanishi kerak bo'lgan summa ko'rsatilgan hujjat",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'finance'],
    cefr: 'B1',
    collocations: [
      { text: 'issue an invoice', corpusCount: 620, verified: true },
      { text: 'settle an invoice', corpusCount: 340, verified: true },
      { text: 'an outstanding invoice', corpusCount: 420, verified: true },
      { text: 'invoice number' },
    ],
    synonyms: ['bill', 'statement of charges'],
    antonyms: ['receipt'],
    wordFamily: ['invoice', 'invoicing', 'invoiced'],
    examples: [
      {
        sentence: 'Please find attached invoice number 2024-0417, payable within thirty days.',
        source: 'business email (style)',
        translationUz:
          "Ilova qilinmoqda: 2024-0417 raqamli hisob-faktura, o'ttiz kun ichida to'lanadi.",
      },
      {
        sentence: 'Late settlement of invoices lengthened the average collection period to 58 days.',
        source: 'annual report',
      },
    ],
    professionalContext:
      'An accounts receivable clerk uses this noun daily when billing customers and chasing overdue payments.',
    communicativeTask:
      'Write one polite sentence reminding a customer that an invoice is now ten days overdue.',
    semanticLinks: [
      { word: 'transaction fee', relation: 'related' },
      { word: 'follow up', relation: 'related' },
      { word: 'cash flow', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-memorandum',
    word: 'memorandum',
    lemma: 'memorandum',
    pos: 'noun',
    ipa: '/ˌmeməˈrændəm/',
    definitions: [
      {
        text: 'A short official note written inside an organisation to inform staff or record an agreement.',
        textUz: "xizmat xati, memorandum — tashkilot ichida xabar berish yoki kelishuvni qayd etish uchun yoziladigan qisqa rasmiy hujjat",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'management'],
    cefr: 'C1',
    collocations: [
      { text: 'issue a memorandum', corpusCount: 240, verified: true },
      { text: 'an internal memorandum', corpusCount: 320, verified: true },
      { text: 'a memorandum of understanding', corpusCount: 940, verified: true },
      { text: 'circulate a memorandum' },
    ],
    synonyms: ['memo', 'internal note'],
    antonyms: [],
    wordFamily: ['memorandum', 'memoranda', 'memo'],
    examples: [
      {
        sentence: 'The two banks signed a memorandum of understanding on cross-border payments.',
        source: 'business press (style)',
        translationUz:
          "Ikki bank chegaralararo to'lovlar bo'yicha o'zaro anglashuv memorandumini imzoladi.",
      },
      {
        sentence: 'An internal memorandum set out the new expense rules taking effect in January.',
        source: 'business email (style)',
      },
    ],
    professionalContext:
      'An administrative officer uses this noun when informing all staff about a change of internal procedure.',
    communicativeTask:
      'Write a two-sentence internal memorandum announcing a new rule about meeting rooms.',
    semanticLinks: [
      { word: 'minutes', relation: 'related' },
      { word: 'proposal', relation: 'related' },
      { word: 'confirm', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-conference-call',
    word: 'conference call',
    lemma: 'conference call',
    pos: 'noun phrase',
    ipa: '/ˈkɒnfərəns kɔːl/',
    definitions: [
      {
        text: 'A telephone or online meeting in which three or more people in different places take part.',
        textUz: "konferens-aloqa — turli joylardagi uch va undan ortiq kishi qatnashadigan telefon yoki onlayn uchrashuv",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'join a conference call', corpusCount: 320, verified: true },
      { text: 'schedule a conference call', corpusCount: 240, verified: true },
      { text: 'the quarterly earnings call', corpusCount: 680, verified: true },
      { text: 'dial into the call' },
    ],
    synonyms: ['video call', 'teleconference'],
    antonyms: [],
    wordFamily: ['confer', 'conference', 'call'],
    examples: [
      {
        sentence: 'Management will host a conference call for analysts at 14:00 on the day of results.',
        source: 'annual report',
        translationUz:
          "Rahbariyat natijalar e\\'lon qilinadigan kuni soat 14:00 da tahlilchilar uchun konferens-aloqa o'tkazadi.",
      },
      {
        sentence: 'Apologies, I will be ten minutes late joining the conference call this afternoon.',
        source: 'business email (style)',
      },
    ],
    professionalContext:
      'An investor relations assistant uses this phrase when inviting analysts to the quarterly results discussion.',
    communicativeTask:
      'Write one sentence inviting three colleagues to a conference call, giving the date, time and topic.',
    semanticLinks: [
      { word: 'agenda', relation: 'related' },
      { word: 'minutes', relation: 'related' },
      { word: 'confirm', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-apologise',
    word: 'apologise',
    lemma: 'apologise',
    pos: 'verb',
    ipa: '/əˈpɒlədʒaɪz/',
    definitions: [
      {
        text: 'To say that you are sorry for a mistake, delay or problem you have caused.',
        textUz: "uzr so'ramoq — sabab bo'lgan xato yoki kechikish uchun kechirim so'ramoq",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'apologise for the delay', corpusCount: 420, verified: true },
      { text: 'apologise for any inconvenience', corpusCount: 560, verified: true },
      { text: 'apologise sincerely', corpusCount: 180, verified: true },
      { text: 'apologise on behalf of' },
    ],
    synonyms: ['say sorry', 'express regret'],
    antonyms: [],
    wordFamily: ['apologise', 'apology', 'apologetic', 'apologies'],
    examples: [
      {
        sentence: 'We apologise for the delay in dispatching your order and for any inconvenience caused.',
        source: 'business email (style)',
        translationUz:
          "Buyurtmangizni jo'natishdagi kechikish va yuzaga kelgan noqulaylik uchun uzr so'raymiz.",
      },
      {
        sentence: 'The chief executive apologised publicly for the failure of the payment system.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'A customer service officer uses this verb when responding in writing to a complaint about a late delivery.',
    communicativeTask:
      'Write one professional sentence apologising to a client for sending an incorrect invoice.',
    semanticLinks: [
      { word: 'clarify', relation: 'related' },
      { word: 'deadline extension', relation: 'related' },
      { word: 'follow up', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-attachment',
    word: 'attachment',
    lemma: 'attachment',
    pos: 'noun',
    ipa: '/əˈtætʃmənt/',
    definitions: [
      {
        text: 'A file that is sent together with an email message.',
        textUz: "ilova — elektron xat bilan birga yuboriladigan fayl",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication'],
    cefr: 'B1',
    collocations: [
      { text: 'open an attachment', corpusCount: 320, verified: true },
      { text: 'please see the attachment', corpusCount: 240, verified: true },
      { text: 'send as an attachment', corpusCount: 280, verified: true },
      { text: 'an attachment is missing' },
    ],
    synonyms: ['enclosure', 'attached file'],
    antonyms: [],
    wordFamily: ['attach', 'attached', 'attachment'],
    examples: [
      {
        sentence: 'Please find the signed contract as an attachment to this message.',
        source: 'business email (style)',
        translationUz: "Imzolangan shartnoma ushbu xatga ilova qilingan.",
      },
      {
        sentence: 'Staff are reminded not to open attachments from unknown senders.',
        source: 'business email (style)',
      },
    ],
    professionalContext:
      'An office administrator uses this noun when sending contracts and reports to external partners by email.',
    communicativeTask:
      'Write one sentence telling a colleague what you have attached and what they should do with it.',
    semanticLinks: [
      { word: 'invoice', relation: 'related' },
      { word: 'proposal', relation: 'related' },
      { word: 'confirm', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-confirm',
    word: 'confirm',
    lemma: 'confirm',
    pos: 'verb',
    ipa: '/kənˈfɜːm/',
    definitions: [
      {
        text: 'To state officially that something is true, agreed or arranged.',
        textUz: "tasdiqlamoq — biror narsaning to'g'ri yoki kelishilganini rasman bildirmoq",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'general'],
    cefr: 'B1',
    collocations: [
      { text: 'confirm receipt', corpusCount: 480, verified: true },
      { text: 'confirm in writing', corpusCount: 420, verified: true },
      { text: 'confirm an appointment', corpusCount: 360, verified: true },
      { text: 'please confirm by Friday' },
    ],
    synonyms: ['verify', 'acknowledge', 'validate'],
    antonyms: ['deny', 'cancel'],
    wordFamily: ['confirm', 'confirmation', 'confirmed', 'unconfirmed'],
    examples: [
      {
        sentence: 'Please confirm receipt of this email and let us know if the terms are acceptable.',
        source: 'business email (style)',
        translationUz:
          "Iltimos, ushbu xatni olganingizni tasdiqlang va shartlar maqbulligini bildiring.",
      },
      {
        sentence: 'The company confirmed that full-year guidance remains unchanged.',
        source: 'business press (style)',
      },
    ],
    professionalContext:
      'An assistant uses this verb when replying to arrangements so that both sides have a written record.',
    communicativeTask:
      'Write one sentence confirming a meeting, restating the date, time and place.',
    semanticLinks: [
      { word: 'clarify', relation: 'related' },
      { word: 'conference call', relation: 'related' },
      { word: 'attachment', relation: 'related' },
    ],
    status: 'approved',
  },
  {
    id: 'lx-presentation',
    word: 'presentation',
    lemma: 'presentation',
    pos: 'noun',
    ipa: '/ˌprezənˈteɪʃn/',
    definitions: [
      {
        text: 'A talk in which somebody explains information or a proposal to an audience, often with slides.',
        textUz: "taqdimot — ma'lumot yoki taklifni auditoriyaga, ko'pincha slaydlar bilan tushuntirish",
        domain: 'business_communication',
      },
    ],
    domains: ['business_communication', 'academic'],
    cefr: 'B1',
    collocations: [
      { text: 'give a presentation', corpusCount: 1240, verified: true },
      { text: 'prepare a presentation', corpusCount: 620, verified: true },
      { text: 'an investor presentation', corpusCount: 480, verified: true },
      { text: 'presentation slides' },
    ],
    synonyms: ['talk', 'briefing', 'pitch'],
    antonyms: [],
    wordFamily: ['present', 'presentation', 'presenter', 'presentational'],
    examples: [
      {
        sentence: 'The investor presentation and audio webcast are available on the corporate website.',
        source: 'annual report',
        translationUz:
          "Investorlar uchun taqdimot va audio translyatsiya korporativ veb-saytda mavjud.",
      },
      {
        sentence: 'She gave a fifteen-minute presentation on the results of the pilot project.',
        source: 'business case study (style)',
      },
    ],
    professionalContext:
      'A young economist uses this noun when preparing to explain analytical results to managers who are not specialists.',
    communicativeTask:
      'Write one opening sentence for a presentation about inflation in your country.',
    semanticLinks: [
      { word: 'executive summary', relation: 'related' },
      { word: 'findings', relation: 'related' },
      { word: 'agenda', relation: 'related' },
    ],
    status: 'approved',
  },
]

/** Yozuvlar birinchi sohasi (`domains[0]`) bo'yicha guruhlangan ko'rinishi. */
export const SEED_LEXICON_BY_DOMAIN: Record<string, SeedLexiconEntry[]> = SEED_LEXICON.reduce<
  Record<string, SeedLexiconEntry[]>
>((acc, entry) => {
  const key: string = entry.domains[0] ?? 'general'
  ;(acc[key] ??= []).push(entry)
  return acc
}, {})
