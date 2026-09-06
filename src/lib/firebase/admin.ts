import 'server-only'

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

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
