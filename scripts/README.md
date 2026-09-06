# scripts/ — LinguaEcon AI CLI vositalari

Bu papkadagi skriptlar **`tsx`** orqali ishlaydi va Firebase **Admin SDK** dan foydalanadi
(server kaliti bilan, Firestore Rules'ni chetlab o'tadi). Ular Next.js ilovasidan mustaqil:
`src/lib/firebase/admin.ts` `server-only` importiga ega bo'lgani uchun skriptlar Admin SDK ni
`scripts/_lib.ts` da mustaqil initsializatsiya qiladi.

Har bir skriptda:

- `--help` — to'liq yordam,
- `--dry-run` — hech narsani o'zgartirmasdan nima bo'lishini ko'rsatish (yozadigan skriptlarda),
- `--yes` — interaktiv tasdiqlashni o'tkazib yuborish (CI uchun),
- o'zbekcha konsol chiqishi.

---

## 0. Tayyorgarlik

### 0.1. Muhit o'zgaruvchilari

Loyiha ildizida `.env.local` faylini yarating (skriptlar uni `node:fs` bilan o'zi o'qiydi,
`dotenv` paketi kerak emas):

```dotenv
# Firebase Admin SDK — MAJBURIY
# Console -> Project settings -> Service accounts -> Generate new private key,
# so'ng JSON faylni base64 ga o'giring:
#   Windows PowerShell:
#     [Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | Set-Clipboard
#   macOS / Linux:
#     base64 -w0 service-account.json
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Iiwi...

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=linguaecon-dev.firebasestorage.app

# generate-items.ts uchun
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_MAIN=claude-sonnet-5
AI_MODEL_FAST=claude-haiku-4-5-20251001
```

Muqobil variantlar: `FIREBASE_SERVICE_ACCOUNT` (xom JSON) yoki
`GOOGLE_APPLICATION_CREDENTIALS` (JSON fayl yo'li).

> **Xavfsizlik:** `.env.local`, service account JSON va `credentials*.csv` hech qachon
> git'ga tushmasligi kerak. `scripts/.gitignore` eksport va parol fayllarini bloklaydi.

### 0.2. Ishga tushirish

Barcha buyruqlar **loyiha ildizidan** bajariladi (skriptlar `process.cwd()` ga tayanadi):

```bash
npx tsx scripts/<nom>.ts --help
```

`package.json` da qisqartmalar ham bor:

```bash
pnpm seed            # tsx scripts/seed.ts
pnpm seed:items      # tsx scripts/generate-items.ts
pnpm corpus:build    # tsx scripts/build-corpus.ts
pnpm users:import    # tsx scripts/import-users.ts
```

### 0.3. Tavsiya etilgan tartib (birinchi o'rnatish)

```bash
npx tsx scripts/seed.ts --dry-run                                    # 1. kontentni tekshirish
npx tsx scripts/seed.ts --yes                                        # 2. kontentni yozish
npx tsx scripts/create-admin.ts --email=admin@... --name="..."       # 3. birinchi admin
npx tsx scripts/import-users.ts --file=./data/students.xlsx --dry-run # 4. talabalarni ko'rish
npx tsx scripts/import-users.ts --file=./data/students.xlsx --yes     # 5. talabalarni import
npx tsx scripts/build-corpus.ts --dry-run                             # 6. korpus (matnlar joylangach)
```

---

## 1. `seed.ts` — o'quv kontentni Firestore'ga yozish

`src/content/` dagi barcha seed kontentni **idempotent** tarzda yozadi: hujjat id lari
deterministik (kontentdagi `id`), yozuv `merge: true` bilan. Skriptni istalgan marta qayta
ishga tushirish xavfsiz — `stats` va o'qituvchi tahrirlari saqlanadi.

Yozishdan **oldin** tekshiradi: takrorlangan id lar, darslar va testlardagi mavjud bo'lmagan
item/lug'at havolalari, parallel pre/post variantlarning mosligi va har bir itemning to'liq
`explanation{why, how, whereElse}` maydoni (metodikaning asosiy talabi).

```bash
# Nima yozilishini ko'rish (Firestore o'qilmaydi ham)
npx tsx scripts/seed.ts --dry-run

# Hammasini yozish
npx tsx scripts/seed.ts --yes

# Faqat lug'at va mashqlarni yangilash
npx tsx scripts/seed.ts --only=lexicon,items --yes

# Testlardan tashqari hammasi
npx tsx scripts/seed.ts --skip=tests --yes

# To'liq qayta yozish (ehtiyot bo'ling — o'qituvchi tahrirlari yo'qoladi)
npx tsx scripts/seed.ts --force --yes
```

| Bayroq | Ma'nosi |
|---|---|
| `--only=<a,b>` | Faqat tanlangan bloklar |
| `--skip=<a,b>` | Tanlanganlardan tashqari hammasi |
| `--force` | `merge` o'rniga to'liq almashtirish |
| `--dry-run` | Tekshiradi va hisoblaydi, yozmaydi |
| `--no-verify` | Havolalar tekshiruvini o'tkazib yuboradi |
| `--yes` | Tasdiqlashsiz |

**Bloklar (yozilish tartibi = bog'liqlik tartibi):**
`lexicon` → `grammar` → `items` → `courses` → `modules` → `lessons` →
`caseStudies` → `scenarios` → `promptExercises` → `surveys` → `tests` → `badges`

**Kolleksiyalar:** `lexicon`, `grammarLessons`, `items`, `courses`, `modules`, `lessons`,
`caseStudies`, `scenarios`, `promptExercises`, `surveys`, `tests`, `badges`.

---

## 2. `create-admin.ts` — birinchi administrator

Auth foydalanuvchi yaratadi (yoki mavjudini yangilaydi), `role` custom claim'ini o'rnatadi va
`users/{uid}` hujjatini yozadi.

```bash
# Parol avtomatik generatsiya qilinadi va bir marta ekranga chiqadi (tavsiya etiladi)
npx tsx scripts/create-admin.ts --email=admin@linguaecon.uz --name="Munirakhon Mukhitdinova"

# Parolni o'zingiz berish
npx tsx scripts/create-admin.ts \
  --email=admin@linguaecon.uz --name="Munirakhon Mukhitdinova" --password='LinguaEcon2027!'

# O'qituvchi yoki tadqiqotchi hisobi
npx tsx scripts/create-admin.ts --email=teacher@uni.uz --name="N. Karimova" --role=teacher
npx tsx scripts/create-admin.ts --email=res@uni.uz --name="M. M." --role=researcher

# Rejani ko'rish
npx tsx scripts/create-admin.ts --email=admin@uni.uz --name="Admin" --dry-run
```

| Bayroq | Ma'nosi |
|---|---|
| `--email=` | **Majburiy** |
| `--name=` | **Majburiy**, `displayName` |
| `--password=` | Berilmasa 14 belgili xavfsiz parol generatsiya qilinadi |
| `--role=` | `admin` (default) / `teacher` / `researcher` / `student` |
| `--locale=` | `uz` (default) / `en` / `ru` |
| `--university=` | Ixtiyoriy |
| `--dry-run`, `--yes` | |

> Yangi claim faqat foydalanuvchi tokeni yangilangandan keyin kuchga kiradi —
> tizimdan chiqib qayta kirish kerak.

---

## 3. `import-users.ts` — talabalarni ommaviy import

CSV yoki XLSX fayldan talabalarni yaratadi: Auth hisobi + vaqtinchalik parol, custom claims
(`role`, `groupId`, `expGroup`, `participantCode`), `users/{uid}` hujjati; yetishmayotgan
kohort va guruhlarni (to'g'ri `featureFlags` bilan) yaratadi va kirish fayli yonida
`credentials.csv` yozadi.

**Fayl ustunlari** (sarlavha qatori majburiy, katta-kichik harf farqi yo'q):

| Ustun | Muqobil nomlar | Izoh |
|---|---|---|
| `fullName` | `name`, `fio`, `F.I.Sh.`, `ism` | To'liq ism |
| `email` | `mail`, `e-mail`, `pochta` | Unikal |
| `groupName` | `group`, `guruh` | Masalan `IQT-21-01` |
| `expGroup` | `exp`, `type`, `turi` | `experimental` / `control` (yoki `E` / `C`, `eksperimental` / `nazorat`) |

```bash
# Avval albatta dry-run
npx tsx scripts/import-users.ts --file=./data/students.xlsx --cohort="2026-27 kuz" --dry-run

# Import
npx tsx scripts/import-users.ts --file=./data/students.xlsx --cohort="2026-27 kuz" --yes

# CSV, o'qituvchi biriktirilgan holda
npx tsx scripts/import-users.ts --file=./data/students.csv --teacher=<teacherUid> --yes

# Parollar faylini boshqa joyga
npx tsx scripts/import-users.ts --file=./data/students.xlsx --out=./data/parollar.csv --yes
```

| Bayroq | Ma'nosi |
|---|---|
| `--file=` | **Majburiy**, `.xlsx` / `.xls` / `.csv` |
| `--cohort=` | Kohort nomi yoki id (default `default-cohort`) |
| `--university=` | Yangi kohort uchun universitet nomi |
| `--teacher=` | Yaratiladigan guruhlarga biriktiriladigan o'qituvchi uid |
| `--password-length=` | Vaqtinchalik parol uzunligi (default 10) |
| `--out=` | `credentials.csv` yo'li |
| `--dry-run`, `--yes` | |

**Ishtirokchi kodi** (`participantCode`) mavjud talabalardan davom ettiriladi:
eksperimental guruh `E-001`, `E-002`, ...; nazorat guruhi `C-001`, `C-002`, ...
Bir guruhda ikki xil `expGroup` bo'lsa skript to'xtaydi.

> ⚠️ `credentials.csv` da **ochiq parollar** bo'ladi. Talabalarga tarqatib bo'lgach faylni
> o'chiring. Talabalar birinchi kirishda parolni almashtirishlari shart
> (`mustChangePassword: true`).

---

## 4. `set-claims.ts` — custom claim'larni o'rnatish / tuzatish

```bash
# Joriy claim'larni ko'rish
npx tsx scripts/set-claims.ts --email=st042@uni.uz --show

# O'qituvchiga guruhlar biriktirish
npx tsx scripts/set-claims.ts --email=teacher@uni.uz --role=teacher --groups=iqt-21-01,iqt-21-02 --yes

# Talabani eksperimental guruhga o'tkazish
npx tsx scripts/set-claims.ts --email=st042@uni.uz --exp-group=experimental --code=E-042 --yes

# Guruh va kohortni tuzatish
npx tsx scripts/set-claims.ts --email=st042@uni.uz --group=iqt-21-01 --cohort=2026-27-kuz --yes
```

| Bayroq | Ma'nosi |
|---|---|
| `--email=` | **Majburiy** |
| `--role=` | `student` / `teacher` / `researcher` / `admin` |
| `--group=` | `groupId` claim (talaba) |
| `--groups=` | `groupIds` claim (o'qituvchi) |
| `--exp-group=` | `experimental` / `control` |
| `--code=` | `participantCode`, masalan `E-042` |
| `--cohort=` | Faqat `users` hujjatiga yoziladi |
| `--show` | Faqat ko'rsatadi |
| `--clear` | `role` dan tashqari hamma claim'ni tozalaydi |
| `--dry-run`, `--yes` | |

Claim o'zgargach `users/{uid}` hujjati ham sinxronlanadi.

---

## 5. `generate-items.ts` — AI mashq generatsiyasi

`@/ai/services/exercises` dagi `generateExercises` xizmatini chaqiradi va natijani
`items` kolleksiyasiga **`status: 'draft'`, `source: 'ai'`** bilan yozadi. Draft itemlarni
o'qituvchi Teacher Dashboard → *Content approval* sahifasida tasdiqlaydi
(PLAN 1.5, 7.4 — human-in-the-loop).

Xizmat hali yozilmagan bo'lsa, skript aniq xato xabari bilan to'xtaydi va hech narsa
yozmaydi; `--dry-run` esa xizmatsiz ham matritsani ko'rsatadi.

```bash
# Matritsani ko'rish (AI chaqirilmaydi, pul sarflanmaydi)
npx tsx scripts/generate-items.ts --topic=all --count=8 --dry-run

# Bitta mavzu, 3 daraja, har biriga 6 ta item
npx tsx scripts/generate-items.ts --skill=grammar --topic=passive_voice --difficulty=2,3,4 --count=6 --yes

# 8 mavzu x 5 difficulty x 8 item = 320 item (PLAN 8.2 maqsadi)
npx tsx scripts/generate-items.ts --skill=grammar --topic=all --count=8 --yes

# Lug'at itemlari, bank sohasi
npx tsx scripts/generate-items.ts --skill=vocabulary --topic=vocab_banking --domain=banking --count=10 --yes

# Natijani JSON ga ham saqlash
npx tsx scripts/generate-items.ts --topic=conditionals --count=5 --out-json=./drafts.json --yes
```

| Bayroq | Ma'nosi |
|---|---|
| `--skill=` | `grammar` (default), `vocabulary`, `reading`, ... |
| `--topic=` | Mavzu(lar), vergul bilan; `all` — 8 ta grammatik mavzu |
| `--difficulty=` | `1..5`, vergul bilan (default hammasi) |
| `--count=` | Har (mavzu × difficulty) katak uchun item soni (default 5) |
| `--domain=` | Vergul bilan (default `economics,finance`) |
| `--cefr=` | Majburiy CEFR; berilmasa `difficulty` dan olinadi |
| `--model=` | Boshqa model |
| `--out-json=` | Natijani JSON faylga ham yozish |
| `--dry-run`, `--yes` | |

---

## 6. `build-corpus.ts` — Corpus Verification uchun mini-korpus

`scripts/corpus-src/` dagi `.txt` fayllarni o'qiydi, gaplarga bo'ladi, tokenizatsiya va sodda
(qoidaviy) lemmatizatsiya qiladi, 2/3/4-grammlarni chastota va document frequency bilan
sanaydi, har biriga 3 tagacha misol gap saqlaydi, chegaradan past n-grammlarni tashlaydi va
`corpusNgrams` + `corpusDocs` kolleksiyalariga yozadi.

Hujjat id — n-grammning ekranlangan ko'rinishi (`/` → `~2F`, bo'shliq → `_`, `.` → `~2E`).

Lemmatizatsiya "make / makes / made / making a profit" ni bitta `make a profit` n-grammiga
keltiradi — kollokatsiyani tekshirish uchun aynan shu kerak.

```bash
# Papka va README yaratiladi, statistika ko'rsatiladi
npx tsx scripts/build-corpus.ts --dry-run

# Qurish va yozish
npx tsx scripts/build-corpus.ts --min-count=3 --yes

# Faqat 2- va 3-grammlar, kamroq hajm
npx tsx scripts/build-corpus.ts --n=2,3 --min-count=5 --max-ngrams=80000 --yes

# Natijani JSON ga ham chiqarish (tekshirish uchun)
npx tsx scripts/build-corpus.ts --min-count=3 --out-json=./ngrams.json --dry-run
```

| Bayroq | Ma'nosi |
|---|---|
| `--dir=` | Manba papkasi (default `scripts/corpus-src`) |
| `--min-count=` | Chastota chegarasi (default 3) |
| `--max-ngrams=` | Yoziladigan maksimal n-gramm (default 150000) |
| `--n=` | `2,3,4` (default) |
| `--domain=` | Standart domain (default `economics`) |
| `--out-json=` | JSON nusxa |
| `--dry-run`, `--yes` | |

Fayl nomi domenni bildiradi: `imf-weo-2025_finance.txt` → `domain=finance`.

### 6.1. Tavsiya etilgan ochiq manbalar

`scripts/build-corpus.ts` birinchi ishga tushganda `scripts/corpus-src/README.md` faylini
avtomatik yaratadi. Qisqacha ro'yxat:

| Manba | Nima olinadi | Litsenziya / shart |
|---|---|---|
| **IMF** — World Economic Outlook, Global Financial Stability Report, Article IV | Makroiqtisodiy tahlil, prognoz tili, grafik izohlari | Erkin yuklab olinadi; manbani ko'rsating |
| **World Bank Open Knowledge Repository** | Rivojlanish iqtisodiyoti hisobotlari | Ko'p hujjatlar CC BY 3.0 IGO |
| **ECB** — Economic Bulletin, monetary policy statements | Pul-kredit siyosati, inflyatsiya leksikasi | Manba ko'rsatilgan holda ruxsat |
| **OpenStax** — Principles of Economics / Macroeconomics | Darslik registri, ta'riflar; B1–B2 uchun eng mos | CC BY 4.0 |
| **Wikipedia** — iqtisodiyot / moliya / bank maqolalari | Terminologiya, keng qamrov | CC BY-SA 4.0 |
| **OECD** ochiq hisobotlari | Siyosat tahlili, mehnat bozori, savdo | Ko'p hisobotlar ochiq |
| **Federal Reserve** — FOMC statements, Beige Book | Rasmiy bayonot registri | Public domain |
| **U.S. SEC EDGAR** — 10-K yillik hisobotlar | Korporativ moliya, "annual report" registri | Public domain |
| **UNCTAD / WTO** statistik sharhlari | Xalqaro savdo leksikasi | Ochiq |

PDF dan matnga: `pdftotext -layout -enc UTF-8 file.pdf file.txt`.
Jadval, sahifa raqamlari va kolontitullarni olib tashlang.
**Yopiq litsenziyali darsliklar va pullik ma'lumotlar bazalarini joylashtirmang.**

---

## 7. `export-research.ts` — Excel / CSV / SPSS eksport

`@/lib/export` modulidagi eksportni ishga tushiradi va natijani `scripts/out/<sana>/`
papkasiga yozadi:

```
scripts/out/2027-04-20/
  linguaecon-research.xlsx   # ko'p varaqli workbook + README varag'i
  participants.csv
  attempts_long.csv
  speaking_long.csv
  writing_long.csv
  ai_interactions.csv
  survey_items.csv
  import.sps                 # GET DATA / VARIABLE LABELS / VALUE LABELS / VARIABLE LEVEL
  codebook.md                # o'zgaruvchilar kitobi
```

Agar `@/lib/export` faqat datasetlarni qursa (CSV/Excel/SPSS generatorlarisiz), skript
fayllarni o'zi yozadi. Modul mavjud bo'lmasa — aniq xato bilan to'xtaydi.

```bash
npx tsx scripts/export-research.ts --dry-run
npx tsx scripts/export-research.ts --experiment=exp-2027-spring
npx tsx scripts/export-research.ts --datasets=participants,survey_items --format=csv,sps
npx tsx scripts/export-research.ts --include-events --out=./export
```

| Bayroq | Ma'nosi |
|---|---|
| `--experiment=` | Faqat shu eksperiment ishtirokchilari |
| `--cohort=` | Faqat shu kohort |
| `--datasets=` | Tanlangan datasetlar |
| `--format=` | `xlsx,csv,sps` (default hammasi) |
| `--include-events` | To'liq event log (katta fayl) |
| `--out=` | Chiqish papkasi |
| `--dry-run` | |

**Etika (PLAN 9.4):** eksportda `uid`, ism yoki email bo'lmasligi kerak — faqat
`participantCode`. Skript shunday ustunlarni topsa ogohlantiradi. `scripts/out/` git'ga
tushmaydi.

---

## 8. `_lib.ts` — umumiy yordamchilar

Yangi skript yozganda shu yerdan foydalaning:

| Funksiya | Vazifasi |
|---|---|
| `loadEnv()` | `.env.local` → `process.env` (dotenv paketisiz, `node:fs`) |
| `initAdmin()`, `adminDb()`, `adminAuth()`, `adminBucket()` | Admin SDK |
| `batchWrite(collection, docs, opts)` | 450 tadan bo'lib yozadi (Firestore 500 op limiti), `merge: true` |
| `batchWritePaths(docs, opts)` | To'liq hujjat yo'llari bo'yicha batch yozish |
| `countDocs(collection)` | Count aggregation |
| `parseArgs()` | `--key=value`, `--key value`, `--flag`; `.get/.has/.list/.int` |
| `wantsHelp()`, `showHelp(text)` | `--help` / `-h` |
| `confirm(question, autoYes)`, `ask(question)` | Interaktiv so'rov (TTY bo'lmasa xavfsiz bekor qiladi) |
| `log.*`, `c.*`, `table(headers, rows)` | Rangli o'zbekcha chiqish, jadval |
| `slugify`, `encodeDocId`, `decodeDocId` | Hujjat id lari |
| `participantCode(group, n)`, `generatePassword(n)` | Ishtirokchi kodi, vaqtinchalik parol |
| `chunk`, `isoDate`, `fileStamp`, `runMain`, `fail` | Turli yordamchilar |

**Eslatma:** `tsx` bu loyihada `.ts` fayllarni CommonJS sifatida bajaradi
(`package.json` da `"type": "module"` yo'q), shuning uchun **top-level `await` ishlatib
bo'lmaydi** — `runMain(main)` naqshidan foydalaning.

---

## 9. Xavfsizlik va tadqiqot etikasi

- Skriptlar **Admin SDK** bilan ishlaydi va Firestore/Storage Rules'ni chetlab o'tadi.
  Ularni faqat ishonchli mashinada, to'g'ri loyihaga (`dev` / `prod`) qarab ishga tushiring.
  Har bir skript boshida qaysi Firebase loyihasiga ulanayotgani chop etiladi — **tekshiring**.
- `--dry-run` ni odat qiling: `seed`, `import-users`, `build-corpus` va `generate-items`
  uchun avval quruq ishga tushiring.
- Ochiq parollar (`credentials.csv`) va eksport fayllari (`scripts/out/`) git'ga tushmaydi;
  tarqatgandan keyin o'chiring.
- AI generatsiya qilgan kontent har doim `status: 'draft'` — talabaga faqat o'qituvchi
  tasdiqlagandan keyin ko'rinadi.
- Eksport anonim: faqat `participantCode`. Kod ↔ shaxs mosligi faqat tadqiqotchi sahifasida.
