/**
 * google-auth — Firebase CLI ning refresh tokenidan Google API access tokeni oladi.
 *
 * Nima uchun kerak: Firebase CLI da ba'zi amallar (API yoqish, Authentication
 * provayderini yoqish, Storage bucket yaratish) uchun buyruq yo'q. Ular Google
 * Cloud REST API orqali bajariladi. Yangi ruxsat so'ralmaydi — foydalanuvchi
 * `firebase login` paytida bergan ruxsatning o'zi ishlatiladi.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** firebase-tools ning ochiq OAuth mijozi (paket ichida ochiq keladi). */
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

function credentialFile(): string {
  const candidates = [
    path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json'),
    process.env.APPDATA
      ? path.join(process.env.APPDATA, 'configstore', 'firebase-tools.json')
      : '',
  ].filter(Boolean)

  for (const file of candidates) {
    if (fs.existsSync(file)) return file
  }
  throw new Error('Firebase CLI konfiguratsiyasi topilmadi. Avval: npx firebase login')
}

export function readRefreshToken(): string {
  const json = JSON.parse(fs.readFileSync(credentialFile(), 'utf8'))
  const token = json?.tokens?.refresh_token
  if (!token) {
    throw new Error('Refresh token topilmadi. Qayta kiring: npx firebase login --reauth')
  }
  return token as string
}

let cached: { token: string; expiresAt: number } | null = null

/** Access token (10 daqiqa keshlanadi). */
export async function getCliAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: readRefreshToken(),
      grant_type: 'refresh_token',
    }),
  })

  const json = (await response.json()) as {
    access_token?: string
    expires_in?: number
    error_description?: string
  }
  if (!json.access_token) {
    throw new Error(`Access token olinmadi: ${json.error_description ?? 'noma’lum xato'}`)
  }

  cached = {
    token: json.access_token,
    expiresAt: Date.now() + Math.min((json.expires_in ?? 3600) - 60, 600) * 1000,
  }
  return cached.token
}
