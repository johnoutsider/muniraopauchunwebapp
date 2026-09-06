# RESEARCH — eksperimentni o'tkazish qo'llanmasi

Bu hujjat tadqiqotchi uchun: kohortni yaratishdan SPSS'ga eksportgacha
bo'lgan butun yo'l. Har bir qadam platformadagi aniq sahifaga bog'langan.

**Dizayn:** kvazi-eksperimental, ikki guruhli, pre-test / post-test.
**Namuna:** 150–200 talaba (iqtisodiyot yo'nalishi).
**Mustaqil o'zgaruvchi:** AI yordamining mavjudligi (eksperimental) yoki
yo'qligi (nazorat) — bir xil platforma, bir xil kontent, bir xil o'qituvchi.
**Bog'liq o'zgaruvchilar:** 8 ko'nikma bo'yicha ballar, o'sish (gain),
motivatsiya, AI literacy, vaqt sarfi, xatolar dinamikasi.

---

## 1. Eksperiment taqvimi

| Bosqich | Muddat | Nima qilinadi |
|---|---|---|
| Tayyorgarlik | dekabr 2026 | Kohort, guruhlar, testlar, so'rovnomalar, pilot (10–20 talaba) |
| Pre-test hafta | yanvar 2027, 1-hafta | Consent → diagnostika → pre-test → motivatsiya + AI literacy so'rovnomalari |
| O'qitish | 10–12 hafta | Haftasiga 2–3 seans; monitoring; oraliq progress testlar (4 va 8-hafta) |
| Post-test hafta | aprel 2027 | Post-test (pre bilan bir xil struktura, parallel variant) + so'rovnomalar + qoniqish |
| Tahlil | may 2027 | Eksport → SPSS → natijalar |

⚠️ Pre va post testlar **bir xil strukturada, lekin parallel variantlarda**
bo'lishi kerak (`tests` hujjatida `variant: 'A'` / `'B'`). Aynan bir xil test
takrorlansa, o'sish testni eslab qolish hisobiga bo'ladi.

---

## 2. Kohort va guruhlar yaratish

`/researcher/groups` (yoki `/admin/cohorts`)

1. **Kohort:** `2026-27 bahor`, universitet, fakultet, boshlanish/tugash sanasi.
2. **Akademik guruhlar:** har bir real guruh uchun bitta `groups` hujjati.
   - `type: 'experimental'` yoki `'control'`
   - `teacherId`
   - `featureFlags` — tur bo'yicha avtomatik to'ldiriladi

Nazorat guruhi standart flaglari (`CONTROL_GROUP_FLAGS`):

| Flag | Eksperimental | Nazorat |
|---|---|---|
| `aiTutor` | ✓ | ✗ |
| `aiFeedback` | ✓ | ✗ |
| `adaptive` | ✓ | ✗ |
| `pronunciationAI` | ✓ | ✗ |
| `aiRolePlay` | ✓ | ✗ |
| `promptLab` | ✓ | ✗ |
| `corpusVerification` | ✓ | ✗ |
| `semanticNetwork` | ✓ | ✗ |
| `gamification` | ✓ | ✓ |
| `peerAssessment` | ✓ | ✓ |
| `forum` | ✓ | ✓ |

**Muhim:** gamifikatsiya, forum va peer assessment IKKALA guruhda ham yoqilgan.
Faqat AI o'zgaruvchi bo'lishi kerak — aks holda natijani AI ta'siriga bog'lab
bo'lmaydi.

Flaglar **serverda** tekshiriladi (`src/lib/flags.ts`): nazorat guruhi
talabasining brauzerida AI komponentlari umuman render qilinmaydi va tegishli
API route'lar 403 qaytaradi. Ya'ni "DevTools orqali yoqib olish" mumkin emas.

---

## 3. 150–200 talabani import qilish

`/admin/users → Bulk import`

Excel ustunlari:

| Ustun | Majburiy | Misol |
|---|---|---|
| `fullName` | ✓ | Aziza Karimova |
| `email` | ✓ | a.karimova@student.uz |
| `groupName` | ✓ | IQT-201 |
| `gender` | — | f |
| `birthYear` | — | 2005 |

Import quyidagini bajaradi:

1. Firebase Auth hisobi + vaqtinchalik parol
2. `users/{uid}` hujjati (`status: 'active'`, `mustChangePassword: true`)
3. `participantCode` — guruh turiga qarab: eksperimental `E-001…`, nazorat `C-001…`
4. Custom claims: `role`, `groupId`, `expGroup`, `participantCode`
5. `auditLogs` yozuvi

Natija: talabalar ro'yxati + vaqtinchalik parollar CSV sifatida yuklab olinadi.
**Bu faylni tarqatgandan keyin o'chiring.**

Talaba birinchi kirishda: parol o'zgartirish → **informed consent** → onboarding.

---

## 4. Randomizatsiya

`/researcher/experiment → Randomise`

Uch usul:

| Usul | Qachon |
|---|---|
| **Guruh darajasida (cluster)** | ⭐ Tavsiya etiladi. Butun akademik guruh eksperimental yoki nazorat bo'ladi. Talabalar bir xonada o'tirgani uchun "aralashish" (contamination) xavfi kamayadi |
| **Stratifikatsiyalangan individual** | Diagnostika bali bo'yicha kvartillarga bo'lib, har kvartildan tasodifiy yarmi. Guruhlar boshlang'ich daraja bo'yicha muvozanatli bo'ladi |
| **Qo'lda** | Faqat maxsus holatlar uchun |

Randomizatsiya **diagnostika testidan keyin, pre-testdan oldin** bajariladi —
shunda stratifikatsiya uchun ma'lumot bor, lekin natijaga ta'sir qilmaydi.

Randomizatsiya `experiments/{id}` hujjatiga `seed` bilan yoziladi —
qayta ishlab chiqarish mumkin (reproducible).

**Muvozanatni tekshiring:** randomizatsiyadan keyin `/researcher/analytics`
sahifasida ikki guruhning pre-test o'rtachasini solishtiring. Mustaqil t-test
`p > 0.05` bo'lishi kerak (guruhlar boshida farq qilmasin).

---

## 5. Informed consent

Talaba birinchi kirishda `/consent` sahifasini ko'radi (o'zbek/rus tilida).

Sahifa mazmuni:

- Tadqiqot maqsadi va davomiyligi
- Qanday ma'lumot yig'iladi (mashq natijalari, vaqt, AI xabarlari soni, audio yozuvlar)
- Ma'lumot **anonimlashtirilgan** holda tahlil qilinishi
- **Rad etish huquqi:** platformadan to'liq foydalanadi, lekin ma'lumoti
  eksportga kirmaydi
- Istalgan vaqtda roziligini qaytarib olish (`/student/settings`)
- Ma'lumot saqlash muddati va o'chirish so'rovi tartibi
- Aloqa: tadqiqotchi email

Texnik tomoni:

- Rozilik → `users/{uid}.consentGiven = true`, `consentAt = serverTimestamp()`
- `events_*` ga `consent_given` hodisasi
- `consentGiven !== true` bo'lgan talabalar **barcha eksport datasetlaridan
  chiqarib tashlanadi** (`src/lib/export/datasets.ts` filtri)
- Rozilik bermagan talaba platformadan to'liq foydalanadi — bu etik talab

⚠️ Consent matnini universitet etika komissiyasi tasdiqlagan variant bilan
almashtiring. Kodda joylashuvi: `messages/uz.json` → `consent.*`.

---

## 6. Pre-test → o'qitish → post-test

### 6.1. Pre-test haftasi

1. `/researcher/tests` → pre-test yarating (8 bo'lim: vocabulary, grammar,
   listening, reading, writing, speaking, pronunciation, professional).
2. `assignedTo.groupIds` ga barcha guruhlarni qo'shing, `from`/`to` oynasini
   belgilang (masalan 3 kun).
3. Talabalar `/student/assessment/pre-test` da topshiradi.
4. Writing va speaking bo'limlari:
   - Avtomatik: Azure (talaffuz) + rubrika bo'yicha dastlabki ball
   - **O'qituvchi qo'lda tasdiqlaydi** — pre/post ballari qo'lda tekshirilgan
     bo'lishi kerak, aks holda AI baholashi o'zgaruvchiga aylanadi
5. So'rovnomalar: motivatsiya (Likert) + AI literacy → `/student/surveys`

⚠️ **Nazorat guruhi writing/speaking ishlarini ham AI emas, o'qituvchi
baholaydi.** Baholash usuli ikki guruhda bir xil bo'lishi shart.

### 6.2. O'qitish (10–12 hafta)

Har hafta monitoring — `/researcher/dashboard`:

| Ko'rsatkich | Nima ko'rsatadi |
|---|---|
| Faol talabalar / guruh | Tashlab ketish (attrition) |
| O'rtacha vaqt (daqiqa) | Yuklamaning tengligi |
| Urinishlar soni | Faollik |
| AI xabarlari (faqat eksperimental) | Aralashuv "dozasi" |
| Risk darajasi (haftalik prognoz) | Kim ortda qolmoqda |

**Attrition** — asosiy xavf. 20% dan ortiq tashlab ketish natijani buzadi.
Har hafta risk `high` bo'lganlar ro'yxatini o'qituvchiga yuboring.

Oraliq progress testlar 4 va 8-haftalarda — o'sish dinamikasini kuzatish uchun
(faqat ichki, asosiy tahlilga kirmaydi).

### 6.3. Post-test haftasi

1. Post-test — pre-test bilan **bir xil struktura, parallel variant**.
2. So'rovnomalar: motivatsiya (post), AI literacy (post), qoniqish.
3. Writing/speaking — yana o'qituvchi baholaydi. Iloji bo'lsa **ko'r
   baholash** (blind): baholovchi talabaning qaysi guruhda ekanini bilmasin.
4. Barcha topshiriqlar yopilgach: `/researcher/export`.

---

## 7. Yig'iladigan o'zgaruvchilar

| Guruh | O'zgaruvchilar | Manba |
|---|---|---|
| **Natija (asosiy)** | `pre_*`, `post_*`, `gain_*` — 8 ko'nikma bo'yicha (0–100) | `testAttempts` (type `pre`/`post`) |
| **Talaffuz** | accuracy, fluency, completeness, prosody, pronScore | `speakingSubmissions.azure` |
| **Yozish** | rubrika 5 mezon (0–5), draftlar soni, so'zlar soni | `writingSubmissions` |
| **Jarayon** | urinishlar, to'g'ri javoblar ulushi, vaqt (ms), yordamlar, qiyinlik | `attempts` |
| **Xatolar** | 25 tegli taksonomiya bo'yicha hisob va trend | `attempts.errorTags` → `errorProfiles` |
| **AI aralashuvi** | xabarlar soni, tokenlar, rejim, "foydali bo'ldimi" | `aiSessions` + `messages` |
| **Faollik** | kunlik vaqt, faol kunlar, streak, XP, badge'lar | `statsDaily` |
| **So'rovnomalar** | motivatsiya pre/post, AI literacy pre/post, qoniqish | `surveyResponses` |
| **Demografiya** | guruh, kohort (ixtiyoriy: jins, yosh) | `users` |
| **Hodisalar** | 26 tur hodisa, vaqt belgisi bilan | `events_YYYY_MM` |

---

## 8. SPSS uchun eksport

`/researcher/export → SPSS-ready package`

### Paket tarkibi

| Fayl | Nima |
|---|---|
| `participants.csv` | **Wide** format: bir talaba = bir qator. Asosiy tahlil shu yerda |
| `attempts_long.csv` | **Long** format: bir urinish = bir qator |
| `speaking_long.csv` | Bir audio topshiriq = bir qator |
| `writing_long.csv` | Bir yozma ish = bir qator |
| `ai_interactions.csv` | Bir AI sessiya/xabar = bir qator |
| `survey_items.csv` | Bir savol javobi = bir qator (item-level, ishonchlilik tahlili uchun) |
| `codebook.md` | Kodlash kitobi: o'zgaruvchi, yorliq, tip, o'lchov darajasi, qiymat yorliqlari |
| `import.sps` | SPSS sintaksisi: `GET DATA` + `VARIABLE LABELS` + `VALUE LABELS` + `VARIABLE LEVEL` + `SAVE OUTFILE` |

### Import qilish

1. ZIP arxivni yuklab oling va bitta papkaga chiqaring.
2. `import.sps` ni SPSS'da oching.
3. Fayl boshidagi `FILE PATH` o'zgaruvchisini o'z papkangizga moslang.
4. **Run → All**.

Sintaksis quyidagini avtomatik qiladi:

- UTF-8 kodirovka bilan o'qiydi (o'zbekcha yorliqlar buzilmaydi)
- O'zgaruvchi nomlarini SPSS qoidalariga moslaydi (≤ 64 belgi, bo'shliqsiz,
  band kalit so'zlar himoyalangan — `src/lib/export/spss.ts`)
- O'lchov darajasini o'rnatadi: `nominal` / `ordinal` / `scale`
- Qiymat yorliqlarini qo'yadi

### Kodlash konvensiyalari

| O'zgaruvchi | Kod |
|---|---|
| `expGroup` | `1 = experimental`, `2 = control` |
| `correct` | `0 = no`, `1 = yes` |
| Likert | raqamli (1–5 yoki 1–7), teskari savollar **eksportda allaqachon aylantirilgan** |
| Yo'q qiymat | bo'sh katak (SPSS system-missing) |
| Sanalar | ISO 8601 matn (`2027-03-15T09:12:00Z`) |

### Tavsiya etilgan tahlil ketma-ketligi

1. **Muvozanat:** pre-test bo'yicha mustaqil t-test → guruhlar boshida farq qilmasligi kerak
2. **Ichki guruh o'sishi:** paired t-test (pre vs post) har guruh uchun alohida
3. **Guruhlararo farq:** gain bo'yicha mustaqil t-test yoki **ANCOVA**
   (pre-test kovariat sifatida — kuchliroq usul)
4. **Effekt hajmi:** Cohen's d (Cohen 1988: 0.2 kichik, 0.5 o'rta, 0.8 katta)
5. **Normal taqsimot buzilsa:** Mann–Whitney U / Wilcoxon signed-rank
6. **Korrelyatsiya:** AI xabarlari soni ↔ gain (faqat eksperimental guruhda)
7. **So'rovnomalar:** ishonchlilik (Cronbach's α), keyin motivatsiya/AI literacy
   o'zgarishi bo'yicha paired t-test
8. **Ko'p taqqoslash:** 8 ko'nikma bo'yicha alohida test qilsangiz —
   Bonferroni yoki FDR tuzatishi

Platformadagi `/researcher/analytics` sahifasi ham t-test, Cohen's d va
Mann–Whitney beradi — lekin bu **faqat tezkor ko'rish uchun**. Dissertatsiyada
keltiriladigan qiymatlar SPSS'dan olinadi (`src/lib/analytics/stats.ts` dagi
p-qiymat approksimatsiyasi haqidagi izohga qarang).

---

## 9. Anonimlik kafolatlari

| Kafolat | Qanday ta'minlanadi |
|---|---|
| Eksportda **ism, email, uid yo'q** | Faqat `participantCode` (`E-042`, `C-017`). Filtr `src/lib/export/datasets.ts` da |
| Kod ↔ shaxs mosligi | Faqat `/researcher/participants` sahifasida, alohida ko'rinadi va eksport qilinmaydi |
| Chat va DM matnlari | Tadqiqotchi **o'qiy olmaydi** (`firestore.rules`: `chats/*/messages` uchun ruxsat yo'q). Tahlilga faqat xabarlar soni va uzunligi tushadi |
| AI yozishmalari | Xabar matnlari tadqiqotchiga ochiq emas; `ai_interactions.csv` da faqat rejim, tokenlar, "foydali bo'ldimi" |
| Audio yozuvlar | Storage'da `speaking/{uid}/` — faqat egasi, uning o'qituvchisi va admin. Eksportga Azure ballari tushadi, audio fayl emas |
| Rozilik bermaganlar | Barcha datasetlardan chiqarib tashlanadi |
| Eksport auditi | Har eksport `auditLogs` ga yoziladi (kim, qachon, qaysi dataset) |
| Vaqtinchalik havola | Eksport fayli Storage'ga yoziladi va **muddatli signed URL** bilan beriladi |

### Ma'lumotni saqlash va o'chirish

- Eksperiment ma'lumotlari himoyadan keyin **5 yil** saqlanadi (universitet talabi).
- Talaba o'chirish so'rovi bersa: `/admin/users → Delete data` — Auth hisobi va
  `users` hujjati o'chiriladi, `participantCode` bilan bog'liq anonim yozuvlar
  qoladi (ular allaqachon shaxsga bog'lanmaydi).
- Audio yozuvlar tahlil tugagach o'chirilishi mumkin — Azure ballari saqlanib qoladi.

---

## 10. Eksperimentdan oldingi tekshiruv ro'yxati

- [ ] Etika komissiyasi ruxsati olingan, consent matni tasdiqlangan
- [ ] Pre va post testlar tayyor, **parallel variantlar** tekshirilgan
- [ ] So'rovnomalar validatsiya qilingan shkalalardan olingan (manba ko'rsatilgan)
- [ ] Kontent to'liq: ≥ 500 so'z, ≥ 320 grammatika item, 8 dars, 4 case study
- [ ] Barcha AI generatsiya qilgan itemlar o'qituvchi tomonidan tasdiqlangan
- [ ] Nazorat guruhi hisobida AI elementlari **ko'rinmasligi** qo'lda tekshirilgan
- [ ] 10–20 talaba bilan pilot o'tkazilgan, xatolar tuzatilgan
- [ ] Guruhlar randomizatsiya qilingan, muvozanat t-testi `p > 0.05`
- [ ] Byudjet ogohlantirishlari yoqilgan (Firebase, Anthropic, Azure)
- [ ] Zaxira nusxa jadvali ishlayapti (haftalik Firestore eksporti)
- [ ] O'qituvchilar review queue va baholash bo'yicha o'qitilgan
