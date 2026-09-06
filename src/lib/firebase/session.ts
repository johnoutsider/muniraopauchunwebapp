import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { adminAuth, adminDb } from './admin'
import { COL, ROLE_HOME, type Role } from '@/config/constants'
import type { SessionUser, UserDoc } from '@/types'

export const SESSION_COOKIE = 'le_session'
const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000 // 5 kun

/** Firebase ID token → sessiya cookie (httpOnly). Login server action'dan chaqiriladi. */
export async function createSession(idToken: string): Promise<void> {
  const auth = adminAuth()
  const decoded = await auth.verifyIdToken(idToken, true)
  // Yangi login: token 5 daqiqadan eski bo'lmasligi kerak
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
    throw new Error('Sessiya eskirgan, qaytadan kiring.')
  }
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  })
  const store = await cookies()
  store.set(SESSION_COOKIE, sessionCookie, {
    maxAge: SESSION_MAX_AGE_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  store.delete(SESSION_COOKIE)
  if (value) {
    try {
      const decoded = await adminAuth().verifySessionCookie(value)
      await adminAuth().revokeRefreshTokens(decoded.sub)
    } catch {
      // cookie yaroqsiz — e'tiborsiz qoldiriladi
    }
  }
}

/**
 * Joriy foydalanuvchi. Har so'rov ichida keshlanadi (React cache).
 * Rol va guruh ma'lumoti custom claims'dan olinadi, yetishmasa Firestore'dan.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies()
  const cookie = store.get(SESSION_COOKIE)?.value
  if (!cookie) return null

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true)
    const claims = decoded as Record<string, unknown>

    let role = claims.role as Role | undefined
    let groupId = claims.groupId as string | undefined
    let expGroup = claims.expGroup as SessionUser['expGroup']
    let participantCode = claims.participantCode as string | undefined
    let groupIds = claims.groupIds as string[] | undefined
    let displayName = (decoded.name as string) ?? ''
    let locale: SessionUser['locale'] = 'uz'

    if (!role) {
      const snap = await adminDb().collection(COL.users).doc(decoded.uid).get()
      const data = snap.data() as UserDoc | undefined
      role = data?.role ?? 'student'
      groupId = data?.groupId
      groupIds = data?.groupIds
      expGroup = data?.expGroup
      participantCode = data?.participantCode
      displayName = data?.displayName ?? displayName
      locale = data?.locale ?? 'uz'
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName,
      role,
      groupId,
      groupIds,
      expGroup,
      participantCode,
      locale,
      photoURL: decoded.picture as string | undefined,
    }
  } catch {
    return null
  }
})

/** Rolga qarab himoyalangan sahifalar uchun. */
export async function requireUser(allowed?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (allowed && !allowed.includes(user.role)) redirect(ROLE_HOME[user.role])
  return user
}

/** Talaba uchun: consent va onboarding tugallanganini tekshiradi. */
export async function requireStudent(): Promise<SessionUser> {
  const user = await requireUser(['student'])
  const snap = await adminDb().collection(COL.users).doc(user.uid).get()
  const data = snap.data() as UserDoc | undefined
  if (!data?.consentGiven) redirect('/consent')
  if (!data?.onboarding?.completedAt) redirect('/onboarding')
  return user
}

/** API route'lar uchun: foydalanuvchini qaytaradi yoki null. */
export async function getApiUser(): Promise<SessionUser | null> {
  return getSessionUser()
}

/** Custom claims'ni yangilash (admin amallari). */
export async function setUserClaims(
  uid: string,
  claims: {
    role?: Role
    groupId?: string
    groupIds?: string[]
    expGroup?: string
    participantCode?: string
  }
): Promise<void> {
  const auth = adminAuth()
  const user = await auth.getUser(uid)
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), ...claims })
}
