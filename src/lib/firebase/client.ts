'use client'

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * Lokal Firebase Emulator Suite rejimi (haqiqiy loyihasiz ishlash uchun).
 * Faqat localhost da ishlaydi: bayroq tasodifan Vercel ga ko'chib qolsa ham,
 * brauzer haqiqiy Firebase ga ulanaveradi (127.0.0.1:9099 ga emas).
 */
function onLocalhost(): boolean {
  if (typeof window === 'undefined') return process.env.NODE_ENV !== 'production'
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')
}

export const USE_EMULATOR =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === '1' && onLocalhost()

const EMULATOR_HOST = process.env.NEXT_PUBLIC_EMULATOR_HOST ?? '127.0.0.1'
const EMULATOR_PORTS = { auth: 9099, firestore: 8080, storage: 9199 } as const

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

let _auth: Auth | null = null
let _db: Firestore | null = null
let _storage: FirebaseStorage | null = null

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp())
    if (USE_EMULATOR) {
      connectAuthEmulator(_auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, {
        disableWarnings: true,
      })
    }
  }
  return _auth
}

export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp())
    if (USE_EMULATOR) {
      connectFirestoreEmulator(_db, EMULATOR_HOST, EMULATOR_PORTS.firestore)
    }
  }
  return _db
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp())
    if (USE_EMULATOR) {
      connectStorageEmulator(_storage, EMULATOR_HOST, EMULATOR_PORTS.storage)
    }
  }
  return _storage
}

/** App Check — faqat brauzerda, kalit mavjud bo'lsa va emulyator rejimi o'chiq bo'lsa. */
export async function initAppCheck() {
  if (typeof window === 'undefined' || USE_EMULATOR) return
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY
  if (!siteKey) return
  try {
    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check')
    initializeAppCheck(getFirebaseApp(), {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } catch {
    // App Check ixtiyoriy — xatolik ilovani to'xtatmaydi
  }
}
