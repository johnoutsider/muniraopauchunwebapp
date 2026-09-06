# Talablar → amalga oshirish xaritasi

Ushbu hujjat so‘rovnomadagi (`ILMIY TADQIQOT PLATFORMASI UCHUN SO‘ROVNOMA`) va
`PLAN.md` dagi har bir talab kod bazasida qayerda bajarilganini ko‘rsatadi.
Har bir bosqich yakunida shu jadval bo‘yicha tekshiruv o‘tkaziladi.

---

## 1. Foydalanuvchi rollari (so‘rovnoma 3-bo‘lim)

| Rol | Amalga oshirish | Huquq nazorati |
|---|---|---|
| Talaba | `app/(student)/**`, `src/features/student` | `requireStudent()` — consent va onboarding majburiy |
| O‘qituvchi | `app/(teacher)/**`, `src/features/teacher` | `requireUser(['teacher','admin'])` + `assertTeachesGroup` |
| AI o‘qituvchi / AI Tutor | `src/ai/services/tutor.ts`, `app/api/ai/tutor` | `aiTutor` feature flag |
| Tadqiqotchi | `app/(researcher)/**`, `src/features/researcher` | `requireUser(['researcher','admin'])` |
| Administrator | `app/(admin)/**`, `src/features/admin` | `requireUser(['admin'])` + `auditLogs` |

Rollar Firebase Auth **custom claims** orqali (`role`, `groupId`, `groupIds`,
`expGroup`, `participantCode`) — `src/lib/firebase/session.ts`.

---

## 2. Metodik tizim (so‘rovnoma 4-bo‘lim)

### Motivatsion-maqsadli komponent

| Talab | Qayerda |
|---|---|
| O‘quv maqsadini aniqlash | `app/onboarding` — “What do you want to improve?” ustasi |
| Kasbiy ehtiyojlarni belgilash | Onboarding 2-qadam: finance / banking / marketing / management / economics |
| Individual goal setting | `users.onboarding.goal`, `learningPaths.goals` |
| Learning motivation | Motivatsiya so‘rovnomasi — `src/content/surveys.ts`, `/student/surveys` |
| AI literacy boshlang‘ich moduli | `/student/prompt-lab` kirish moduli |
| Refleksiya kundaligi | `/student/reflection`, `reflections` kolleksiyasi |

### Mazmuniy-lingvistik komponent

| Yo‘nalish | Qayerda |
|---|---|
| A. Vocabulary & Lexis (8 domen, kollokatsiya, sinonim/antonim, word formation, semantic network, terminologiya) | `src/content/lexicon.ts`, `/student/practice/[skill]` (vocabulary), `app/api/ai/semantic-network` |
| So‘z → ma’no → kollokatsiya → kontekst → kasbiy vaziyat → kommunikativ qo‘llash | `LexiconDoc` maydonlari + so‘z kartasi komponenti + `VOCABULARY_SEQUENCE` (system prompt) |
| B. Grammar (iqtisodiy kontekstda, 8 mavzu) | `GRAMMAR_TOPICS` (`src/config/constants.ts`), `src/content/grammar.ts`, `/student/practice/[skill]` (grammar) |
| Mashqlar darajasi avtomatik moslashadi | `src/lib/adaptive/policy.ts` + `bkt.ts` |
| C. Pronunciation & Phonetics + AI Pronunciation Coach | `/student/speaking-lab`, `src/lib/speech/azure.ts`, `app/api/speech/assess` |
| Ovozni namuna bilan taqqoslash | `app/api/speech/tts` + `src/lib/speech/tts-cache.ts` |

---

## 3. 8 bosqichli o‘quv algoritmi (so‘rovnoma 5-bo‘lim)

| Bosqich | Route | Kod |
|---|---|---|
| 1. Maqsad va tashkil etish | `/onboarding`, `/student/path` | `src/lib/adaptive/path.ts` |
| 2. Diagnostika va differensiallashtirish | `/student/assessment/diagnostic` | `buildLinguisticProfile`, `generatePath` |
| 3. AI bilan ishlashga tayyorgarlik | `/student/prompt-lab` | `src/ai/services/prompt-lab.ts` |
| 4. O‘rgatuvchi bosqich | `/student/learn/[lessonId]` | `LessonBlock` renderer |
| 5. Mashq va avtomatlashtirish | `/student/practice/[skill]` | `exercise-runner`, `gradeItem`, `recordAttempt` |
| 6. Produktiv-kommunikativ | `/student/ai-teacher`, `/student/speaking-lab`, `/student/writing-lab`, `/student/communication` | `roleplay`, `reviewWriting` |
| 7. Integrativ-kasbiy faoliyat | `/student/projects/[projectId]` | `src/content/case-studies.ts`, 9 bosqichli case oqimi |
| 8. Baholash, feedback, refleksiya | `/student/assessment/results/[attemptId]`, `/student/reflection` | `buildFeedbackReport` |

---

## 4. Kerakli platform funksiyalari (so‘rovnoma 6-bo‘lim)

| Imkoniyat | Holat | Qayerda |
|---|---|---|
| Ro‘yxatdan o‘tish | ✅ | `app/(auth)/register` + admin tasdiqlash |
| Shaxsiy kabinet | ✅ | `/student/settings` |
| Student dashboard | ✅ | `/student/dashboard` |
| Teacher dashboard | ✅ | `/teacher/dashboard` |
| Researcher dashboard | ✅ | `/researcher/dashboard` |
| Video lessons | ✅ | `LessonBlock.video` (YouTube/Vimeo/Storage) |
| Interactive lessons | ✅ | `LessonBlock` to‘plami |
| Vocabulary module | ✅ | `/student/practice/[skill]` (vocabulary) |
| Grammar module | ✅ | `/student/practice/[skill]` (grammar) |
| Pronunciation module | ✅ | `/student/speaking-lab` |
| Listening | ✅ | Diagnostika bo‘limi + `practice/listening` |
| Reading | ✅ | `practice/reading` + `LessonBlock.text` |
| Writing | ✅ | `/student/writing-lab` |
| Speaking | ✅ | `/student/speaking-lab`, role-play |
| Professional English module | ✅ | Domen darslari + case study |
| Pre-test / Post-test | ✅ | `/student/assessment/post-test`, `tests` kolleksiyasi |
| Diagnostic test | ✅ | `/student/assessment/diagnostic` |
| Adaptive tests | ✅ | `pickNextItem` + `TestDoc.type='adaptive'` |
| Individual learning path | ✅ | `/student/path` |
| AI tutor / chatbot / feedback | ✅ | `/student/ai-teacher`, `app/api/ai/*` |
| Pronunciation AI | ✅ | Azure + `analyseSpeaking` |
| Group work / Individual work | ✅ | `/student/projects`, `/student/practice` |
| Student chat / Teacher-student chat / AI chat | ✅ | `/student/communication/chats`, `/teacher/chats` |
| Discussion forum | ✅ | `/student/communication/forum` |
| Peer assessment | ✅ | `src/features/peer` |
| Self-assessment | ✅ | `/student/reflection` |
| Gamification, badges | ✅ | `/student/achievements`, `XP`, `badges` |
| Portfolio | ✅ | `/student/portfolio` |
| Learning analytics | ✅ | `/teacher/analytics`, `/researcher/analytics` |
| Charts and statistics | ✅ | `src/components/charts` |
| Excel export | ✅ | `src/lib/export/excel.ts` |
| SPSS-ready export | ✅ | `src/lib/export/spss.ts` (CSV + codebook + `.sps`) |
| Eksperimental/nazorat guruh boshqaruvi | ✅ | `/researcher/groups` + feature flags |

---

## 5. AI funksiyalari (so‘rovnoma 7-bo‘lim)

| Funksiya | Servis |
|---|---|
| AI Teacher / Tutor / Chatbot | `src/ai/services/tutor.ts` |
| AI Feedback | `analysis.ts` → `buildFeedbackReport` |
| Adaptive Learning | `src/lib/adaptive/*` |
| Personalized Tasks | `exercises.ts` (profilga mos) |
| AI Vocabulary Generator | `vocabulary.ts` → `generateVocabCard` |
| AI Grammar Exercises | `exercises.ts` → `generateExercises` |
| AI Speaking Partner | `roleplay.ts` |
| AI Pronunciation Coach | `speaking.ts` + Azure |
| AI Writing Feedback | `writing.ts` → `reviewWriting` |
| AI Error Analysis | `analysis.ts` → `analyseErrors` |
| AI Progress Prediction | `src/lib/analytics/aggregate.ts` → `predictProgress` + cron |
| Learning Analytics | `aggregate.ts`, `stats.ts` |
| Prompt Scaffolding | `prompt-lab.ts` → `evaluatePrompt` |
| Corpus Verification | `corpus.ts` + `scripts/build-corpus.ts` |

---

## 6. Mualliflik AI strategiyalari (so‘rovnoma 8-bo‘lim)

| Strategiya | Amalga oshirish |
|---|---|
| AI Semantic Network | `generateSemanticNetwork`, `semanticNetworks` kolleksiyasi, graf UI |
| Prompt Scaffolding | Simple → Guided → Independent, `nextLevel` server tomonda hisoblanadi |
| Adaptive Learning | Diagnostika → natija → mashq → feedback → qayta moslashtirish |
| AI Feedback and Reflection | `FEEDBACK_RULE` system promptda: **nima uchun → qanday tuzatish → yana qayerda**; har bir `ItemDoc.explanation` shu uch maydondan iborat |
| Corpus Verification | `corpusNgrams` + `verifyCollocation` |
| Interactive AI Communication | 6 persona role-play (matn va ovoz) |
| AI Pronunciation Coaching | Azure fonema/prosody ballari → pedagogik tavsiya |

---

## 7. Tajriba va ma’lumotlar (so‘rovnoma 11-bo‘lim)

| Talab | Amalga oshirish |
|---|---|
| 150–200 talaba | `scripts/import-users.ts` (Excel/CSV bulk import) |
| Lingvistik natijalar | `testAttempts.sectionScores`, `mastery`, `speakingSubmissions`, `writingSubmissions` |
| Faoliyat ma’lumotlari | `attempts`, `events_YYYY_MM`, `statsDaily` |
| Tadqiqot ma’lumotlari | `experiments`, `surveyResponses`, `users.expGroup` |
| Dashboard / Charts / Progress graphs | `/researcher/analytics` |
| Excel / CSV / SPSS eksport | `/researcher/export` |
| Anonimlik | Eksportda faqat `participantCode`; mapping faqat `/researcher/participants` |

---

## 8. Eksperiment dizayni kafolati

Nazorat guruhi AI imkoniyatlarini **serverda** ololmaydi:

1. `resolveFlags(user)` guruh turiga qarab bayroqlarni hisoblaydi (`src/lib/flags.ts`).
2. Sahifalar AI bloklarini umuman render qilmaydi (`FlagGate`).
3. AI API route‘lari `guardRoute(..., { flag })` orqali 403 qaytaradi
   (`src/features/shared/api-helpers.ts`) — UI‘ni chetlab o‘tish mumkin emas.
4. Adaptivlik `adaptive` bayrog‘i o‘chirilganda ishlamaydi — hamma bir xil
   ketma-ketlikni oladi.

Bu — eksperimentning mustaqil o‘zgaruvchisi.
