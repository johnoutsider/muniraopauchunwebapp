import 'server-only'

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

/**
 * Emulyator rejimi: Firestore/Auth/Storage emulyatorlari ishlaganda
 * Admin SDK'ga haqiqiy service account kerak emas — faqat projectId yetarli.
 */
const EMULATOR_ENV_KEYS = [
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
] as const

/**
 * Ishlab chiqarishda (Vercel yoki NODE_ENV=production) emulyator o'zgaruvchilari
 * har doim xato sozlama — ular tasodifan `.env.local` dan ko'chib qolgan bo'ladi.
 * Admin SDK ularni to'g'ridan-to'g'ri process.env dan o'qiydi va 127.0.0.1 ga
 * ulanmoqchi bo'lib ECONNREFUSED beradi. Shuning uchun ularni olib tashlaymiz
 * va bir marta ogohlantiramiz.
 */
function stripEmulatorEnvInProduction(): void {
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  if (!isProduction) return
  const found = EMULATOR_ENV_KEYS.filter((key) => process.env[key])
  if (!found.length) return
  for (const key of found) delete process.env[key]
  console.warn(
    `[firebase/admin] Ishlab chiqarish muhitida emulyator o‘zgaruvchilari e’tiborsiz qoldirildi: ${found.join(', ')}. Ularni Vercel Environment Variables dan o‘chiring.`
  )
}

// Modul yuklanishida ham bir marta — SDK o'zgaruvchilarni o'qishidan oldin.
stripEmulatorEnvInProduction()

function usingEmulators(): boolean {
  stripEmulatorEnvInProduction()
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST)
}

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (b64) {
    const json = Buffer.from(b64, 'base64').toString('utf8')
    return JSON.parse(json)
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) return JSON.parse(raw)
  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_BASE64 topilmadi. .env.local faylini to‘ldiring (docs/SETUP.md).'
  )
}

let _app: App | null = null

export function adminApp(): App {
  if (_app) return _app
  const existing = getApps()
  if (existing.length) {
    _app = existing[0]
    return _app
  }
  if (usingEmulators()) {
    const projectId =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.GCLOUD_PROJECT ??
      'linguaecon-dev'
    _app = initializeApp({
      projectId,
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
    })
    return _app
  }

  const sa = loadServiceAccount()
  _app = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: (sa.private_key as string).replace(/\\n/g, '\n'),
    }),
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${sa.project_id}.firebasestorage.app`,
  })
  return _app
}

let _db: Firestore | null = null

export function adminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(adminApp())
    try {
      _db.settings({ ignoreUndefinedProperties: true })
    } catch {
      // settings faqat bir marta chaqiriladi
    }
  }
  return _db
}

export function adminAuth(): Auth {
  return getAuth(adminApp())
}

export function adminBucket() {
  return getStorage(adminApp()).bucket()
}

export { FieldValue, Timestamp } from 'firebase-admin/firestore'
