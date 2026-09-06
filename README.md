# LinguaEcon AI

**Iqtisodiyot yo'nalishi talabalari uchun AI asosidagi professional ingliz tili platformasi.**

Bu — DSc dissertatsiyasi (Munirakhon Mukhitdinova, O'zDJTU, himoya ~2027) doirasida
ishlab chiqilgan MVP. Platforma ikki vazifani bajaradi:

1. **8 bosqichli mualliflik metodikasini** amalda ko'rsatadi (quyidagi jadval);
2. **Real pedagogik eksperiment** o'tkazishga yaroqli: 150–200 talaba,
   eksperimental va nazorat guruhlari, pre/post testlar, so'rovnomalar va
   SPSS uchun tayyor eksport.

Nazorat guruhi xuddi shu platformadan foydalanadi, lekin AI funksiyalari
feature-flag orqali butunlay o'chirilgan — bu eksperimentning mustaqil
o'zgaruvchisi (`docs/ARCHITECTURE.md`).

---

## 8 bosqichli metodika platformada

| # | Bosqich | Sahifa / modul | Mexanizm |
|---|---|---|---|
| 1 | Maqsad belgilash va tashkil etish | `/student/path`, `/onboarding`, `/student/reflection` | Maqsad ustasi, kasbiy yo'nalish tanlash, motivatsiya so'rovnomasi (pre), refleksiya kundaligi ochiladi |
| 2 | Diagnostika va differensiallashtirish | `/student/assessment/diagnostic` | 8 bo'limli test → **Individual Linguistic Profile** (weak / needs improvement / intermediate / strong) → Learning Path v1 |
| 3 | AI bilan ishlashga tayyorgarlik | `/student/prompt-lab` | AI literacy, akademik halollik, Simple → Guided → Independent prompt bosqichlari, AI javobini tekshirish mashqi |
| 4 | O'rgatuvchi bosqich | `/student/learn/[lessonId]` | Video + interaktiv bloklar, grammatika iqtisodiy kontekstda, 6 bosqichli so'z kartasi, TTS + IPA, infografika |
| 5 | Mashq va avtomatlashtirish | `/student/practice` | Adaptiv dvigatel (BKT + 3-to'g'ri/2-xato qoidalari), 12 tur mashq, SM-2 lug'at takrorlash, XP va streak |
| 6 | Produktiv-kommunikativ | `/student/ai-teacher`, `/student/speaking-lab`, `/student/writing-lab`, `/student/communication` | AI role-play (6 persona), talaffuz baholash (Azure), yozma ish feedback'i, chat va forum |
| 7 | Integrativ-kasbiy faoliyat | `/student/projects` | Case study: matn → grafik tahlili → lug'at → grammatika → speaking → guruh muhokamasi → solution → report → prezentatsiya |
| 8 | Baholash, feedback, refleksiya | `/student/assessment`, `/student/portfolio`, `/student/reflection` | AI Feedback Report, self-assessment, progress dashboard, Learning Path qayta generatsiyasi, post-test |

---

## Stek

| Qatlam | Tanlov |
|---|---|
| Frontend | Next.js 15 (App Router, React 19, Server Actions), TypeScript strict, Tailwind CSS 4 + shadcn/ui |
| Ma'lumotlar | Firebase: Auth (custom claims), Cloud Firestore (`europe-west3`), Storage, Cloud Functions v2 (Node 20), App Check |
| Server logika | Vercel (`fra1`) — Route Handlers va Server Actions, `firebase-admin` SDK |
| AI | Claude API (tutor, feedback, mashq generatsiya, error analysis) + Azure AI Speech (talaffuz baholash, STT, TTS) |
| Analitika | Event log (append-only) → `statsDaily` → `statsGroupDaily`; `simple-statistics` (t-test, Cohen's d) |
| Eksport | Excel (exceljs), CSV, SPSS-ready paket (`codebook.md` + `import.sps`) |
| i18n | next-intl — `uz` (asosiy, lotin), `en`, `ru` |
| Test | Vitest (unit), Firebase Emulator Suite (rules), Playwright (e2e) |
| CI/CD | GitHub Actions (typecheck, lint, test) → Vercel Preview → Production |

---

## Tez boshlash

### 1. Talablar

- Node.js 20+
- pnpm 11+ (`corepack enable`)
- Firebase CLI (`npm i -g firebase-tools`) — emulatorlar uchun
- Java 11+ — Firestore emulatori uchun

### 2. O'rnatish

```bash
pnpm install
cp .env.example .env.local
cp .firebaserc.example .firebaserc
```

`.env.local` ni to'ldiring. Har bir o'zgaruvchi ustida qayerdan olish
yozilgan; lokal ishlash uchun minimal to'plam:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase web config
- `FIREBASE_SERVICE_ACCOUNT_BASE64` — Admin SDK kaliti (base64)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

`ANTHROPIC_API_KEY` va `AZURE_SPEECH_KEY` bo'lmasa ham ilova ishlaydi —
AI va talaffuz baholash funksiyalari "mavjud emas" holatida turadi.

To'liq yo'riqnoma: **[docs/SETUP.md](docs/SETUP.md)**.

### 3. Ishga tushirish

```bash
pnpm dev                 # http://localhost:3000
```

Emulatorlar bilan (Firestore/Auth/Storage/Functions lokal, bulutga tegmaydi):

```bash
pnpm emulators           # UI: http://localhost:4000
# .env.local da: NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1
pnpm dev
```

| Xizmat | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |
| Emulator UI | 4000 |

### 4. Boshlang'ich ma'lumotlar

```bash
pnpm seed                # kurslar, modullar, darslar, lexicon, badge'lar
pnpm seed:items          # AI orqali mashq generatsiyasi (ANTHROPIC_API_KEY kerak)
pnpm users:import        # Excel'dan talabalarni bulk import
pnpm corpus:build        # korpus n-gram indeksi (bir marta)
```

### 5. Tekshiruv

```bash
pnpm typecheck
pnpm lint
pnpm test                # Vitest unit testlar
```

---

## Loyiha strukturasi

```
app/                    # Next.js routelar: (marketing) (auth) (student) (teacher) (researcher) (admin) api/
src/
  components/           # ui/ (shadcn), layout/, student/, teacher/, researcher/, charts/, audio/
  features/             # domain modullar: auth, onboarding, learning-path, lessons, exercises,
                        # adaptive, vocabulary, speaking, writing, ai-teacher, chat, projects,
                        # assessment, surveys, gamification, portfolio, analytics, export, admin
  ai/                   # Claude: client, prompts/, schemas/ (zod), tools/, services/, guard/
  lib/
    firebase/           # client.ts, admin.ts, session.ts
    speech/             # azure.ts (assess, stt, tts), audio.ts
    adaptive/           # bkt.ts, policy.ts, srs.ts, grade.ts, mastery.ts, path.ts
    analytics/          # events.ts, aggregate.ts, stats.ts
    export/             # excel.ts, csv.ts, spss.ts
    utils/              # format.ts, cn.ts
  types/                # Firestore hujjat tiplari
  config/               # constants.ts (COL, CEFR, skills, domains, errorTaxonomy, limitlar)
functions/              # Cloud Functions (alohida npm paketi, Node 20)
  src/auth/             # onUserCreated
  src/firestore/        # onAttemptCreated, onChatMessageCreated, on*SubmissionCreated/Updated
  src/scheduled/        # kunlik agregatsiya, haftalik prognoz, streak reset
scripts/                # seed, korpus build, bulk import, item generatsiya CLI
messages/               # uz.json, en.json, ru.json
tests/                  # unit/ (Vitest), rules/ (emulator), e2e/ (Playwright)
docs/                   # SETUP, DEPLOY, RESEARCH, ARCHITECTURE
public/                 # manifest.webmanifest, icon.svg, robots.txt
firestore.rules  storage.rules  firestore.indexes.json  firebase.json  vercel.json
PLAN.md                 # to'liq texnik reja (19 bo'lim)
```

---

## Hujjatlar

| Fayl | Nima haqida |
|---|---|
| **[PLAN.md](PLAN.md)** | To'liq texnik reja: stek, ma'lumotlar modeli, AI arxitekturasi, muddatlar, xarajatlar |
| **[docs/SETUP.md](docs/SETUP.md)** | Noldan sozlash: Firebase loyihalari, Auth, Storage, App Check, kalitlar, seed, birinchi admin |
| **[docs/DEPLOY.md](docs/DEPLOY.md)** | Vercel deploy, muhitlar, domen, cron sirlari, xarajat nazorati |
| **[docs/RESEARCH.md](docs/RESEARCH.md)** | Eksperiment qo'llanmasi: kohort, randomizatsiya, consent, pre/post, SPSS eksport, anonimlik |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | So'rov oqimi, AI kalitlari qayerda, feature-flag mexanizmi, event-log quvuri |
| **[docs/TRACEABILITY.md](docs/TRACEABILITY.md)** | Talab → modul → bosqich matritsasi (PLAN 15-bo'lim) |

---

## Xavfsizlik qisqacha

- Barcha AI kalitlari faqat serverda (Vercel env). Brauzer ularni hech qachon ko'rmaydi.
- Firestore va Storage qoidalari default-deny; yozish asosan Admin SDK orqali.
- `events_*` — append-only: klient yoza olmaydi, update/delete yo'q.
- Sessiya cookie httpOnly + secure; middleware rolni tekshiradi, server action qayta tekshiradi.
- Eksportda ism va uid yo'q — faqat `participantCode` (`E-042`, `C-017`).

Batafsil: PLAN.md 10-bo'lim va `firestore.rules` izohlari.

---

## Litsenziya va foydalanish

Ilmiy tadqiqot maqsadida ishlab chiqilgan, ichki foydalanish uchun.
Ma'lumotlar bilan ishlashda `docs/RESEARCH.md` dagi etika bo'limiga rioya qiling.
