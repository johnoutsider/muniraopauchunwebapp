/**
 * scripts/set-claims.ts — foydalanuvchining custom claim'larini o'rnatadi yoki tuzatadi.
 *
 *   npx tsx scripts/set-claims.ts --email=student@uni.uz --role=student --group=g-eco-1a --exp-group=experimental
 *
 * Custom claim'lar middleware va Firestore Rules'da rol tekshiruvi uchun ishlatiladi
 * (PLAN 2-bo'lim): `role`, `groupId`, `groupIds`, `expGroup`, `participantCode`.
 */

import {
  adminAuth,
  adminDb,
  c,
  confirm,
  log,
  parseArgs,
  projectId,
  runMain,
  showHelp,
  table,
  wantsHelp,
} from './_lib'
import {
  COL,
  EXPERIMENT_GROUPS,
  ROLES,
  type ExperimentGroup,
  type Role,
} from '@/config/constants'

const HELP = `
${c.bold('set-claims')} — foydalanuvchi custom claim'larini o'rnatadi/tuzatadi (email bo'yicha).

${c.bold('Ishlatish:')}
  npx tsx scripts/set-claims.ts --email=<email> [bayroqlar]

${c.bold('Bayroqlar:')}
  --email=<email>            ${c.gray('(majburiy) Kimga')}
  --role=<rol>               ${c.gray(`${ROLES.join(' | ')}`)}
  --group=<groupId>          ${c.gray('Talaba guruhi (groupId claim + users hujjati)')}
  --groups=<id1,id2>         ${c.gray("O'qituvchi guruhlari (groupIds claim)")}
  --exp-group=<turi>         ${c.gray(EXPERIMENT_GROUPS.join(' | '))}
  --code=<E-042>             ${c.gray('participantCode')}
  --cohort=<cohortId>        ${c.gray('cohortId (faqat users hujjatiga yoziladi)')}
  --show                     ${c.gray("Faqat joriy claim'larni ko'rsatadi, hech narsa o'zgartirmaydi")}
  --clear                    ${c.gray("Barcha claim'larni tozalaydi (role dan tashqari)")}
  --dry-run                  ${c.gray("O'zgarishlarni ko'rsatadi, yozmaydi")}
  --yes                      ${c.gray("Tasdiqlashni o'tkazib yuboradi")}
  --help                     ${c.gray('Shu yordam')}

${c.bold('Misollar:')}
  ${c.gray('# Rolni tuzatish')}
  npx tsx scripts/set-claims.ts --email=teacher@uni.uz --role=teacher --groups=g-eco-1a,g-eco-1b

  ${c.gray('# Talabani eksperimental guruhga o‘tkazish')}
  npx tsx scripts/set-claims.ts --email=st042@uni.uz --exp-group=experimental --code=E-042

  ${c.gray('# Joriy holatni ko‘rish')}
  npx tsx scripts/set-claims.ts --email=st042@uni.uz --show

${c.yellow('Eslatma:')} yangi claim faqat foydalanuvchi tokeni yangilangach kuchga kiradi
(tizimdan chiqib qayta kirish yoki ~1 soat).
`

async function main(): Promise<void> {
  if (wantsHelp()) showHelp(HELP)

  const args = parseArgs()
  const email = args.get('email')?.trim().toLowerCase()
  if (!email) throw new Error('--email berilishi shart. Yordam: --help')

  const dryRun = args.has('dry-run')

  log.title("Custom claim'lar")
  log.detail(`Loyiha: ${projectId()}`)

  const auth = adminAuth()
  const user = await auth.getUserByEmail(email)
  const current = (user.customClaims ?? {}) as Record<string, unknown>

  log.blank()
  log.info(`Foydalanuvchi: ${c.bold(user.displayName ?? email)} (${user.uid})`)
  log.info("Joriy claim'lar:")
  const currentRows = Object.entries(current).map(([k, v]) => [k, JSON.stringify(v)])
  if (currentRows.length) table(['claim', 'qiymat'], currentRows)
  else log.detail("(bo'sh)")

  if (args.has('show')) return

  // Yangi claim'larni yig'ish
  const next: Record<string, unknown> = args.has('clear')
    ? { role: current.role }
    : { ...current }

  const role = args.get('role') as Role | undefined
  if (role) {
    if (!ROLES.includes(role)) throw new Error(`Nomaʻlum rol: ${role} (${ROLES.join(', ')})`)
    next.role = role
  }

  const groupId = args.get('group')
  if (groupId) next.groupId = groupId

  const groupIds = args.list('groups')
  if (groupIds) next.groupIds = groupIds

  const expGroup = args.get('exp-group') as ExperimentGroup | undefined
  if (expGroup) {
    if (!EXPERIMENT_GROUPS.includes(expGroup)) {
      throw new Error(`Nomaʻlum eksperiment guruhi: ${expGroup} (${EXPERIMENT_GROUPS.join(', ')})`)
    }
    next.expGroup = expGroup
  }

  const code = args.get('code')
  if (code) next.participantCode = code

  const cohortId = args.get('cohort')

  const changed = JSON.stringify(next) !== JSON.stringify(current)
  if (!changed && !cohortId) {
    log.ok("O'zgarish yo'q — hech narsa yozilmadi.")
    return
  }

  log.blank()
  log.info("Yangi claim'lar:")
  table(
    ['claim', 'qiymat'],
    Object.entries(next).map(([k, v]) => [k, JSON.stringify(v)])
  )

  if (dryRun) {
    log.dry(`setCustomUserClaims(${user.uid}, ...)`)
    log.dry(`${COL.users}/${user.uid} yangilanar edi`)
    log.ok("Dry-run tugadi — hech narsa o'zgartirilmadi.")
    return
  }

  if (!(await confirm("Claim'lar o'rnatilsinmi?", args.has('yes')))) {
    log.warn('Bekor qilindi.')
    return
  }

  await auth.setCustomUserClaims(user.uid, next)
  log.ok("Custom claim'lar o'rnatildi.")

  // users/{uid} hujjatini ham sinxronlaymiz
  const userPatch: Record<string, unknown> = {}
  if (next.role) userPatch.role = next.role
  if (next.groupId) userPatch.groupId = next.groupId
  if (next.groupIds) userPatch.groupIds = next.groupIds
  if (next.expGroup) userPatch.expGroup = next.expGroup
  if (next.participantCode) userPatch.participantCode = next.participantCode
  if (cohortId) userPatch.cohortId = cohortId

  if (Object.keys(userPatch).length) {
    await adminDb().collection(COL.users).doc(user.uid).set(userPatch, { merge: true })
    log.ok(`${COL.users}/${user.uid} yangilandi.`)
  }

  log.blank()
  log.warn('Foydalanuvchi tizimdan chiqib qayta kirsin — token yangilanishi kerak.')
}

runMain(main)
