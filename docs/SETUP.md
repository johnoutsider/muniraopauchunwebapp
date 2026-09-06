# SETUP — noldan sozlash

Bu hujjat platformani birinchi marta ishga tushirish uchun qadam-baqadam
yo'riqnoma. Oxirigacha bajarilsa: ikki Firebase loyihasi, ishlaydigan lokal
muhit, seed qilingan baza va birinchi admin hisobi bo'ladi.

Taxminiy vaqt: **60–90 daqiqa** (Azure resursi tasdiqlanishini kutish bundan tashqari).

---

## 0. Oldindan kerak

| Nima | Izoh |
|---|---|
| Google hisobi | Firebase / Google Cloud uchun |
| To'lov kartasi | Firebase **Blaze** rejasi majburiy (Cloud Functions va tashqi tarmoq uchun) |
| Node.js 20+, pnpm 11+ | `corepack enable` |
| Firebase CLI | `npm i -g firebase-tools` |
| Java 11+ | Firestore emulatori uchun |
| Anthropic hisobi | console.anthropic.com |
| Azure obunasi | portal.azure.com (bepul tarif ham yetadi) |

---

## 1. Ikki Firebase loyihasi

Ishlab chiqish va real eksperiment ma'lumotlari **hech qachon** aralashmasligi kerak.

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Nom: `linguaecon-dev` → Google Analytics: **o'chiring** (kerak emas)
3. Xuddi shu tarzda ikkinchi loyiha: `linguaecon-prod`
4. Har ikkisida: **Settings → Usage and billing → Modify plan → Blaze**
5. Prod loyihada byudjet ogohlantirishini qo'ying:
   Google Cloud Console → Billing → Budgets & alerts → oylik $100, 50/90/100% da email.

> Quyidagi 2–6 qadamlar **har ikki loyihada** bajariladi.

---

## 2. Authentication

**Build → Authentication → Get started**

Yoqiladigan provayderlar (**Sign-in method**):

| Provayder | Holat | Izoh |
|---|---|---|
| Email/Password | **Yoqing** | Asosiy usul. Talabalar bulk import bilan yaratiladi |
| Google | Yoqing | O'qituvchi/tadqiqotchi uchun qulay |
| Phone | Ixtiyoriy | MVP uchun shart emas |

Qo'shimcha sozlamalar:

- **Settings → User actions** → "Enable create (sign-up)" — prod'da o'chirib
  qo'yish mumkin, chunki hisoblarni admin yaratadi.
- **Templates** → parolni tiklash va email tasdiqlash matnlarini o'zbekchaga o'zgartiring.
- **Settings → Authorized domains** → keyinroq (DEPLOY.md) domen qo'shiladi.

---

## 3. Firestore (`europe-west3`)

**Build → Firestore Database → Create database**

1. Rejim: **Production mode** (bo'sh qoidalar bilan boshlanadi — biz o'zimiznikini deploy qilamiz)
2. **Location: `europe-west3` (Frankfurt)** — ⚠️ keyin O'ZGARTIRIB BO'LMAYDI.
   Vercel `fra1` bilan bir joyda bo'lgani uchun O'zbekistondan kechikish minimal.

Qoidalar va indekslarni repo'dan deploy qiling (5-qadamdan keyin):

```bash
firebase use dev
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 4. Storage

**Build → Storage → Get started** → location `europe-west3` (Firestore bilan bir xil).

```bash
firebase deploy --only storage
```

Storage yo'llari (`storage.rules`):

| Yo'l | Kim yozadi | Cheklov |
|---|---|---|
| `speaking/{uid}/{file}` | faqat egasi | `audio/*`, ≤ 8 MB |
| `tts/{hash}.mp3` | faqat server | o'qish: hamma kirganlar |
| `projects/{projectId}/{file}` | loyiha a'zolari | ≤ 25 MB |
| `avatars/{uid}` | faqat egasi | `image/*`, ≤ 2 MB |

---

## 5. App Check (bot himoyasi)

1. Google Cloud Console → **reCAPTCHA Enterprise** → **Create key** →
   type: **Website**, domen: `localhost` va prod domeningiz → **Site key** ni nusxalang.
2. Firebase Console → **App Check** → Apps → Web app → **reCAPTCHA Enterprise** →
   site key ni kiriting.
3. Site key ni `.env.local` ga: `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=...`
4. **Dastlab "Unenforced" holatida qoldiring.** Pilotdan keyin
   (Firestore va Storage bo'yicha) **Enforce** ga o'tkazing.
5. Lokal ishlash uchun brauzer konsolidagi debug tokenni App Check →
   Apps → **Manage debug tokens** ga qo'shing.

---

## 6. Web app konfiguratsiyasi

**Project settings → General → Your apps → Add app → Web (`</>`)**

Chiqadigan config `.env.local` ga ko'chiriladi:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=linguaecon-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=linguaecon-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=linguaecon-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Bu qiymatlar maxfiy emas — ular brauzerda ko'rinadi, himoyani Rules va App Check beradi.

---

## 7. Service account (Admin SDK)

**Project settings → Service accounts → Generate new private key** → JSON yuklanadi.

⚠️ Bu fayl — to'liq huquqli kalit. Repoga QO'YMANG (`.gitignore` da
`serviceAccount*.json` bor). Base64 qiling va faylni o'chiring:

```bash
# Linux / macOS
base64 -w0 serviceAccount.json

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccount.json"))
```

Natijani `.env.local` ga:

```
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Iiw...
```

Sessiya cookie siri ham kerak:

```bash
```

---

## 8. Anthropic (Claude) kaliti

1. [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**
2. Nom: `linguaecon-dev` / `linguaecon-prod` — alohida kalitlar, alohida limit.
3. **Limits** bo'limida oylik xarajat chegarasini qo'ying (dev uchun $20,
   prod uchun eksperiment byudjetiga qarab $200–400 — PLAN 16).
4. `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_MAIN=claude-sonnet-4-5
AI_MODEL_FAST=claude-haiku-4-5-20251001
```

Model nomlari feature-flag: qimmatlashsa `AI_MODEL_MAIN` ni ham Haiku'ga
o'tkazish mumkin, kod o'zgarmaydi.

---

## 9. Azure Speech resursi

1. [portal.azure.com](https://portal.azure.com) → **Create a resource** → qidiruv: **Speech**
2. Sozlamalar:
   - Resource group: `linguaecon`
   - Region: **`germanywestcentral`** yoki `westeurope` (Frankfurt'ga yaqin)
   - Pricing tier: **F0** (bepul, oyiga 5 soat) sinov uchun, eksperiment uchun **S0**
3. Yaratilgach: **Keys and Endpoint** → **KEY 1** va **Location/Region**:

```
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=germanywestcentral
```

Tekshirish: Speaking Lab'da bitta so'zni yozib ko'ring — accuracy/fluency/
completeness/prosody ballari chiqishi kerak.

---

## 10. Qo'shimcha xizmatlar (ixtiyoriy, lekin tavsiya etiladi)

| Xizmat | Nima uchun | Qayerdan |
|---|---|---|
| **Sentry** | Xatolarni kuzatish | sentry.io → Project → Client Keys (DSN) |
| **Resend** | Bildirishnoma emaillari | resend.com → API Keys |

Bularsiz ham platforma ishlaydi — tegishli funksiyalar shunchaki o'chib turadi.

---

## 11. Lokal muhitni ishga tushirish

```bash
pnpm install
cp .env.example .env.local     # to'ldiring
cp .firebaserc.example .firebaserc
firebase login
firebase use dev

pnpm emulators                 # alohida terminalda; UI: localhost:4000
pnpm dev                       # localhost:3000
```

Emulatorga ulanish uchun `.env.local` da:

```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1
```

Emulator ma'lumotlari o'chib ketmasligi uchun:

```bash
firebase emulators:start --import=./.emulator-data --export-on-exit
```

---

## 12. Vercel env o'zgaruvchilari

Vercel loyihasi yaratilgach (`docs/DEPLOY.md` 1-qadam):

**Project → Settings → Environment Variables**

| O'zgaruvchi | Development | Preview | Production |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | dev | dev | **prod** |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | dev | dev | **prod** |
| `ANTHROPIC_API_KEY` | dev kalit | dev kalit | **prod kalit** |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | ✓ | ✓ | ✓ |
| `CRON_SECRET` | — | — | ✓ |
| `NEXT_PUBLIC_APP_URL` | localhost | preview URL | prod domen |

CLI orqali tez usul:

```bash
vercel env add ANTHROPIC_API_KEY production
```

⚠️ **Preview muhiti hech qachon prod Firebase loyihasiga ulanmasin** — aks holda
test ma'lumotlari eksperiment datasetiga tushib ketadi.

---

## 13. Cloud Functions deploy

```bash
cd functions && npm install && cd ..
firebase use dev
firebase deploy --only functions
```

Deploy bo'ladigan funksiyalar:

| Funksiya | Trigger |
|---|---|
| `onUserCreated` | Auth: yangi hisob → `users/{uid}` + custom claims |
| `onAttemptCreated` | `attempts/{id}` → `items.stats` yangilanadi |
| `onSpeakingSubmissionCreated` | yangi rekord bo'lsa → portfolio |
| `onWritingSubmissionUpdated` | `status = reviewed` → bildirishnoma |
| `onChatMessageCreated` | chat `lastMessage` + bildirishnomalar |
| `scheduledDailyAggregation` | cron 02:00 Asia/Tashkent |
| `scheduledWeeklyPrediction` | cron dushanba 03:00 |
| `scheduledStreakReset` | cron 00:30 |

Cron funksiyalari birinchi deploy'da Cloud Scheduler ishlarini yaratadi
(Blaze rejasi kerak).

---

## 14. Bazani seed qilish

```bash
pnpm seed          # kurslar, modullar, darslar, lexicon, badge'lar, so'rovnomalar
pnpm seed:items    # AI orqali mashq generatsiyasi (status: draft)
pnpm corpus:build  # korpus n-gram indeksi
```

`seed:items` yaratgan mashqlar **draft** holatida bo'ladi — o'qituvchi
`/teacher/content` sahifasida tasdiqlagunicha talabaga ko'rinmaydi
(human-in-the-loop tamoyili, PLAN 7.4).

---

## 15. Birinchi admin hisobi

Chicken-and-egg muammosi: admin sahifasiga kirish uchun `role=admin` claim kerak,
lekin claim'ni admin qo'yadi. Yechim — bir martalik skript:

```bash
# 1. Firebase Console → Authentication → Add user
#    email: admin@linguaecon.uz, parol: (vaqtinchalik)
#    UID ni nusxalang

# 2. Claim va users hujjatini qo'ying:
pnpm users:import --admin --uid=<UID> --email=admin@linguaecon.uz --name="Admin"
```

Skript quyidagini bajaradi:

1. `auth.setCustomUserClaims(uid, { role: 'admin' })`
2. `users/{uid}` hujjatini `role: 'admin', status: 'active'` bilan yozadi

So'ng **chiqib qayta kiring** — ID token yangi claim bilan yangilanadi
(claim faqat token yangilanganda kuchga kiradi).

Tekshiruv: `/admin/users` sahifasi ochilishi kerak.

Keyingi hisoblar (o'qituvchi, tadqiqotchi) admin panelidan yaratiladi:
`/admin/users → New user → role`.

---

## 16. Yakuniy tekshiruv ro'yxati

- [ ] `pnpm dev` xatosiz ishga tushdi
- [ ] Ro'yxatdan o'tish → `users/{uid}` hujjati avtomatik yaratildi (`onUserCreated`)
- [ ] Login → rolga mos dashboard'ga yo'naltirdi
- [ ] Talaba sifatida boshqa talabaning hujjatini o'qib bo'lmaydi (Rules ishlayapti)
- [ ] Speaking Lab: audio yozildi, Storage'ga tushdi, Azure ball qaytardi
- [ ] AI Teacher: streaming javob keldi, `aiSessions/messages` yozildi
- [ ] `events_YYYY_MM` kolleksiyasida hodisalar paydo bo'lmoqda
- [ ] Emulator UI'da (localhost:4000) Firestore va Storage ko'rinmoqda
- [ ] Byudjet ogohlantirishlari o'rnatilgan (Firebase + Anthropic + Azure)

Keyingi qadam: **[docs/DEPLOY.md](DEPLOY.md)**.
