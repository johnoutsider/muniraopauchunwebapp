/**
 * scripts/create-admin.ts — birinchi administrator hisobini yaratadi.
 *
 *   npx tsx scripts/create-admin.ts --email=admin@uzdjtu.uz --name="Munirakhon M." --password='Str0ngPass!'
 *
 * Nima qiladi:
 *   1. Firebase Auth'da foydalanuvchi yaratadi (yoki mavjudini topadi);
 *   2. `role: 'admin'` custom claim o'rnatadi;
 *   3. `users/{uid}` hujjatini yozadi (merge).
 */

import {
  adminAuth,
  adminDb,
  ask,
  c,
  confirm,
  FieldValue,
  generatePassword,
  log,
  parseArgs,
  projectId,
  runMain,
  showHelp,
  wantsHelp,
} from './_lib'
import { COL, ROLES, type Role } from '@/config/constants'

const HELP = `
${c.bold('create-admin')} — birinchi administrator (yoki teacher/researcher) hisobini yaratadi.

${c.bold('Ishlatish:')}
  npx tsx scripts/create-admin.ts --email=<email> --name="<F.I.Sh.>" [--password=<parol>]

${c.bold('Bayroqlar:')}
  --email=<email>        ${c.gray('(majburiy) Foydalanuvchi elektron pochtasi')}
  --name="<ism>"         ${c.gray('(majburiy) To‘liq ism (displayName)')}
  --password=<parol>     ${c.gray('Parol (kamida 8 belgi). Berilmasa avtomatik generatsiya qilinadi')}
  --role=<rol>           ${c.gray(`Rol: ${ROLES.join(' | ')} (default: admin)`)}
  --locale=<uz|en|ru>    ${c.gray("Interfeys tili (default: uz)")}
  --university="<nom>"   ${c.gray('Universitet nomi (ixtiyoriy)')}
  --dry-run              ${c.gray('Hech narsa yozilmaydi, faqat rejani ko‘rsatadi')}
  --yes                  ${c.gray('Tasdiqlash so‘rovini o‘tkazib yuboradi')}
  --help                 ${c.gray('Shu yordam')}

${c.bold('Misol:')}
  npx tsx scripts/create-admin.ts \\
    --email=admin@linguaecon.uz --name="Munirakhon Mukhitdinova" --password='LinguaEcon2027!'

${c.yellow('Eslatma:')} parolni terminal tarixida qoldirmaslik uchun --password ni tashlab keting —
skript xavfsiz parol generatsiya qilib, uni bir marta ekranga chiqaradi.
`

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const dryRun = args.has('dry-run')

  log.title('Administrator yaratish')
  log.detail(`Loyiha: ${projectId()}`)

  const email = (args.get('email') ?? (await ask('Email:'))).trim().toLowerCase()
  const name = (args.get('name') ?? (await ask('To‘liq ism:'))).trim()
  const role = (args.get('role') ?? 'admin') as Role
  const locale = (args.get('locale') ?? 'uz') as 'uz' | 'en' | 'ru'
  const university = args.get('university')

  if (!email || !email.includes('@')) {
    throw new Error("To‘g‘ri --email berilishi shart (masalan --email=admin@linguaecon.uz).")
  }
  if (!name) {
    throw new Error('--name (to‘liq ism) berilishi shart.')
  }
  if (!ROLES.includes(role)) {
    throw new Error(`Nomaʻlum rol: ${role}. Ruxsat etilganlar: ${ROLES.join(', ')}`)
  }

  const generated = !args.get('password')
  const password = args.get('password') ?? generatePassword(14)
  if (password.length < 8) {
    throw new Error('Parol kamida 8 belgidan iborat bo‘lishi kerak.')
  }

  log.blank()
  log.info(`Email .......... ${c.bold(email)}`)
  log.info(`Ism ............ ${c.bold(name)}`)
  log.info(`Rol ............ ${c.bold(role)}`)
  log.info(`Til ............ ${locale}`)
  if (university) log.info(`Universitet .... ${university}`)
  log.info(`Parol .......... ${generated ? c.yellow('avtomatik generatsiya') : c.gray('berilgan')}`)
  log.blank()

  if (dryRun) {
    log.dry(`Auth foydalanuvchi yaratilar edi: ${email}`)
    log.dry(`Custom claim: { role: "${role}" }`)
    log.dry(`Firestore: ${COL.users}/{uid}`)
    log.ok('Dry-run tugadi — hech narsa o‘zgartirilmadi.')
    return
  }

  if (!(await confirm(`${role} hisobi yaratilsinmi?`, args.has('yes')))) {
    log.warn('Bekor qilindi.')
    return
  }

  const auth = adminAuth()
  const db = adminDb()

  // 1. Auth foydalanuvchi
  let uid: string
  let created = false
  try {
    const existing = await auth.getUserByEmail(email)
    uid = existing.uid
    log.warn(`Bu email allaqachon mavjud (uid: ${uid}). Parol va ism yangilanadi.`)
    await auth.updateUser(uid, { displayName: name, password, emailVerified: true })
  } catch (err: unknown) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err
    const user = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    })
    uid = user.uid
    created = true
    log.ok(`Auth foydalanuvchi yaratildi: ${uid}`)
  }

  // 2. Custom claims
  await auth.setCustomUserClaims(uid, { role })
  log.ok(`Custom claim o‘rnatildi: role="${role}"`)

  // 3. users/{uid}
  await db
    .collection(COL.users)
    .doc(uid)
    .set(
      {
        uid,
        email,
        displayName: name,
        role,
        locale,
        university: university ?? null,
        status: 'active',
        consentGiven: true,
        consentAt: FieldValue.serverTimestamp(),
        mustChangePassword: generated,
        totalXp: 0,
        createdAt: FieldValue.serverTimestamp(),
        lastActiveAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  log.ok(`Firestore hujjati yozildi: ${COL.users}/${uid}`)

  log.blank()
  log.title('Tayyor')
  console.log(`  ${c.gray('Email')}  : ${c.bold(email)}`)
  console.log(`  ${c.gray('Parol')}  : ${c.bold(password)}`)
  console.log(`  ${c.gray('UID')}    : ${uid}`)
  console.log(`  ${c.gray('Rol')}    : ${role}`)
  log.blank()
  if (generated) {
    log.warn('Parolni hoziroq xavfsiz joyga ko‘chiring — u boshqa ko‘rsatilmaydi.')
  }
  if (!created) {
    log.warn(
      'Foydalanuvchi avval mavjud edi. Yangi claim kuchga kirishi uchun tizimdan chiqib qayta kiring.'
    )
  }
}

runMain(main)
