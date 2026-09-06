/**
 * firebase-bootstrap — haqiqiy Firebase loyihasini sozlash.
 *
 * `firebase login` bajarilgandan keyin CLI orqali avtomatlashtirish mumkin
 * bo'lgan hamma narsani qiladi va faqat konsolda qo'lda bajariladigan
 * qadamlarni ro'yxat qilib beradi.
 *
 * Ishlatish:
 *   npx tsx scripts/firebase-bootstrap.ts --project=linguaecon-dev
 *   npx tsx scripts/firebase-bootstrap.ts --project=linguaecon-prod --create
 *
 * Bayroqlar:
 *   --project=<id>   (majburiy) Firebase loyiha id si
 *   --create         Loyiha mavjud bo'lmasa yaratadi
 *   --location=<id>  Firestore joylashuvi (default: eur3 — Yevropa)
 *   --skip-deploy    Rules/indexes deploy qilinmaydi
 *   --dry-run        Hech narsa o'zgartirilmaydi
 *   --help           Shu yordam
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { c, log, parseArgs, runMain } from './_lib'

const ROOT = path.resolve(__dirname, '..')

function fb(args: string[], opts: { allowFail?: boolean; capture?: boolean } = {}) {
  const result = spawnSync('npx', ['firebase', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: opts.capture ? 'pipe' : 'inherit',
  })
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (result.status !== 0 && !opts.allowFail) {
    throw new Error(`firebase ${args[0]} muvaffaqiyatsiz tugadi.\n${out}`)
  }
  return { ok: result.status === 0, out }
}

/** .env.local ni yangilaydi (mavjud kalitni almashtiradi, yo'q bo'lsa qo'shadi). */
function upsertEnv(pairs: Record<string, string>) {
  const file = path.join(ROOT, '.env.local')
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

  for (const [key, value] of Object.entries(pairs)) {
    const line = `${key}=${value}`
    const re = new RegExp(`^${key}=.*$`, 'm')
    text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
  }
  fs.writeFileSync(file, text.trimStart(), 'utf8')
}

/** Emulyator qatorlarini izohga aylantiradi — haqiqiy loyihaga o'tayotganda. */
function disableEmulatorMode() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return false
  let text = fs.readFileSync(file, 'utf8')
  const keys = [
    'NEXT_PUBLIC_USE_FIREBASE_EMULATOR',
    'FIRESTORE_EMULATOR_HOST',
    'FIREBASE_AUTH_EMULATOR_HOST',
    'FIREBASE_STORAGE_EMULATOR_HOST',
  ]
  let changed = false
  for (const key of keys) {
    const re = new RegExp(`^(${key}=.*)$`, 'm')
    if (re.test(text)) {
      text = text.replace(re, '# $1')
      changed = true
    }
  }
  if (changed) fs.writeFileSync(file, text, 'utf8')
  return changed
}

function printHelp() {
  console.log(`
${c.bold('firebase-bootstrap')} — haqiqiy Firebase loyihasini sozlaydi.

${c.bold('Oldindan:')} npx firebase login

${c.bold('Ishlatish:')}
  npx tsx scripts/firebase-bootstrap.ts --project=<loyiha-id> [--create]

${c.bold('Bayroqlar:')}
  --project=<id>   (majburiy) Firebase loyiha id si
  --create         Loyiha mavjud bo'lmasa yaratadi
  --location=<id>  Firestore joylashuvi (default: eur3)
  --skip-deploy    Rules va indexes deploy qilinmaydi
  --dry-run        Hech narsa o'zgartirilmaydi
  --help           Shu yordam
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has('help')) return printHelp()

  const projectId = args.get('project')
  if (!projectId) {
    log.error('--project=<loyiha-id> majburiy. Yordam: --help')
    process.exitCode = 1
    return
  }

  const dry = args.has('dry-run')
  const location = args.get('location') ?? 'eur3'

  log.title('Firebase bootstrap')
  log.detail(`Loyiha: ${c.bold(projectId)}`)
  log.detail(`Firestore joylashuvi: ${c.bold(location)}`)
  if (dry) log.warn('dry-run — hech narsa o‘zgartirilmaydi')

  /* 1. Autentifikatsiya ---------------------------------------------- */
  const who = fb(['login:list'], { allowFail: true, capture: true })
  if (!who.ok || /No authorized accounts/i.test(who.out)) {
    log.error('Firebase CLI hisobga kirmagan.')
    log.detail('Avval shu buyruqni o‘zingiz bajaring (brauzer ochiladi):')
    console.log(`\n    npx firebase login\n`)
    process.exitCode = 1
    return
  }
  log.ok('Firebase CLI autentifikatsiya qilingan.')

  /* 2. Loyiha mavjudmi ------------------------------------------------ */
  const list = fb(['projects:list'], { allowFail: true, capture: true })
  const exists = list.out.includes(projectId)

  if (!exists) {
    if (!args.has('create')) {
      log.error(`"${projectId}" loyihasi topilmadi.`)
      log.detail('Yaratish uchun --create bering yoki konsolda qo‘lda yarating.')
      process.exitCode = 1
      return
    }
    if (dry) {
      log.warn(`[dry-run] loyiha yaratilar edi: ${projectId}`)
    } else {
      log.step('Loyiha yaratilmoqda...')
      fb(['projects:create', projectId, '--display-name', 'LinguaEcon AI'])
      log.ok('Loyiha yaratildi.')
    }
  } else {
    log.ok('Loyiha mavjud.')
  }

  /* 3. Firestore bazasi ----------------------------------------------- */
  if (!dry) {
    log.step('Firestore bazasi tekshirilmoqda...')
    const db = fb(
      ['firestore:databases:create', '(default)', '--location', location, '--project', projectId],
      { allowFail: true, capture: true }
    )
    if (db.ok) log.ok(`Firestore bazasi yaratildi (${location}).`)
    else if (/already exists|ALREADY_EXISTS/i.test(db.out)) log.ok('Firestore bazasi allaqachon bor.')
    else {
      log.warn('Firestore bazasini CLI yarata olmadi — konsolda qo‘lda yarating.')
      log.detail(db.out.split('\n').slice(-3).join(' ').trim())
    }
  }

  /* 4. Web ilova va SDK konfiguratsiyasi ------------------------------ */
  if (!dry) {
    log.step('Web ilova konfiguratsiyasi olinmoqda...')
    let cfg = fb(['apps:sdkconfig', 'web', '--project', projectId, '--json'], {
      allowFail: true,
      capture: true,
    })

    if (!cfg.ok || !cfg.out.includes('apiKey')) {
      log.detail('Web ilova topilmadi — yaratilmoqda...')
      fb(['apps:create', 'web', 'LinguaEcon Web', '--project', projectId], { allowFail: true })
      cfg = fb(['apps:sdkconfig', 'web', '--project', projectId, '--json'], {
        allowFail: true,
        capture: true,
      })
    }

    const match = cfg.out.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        const sdk = parsed?.result?.sdkConfig ?? parsed?.sdkConfig ?? parsed
        if (sdk?.apiKey) {
          upsertEnv({
            NEXT_PUBLIC_FIREBASE_API_KEY: sdk.apiKey,
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: sdk.authDomain ?? `${projectId}.firebaseapp.com`,
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: sdk.projectId ?? projectId,
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
              sdk.storageBucket ?? `${projectId}.firebasestorage.app`,
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: sdk.messagingSenderId ?? '',
            NEXT_PUBLIC_FIREBASE_APP_ID: sdk.appId ?? '',
          })
          log.ok('.env.local ga NEXT_PUBLIC_FIREBASE_* qiymatlari yozildi.')
        } else {
          log.warn('SDK konfiguratsiyasi tushunarsiz — .env.local ni qo‘lda to‘ldiring.')
        }
      } catch {
        log.warn('SDK konfiguratsiyasini o‘qib bo‘lmadi — .env.local ni qo‘lda to‘ldiring.')
      }
    } else {
      log.warn('Web ilova konfiguratsiyasi olinmadi — konsolda ilova qo‘shing.')
    }

    if (disableEmulatorMode()) {
      log.ok('Emulyator rejimi .env.local da izohga o‘tkazildi.')
    }
  }

  /* 5. Rules va indekslar --------------------------------------------- */
  if (!args.has('skip-deploy') && !dry) {
    log.step('Rules va indekslar deploy qilinmoqda...')
    const deployed = fb(
      ['deploy', '--only', 'firestore:rules,firestore:indexes,storage', '--project', projectId],
      { allowFail: true, capture: true }
    )
    if (deployed.ok) log.ok('Firestore rules, indekslar va Storage rules deploy qilindi.')
    else {
      log.warn('Deploy muvaffaqiyatsiz — quyidagi sabab bo‘lishi mumkin:')
      log.detail('Storage bucket yaratilmagan yoki Blaze rejasi yoqilmagan.')
      log.detail(deployed.out.split('\n').slice(-4).join(' ').trim())
    }
  }

  /* 6. Qo'lda bajariladigan qadamlar ---------------------------------- */
  log.title('Qo‘lda bajariladigan qadamlar')
  const console_ = `https://console.firebase.google.com/project/${projectId}`
  console.log(`
  ${c.bold('1) Blaze rejasi')}
     ${console_}/usage/details
     Cloud Functions va tashqi tarmoq (Claude, Azure) uchun majburiy.

  ${c.bold('2) Authentication')}
     ${console_}/authentication/providers
     Email/Password ni yoqing. Google — ixtiyoriy.

  ${c.bold('3) Storage')}
     ${console_}/storage
     Bucket yarating (Firestore bilan bir xil regionda).

  ${c.bold('4) Service account (server uchun)')}
     ${console_}/settings/serviceaccounts/adminsdk
     "Generate new private key" → JSON yuklab oling, so‘ng:

       node -e "console.log(require('fs').readFileSync('serviceAccount.json','base64'))"

     Natijani .env.local ga FIREBASE_SERVICE_ACCOUNT_BASE64= qatoriga qo‘ying.

  ${c.bold('5) AI kalitlari')}
     ANTHROPIC_API_KEY  — console.anthropic.com
     AZURE_SPEECH_KEY / AZURE_SPEECH_REGION — portal.azure.com

  ${c.bold('6) Keyin:')}
       pnpm seed --yes
       npx tsx scripts/create-admin.ts --email=... --name="..."
       pnpm build
`)

  log.ok('Bootstrap yakunlandi.')
}

runMain(main)
