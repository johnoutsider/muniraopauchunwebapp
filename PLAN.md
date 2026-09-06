# ILMIY TADQIQOT PLATFORMASI — TO'LIQ ISHLAB CHIQISH REJASI

**Loyiha (ishchi nomi):** LinguaEcon AI — iqtisodiyot yo'nalishi talabalari uchun AI asosidagi professional ingliz tili platformasi
**Buyurtmachi:** Munirakhon Mukhitdinova (DSc, O'zDJTU), himoya ~2027
**Maqsad:** 8 bosqichli mualliflik metodikasini amalda ko'rsatadigan va 150–200 talaba bilan real eksperiment o'tkazishga yaroqli MVP
**Stek:** Next.js 15 (App Router) + Firebase (Auth, Firestore, Storage, Functions) + Vercel + Claude API + Azure Speech
**Reja sanasi:** 2026-09-06

---

## 0. QISQACHA XULOSA (Executive Summary)

| Savol | Javob |
|---|---|
| Nima quriladi | 5 rolli (talaba, o'qituvchi, tadqiqotchi, admin + AI tutor) veb-platforma, 14 asosiy sahifa, 8 bosqichli o'quv oqimi |
| Qayerda ishlaydi | Frontend + server logika Vercel'da (Next.js 15), ma'lumotlar Firebase'da (Frankfurt regioni) |
| AI | Claude (matn: tutor, feedback, mashq generatsiya), Azure Speech (talaffuz baholash, TTS, STT) |
| Muddat | ~13 hafta MVP (2026-yil dekabr boshi), pilot dekabr, asosiy eksperiment 2027-yil yanvar–aprel |
| Eksperiment | Eksperimental / nazorat guruhlari, pre-test / post-test, so'rovnomalar, Excel/CSV/SPSS eksport |
| Asosiy tamoyil | Har bir ☑ belgilangan funksiya MVP'ga kiradi, lekin "chuqurlik" bosqichma-bosqich oshiriladi |

---

## 1. TEXNOLOGIK STEK (yakuniy qaror)

### 1.1. Frontend
| Qatlam | Tanlov | Sabab |
|---|---|---|
| Framework | **Next.js 15.x** (App Router, React 19, Server Components, Server Actions, Route Handlers, Turbopack) | Vercel bilan tabiiy integratsiya, streaming AI javoblar, SEO landing |
| Til | **TypeScript (strict)** | Xatolarni kamaytirish, katta jamoa/AI-yordamchi bilan ishlash qulay |
| Stil | **Tailwind CSS 4 + shadcn/ui + lucide-react** | Tez UI, izchil dizayn tizimi, accessible komponentlar |
| Animatsiya | framer-motion (minimal) | Gamification, progress effektlari |
| Formlar | react-hook-form + zod | Barcha formalar va AI JSON javoblari uchun yagona validatsiya |
| Client state | React holati + Firestore realtime (`onSnapshot`) hooklar; zustand faqat kerak bo'lganda | Chat, presence, progress real vaqtda |
| Server data | React Server Components + Server Actions; TanStack Query faqat client-side interaktiv joylarda | Kamroq client kod |
| Jadval | TanStack Table | Teacher/Researcher jadvallar, filtr, sort |
| Grafiklar | **Recharts** | Progress, statistika, iqtisodiy grafiklar (case study) |
| Audio | MediaRecorder + o'z WAV enkoderimiz (`src/lib/speech/audio.ts`: AudioContext bilan dekodlash, mono downmix, 16 kHz resampling, 16-bit PCM sarlavha) | Azure 16 kHz mono PCM WAV talab qiladi; tashqi kutubxona kerak emas |
| Video | YouTube (unlisted) / Vimeo embed + Firebase Storage (o'z videolari) | Arzon, tez; MVP uchun Mux shart emas |
| i18n | **next-intl** — `uz` (default, lotin), `en`, `ru` | Interfeys o'zbek/rus, o'quv kontenti ingliz |
| PWA | next-pwa yoki manual manifest + service worker (offline shell) | Talabalar telefondan kiradi, internet beqaror |
| Mobile-first | Barcha sahifalar 360px dan boshlab | Asosiy foydalanuvchi telefonda |

### 1.2. Backend / Ma'lumotlar (Firebase, Blaze rejasi)
| Xizmat | Vazifa |
|---|---|
| **Firebase Auth** | Email/parol (asosiy), Google, telefon (ixtiyoriy). Rollar **custom claims** orqali (`role`, `groupId`, `expGroup`) |
| **Cloud Firestore** (Native mode, region `europe-west3` Frankfurt) | Asosiy DB: foydalanuvchilar, kontent, urinishlar, chat, eventlar |
| **Firebase Storage** | Audio yozuvlar, TTS namuna audio, yuklangan fayllar, prezentatsiyalar, video |
| **Cloud Functions (2nd gen, Node 20)** | Faqat Firestore triggerlari: `onUserCreated`, urinish yozilganda mastery yangilash, og'ir/asinxron ishlar. Qolgan server logika Vercel'da |
| **App Check** (reCAPTCHA Enterprise) | Bot va API suiiste'molidan himoya |
| **Firestore Security Rules + Storage Rules** | Rolga asoslangan kirish; Emulator'da test qilinadi |
| **Firebase Extensions** (ixtiyoriy, 2-bosqich) | "Export Collections to BigQuery" — og'ir analitika uchun |

**Server tomonda (Vercel):** `firebase-admin` SDK (service account env orqali). Sessiya Firebase **session cookie** (httpOnly) orqali: `createSessionCookie` bilan yaratiladi, har so'rovda `verifySessionCookie` bilan tekshiriladi (`src/lib/firebase/session.ts`). Middleware edge'da faqat cookie mavjudligini tekshiradi, haqiqiy rol tekshiruvi server komponentlarida (`requireUser`) bajariladi.

### 1.3. AI xizmatlari
| Vazifa | Xizmat | Izoh |
|---|---|---|
| Matnli AI (tutor, feedback, mashq generatsiya, error analysis, role-play, writing feedback, prompt baholash) | **Claude API** (Vercel AI SDK `ai` + `@ai-sdk/anthropic`) | Asosiy model: `claude-sonnet-5`; arzon/tez ishlar (klassifikatsiya, qisqa tekshiruv): `claude-haiku-4-5-20251001`. Barcha javoblar zod sxemasi bilan `generateObject`/`streamObject`. Prompt caching (metodika + rubrikalar katta system prompt) |
| Talaffuz baholash | **Azure AI Speech — Pronunciation Assessment** | Accuracy, fluency, completeness, prosody; so'z va fonema darajasida ball; scripted (matn bo'yicha) va unscripted (erkin nutq) rejimlar |
| STT (speaking transkript) | Azure Speech-to-Text | Speaking topshiriqlar, role-play ovozli rejim |
| TTS (namuna talaffuz) | Azure Neural TTS (en-GB / en-US ovozlar) | Natija Storage'da keshlanadi (bir so'z — bir marta) |
| Zaxira STT | OpenAI Whisper API (ixtiyoriy) | Azure ishlamasa |
| Corpus Verification | O'z mini-korpus (ochiq iqtisodiy matnlar) + n-gram hisob + Claude izohi | 8.5-bo'limga qarang |

### 1.4. Infratuzilma va vositalar
| Vazifa | Vosita |
|---|---|
| Hosting | **Vercel** (Pro reja eksperiment davrida; funksiya region `fra1`, `maxDuration` AI route'lar uchun 60–300 s) |
| Cron | Vercel Cron (kunlik statistika agregatsiyasi, progress prediction, SRS eslatmalar) |
| Rate limiting | Firestore kunlik hisoblagich `aiQuota/{uid}_{sana}` + in-memory kesh (`src/ai/guard/rate-limit.ts`) — qo'shimcha xizmat kerak emas |
| Email | Firebase Auth (verifikatsiya, parol tiklash) + Resend (bildirishnomalar, ixtiyoriy) |
| Monitoring | Sentry (frontend + server), Vercel Analytics, Firebase usage alerts |
| Repo / CI | GitHub + GitHub Actions (lint, typecheck, unit test, Firestore rules test) → Vercel Preview → Production |
| Test | Vitest + Testing Library (unit), Playwright (e2e asosiy oqimlar), Firebase Emulator Suite (rules) |
| Paket menejer | pnpm |
| Kod sifati | ESLint, Prettier, Husky + lint-staged, Conventional Commits |

### 1.5. Muhim texnik qarorlar (nima uchun aynan shunday)
1. **Firestore realtime = chat.** Socket.io yoki alohida server kerak emas. Student chat, teacher chat, group discussion, presence — `onSnapshot`.
2. **AI kalitlari faqat serverda.** Brauzer hech qachon Claude/Azure kalitini ko'rmaydi. Barcha AI chaqiruvlar Route Handler / Server Action orqali.
3. **Vercel + Firebase regionlari yaqin** (Frankfurt) — O'zbekistondan kechikish minimal.
4. **Nazorat guruhi uchun "AI-siz" rejim** feature-flag orqali: xuddi shu platforma, lekin AI tutor, AI feedback, adaptivlik o'chirilgan; faqat statik mashqlar + o'qituvchi feedback. Bu eksperiment dizayni uchun majburiy.
5. **Event log (append-only)** — har bir harakat yoziladi; barcha ilmiy ma'lumot shu yerdan olinadi.
6. **AI yaratgan kontent → o'qituvchi tasdiqlaydi** (human-in-the-loop tamoyili). Tasdiqlangan mashqlar "item bank"ga tushadi va qayta ishlatiladi (arzon + izchil).

---

## 2. FOYDALANUVCHI ROLLARI VA HUQUQLAR

| Rol | Claim | Nima qila oladi |
|---|---|---|
| **Talaba** (`student`) | `role=student`, `groupId`, `expGroup=experimental\|control` | O'qiydi, testlar, mashqlar, AI bilan ishlaydi (agar experimental), chat, guruh ishi, portfolio |
| **O'qituvchi** (`teacher`) | `role=teacher`, `groupIds[]` | O'z guruhlarini ko'radi, materiallarni tasdiqlaydi, writing/speaking'ga feedback beradi, chat, topshiriq beradi, progressni kuzatadi |
| **Tadqiqotchi** (`researcher`) | `role=researcher` | Eksperimentni sozlaydi, guruhlarga ajratadi, pre/post testlarni boshqaradi, so'rovnomalar, barcha statistika, eksport (anonim) |
| **Administrator** (`admin`) | `role=admin` | Foydalanuvchi/guruh/kurs CRUD, bulk import, feature flags, texnik sozlamalar, audit log |
| **AI Tutor** | Tizim aktori (auth roli emas) | Chat, feedback, role-play, mashq generatsiya — barcha harakatlari `aiInteractions`ga yoziladi |

**Auth oqimi:**
- Talabalar admin tomonidan **bulk import** (Excel: F.I.Sh., guruh, email) → avtomatik hisob + `participantCode` (masalan `E-042`, `C-017`) + vaqtinchalik parol. Birinchi kirishda parolni o'zgartirish + **informed consent** (tadqiqotda ishtirok roziligi) + profil to'ldirish.
- O'qituvchi/tadqiqotchi hisoblari admin tomonidan yaratiladi.
- Ochiq ro'yxatdan o'tish (landing "Sign up") — ixtiyoriy, admin tasdiqlaydi ("pending" holat).
- Sessiya: Firebase ID token → server session cookie (httpOnly, 5 kun). Middleware himoyalangan yo'llarga cookie'siz kirishni to'sadi; rol tekshiruvi `requireUser` / `requireStudent` orqali server tomonda.

---

## 3. AXBOROT ARXITEKTURASI — SAHIFALAR VA ROUTELAR

```
app/
  (marketing)/            # 1. Landing
    page.tsx              # Home: metodika, 8 bosqich, demo video, kirish
    about/                # Tadqiqot haqida, muallif, etika
  (auth)/
    login/  register/  reset-password/  consent/  onboarding/
  (student)/student/
    dashboard/            # 2. Student Dashboard
    path/                 # 3. My Learning Path
    learn/[moduleId]/[lessonId]/   # 4. Learn (video + interactive + mashq)
    ai-teacher/           # 5. AI Teacher (24/7 chat, scaffold darajalari)
    practice/             # 6. Practice Zone (gamified, adaptiv)
      vocabulary/  grammar/  listening/  reading/
    speaking-lab/         # 7. Speaking & Pronunciation Lab
    writing-lab/          # 8. Writing Lab
    communication/        # 9. Communication Hub
      ai-chat/  chats/[chatId]/  groups/[groupId]/  forum/
    projects/             # 10. Group Project Zone (case study, project, presentation)
      [projectId]/
    assessment/           # 11. Assessment Center
      diagnostic/  progress/  post-test/  results/[attemptId]/
    portfolio/            # 12. My Portfolio
    reflection/           # Refleksiya kundaligi (1 va 8-bosqich)
    prompt-lab/           # 3-bosqich: Prompt Practice Lab
    achievements/         # Gamification: badge, XP, streak, leaderboard
    settings/
  (teacher)/teacher/      # 13. Teacher Dashboard
    dashboard/  groups/[groupId]/  students/[uid]/  content/ (tasdiqlash)
    review/ (writing/speaking navbat)  assignments/  chats/  analytics/
  (researcher)/researcher/  # 14. Researcher Analytics Dashboard
    dashboard/  experiment/  groups/  tests/  surveys/  analytics/  export/  participants/
  (admin)/admin/
    users/  groups/  cohorts/  courses/  items/  lexicon/  flags/  audit/  system/
  api/                    # Route Handlers (AI streaming, speech, export, cron, webhooks)
```

**Sahifa → funksiya mosligi (so'rovnoma 12-bo'lim):** 14 sahifaning barchasi yuqoridagi routelarga xaritalangan; qo'shimcha `reflection`, `prompt-lab`, `achievements` sahifalari metodikaning 1, 3, 8-bosqichlari va gamification talabi uchun qo'shildi.

---

## 4. MA'LUMOTLAR MODELI (Firestore)

> Qoida: dokument ≤ 1 MB, katta hajmli ma'lumot (event log) oy bo'yicha bo'linadi, agregatlar alohida saqlanadi.

### 4.1. Foydalanuvchi va tashkilot
| Kolleksiya | Asosiy maydonlar |
|---|---|
| `users/{uid}` | displayName, email, role, locale, groupId, cohortId, expGroup, participantCode, consentAt, onboarding{goal, profession, targetSkills}, avatar, status, createdAt, lastActiveAt |
| `cohorts/{id}` | name (masalan "2026-27 kuz"), university, faculty, startDate, endDate, teacherIds[] |
| `groups/{id}` | cohortId, name, type: `experimental\|control`, teacherId, studentCount, featureFlags{aiTutor, aiFeedback, adaptive, pronunciationAI, ...} |
| `settings/global` | Global feature flags, model nomlari, limitlar, e'lonlar |
| `auditLogs/{id}` | actorUid, action, target, ts, meta |

### 4.2. O'quv kontenti (CMS)
| Kolleksiya | Asosiy maydonlar |
|---|---|
| `courses/{id}` | title, description, cefrRange, order, published |
| `modules/{id}` | courseId, title, stage (1–8), skill (vocab/grammar/pronunciation/listening/reading/writing/speaking/professional), domain (finance/banking/marketing/management/general…), order |
| `lessons/{id}` | moduleId, title, type: video/interactive/explanation, blocks[] (video, text, infographic, chart, ai-explanation, exercise-ref), cefr, estimatedMin, published, createdBy, approvedBy |
| `items/{id}` (mashq banki) | type (matching, classification, mcq, gap-fill, transformation, error-correction, expansion, word-order, imitation, substitution, open-writing, speaking-prompt), skill, topic, domain, cefr (A2–C1), difficulty (1–5), stem, options, answerKey, explanation{why, how, whereElse}, tags[], source: `human\|ai`, status: `draft\|approved\|rejected`, generatedFromPrompt, stats{attempts, correctRate} |
| `lexicon/{wordId}` | word, pos, ipa, definitions[], domain[], cefr, collocations[], synonyms[], antonyms[], wordFamily[], examples[{sentence, source}], professionalContext, audioUrl(TTS), semanticLinks[{wordId, relation}] |
| `semanticNetworks/{id}` | seedWord, domain, nodes[], edges[], generatedBy, approved |
| `caseStudies/{id}` | title, scenario (matn + chart data), domain, cefr, tasks[] (read → analyze → vocab → grammar → explain → discuss → solution → report → presentation), rubric, requiredVocab[], requiredGrammar[] |
| `scenarios/{id}` (role-play) | persona (client/manager/interviewer/partner/economist/investor), context, goals, cefr, successCriteria, scaffoldLevel |
| `promptExercises/{id}` | level (simple/guided/independent), task, badPromptExample, goodPromptExample, rubric |
| `surveys/{id}` | title, type (motivation/aiLiteracy/satisfaction/pre/post), questions[{id, text, type: likert5/likert7/mcq/open, scaleLabels}] |
| `tests/{id}` | type: diagnostic/pre/progress/post, sections[{skill, itemIds[], timeLimit}], scoring, assignedTo{groupIds[], from, to} |
| `badges/{id}` | name, icon, criteria (rule JSON), xp |

### 4.3. Talaba faoliyati va natijalar
| Kolleksiya | Asosiy maydonlar |
|---|---|
| `learningPaths/{uid}` | linguisticProfile{vocab, grammar, pronunciation, speaking, writing, listening, reading, professional: {level, label: strong/intermediate/needs improvement/weak, score}}, goals, steps[{moduleId, lessonId, status, reason}], generatedAt, version |
| `mastery/{uid}/skills/{skillId}` | pMastery (0–1), currentDifficulty (1–5), streakCorrect, streakWrong, attempts, lastPracticedAt |
| `attempts/{id}` | uid, itemId, context (lesson/practice/test), answer, isCorrect, score, timeMs, hintsUsed, errorTags[], difficultyAtTime, ts |
| `testAttempts/{id}` | uid, testId, type, sectionScores{}, totalScore, startedAt, finishedAt, rawAnswers[] |
| `userVocab/{uid}/words/{wordId}` | srs{interval, ease, due, reps}, status (new/learning/known), lastError |
| `aiSessions/{id}` + `messages/{msgId}` | uid, mode (tutor/roleplay/explain/vocab-teach/writing-review), scenarioId, scaffoldLevel, model, tokensIn/Out, startedAt; message: role, content, feedbackTags, ts |
| `speakingSubmissions/{id}` | uid, taskId, type (word/sentence/dialogue/presentation), audioPath, referenceText, transcript, azure{accuracy, fluency, completeness, prosody, pronScore, words[{word, score, phonemes[], errorType}]}, aiFeedback{strengths, issues, stress, intonation, problematicSounds, tips}, teacherFeedback, attemptNo, ts |
| `writingSubmissions/{id}` | uid, taskId, drafts[{text, ts, aiFeedback{errors[{span, type, why, fix, whereElse}], rubricScores, summary}}], finalText, teacherFeedback, rubricScores, status (draft/submitted/reviewed) |
| `projects/{id}` | groupId, caseStudyId, memberUids[], roles{}, stage, sharedDoc (matn), chartData, solution, report, presentationFiles[], deadline, status |
| `projects/{id}/contributions/{uid}` | wordsWritten, messages, tasksDone (guruh ishi hissasi — analitika uchun) |
| `peerReviews/{id}` | reviewerUid, targetUid, artifactRef, rubricScores, comment, ts |
| `reflections/{id}` | uid, stage, answers{didWell, repeatedMistakes, improveNext}, mood, ts |
| `surveyResponses/{id}` | uid, surveyId, answers{}, ts |
| `xpEvents/{id}`, `userBadges/{uid}/{badgeId}`, `streaks/{uid}` | Gamification |
| `portfolioItems/{id}` | uid, type (writing/speaking/project/achievement/feedback), ref, pinned, note |
| `chats/{id}` + `messages/` | type (dm/teacher/group), memberUids[], lastMessage; message: senderUid, text, attachments, ts |
| `presence/{uid}` | online, lastSeen |
| `forum/threads/{id}` + `posts/` | title, authorUid, groupId/global, tags; post: text, likes |
| `notifications/{uid}/items/{id}` | type, text, link, read |

### 4.4. Ilmiy ma'lumotlar (Learning Analytics)
| Kolleksiya | Asosiy maydonlar |
|---|---|
| `events_{YYYY_MM}/{id}` (append-only) | uid, participantCode, expGroup, type (login, lesson_view, item_attempt, ai_message, speaking_submit, writing_submit, chat_message, forum_post, reflection, survey, badge, path_regenerated…), payload, sessionId, device, ts |
| `statsDaily/{uid}_{date}` | timeOnTaskMin, attempts, correctRate, aiMessages, wordsLearned, skillsScores{}, streak |
| `statsGroupDaily/{groupId}_{date}` | Guruh agregatlari |
| `experiments/{id}` | title, hypothesis, design, preTestId, postTestId, surveyIds[], groupIds{experimental[], control[]}, timeline{start, midpoint, end}, status |
| `predictions/{uid}` | predictedPostScores{}, riskLevel, generatedAt, method |
| `errorProfiles/{uid}` | Xatolar taksonomiyasi bo'yicha hisob (tense, articles, prepositions, collocation, word-order, stress, /θ/…), trend |

### 4.5. Korpus (Corpus Verification)
| Kolleksiya | Asosiy maydonlar |
|---|---|
| `corpusDocs/{id}` | title, source (ochiq manba: IMF/World Bank/ECB hisobotlar, Wikipedia econ, OpenStax Economics…), domain, wordCount, text (Storage'da) |
| `corpusNgrams/{ngram}` | n, count, docFreq, examples[{sentence, docId}] (2–4 gramm, lemmatized) |

---

## 5. 8 BOSQICHLI O'QUV ALGORITMINING TIZIMDAGI AMALGA OSHIRILISHI

| Bosqich | Platformada qayerda | Mexanizm |
|---|---|---|
| **1. Maqsad va tashkil etish** | Onboarding + Learning Path + Reflection | "What do you want to improve?" ustasi: maqsad, kasbiy yo'nalish (finance/banking/marketing/management), modul tanlash, kutilayotgan natijalar. AI literacy kirish moduli. Motivatsiya so'rovnomasi (pre). Refleksiya kundaligi ochiladi |
| **2. Diagnostika va differensiallashtirish** | Assessment Center → Diagnostic | 8 bo'limli test (vocab, grammar, listening, reading, speaking, pronunciation, writing, professional English). Speaking/pronunciation — Azure; writing — Claude rubrika. Natija: **Individual Linguistic Profile** (Strong / Intermediate / Needs improvement / Weak) + tipik xatolar + boshlang'ich difficulty har skill uchun. Learning Path v1 avtomatik generatsiya |
| **3. AI bilan ishlashga tayyorgarlik** | Prompt Practice Lab + AI literacy modul | AI nima qila oladi / qila olmaydi darsi; akademik halollik qoidalari; **Simple → Guided → Independent** prompt bosqichlari; talaba yozgan promptni AI baholaydi (aniqlik, kontekst, daraja, format) va yaxshilangan variant ko'rsatadi; AI javobini tekshirish mashqi (hallucination topish) |
| **4. O'rgatuvchi** | Learn | Video + interactive bloklar + grammar explanation (iqtisodiy kontekstda) + vocabulary introduction (so'z → ma'no → kollokatsiya → kontekst → kasbiy vaziyat → kommunikativ qo'llash) + pronunciation demo (TTS + IPA) + infografika + iqtisodiy grafik. Mashq turlari: matching, classification, choosing, imitation, substitution, transformation |
| **5. Mashq va avtomatlashtirish** | Practice Zone | **Adaptiv dvigatel** (6-bo'lim). Mashqlar: gap-fill, MCQ, transformation, error correction, expansion, word order, grammar challenge, vocabulary challenge. SRS (SM-2) lug'at takrorlash. Gamification (XP, streak) |
| **6. Produktiv-kommunikativ** | AI Teacher / Communication Hub / Speaking Lab / Writing Lab | AI role-play (client, manager, interviewer, partner, economist, investor) matn + ovoz; student chat; group discussion; grafik tushuntirish topshirig'i; business meeting simulyatsiyasi (AI moderator + 3–5 talaba) |
| **7. Integrativ-kasbiy** | Group Project Zone (Case Study) | Bitta case: ma'lumot o'qish → grafik tahlil → vocab tanlash (checklist) → grammatik strukturalar → muammo tushuntirish (speaking) → guruh muhokamasi (chat) → solution → report (Writing Lab) → presentation (yuklash + speaking). Rubrika bo'yicha AI + o'qituvchi + peer baho |
| **8. Baholash, feedback, refleksiya** | Assessment Center / Dashboard / Reflection | **AI Feedback Report** (strengths / areas to improve, skill bo'yicha), self-assessment 3 savol, Progress Dashboard (5 chiziq), keyingi individual yo'nalish — Learning Path qayta generatsiya. Progress test → Post-test |

---

## 6. ADAPTIV O'QITISH DVIGATELI

**Kirish:** skill (masalan `grammar.present_perfect`), talabaning `mastery` holati, oxirgi urinishlar.
**Chiqish:** keyingi item (difficulty 1–5 ≈ A2 → C1) yoki "qayta tushuntirish" bloki.

Qoidalar (MVP, aniqlangan va tushuntirib beriladigan):
1. Boshlang'ich difficulty = diagnostika natijasidan (skill bo'yicha).
2. **3 ta ketma-ket to'g'ri** → difficulty +1 (maks 5), qisqa "Level up" animatsiyasi.
3. **2 ta ketma-ket xato** → difficulty −1 (min 1) **va** mikro-tushuntirish: statik `explanation` (nazorat guruhi) yoki AI generatsiya qilgan shaxsiy tushuntirish (eksperimental guruh) — "nima uchun / qanday tuzatish / yana qayerda ishlatiladi".
4. `pMastery` — soddalashtirilgan Bayesian Knowledge Tracing (BKT): p(learn)=0.2, p(guess)=0.25, p(slip)=0.1; ≥0.85 → skill "mastered", Learning Path keyingi qadamga o'tadi.
5. Xato taksonomiyasi (`errorTags`) har urinishda yoziladi → `errorProfiles` → AI Error Analysis haftalik.
6. Lug'at: SM-2 spaced repetition; "due" so'zlar Today's Tasks'da.
7. Learning Path qayta generatsiya: har progress-testdan keyin yoki 7 kunda bir (cron), sabablar bilan ("Grammar: articles zaif → 2 ta qo'shimcha dars").
8. Nazorat guruhi: 2–3 qoidalar o'chirilgan, hamma bir xil ketma-ketlikda oladi (klassik e-learning).

**Progress prediction (AI Progress Prediction):** haftalik cron — har talaba uchun oddiy chiziqli trend (skill ballari vaqt bo'yicha) + faollik → kutilayotgan post-test bali va risk darajasi (low/medium/high); Claude qisqa izoh yozadi o'qituvchi uchun ("3 hafta faol emas, grammar pasaymoqda").

---

## 7. AI ARXITEKTURASI

### 7.1. Umumiy tuzilma
```
src/ai/
  client.ts            # Anthropic provider, model konstantalari, retry, caching
  prompts/             # versiyalangan system promptlar (methodology.v1.md, rubrics/, personas/)
  schemas/             # zod: ExerciseSet, WritingFeedback, SpeakingFeedback, ErrorAnalysis, PromptEval...
  tools/               # corpusLookup, lexiconLookup, studentProfile (tool-use)
  services/            # tutorChat, generateExercises, gradeOpen, writingFeedback, speakingFeedback,
                       # vocabTeach, semanticNetwork, errorAnalysis, promptEvaluate, corpusVerify,
                       # rolePlay, progressNarrative, feedbackReport
  guard/               # rate limit, content filter, token budget, logging → aiInteractions/events
```

### 7.2. AI funksiyalar ro'yxati (so'rovnoma 7-bo'lim → xizmat)
| Funksiya | Xizmat | Kirish → Chiqish |
|---|---|---|
| AI Teacher / AI Tutor / AI Chatbot | `tutorChat` (streaming) | Talaba xabari + profil + joriy dars konteksti → javob (ingliz, CEFR darajasiga moslashgan, so'rovga qarab o'zbek izoh) |
| AI Feedback | `feedbackReport` | Oxirgi N kun urinishlari, submissionlar → Strengths / Areas to improve / Next steps |
| Adaptive Learning, Personalized Tasks | 6-bo'lim + `generateExercises` (profilga mos topic/difficulty) | |
| AI Vocabulary Generator | `vocabTeach`, `semanticNetwork` | So'z/domain → 6 bosqichli o'rgatish karta + semantik tarmoq (graf) |
| AI Grammar Exercises | `generateExercises` | topic, cefr, n, domain → item[] (zod) → `items` (status: draft) → o'qituvchi tasdiqlaydi |
| AI Speaking Partner | `rolePlay` (matn + ovoz: STT → Claude → TTS) | Persona + scenario → dialog, oxirida feedback |
| AI Pronunciation Coach | Azure + `speakingFeedback` | Audio + reference → ballar + AI tavsiya (stress, intonation, fluency, problematic sounds) |
| AI Writing Feedback | `writingFeedback` | Matn + rubrika → xatolar (span, tur, nima uchun, qanday tuzatish, yana qayerda), rubrika ballari, yaxshilangan variant (faqat so'ralganda — akademik halollik) |
| AI Error Analysis | `errorAnalysis` | errorProfiles + oxirgi xatolar → tipik xatolar, sabab, mashq tavsiyasi |
| AI Progress Prediction | cron + `progressNarrative` | statsDaily → prognoz + izoh |
| Learning Analytics | Hisoblash (server) + vizualizatsiya, AI faqat izoh | |
| Prompt Scaffolding | `promptEvaluate` | Talaba prompti → ball (aniqlik, kontekst, daraja, format, halollik), yaxshilangan prompt, keyingi scaffold darajasi |
| Corpus Verification | `corpusVerify` (tool-use) | "make a profit" vs "do a profit" → n-gram hisob, misollar, verdikt + izoh |

### 7.3. Metodik qoidalar system promptda (majburiy)
- Xatoni faqat "wrong" demaslik: **nima uchun → qanday tuzatish → yana qaysi holatda**.
- Iqtisodiy/kasbiy kontekstda misollar (inflation, revenue, market share…).
- CEFR darajasiga mos til; talaba so'rasa o'zbekcha izoh.
- Akademik halollik: yozma ish o'rniga to'liq matn yozib bermaslik, yo'naltirish; "AI-generated" belgilash.
- Har javob oxirida ixtiyoriy "check this" — talabani tekshirishga undash (AI literacy).

### 7.4. Nazorat va xavfsizlik
- Rate limit: talaba/kun uchun xabar va token limiti (Firestore `aiQuota`); limit tugasa — statik materiallar va tushunarli xabar.
- Barcha AI chaqiruvlar `aiSessions/messages` + `events`ga yoziladi (tokenlar, model, kechikish) — ilmiy ma'lumot + xarajat nazorati.
- AI yaratgan kontent `status=draft` → o'qituvchi tasdiqlaydi → item bank.
- Prompt injection: talaba matni har doim `user` rolida, system promptga qo'shilmaydi.
- Modelni feature flag orqali almashtirish mumkin (Sonnet ↔ Haiku).

---

## 8. MODULLAR BO'YICHA BATAFSIL FUNKSIONAL SPETSIFIKATSIYA

### 8.1. Vocabulary & Lexis
- 8 lug'at yo'nalishi (general, academic, economic, finance, banking, marketing, management, business communication) + collocations, synonyms/antonyms, word formation, semantic networks, terminology.
- **So'z kartasi** (6 bosqich): so'z (IPA + TTS audio) → ma'no → kollokatsiyalar → kontekst gap → kasbiy vaziyat → kommunikativ topshiriq (bitta gap yoz / ayt).
- **Semantic Network** interaktiv graf (react-force-graph yoki d3): inflation → prices → purchasing power → …; tugmani bosib har tugunga o'tish; AI yangi tarmoq generatsiya qiladi, o'qituvchi tasdiqlaydi.
- Mashqlar: matching, classification, gap-fill, collocation choice, word formation, terminology quiz.
- SRS takrorlash, "My words" ro'yxati, Corpus Verification tugmasi har so'z/kollokatsiyada.
- Start kontent: har domain uchun 50–80 so'z (jami ~500) — admin CMS orqali + AI yordamida to'ldirish.

### 8.2. Grammar
- 8 mavzu iqtisodiy kontekstda (Present Perfect → company performance … Linking devices → reports). Har mavzu: explanation (video/matn) → 4-bosqich mashqlar → 5-bosqich adaptiv mashqlar → 6-bosqich kommunikativ topshiriq.
- Mashq turlari: gap-fill, MCQ, sentence transformation, error correction, sentence expansion/reduction, word order, imitation, substitution, grammar challenge (vaqtga).
- Item bank: har mavzu × 5 difficulty × ≥8 item = ~320 tasdiqlangan item (AI generatsiya + o'qituvchi tasdiq).

### 8.3. Pronunciation & Phonetics (Speaking Lab)
- Oqim: **Record → Analyze → Feedback → Retry** (urinishlar taqqoslanadi).
- Topshiriq turlari: so'z, gap, professional dialogue (AI bilan navbatma-navbat), presentation (60–120 s).
- Azure Pronunciation Assessment: accuracy, fluency, completeness, prosody; so'z/fonema ballari rangli ko'rsatiladi; word stress, sentence stress, intonation (prosody) ko'rsatkichlari.
- Namuna audio (TTS) bilan taqqoslash: ikki to'lqin (wavesurfer), "listen model / listen mine".
- Problematic sounds ro'yxati (masalan /θ/, /w/ vs /v/, final -ed) → maxsus minimal-pair mashqlar.
- Texnik: brauzerda WAV 16 kHz mono yozish, Storage'ga yuklash (≤ 2 daqiqa), server Azure'ga yuboradi, natija Firestore'ga. Mikrofon ruxsati bo'yicha yo'riqnoma ekrani.

### 8.4. Listening / Reading
- Listening: audio (TTS yoki yuklangan) + savollar (MCQ, gap, true/false), transkriptni keyin ko'rsatish; iqtisodiy podcast uslubi.
- Reading: iqtisodiy matnlar (korpus manbalaridan) + vocabulary highlight (lexicon bilan bog'langan) + comprehension savollar + "explain the chart" topshiriq.

### 8.5. Writing Lab
- Oqim: **Write → AI Feedback → Revise → Submit** (draft tarixi saqlanadi, o'qituvchi so'nggi versiyani ko'radi).
- Janrlar: business email, report, summary of a chart, memo, case solution.
- Rubrika: task achievement, vocabulary range/accuracy, grammar range/accuracy, coherence, register — 0–5.
- AI feedback inline (xato ustiga bosganda izoh) + umumiy; o'qituvchi feedback + baho; peer review (ixtiyoriy).
- Nazorat guruhi: AI feedback yo'q, faqat o'qituvchi.

### 8.6. Speaking (kommunikativ)
- AI role-play (matn yoki ovoz), "explain the chart", business meeting simulyatsiyasi, presentation yuklash (video/audio) → Azure (unscripted) + AI feedback + o'qituvchi baho.

### 8.7. Professional English module
- Domainga oid integrativ darslar: finance/banking/marketing/management — har biri vocab + grammar + reading + speaking + case; 7-bosqich case studylar shu yerda.

### 8.8. AI Teacher (24/7)
- Chat, tarix, "explain this" (dars sahifasidan kontekst bilan chaqirish), scaffold darajasi ko'rsatkichi, kunlik limit, "Was this helpful?" — tadqiqot uchun.

### 8.9. Communication Hub
- **AI Chat** (yuqoridagi), **Student chat** (DM), **Teacher–student chat**, **Group discussion** (guruh kanali, mavzuli threadlar), **Discussion forum** (global/guruh, teglar, like).
- Realtime (Firestore), presence, typing indikatori (oddiy), bildirishnomalar, moderatsiya (o'qituvchi o'chirishi mumkin), xabarlar analitikaga yoziladi (soni, uzunligi; matn tadqiqotchiga faqat anonim).

### 8.10. Group Project Zone
- Case study kutubxonasi; o'qituvchi/AI guruhlarni 3–5 kishilik jamoaga ajratadi, rollar (analyst, presenter, writer…).
- Bosqichli jarayon (8.1-jadvaldagi 9 qadam), umumiy hujjat (oddiy collaborative textarea — Firestore, "last write wins" + versiyalar), guruh chati, fayl yuklash, prezentatsiya yuklash, individual hissa hisobi.
- Baholash: AI (rubrika bo'yicha dastlabki), o'qituvchi (yakuniy), peer assessment (jamoa a'zolari bir-birini).

### 8.11. Assessment Center
- Diagnostic (2-bosqich), Progress test (har modul/4 hafta), Pre-test / Post-test (eksperiment; bir xil struktura, parallel variantlar), Adaptive test (CAT-lite: difficulty urinishga qarab).
- Bo'limlar: vocab, grammar, listening, reading (avtomatik), writing (AI + o'qituvchi), speaking/pronunciation (Azure + AI + o'qituvchi).
- Natijalar sahifasi: skill radar, taqqoslash (pre vs post), AI Feedback Report.

### 8.12. Gamification
- XP (mashq, dars, streak), darajalar, badge'lar (First diagnostic, 7-day streak, 100 words, Pronunciation pro, Case solver…), leaderboard (guruh ichida, ixtiyoriy ko'rsatish), kunlik vazifalar ("Today's Tasks").
- Tadqiqot: gamification barcha guruhlarda bir xil (o'zgaruvchi — AI), yoki tadqiqotchi flag orqali o'chirishi mumkin.

### 8.13. Portfolio
- Avtomatik yig'iladi: eng yaxshi writing, speaking yozuvlar, loyihalar, sertifikat/badge'lar, o'qituvchi feedbacklari; talaba "pin" qiladi; PDF eksport (ixtiyoriy); ochiq havola (ixtiyoriy).

### 8.14. Refleksiya kundaligi
- Har dars/hafta oxirida 3 savol (What did I do well? / What mistakes did I repeat? / What will I improve next?) + kayfiyat; tarix; AI qisqa javob (eksperimental).

### 8.15. Prompt Practice Lab
- 3 daraja: Simple (tayyor promptni tanlash), Guided (shablonni to'ldirish), Independent (o'zi yozadi); AI baholaydi; "bad vs good prompt" misollar; AI javobini tekshirish mashqi.

### 8.16. Corpus Verification
- Mini-korpus (~1–2 mln so'z, ochiq litsenziyali iqtisodiy matnlar) → n-gram indeks (offline skript, bir marta) → Firestore.
- UI: ibora kiritish → chastota, misollar, alternativa taklif (AI), "verified ✓ / not attested ✗".
- Lexicon kartalarida kollokatsiyalar avtomatik "corpus-attested" belgisi.

### 8.17. Teacher Dashboard
- Guruhlar, talabalar ro'yxati (progress, oxirgi faollik, risk), individual talaba sahifasi (profil, path, xatolar, submissionlar), **Review queue** (writing/speaking/project — baholash), **Content approval** (AI draft itemlar/darslar), topshiriq berish (deadline), chat, guruh analitikasi, e'lon.

### 8.18. Researcher Analytics Dashboard
- Eksperiment sozlash (pre/post test, so'rovnomalar, muddatlar), guruhlarga ajratish (qo'lda / randomizatsiya), ishtirokchilar (anonim kod), monitoring (faollik, tugallanish).
- Analitika: skill ballari dinamikasi (guruhlar bo'yicha), pre/post gain, xatolar taksonomiyasi, AI interaction hajmi, vaqt sarfi, motivatsiya/AI literacy so'rovnoma natijalari, korrelyatsiya (AI interaction ↔ gain).
- In-app statistika (simple-statistics): mean, SD, paired t-test (pre/post), independent t-test / Mann–Whitney (guruhlar), Cohen's d — dastlabki ko'rish uchun; asosiy tahlil SPSS'da.
- **Eksport:** Excel (ko'p varaqli), CSV, **SPSS-ready** paket (9-bo'lim).

### 8.19. Admin
- Foydalanuvchilar (CRUD, bulk import Excel, rol/claim), guruhlar/kohortlar, kurs/modul/dars/item CMS, lexicon CMS, feature flags (global/guruh), model sozlamalari, limitlar, audit log, tizim holati (AI xarajat, xatolar).

---

## 9. TADQIQOT MA'LUMOTLARI VA EKSPORT

### 9.1. Yig'iladigan ma'lumotlar (so'rovnoma 11-bo'lim → manba)
| Ma'lumot | Manba |
|---|---|
| Vocabulary / Grammar / Pronunciation / Speaking / Writing score | `testAttempts`, `speakingSubmissions`, `writingSubmissions`, `mastery` |
| Topshiriqlar soni, bajarish vaqti, urinishlar, xato turlari, progress rate | `attempts`, `events`, `statsDaily`, `errorProfiles` |
| AI bilan interaction | `aiSessions/messages`, `events(type=ai_message)` |
| Pre/post, guruh, so'rovnoma, motivatsiya, AI literacy | `experiments`, `testAttempts(type=pre/post)`, `surveyResponses`, `users.expGroup` |

### 9.2. Eksport datasetlari
1. **participants** (wide): participantCode, group, gender/age (ixtiyoriy), pre_* (8 skill), post_*, gain_*, motivation_pre/post, ailiteracy_pre/post, satisfaction, totalTimeMin, attempts, aiMessages, wordsLearned, badges.
2. **attempts_long**: participantCode, group, ts, skill, topic, difficulty, correct, timeMs, errorTags.
3. **speaking_long**, **writing_long**: submission bo'yicha ballar.
4. **ai_interactions**: participantCode, ts, mode, tokens, helpful.
5. **events**: to'liq log (katta — CSV, faqat so'rovda).
6. **survey_items**: har savol bo'yicha.

### 9.3. Formatlar
- **Excel** (exceljs): bitta workbook, har dataset alohida varaq, sarlavha + izoh varag'i.
- **CSV** (UTF-8, `,`, ISO sanalar).
- **SPSS-ready**: CSV + `codebook.md` (o'zgaruvchi nomlari ≤ 64 belgi, tip, o'lchov: nominal/ordinal/scale, qiymat yorliqlari) + `import.sps` sintaksis fayli (GET DATA, VARIABLE LABELS, VALUE LABELS, MEASURE LEVEL). Guruh: 1=experimental, 2=control; Likert raqamli.
- Anonimlik: eksportda uid/ism yo'q, faqat `participantCode`; mapping faqat tadqiqotchi sahifasida alohida.
- Eksport server Route Handler'da generatsiya qilinadi → Storage'ga → vaqtinchalik signed URL (audit logga yoziladi).

### 9.4. Etika
- Informed consent ekrani (o'zbek/rus), rad etish imkoni (platformadan foydalanadi, ma'lumoti eksportga kirmaydi).
- Ma'lumot saqlash muddati, o'chirish so'rovi (admin), maxfiylik sahifasi.

---

## 10. XAVFSIZLIK

- Firestore Rules: har kolleksiya uchun rol/egalik qoidalari (talaba faqat o'z hujjatlari; o'qituvchi faqat o'z guruhlari; researcher read-only anonim; admin hammasi). Yozish asosan server (Admin SDK) orqali; client faqat chat/presence/reflection kabi oddiy yozuvlar.
- Storage Rules: audio faqat egasi + o'qituvchi; hajm/tip cheklovi.
- App Check majburiy; Admin SDK kaliti faqat Vercel env; `.env` git'ga kirmaydi.
- Session cookie httpOnly, secure; middleware rol tekshiruvi; server actions'da qayta tekshiruv.
- Rate limit (AI, upload, chat); input sanitizatsiya; XSS (markdown render — rehype-sanitize).
- Audit log (admin harakatlari, eksport).
- Backup: Firestore scheduled export (haftalik) GCS'ga.

---

## 11. LOYIHA STRUKTURASI (papkalar)

```
/
  app/                     # routelar (3-bo'lim)
  src/
    components/            # ui/ (shadcn), layout/, student/, teacher/, researcher/, admin/, charts/, audio/
    features/              # domain bo'yicha: auth, onboarding, learning-path, lessons, exercises, adaptive,
                           # vocabulary, grammar, speaking, writing, ai-teacher, chat, forum, projects,
                           # assessment, surveys, gamification, portfolio, reflection, prompt-lab, corpus,
                           # analytics, export, admin
    ai/                    # 7.1-bo'lim
    lib/
      firebase/            # client.ts, admin.ts, auth.ts, converters/
      speech/              # azure.ts (assess, stt, tts), audio-utils.ts
      adaptive/            # bkt.ts, policy.ts, srs.ts
      analytics/           # events.ts, aggregates.ts, stats.ts
      export/              # excel.ts, csv.ts, spss.ts
      i18n/
      utils/
    types/                 # Firestore hujjat tiplari (zod + TS)
    config/                # flags, models, limits, constants (CEFR, skills, domains, errorTaxonomy)
  functions/               # Firebase Cloud Functions (alohida package)
  firestore.rules  storage.rules  firestore.indexes.json  firebase.json
  scripts/                 # seed (kontent), corpus build, bulk import, item generation CLI
  messages/                # uz.json, en.json, ru.json
  tests/                   # unit, rules, e2e
  docs/                    # PLAN.md, ADRlar, API, metodika xaritasi
```

---

## 12. MUHIT O'ZGARUVCHILARI (env)

| Nom | Qayerda | Izoh |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) | client | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` | client | reCAPTCHA Enterprise |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | server | Admin SDK |
| `ANTHROPIC_API_KEY` | server | Claude |
| `AI_MODEL_MAIN`, `AI_MODEL_FAST` | server | model nomlari (flag) |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | server | Speech |
| `OPENAI_API_KEY` (ixtiyoriy) | server | Whisper zaxira |
| `CRON_SECRET` | server | Vercel Cron autentifikatsiya |
| `RESEND_API_KEY` (ixtiyoriy) | server | email |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | ikkalasi | monitoring |
| `NEXT_PUBLIC_APP_URL` | client | |

Muhitlar: `development` (Firebase emulator), `preview` (Vercel preview + `linguaecon-dev` Firebase loyihasi), `production` (`linguaecon-prod`).

---

## 13. ISHLAB CHIQISH BOSQICHLARI VA MUDDATLAR

> Bugun 2026-09-06. Maqsad: MVP 2026-yil dekabr boshi, pilot dekabr, asosiy eksperiment 2027 bahor semestri (yanvar/fevral–aprel), post-test aprel, tahlil may, himoya 2027.

| Bosqich | Muddat | Natija (Definition of Done) |
|---|---|---|
| **0. Poydevor** | 1-hafta (09.07–09.13) | Repo, Next 15 + TS + Tailwind + shadcn, Firebase loyihalar (dev/prod), Vercel deploy, Auth + rollar + middleware, i18n skeleti, dizayn tizimi (ranglar, tipografiya, layout), Sentry, CI. Landing v1 |
| **1. Kontent yadrosi va o'quv oqimi** | 2–3-hafta | Firestore modeli + rules v1, Admin CMS (kurs/modul/dars/item/lexicon), bulk import, dars pleyeri (video + bloklar), mashq dvigateli (12 tur), diagnostika testi (avtomatik bo'limlar), Individual Linguistic Profile, Learning Path v1, Student Dashboard, Today's Tasks, event log |
| **2. AI yadrosi** | 4–5-hafta | AI moduli (7-bo'lim), AI Teacher chat (streaming), mashq generatsiya + o'qituvchi tasdiq, adaptiv dvigatel (BKT, qoidalar), Vocabulary moduli (karta, semantic network, SRS), Grammar moduli (8 mavzu), AI feedback tushuntirishlari, rate limit, nazorat guruhi flaglari |
| **3. Speaking & Writing laboratoriyalari** | 6–7-hafta | Audio yozish → Storage → Azure assessment → natija UI (so'z/fonema, prosody), TTS namuna + taqqoslash, retry tarixi; Writing Lab (draft, inline AI feedback, rubrika, o'qituvchi baho); diagnostika speaking/writing bo'limlari ulanadi; Listening/Reading modullari |
| **4. Kommunikatsiya va guruh ishi** | 8–9-hafta | Chatlar (DM, teacher, group), forum, presence, bildirishnomalar; AI role-play (matn + ovoz); Group Project Zone (case study oqimi, umumiy hujjat, fayl, prezentatsiya), peer assessment, business meeting simulyatsiyasi |
| **5. Baholash va tadqiqot** | 10–11-hafta | Assessment Center (pre/progress/post, adaptiv test), so'rovnomalar (motivatsiya, AI literacy), Experiment boshqaruvi, Researcher Dashboard (grafiklar, statistika), Excel/CSV/SPSS eksport, anonimizatsiya, progress prediction cron, Teacher Dashboard to'liq (review queue, analytics) |
| **6. Metodik qo'shimchalar** | 12-hafta | Prompt Practice Lab, Corpus Verification (korpus build skripti + UI), Refleksiya kundaligi, Gamification (XP, badge, streak, leaderboard), Portfolio, AI Feedback Report, Error Analysis |
| **7. Sifat, pilot, tayyorgarlik** | 13-hafta (+ dekabr) | Rules testlari, e2e, yuklama testi (200 foydalanuvchi), mobil tekshiruv, xavfsizlik ko'rigi, kontent to'ldirish (≥ 500 so'z, ≥ 320 grammar item, 8 dars video, 4 case study, 2 test varianti), foydalanuvchi qo'llanmalari (talaba/o'qituvchi/tadqiqotchi), 10–20 talaba bilan pilot, tuzatishlar |
| **Eksperiment** | 2027 yanvar–aprel | Pre-test → 10–12 hafta o'qitish → post-test → so'rovnomalar → eksport → SPSS |

Har bosqich oxirida: demo, Vercel preview havolasi, tekshiruv ro'yxati (traceability matrix, 15-bo'lim).

---

## 14. KONTENT TAYYORLASH REJASI (kod bilan parallel)

| Kontent | Hajm (MVP) | Kim / qanday |
|---|---|---|
| Lug'at (lexicon) | ~500 so'z, 8 domain, kollokatsiyalar, IPA, TTS audio | Tadqiqotchi ro'yxat beradi → AI karta generatsiya → o'qituvchi tasdiq |
| Grammar darslari | 8 mavzu × (explanation + video/matn) | Tadqiqotchi matn; video — o'zi yozadi yoki YouTube unlisted |
| Grammar/vocab itemlar | ~320 grammar + ~300 vocab | AI generatsiya (CLI skript) → tasdiq |
| Listening/Reading | 16 matn/audio | Ochiq manbalar + TTS |
| Case study | 4 ta (finance, banking, marketing, management) | Tadqiqotchi + AI |
| Role-play stsenariylar | 6 persona × 2 | AI + tasdiq |
| Diagnostic/pre/post test | 2 parallel variant, 8 bo'lim | Tadqiqotchi + item bank |
| So'rovnomalar | Motivatsiya (Likert), AI literacy, qoniqish | Tadqiqotchi (validatsiya qilingan shkalalar) |
| Korpus | 1–2 mln so'z | Skript: ochiq PDF/HTML → matn → n-gram |
| Prompt Lab | 15 mashq (3 daraja × 5) | Tadqiqotchi + AI |
| Badge'lar | 20 ta | Dizayn |

---

## 15. TALAB → MODUL → BOSQICH XARITASI (so'rovnoma 6-bo'lim, barcha ☑)

| Talab | Modul / sahifa | Bosqich |
|---|---|---|
| Ro'yxatdan o'tish, shaxsiy kabinet | Auth, Settings, Onboarding | 0–1 |
| Student / Teacher / Researcher dashboard | 3 dashboard | 1 / 5 / 5 |
| Video lessons, Interactive lessons | Learn | 1 |
| Vocabulary, Grammar module | Practice Zone + Learn | 2 |
| Pronunciation module, Pronunciation AI | Speaking Lab | 3 |
| Listening, Reading, Writing, Speaking | Learn/Practice, Writing Lab, Speaking Lab | 3 |
| Professional English module | Learn (domain darslar) + Case study | 2–4 |
| Pre-test / Post-test, Diagnostic, Adaptive tests | Assessment Center | 1, 5 |
| Individual learning path | My Learning Path | 1–2 |
| AI tutor, AI chatbot, AI feedback | AI Teacher, AI moduli | 2 |
| Group work, Individual work | Group Project Zone, Practice | 4 |
| Student chat, Teacher-student chat, AI chat | Communication Hub | 2, 4 |
| Discussion forum | Communication Hub | 4 |
| Peer assessment, Self-assessment | Projects, Writing Lab; Reflection | 4, 6 |
| Gamification, badges/achievements | Achievements | 6 |
| Portfolio | My Portfolio | 6 |
| Learning analytics, Charts & statistics | Researcher/Teacher dashboards | 5 |
| Excel export, SPSS-ready export | Researcher → Export | 5 |
| Experimental/control group management | Researcher → Experiment | 5 |
| **7-bo'lim AI funksiyalari (16 ta)** | 7.2-jadval | 2, 3, 5, 6 |
| **8-bo'lim mualliflik strategiyalari (7 ta)** | Semantic Network (2), Prompt Scaffolding (6), Adaptive (2), Feedback & Reflection (2, 6), Corpus Verification (6), Interactive AI Communication (4), Pronunciation Coaching (3) | — |
| **9-bo'lim o'qitish shakllari** | Individual (Practice, AI, Labs, Path), Group (Projects, Forum, Peer), Interactive (Student↔AI/Student/Teacher/Group) | 2–4 |
| **10-bo'lim tamoyillari** | Adaptivlik (6), uzluksiz feedback (7), data-driven (9), AI+inson (tasdiq oqimi), autentiklik (korpus), avtonomiya (path, prompt lab), halollik/nazorat (7.3, teacher review) | — |

---

## 16. XARAJATLAR TAXMINI (eksperiment davri, oyiga, 200 talaba)

| Xizmat | Taxmin | Izoh |
|---|---|---|
| Vercel Pro | ~$20 | 1 a'zo; funksiya vaqti yetarli |
| Firebase Blaze (Firestore, Storage, Functions) | ~$20–60 | Eventlar ko'p bo'lsa oshadi; agregatsiya bilan nazorat |
| Claude API | ~$150–400 | 200 talaba × ~30 seans × ~5–8k token; Haiku + caching bilan kamayadi; kunlik limit |
| Azure Speech | ~$100–250 | ~$1/soat audio; talaba ~1–1.5 soat/oy |
| Sentry, Resend | $0–20 | Bepul tariflar yetarli |
| **Jami** | **~$300–750/oy** | Eksperiment 3–4 oy → ~$1.5–3k. Ishlab chiqish davrida ancha kam |

---

## 17. XAVFLAR VA CHORALAR

| Xavf | Chora |
|---|---|
| Talabalar interneti/telefonlari zaif | Mobile-first, PWA, audio ≤ 2 daqiqa, video YouTube (adaptiv sifat), og'ir grafiklar lazy |
| Vercel funksiya vaqti (uzun AI javob) | Streaming, `maxDuration`, Pro reja, og'ir ishlar Cloud Functions/cron |
| Azure Speech kechikish/regional cheklov | Frankfurt region, zaxira Whisper + Claude taqqoslash; oflayn navbat (keyinroq baholash) |
| AI xato/hallucination | Zod sxema, o'qituvchi tasdiq, korpus tekshiruvi, "check this" madaniyati |
| AI xarajati nazoratdan chiqishi | Kunlik limit, Haiku, prompt caching, item bank qayta ishlatish, xarajat dashboard |
| Firestore o'qish/yozish xarajati (events) | Batch yozish, agregatlar, oylik kolleksiyalar, faqat kerakli indekslar |
| Eksperiment dizayni buzilishi (nazorat guruhi AI ko'rib qolishi) | Guruh flaglari serverda tekshiriladi, UI'da AI elementlari umuman render qilinmaydi |
| Kontent kechikishi | 14-bo'lim rejasi kod bilan parallel, AI generatsiya CLI 2-haftadan |
| Scope creep | Har bosqich DoD, 15-bo'lim matritsa; qo'shimchalar "v2" ro'yxatiga |
| Ma'lumot maxfiyligi/etika | Consent, anonim kodlar, rules, eksport auditi |
| Bitta ishlab chiquvchi | Aniq modul chegaralari, AI-yordamchi bilan kod, haftalik demo |

---

## 18. V2 (MVP'dan keyin, agar vaqt qolsa)
- BigQuery eksport + Looker Studio; real vaqt collaborative editor (Yjs); native mobil (Expo); ELSA/Speechace bilan taqqoslash; ko'p universitet (multi-tenant); o'qituvchi uchun AI dars konstruktori; ota-ona/dekanat hisobotlari; sertifikat PDF; offline mashqlar.

---

## 19. DARHOL BOSHLASH UCHUN TEKSHIRUV RO'YXATI (kod yozishdan oldin)

1. Google Cloud/Firebase: `linguaecon-dev` va `linguaecon-prod` loyihalari, Blaze, Firestore (`europe-west3`), Auth provayderlar, Storage, App Check.
2. Vercel: jamoa/loyiha, GitHub ulanish, env o'zgaruvchilar, region `fra1`, Cron.
3. Anthropic API kaliti (limit bilan), Azure Speech resursi (`westeurope`/`germanywestcentral`), Sentry (ixtiyoriy).
4. Domen (masalan `linguaecon.uz` yoki universitet subdomeni) + Firebase Auth authorized domains.
5. Tadqiqotchidan: lug'at ro'yxatlari (8 domain), grammar matnlari, 4 case study xomaki, so'rovnoma shkalalari, test variantlari, video rejasi, consent matni.
6. Dizayn: logotip, rang palitrasi, 14 sahifa wireframe (Figma yoki `design` skill orqali).
7. GitHub repo, branch strategiyasi (`main` → prod, `dev` → preview), Conventional Commits.

---

*Ushbu reja so'rovnomadagi barcha ☑ talablarni qamrab oladi; har bir bosqich yakunida 15-bo'lim matritsasi bo'yicha tekshiruv o'tkaziladi.*
