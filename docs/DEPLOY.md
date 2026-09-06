# DEPLOY — Vercel, muhitlar va xarajat nazorati

`docs/SETUP.md` bajarilgan bo'lishi kerak (Firebase loyihalari, kalitlar).

---

## 1. Vercel loyihasi

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub repo'ni tanlang
2. Framework: **Next.js** (avtomatik aniqlanadi)
3. Build sozlamalari (odatda o'zgartirish shart emas):
   - Install: `pnpm install`
   - Build: `pnpm build`
   - Output: `.next`
4. **Deploy** — birinchi build env o'zgaruvchilarsiz yiqilishi mumkin, bu normal.
   Env'larni qo'shib qayta deploy qiling.

`vercel.json` repoda quyidagilarni belgilaydi:

| Sozlama | Qiymat | Sabab |
|---|---|---|
| `regions` | `fra1` | Firebase `europe-west3` bilan bir joyda |
| `maxDuration` (`/api/ai/**`) | 300 s | Uzun AI streaming javoblar |
| `maxDuration` (`/api/speech/**`) | 120 s | Azure assessment + TTS |
| `maxDuration` (`/api/cron/**`) | 300 s, 1 GB | Kunlik agregatsiya, haftalik prognoz |
| `crons` | 2 ta | kunlik statistika, haftalik prognoz |
| Xavfsizlik sarlavhalari | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS | — |

⚠️ `Permissions-Policy: microphone=(self)` — mikrofonga faqat o'z domenimizda
ruxsat. Buni olib tashlasangiz Speaking Lab ishlamay qoladi.

⚠️ Vercel Cron **faqat Production** deploymentda ishlaydi va **Pro reja**da
kunlikdan tez-tez chaqirishga ruxsat beriladi. Hobby rejada kuniga 1 marta.

⚠️ `functions` bo'limidagi har bir shablon **mavjud route'ga mos kelishi shart**
— aks holda deploy "pattern doesn't match any Serverless Functions" xatosi
bilan yiqiladi. Yangi og'ir route qo'shsangiz (masalan `app/api/export/**`),
`vercel.json` ga shablon qo'shing yoki oddiyroq yo'l bilan route faylining
o'zida `export const maxDuration = 300` yozing.

---

## 2. Muhitlar

| Muhit | Branch | Firebase loyihasi | URL |
|---|---|---|---|
| **Development** | lokal | emulator yoki `linguaecon-dev` | `localhost:3000` |
| **Preview** | `dev` va PR branchlar | `linguaecon-dev` | Vercel avtomatik URL |
| **Production** | `main` | `linguaecon-prod` | `linguaecon.uz` |

Branch strategiyasi: `feature/*` → PR → `dev` (preview) → PR → `main` (prod).

**Eng muhim qoida:** Preview va Production **turli Firebase loyihalariga**
ulanadi. Vercel'da `NEXT_PUBLIC_FIREBASE_PROJECT_ID` va
`FIREBASE_SERVICE_ACCOUNT_BASE64` ni muhit bo'yicha alohida qiymat bilan
qo'ying (Settings → Environment Variables → muhitni belgilang).

Aks holda preview'dagi test urinishlari eksperiment datasetiga tushadi va
ma'lumot buziladi.

---

## 3. Custom domen

1. Vercel → Project → **Settings → Domains** → `linguaecon.uz` qo'shing
2. DNS provayderida:
   - `A` yozuv: `@` → `76.76.21.21`
   - `CNAME`: `www` → `cname.vercel-dns.com`
3. SSL sertifikat avtomatik chiqadi (bir necha daqiqa)
4. `www` → apex redirect'ni yoqing

### Firebase authorized domains (majburiy!)

Firebase Console (prod loyiha) → **Authentication → Settings → Authorized domains**
ga qo'shing:

- `linguaecon.uz`
- `www.linguaecon.uz`
- `<loyiha>.vercel.app` (preview loginlari uchun)
- `localhost` (odatda oldindan bor)

Bu ro'yxatda bo'lmagan domendan login **`auth/unauthorized-domain`** xatosi beradi.

Shuningdek `NEXT_PUBLIC_APP_URL` ni Production muhitida `https://linguaecon.uz`
ga o'zgartiring — email havolalari va OG teglari shundan olinadi.

---

## 4. Cron ishlari va `CRON_SECRET`

Ikkita cron **Vercel** tomonda (AI izohi kerak bo'lgani uchun — kalit Vercel'da):

| Path | Jadval (UTC) | Toshkent vaqti | Nima qiladi |
|---|---|---|---|
| `/api/cron/daily-stats` | `0 21 * * *` | 02:00 | `events_*` → `statsDaily` agregatsiyasi |
| `/api/cron/weekly-prediction` | `0 22 * * 1` | dushanba 03:00 | prognoz + Claude izohi o'qituvchi uchun |

Uchtasi **Cloud Functions** tomonda (AI kerak emas, Firestore'ga yaqin):
`scheduledDailyAggregation`, `scheduledWeeklyPrediction`, `scheduledStreakReset`
(`firebase deploy --only functions`).

### Cron himoyasi

Vercel har chaqiruvda `Authorization: Bearer $CRON_SECRET` sarlavhasini yuboradi.
Route handler uni tekshirishi shart:

```ts
const auth = request.headers.get('authorization')
if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

Sirni yarating va faqat **Production** muhitiga qo'ying:

```bash
openssl rand -hex 32
vercel env add CRON_SECRET production
```

Qo'lda sinash:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://linguaecon.uz/api/cron/daily-stats
```

---

## 5. Deploy oqimi

```bash
git checkout -b feature/writing-lab
# ... o'zgarishlar ...
git commit -m "feat(writing): inline AI feedback"
git push -u origin feature/writing-lab
# PR → dev : GitHub Actions (typecheck, lint, test) + Vercel Preview
# PR → main: Production deploy
```

GitHub Actions **deploy qilmaydi** — faqat sifatni tekshiradi. Deploy'ni
Vercel GitHub integratsiyasi o'zi bajaradi.

Firebase artefaktlari alohida deploy qilinadi (kod bilan avtomatik ketmaydi):

```bash
firebase use prod
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

⚠️ Yangi kompozit indeks qo'shsangiz, **kod deploy'idan oldin** indekslarni
deploy qiling — indeks qurilishi bir necha daqiqadan bir necha soatgacha davom
etadi va tayyor bo'lmaguncha so'rovlar xato beradi.

### Orqaga qaytarish (rollback)

- **Vercel:** Deployments → oldingi deployment → **Promote to Production** (soniyalar ichida)
- **Rules:** `firebase deploy --only firestore:rules` oldingi commit'dan
- **Functions:** oldingi commit'dan qayta deploy; Firestore triggerlari
  idempotent yozilgan, qayta ishga tushirish xavfsiz

---

## 6. Deploydan keyingi tekshiruv

- [ ] Landing sahifa ochiladi, `robots.txt` va `manifest.webmanifest` yetkaziladi
- [ ] Login ishlaydi (authorized domains!)
- [ ] Talaba dashboard'i yuklanadi, Firestore o'qishlari xato bermaydi
- [ ] Mikrofon so'raladi va Speaking Lab audio yozadi (`Permissions-Policy`)
- [ ] AI Teacher streaming javob beradi
- [ ] `curl` bilan cron 401 qaytaradi (sirsiz), sir bilan 200
- [ ] Sentry'da xatolar ko'rinmoqda
- [ ] Vercel Analytics'da sahifalar qayd etilmoqda
- [ ] PWA: telefonda "Add to Home Screen" ishlaydi

---

## 7. Xarajat nazorati va byudjet chegaralari

Eksperiment davri uchun taxmin (200 talaba, oyiga — PLAN 16):

| Xizmat | Taxmin | Asosiy xarajat manbai |
|---|---|---|
| Vercel Pro | ~$20 | 1 a'zo |
| Firebase Blaze | $20–60 | Firestore o'qish/yozish, Storage, Functions |
| **Claude API** | **$150–400** | 200 × ~30 seans × 5–8k token |
| **Azure Speech** | **$100–250** | ~$1/soat audio; talaba ~1–1.5 soat/oy |
| Sentry / Resend | $0–20 | bepul tariflar yetadi (ixtiyoriy) |
| **Jami** | **~$300–750/oy** | 3–4 oy → ~$1.5–3k |

### Amaldagi chegaralar (kodda)

| Chegara | Qiymat | Qayerda |
|---|---|---|
| AI xabar / talaba / kun | 60 | `AI_LIMITS.MESSAGES_PER_DAY` |
| AI token / talaba / kun | 120 000 | `AI_LIMITS.TOKENS_PER_DAY` |
| Audio yozuv uzunligi | ≤ 120 s | `AUDIO.MAX_DURATION_SEC` |
| Audio hajmi | ≤ 8 MB | `AUDIO.MAX_BYTES` + `storage.rules` |
| Loyiha fayli | ≤ 25 MB | `storage.rules` |

Limit tugaganda talaba **statik materiallar**ga yo'naltiriladi — platforma
bloklanmaydi.

### Xarajatni kamaytiruvchi mexanizmlar

1. **Item bank** — AI generatsiya qilgan mashq bir marta yaratiladi, tasdiqlanadi
   va qayta-qayta ishlatiladi.
2. **Prompt caching** — metodika va rubrikalar (katta system prompt) keshlanadi.
3. **Haiku** — klassifikatsiya va qisqa tekshiruvlar arzon modelda.
4. **TTS keshi** — `tts/{hash}.mp3`: bir so'z bir marta generatsiya qilinadi.
5. **Agregatlar** — dashboard `statsDaily`/`statsGroupDaily` dan o'qiydi, xom
   `events_*` dan emas (Firestore o'qishlari 100 baravar kam).
6. **Oylik event kolleksiyalari** — `events_2027_03` kabi, faqat kerakli oy so'raladi.

### Monitoring

| Nima | Qayerda | Chastota |
|---|---|---|
| Firebase sarfi | Console → Usage and billing | haftalik |
| GCP byudjet ogohlantirishi | Billing → Budgets & alerts | avtomatik email |
| Claude sarfi | console.anthropic.com → Usage | haftalik |
| Azure sarfi | portal.azure.com → Cost Management | haftalik |
| Vercel funksiya vaqti | Vercel → Usage | haftalik |
| Ichki AI xarajat paneli | `/admin/system` (tokenlar `aiSessions` dan) | kunlik |

**Agar xarajat oshib ketsa** (kamayish tartibida ta'sirlilik):

1. `AI_MODEL_MAIN` ni Haiku'ga o'tkazing (`settings/global` → models)
2. `AI_LIMITS.MESSAGES_PER_DAY` ni 30 ga tushiring
3. Guruh darajasida `aiFeedback` flagini o'chiring (tutor qoladi)
4. Speaking topshiriqlarini 60 soniyaga cheklang

---

## 8. Zaxira nusxa (backup)

Haftalik Firestore eksporti GCS'ga (PLAN 10):

```bash
gcloud firestore export gs://linguaecon-prod-backups/$(date +%Y-%m-%d) \
  --project=linguaecon-prod
```

Buni Cloud Scheduler + Cloud Function orqali avtomatlashtiring yoki
eksperiment davrida har dushanba qo'lda bajaring.

Eksperiment tugagach: **to'liq eksportni arxivlang** — dissertatsiya himoyasida
xom ma'lumot so'ralishi mumkin (`docs/RESEARCH.md`).
