# ARCHITECTURE — tizim qanday ishlaydi

Bu hujjat platformaning ichki tuzilishini tushuntiradi: so'rov qayerdan
qayerga boradi, AI kalitlari qayerda saqlanadi, nazorat guruhi AI'ni qanday
ko'rmaydi va ilmiy ma'lumot qanday yig'iladi.

---

## 1. Umumiy manzara

```
                        ┌──────────────────────────────────────┐
                        │  BRAUZER (talaba telefoni/kompyuteri) │
                        │  Next.js client components           │
                        │  Firebase Web SDK (faqat auth + chat) │
                        └───────────────┬──────────────────────┘
                                        │  HTTPS
                    ┌───────────────────┴────────────────────┐
                    │                                        │
        ┌───────────▼────────────┐              ┌────────────▼─────────────┐
        │  VERCEL (fra1)         │              │  FIRESTORE (realtime)     │
        │  Next.js 15 server     │              │  faqat onSnapshot:        │
        │  • Server Components   │              │  chat, presence, forum    │
        │  • Server Actions      │              └────────────┬──────────────┘
        │  • Route Handlers      │                           │
        │  • middleware (edge)   │                           │
        │                        │                           │
        │  firebase-admin SDK ───┼───────────────────────────┤
        │  Anthropic SDK ────────┼──► Claude API             │
        │  Azure Speech SDK ─────┼──► Azure AI Speech        │
        └───────────┬────────────┘                           │
                    │                              ┌─────────▼──────────┐
                    │                              │  FIREBASE          │
                    └──────────────────────────────┤  Firestore         │
                                                   │  Storage           │
                                                   │  Auth              │
                                                   │  Functions (v2)    │
                                                   └────────────────────┘
                                                    europe-west3 (Frankfurt)
```

Vercel `fra1` va Firebase `europe-west3` — ikkalasi ham Frankfurt.
O'zbekistondan kechikish minimal.

---

## 2. So'rov oqimi (request flow)

### 2.1. Sahifa yuklash (Server Component)

```
Brauzer  →  GET /student/practice
             │
             ├─► middleware.ts (Edge)
             │     `le_session` cookie bormi? yo'q → /login
             │     (rol tekshiruvi bu yerda EMAS — edge'da tez bo'lishi kerak)
             │
             ├─► Server Component
             │     requireStudent()          — src/lib/firebase/session.ts
             │       ├─ cookies().get('le_session')
             │       ├─ adminAuth().verifySessionCookie(cookie, true)
             │       ├─ claims: role, groupId, expGroup, participantCode
             │       ├─ consentGiven? yo'q → redirect /consent
             │       └─ onboarding? yo'q → redirect /onboarding
             │
             ├─► resolveFlags(user)          — src/lib/flags.ts
             │     CONTROL/EXPERIMENTAL asos + groups.featureFlags + settings/global
             │
             ├─► adminDb() bilan Firestore o'qish (Admin SDK — Rules chetlab o'tiladi)
             │
             └─► HTML/RSC oqimi brauzerga
```

**Nima uchun Admin SDK:** server hamma narsani ko'rishi kerak (masalan
o'qituvchi guruhining barcha talabalari), lekin **kimga nima ko'rsatishni**
`requireUser()` va `resolveFlags()` hal qiladi. Firestore Rules esa
**klientdan** to'g'ridan-to'g'ri kelgan so'rovlar uchun ikkinchi himoya
qatlami bo'lib qoladi (chat, presence, forum).

### 2.2. Mashq javobini yuborish (Server Action)

```
Brauzer  →  submitAttempt(itemId, answer)   [Server Action]
             │
             ├─ getSessionUser()                       (qayta tekshiruv!)
             ├─ items/{itemId} o'qiladi (status === 'approved' bo'lishi shart)
             ├─ gradeItem(item, answer)                — src/lib/adaptive/grade.ts
             │     deterministik: mcq, gap_fill, matching, word_order …
             │     needsAi bo'lsa → Claude (faqat aiFeedback flagi yoqilgan bo'lsa)
             ├─ applyAttempt(mastery, signal)          — src/lib/adaptive/policy.ts
             │     BKT yangilanishi + 3-to'g'ri/2-xato qoidalari
             ├─ batch yozuv:
             │     attempts/{id}
             │     mastery/{uid}/skills/{skillId}
             │     events_YYYY_MM/{id}                 (append-only)
             │     statsDaily/{uid}_{date}             (increment)
             └─ natija: {isCorrect, score, explanation, leveledUp, needsReteach}
                        │
                        └─► Cloud Function `onAttemptCreated`
                              items/{itemId}.stats.attempts += 1
                              items/{itemId}.stats.correct  += isCorrect
```

### 2.3. AI chat (streaming Route Handler)

```
Brauzer  →  POST /api/ai/tutor   { message, lessonContext }
             │
             ├─ getApiUser()                     — sessiya
             ├─ checkFlag(user, 'aiTutor')       — nazorat guruhi → 403
             ├─ rate limit (Firestore aiQuota)   — kun/xabar va kun/token
             ├─ system prompt (metodika + rubrikalar, prompt caching bilan)
             ├─ talaba matni HAR DOIM `user` rolida — system promptga qo'shilmaydi
             │   (prompt injection himoyasi, PLAN 7.4)
             ├─ streamText(anthropic(AI_MODEL_MAIN), …)
             └─ SSE oqimi brauzerga
                  │
                  └─ oqim tugagach (server):
                       aiSessions/{id}.tokensIn/Out, messageCount
                       aiSessions/{id}/messages/{id}
                       events_YYYY_MM  (type: ai_message)
                       statsDaily      (aiMessages +1, aiTokens += …)
```

### 2.4. Talaffuz baholash

```
Brauzer: MediaRecorder → WAV 16 kHz mono (≤ 120 s)
   │
   ├─► Firebase Storage: speaking/{uid}/{ts}.wav   (klient to'g'ridan yozadi;
   │     storage.rules: faqat egasi, audio/*, ≤ 8 MB)
   │
   └─► POST /api/speech/assess { path, referenceText }
         ├─ getApiUser() + egalik tekshiruvi
         ├─ Admin SDK bilan faylni o'qish
         ├─ Azure Pronunciation Assessment (accuracy, fluency, completeness, prosody)
         ├─ pronunciationAI flagi yoqilgan bo'lsa → Claude qo'shimcha tavsiya
         └─ speakingSubmissions/{id} yoziladi
              │
              └─► Cloud Function `onSpeakingSubmissionCreated`
                    yangi shaxsiy rekord bo'lsa → portfolioItems
```

### 2.5. Realtime chat (yagona to'g'ridan-to'g'ri klient yozuvi)

```
Brauzer  →  Firestore Web SDK
             addDoc(chats/{chatId}/messages, { senderUid, text, ts })
             │
             ├─ firestore.rules tekshiradi:
             │     • chat a'zosimi (memberUids)
             │     • senderUid === request.auth.uid
             │     • text 1..4000 belgi
             │     • ts === request.time
             │
             └─► Cloud Function `onChatMessageCreated`
                   chats/{chatId}.lastMessage yangilanadi
                   qolgan a'zolarga notifications/{uid}/items
```

Chat uchun Socket.io yoki alohida server kerak emas — `onSnapshot` yetarli.
Xuddi shu tarzda: presence, forum, loyihaning umumiy hujjati.

---

## 3. AI kalitlari qayerda

| Kalit | Qayerda saqlanadi | Kim ko'radi |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel env (server-only) | Faqat Node.js runtime |
| `AZURE_SPEECH_KEY` | Vercel env (server-only) | Faqat Node.js runtime |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Vercel env (server-only) | Faqat Node.js runtime |
| `NEXT_PUBLIC_FIREBASE_*` | Vercel env (public) | Brauzerda ko'rinadi — bu normal |

**Qoida:** brauzer hech qachon Claude yoki Azure kalitini ko'rmaydi.
Barcha AI chaqiruvlar Route Handler yoki Server Action orqali o'tadi.

Buni ta'minlaydigan mexanizmlar:

1. `NEXT_PUBLIC_` prefiksi bo'lmagan env o'zgaruvchisi client bundle'ga
   umuman tushmaydi (Next.js kafolati).
2. `src/lib/firebase/admin.ts`, `src/lib/flags.ts`, `src/lib/analytics/events.ts`
   fayllari boshida **`import 'server-only'`** — bu modullarni client
   komponentdan import qilishga urinish **build vaqtida** xato beradi.
3. `next.config.ts` → `serverExternalPackages: ['firebase-admin', 'exceljs',
   'microsoft-cognitiveservices-speech-sdk']` — bu og'ir paketlar bundle
   qilinmaydi.

Cloud Functions'da AI kaliti **yo'q** — shuning uchun haftalik prognozning
matematik qismi Functions'da, Claude izohi esa Vercel cron'ida bajariladi.

---

## 4. Feature flag mexanizmi (nazorat guruhi AI'siz qoladi)

Bu eksperiment dizayni uchun eng muhim texnik qism. AI elementlari nazorat
guruhi talabasiga **umuman render qilinmasligi** kerak — yashirilishi emas.

### To'rt qatlamli himoya

```
1. FLAG HISOBLASH (server)          src/lib/flags.ts
   ────────────────────────────────────────────────
   resolveFlags(user):
     asos      = user.expGroup === 'control'
                   ? CONTROL_GROUP_FLAGS     (aiTutor: false, aiFeedback: false, …)
                   : EXPERIMENTAL_GROUP_FLAGS
     + groups/{groupId}.featureFlags          (tadqiqotchi guruh darajasida o'zgartirishi mumkin)
     + settings/global.featureFlags           (favqulodda global o'chirish)

2. RENDER (server komponent)
   ────────────────────────────────────────────────
   const flags = await resolveFlags(user)
   {flags.aiTutor && <AiTutorCard />}
   → HTML'da AI komponenti YO'Q. Talaba DevTools'da ham topa olmaydi.

3. NAVIGATSIYA
   ────────────────────────────────────────────────
   Sidebar havolalari ham flag bilan filtrlanadi.
   URL'ni qo'lda kiritsa → sahifaning o'zi assertFlag() bilan tekshiradi.

4. API
   ────────────────────────────────────────────────
   Route Handler:   if (!(await checkFlag(user, 'aiTutor'))) → 403
   Server Action:   await assertFlag(user, 'aiFeedback')     → throw
```

`expGroup` **custom claim** — talaba uni o'zgartira olmaydi:
`firestore.rules` da `users/{uid}` uchun update faqat
`displayName`, `locale`, `photoURL` maydonlariga ruxsat beradi.

### Nazorat guruhi nimani oladi

| Modul | Eksperimental | Nazorat |
|---|---|---|
| Darslar, video, kontent | bir xil | bir xil |
| Mashqlar | adaptiv (BKT + qoidalar) | belgilangan ketma-ketlik, hamma bir xil |
| Xato tushuntirishi | AI shaxsiylashtirgan matn | statik `explanation` (why / how / whereElse) |
| Writing feedback | AI inline + o'qituvchi | faqat o'qituvchi |
| Speaking | Azure ballari (ikkalasida) + AI tavsiya | Azure ballari + o'qituvchi |
| AI tutor, role-play, prompt lab, korpus, semantik tarmoq | ✓ | ✗ (menyuda ham yo'q) |
| Gamifikatsiya, forum, peer review, portfolio | ✓ | ✓ |

`pMastery` **ikkala guruhda ham** hisoblanadi (ilmiy ma'lumot sifatida kerak),
lekin nazorat guruhida qiyinlikni o'zgartirmaydi — `applyAttempt(…, { adaptive: false })`.

---

## 5. Event-log ma'lumot quvuri

Barcha ilmiy ma'lumotning yagona manbai — append-only hodisa jurnali.

```
Foydalanuvchi harakati
   │
   ├─► logEvent(user, type, payload)          src/lib/analytics/events.ts
   │     events_YYYY_MM/{autoId}
   │       uid, participantCode, expGroup, groupId,
   │       type (26 tur), payload, sessionId, device, ts
   │
   └─► bir vaqtning o'zida increment:
         statsDaily/{uid}_{YYYY-MM-DD}
           timeOnTaskMin, attempts, correct, aiMessages, aiTokens,
           wordsLearned, lessonsDone, speaking/writingSubmissions, xp
   │
   ├─► [cron 02:00 Toshkent] scheduledDailyAggregation   (Cloud Function)
   │     statsDaily → statsGroupDaily/{groupId}_{date}
   │       activeStudents, avgCorrectRate, totalAttempts,
   │       totalAiMessages, avgTimeOnTaskMin
   │
   ├─► [cron dushanba] scheduledWeeklyPrediction         (Cloud Function)
   │     oxirgi 28 kunlik statsDaily → chiziqli trend
   │     predictions/{uid}: predictedPostScores, predictedTotal, riskLevel
   │
   ├─► [cron dushanba] /api/cron/weekly-prediction       (Vercel — AI kaliti bor)
   │     predictions + errorProfiles → Claude qisqa izoh o'qituvchi uchun
   │
   └─► /researcher/export
         datasets.ts → participants (wide), attempts_long, speaking_long,
                       writing_long, ai_interactions, survey_items
         → CSV + codebook.md + import.sps → ZIP → Storage → signed URL
```

### Nima uchun aynan shunday

| Qaror | Sabab |
|---|---|
| **Append-only** | Ilmiy ma'lumot o'zgarmasligi kerak. `firestore.rules`: klient yoza olmaydi, update va delete umuman yo'q |
| **Oylik kolleksiyalar** (`events_2027_03`) | Bitta kolleksiyada millionlab hujjat bo'lsa so'rov qimmatlashadi. Tahlilda faqat kerakli oy o'qiladi |
| **Agregat + xom log parallel** | Dashboard `statsDaily` dan o'qiydi (bir talaba–bir kun = bitta hujjat), xom log faqat chuqur tahlil uchun. Firestore o'qishlari ~100 baravar kam |
| **`participantCode` eventda ham bor** | Eksport paytida `users` bilan join qilish shart emas — anonimlashtirish arzon va xatosiz |
| **Kunlik agregatsiya Functions'da** | Firestore'ga yaqin, AI kerak emas, Vercel funksiya vaqtini yemaydi |
| **Prognoz izohi Vercel'da** | Claude kaliti faqat Vercel'da |

### Firestore hujjat oqimi (kim yozadi)

| Kolleksiya | Yozuvchi |
|---|---|
| `users`, `groups`, `cohorts`, `tests`, `items`, `lessons` … | Server (Admin SDK) — admin/o'qituvchi CMS |
| `attempts`, `testAttempts`, `mastery`, `learningPaths` | Server (Server Action) |
| `speakingSubmissions`, `writingSubmissions` | Server (Route Handler) |
| `aiSessions` + `messages` | Server (AI Route Handler) |
| `events_*`, `statsDaily` | Server (`logEvent`) |
| `statsGroupDaily`, `predictions`, `portfolioItems`, `notifications` | Cloud Functions |
| **`chats/*/messages`, `presence`, `forumThreads`, `reflections`, `projects.sharedDoc`** | **Klient (Firestore Rules bilan himoyalangan)** |
| `users` (3 ta maydon), `notifications.read`, `portfolioItems.pinned` | Klient (cheklangan update) |

---

## 6. Autentifikatsiya va rollar

```
Firebase Auth (email/parol, Google)
   │
   ├─ onUserCreated (Cloud Function, v1 auth trigger)
   │    users/{uid} yaratiladi
   │    invites/{email} bo'lsa → role, groupId, expGroup, participantCode
   │    auth.setCustomUserClaims(uid, { role, groupId, groupIds, expGroup, participantCode })
   │
   ├─ Klient: signInWithEmailAndPassword → ID token
   │
   ├─ Server Action `createSession(idToken)`
   │    verifyIdToken (auth_time ≤ 5 daqiqa)
   │    createSessionCookie (5 kun)
   │    cookie: le_session — httpOnly, secure, sameSite=lax
   │
   └─ Har so'rovda: verifySessionCookie(cookie, checkRevoked=true)
```

| Rol | Claim | Nimani ko'radi |
|---|---|---|
| `student` | `role`, `groupId`, `expGroup`, `participantCode` | Faqat o'z hujjatlari + nashr etilgan kontent |
| `teacher` | `role`, `groupIds[]` | O'z guruhlari talabalari va ularning ishlari |
| `researcher` | `role` | Agregatlar, test natijalari, so'rovnomalar — **chat matnlaridan tashqari** |
| `admin` | `role` | Hammasi (yozish baribir server orqali) |

Claim'lar `firestore.rules` va `storage.rules` da to'g'ridan-to'g'ri ishlatiladi
(`request.auth.token.get('groupIds', [])`), shuning uchun qoidalar arzon —
ko'p hollarda qo'shimcha `get()` kerak emas.

---

## 7. Xavfsizlik qatlamlari (jamlanma)

| Qatlam | Nima qiladi |
|---|---|
| **middleware (edge)** | Cookie yo'q → `/login`. Tez, DB'ga tegmaydi |
| **`requireUser(roles)`** | Server komponentda rol tekshiruvi |
| **`assertFlag` / `checkFlag`** | Eksperiment guruhiga mos imkoniyat tekshiruvi |
| **Firestore Rules** | Klient so'rovlari uchun default-deny |
| **Storage Rules** | Egalik, hajm, content-type |
| **App Check** | Bot va API suiiste'moli |
| **Rate limit (Firestore `aiQuota`)** | AI so'rovlari kunlik limiti — `src/ai/guard/rate-limit.ts` |
| **`import 'server-only'`** | Server modullarini klientga import qilishni build vaqtida bloklaydi |
| **Xavfsizlik sarlavhalari** (`vercel.json`) | HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy: microphone=(self)` |
| **`auditLogs`** | Admin harakatlari va eksportlar qayd etiladi |

---

## 8. Qayerga qarash kerak

| Savol | Fayl |
|---|---|
| Kolleksiya nomlari, CEFR, ko'nikmalar, limitlar | `src/config/constants.ts` |
| Firestore hujjat tiplari | `src/types/index.ts` |
| Sessiya va rollar | `src/lib/firebase/session.ts` |
| Feature flaglar | `src/lib/flags.ts` |
| Adaptiv dvigatel | `src/lib/adaptive/{bkt,policy,srs,grade}.ts` |
| Event log va agregatlar | `src/lib/analytics/{events,aggregate}.ts` |
| Statistika (t-test, Cohen's d) | `src/lib/analytics/stats.ts` |
| Eksport datasetlari | `src/lib/export/{datasets,spss,excel,csv}.ts` |
| Kim nimani o'qiy oladi | `firestore.rules` (har blok ustida izoh bor) |
| Fayl yuklash cheklovlari | `storage.rules` |
| Fon vazifalari | `functions/src/**` |
| Cron va sarlavhalar | `vercel.json` |
