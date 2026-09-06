/**
 * enable-apis — loyihada kerakli Google Cloud API larni yoqadi.
 *
 * Firebase CLI da API yoqish buyrug'i yo'q, gcloud esa o'rnatilmagan bo'lishi
 * mumkin. Shuning uchun CLI ning o'z refresh tokeni bilan Service Usage API ga
 * murojaat qilamiz — bu foydalanuvchi allaqachon `firebase login` orqali bergan
 * ruxsatning o'zi, yangi ruxsat so'ralmaydi.
 *
 * Ishlatish:
 *   npx tsx scripts/enable-apis.ts --project=<loyiha-id>
 *   npx tsx scripts/enable-apis.ts --project=<id> --api=firestore.googleapis.com
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { c, log, parseArgs, runMain } from './_lib'

/** firebase-tools ning ochiq OAuth mijozi (paket ichida ochiq holda keladi). */
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

/** Platforma ishlashi uchun zarur API lar. */
const DEFAULT_APIS = [
  'firestore.googleapis.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'identitytoolkit.googleapis.com',
  'firebaserules.googleapis.com',
  'serviceusage.googleapis.com',
]

function readRefreshToken(): string {
  const file = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json')
  if (!fs.existsSync(file)) {
    throw new Error('Firebase CLI konfiguratsiyasi topilmadi. Avval: npx firebase login')
  }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const token = json?.tokens?.refresh_token
  if (!token) throw new Error('Refresh token topilmadi. Qayta kiring: npx firebase login --reauth')
  return token as string
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const json = (await response.json()) as { access_token?: string; error_description?: string }
  if (!json.access_token) {
    throw new Error(`Access token olinmadi: ${json.error_description ?? 'noma’lum xato'}`)
  }
  return json.access_token
}

async function isEnabled(project: string, api: string, token: string): Promise<boolean> {
  const url = `https://serviceusage.googleapis.com/v1/projects/${project}/services/${api}`
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
  if (!response.ok) return false
  const json = (await response.json()) as { state?: string }
  return json.state === 'ENABLED'
}

async function enable(project: string, api: string, token: string): Promise<string> {
  const url = `https://serviceusage.googleapis.com/v1/projects/${project}/services/${api}:enable`
  const response = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{}',
  })
  const json = (await response.json()) as { error?: { message?: string }; done?: boolean }
  if (json.error) return `xato: ${json.error.message ?? 'noma’lum'}`
  return json.done ? 'yoqildi' : 'yoqilmoqda'
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const project = args.get('project')
  if (!project) {
    log.error('--project=<loyiha-id> majburiy.')
    process.exitCode = 1
    return
  }

  const apis = args.list('api') ?? DEFAULT_APIS

  log.title('Google Cloud API larni yoqish')
  log.detail(`Loyiha: ${c.bold(project)}`)

  const token = await getAccessToken(readRefreshToken())
  log.ok('Access token olindi.')

  for (const api of apis) {
    if (await isEnabled(project, api, token)) {
      log.ok(`${api} — allaqachon yoqilgan`)
      continue
    }
    log.step(`${api} yoqilmoqda...`)
    const result = await enable(project, api, token)
    if (result.startsWith('xato')) log.warn(`${api} — ${result}`)
    else log.ok(`${api} — ${result}`)
  }

  log.blank()
  log.info('API yoqilgandan keyin bir-ikki daqiqa tarqalish vaqti kerak bo‘lishi mumkin.')
}

runMain(main)
