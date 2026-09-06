'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { adminAuth, adminDb, FieldValue } from '@/lib/firebase/admin'
import {
  createSession,
  destroySession,
  getSessionUser,
  setUserClaims,
} from '@/lib/firebase/session'
import { COL, ROLE_HOME } from '@/config/constants'
import { logEvent, touchStreak } from '@/lib/analytics/events'
import type { ActionResult, OnboardingData, UserDoc } from '@/types'

/** Login: klient Firebase Auth bilan kiradi, ID token'ni shu yerga yuboradi. */
export async function loginAction(idToken: string): Promise<ActionResult<{ home: string }>> {
  try {
    await createSession(idToken)
    const user = await getSessionUser()
    if (!user) return { ok: false, error: 'Sessiya yaratilmadi. Qaytadan urinib ko‘ring.' }

    await adminDb()
      .collection(COL.users)
      .doc(user.uid)
      .set({ lastActiveAt: FieldValue.serverTimestamp() }, { merge: true })

    await Promise.all([logEvent(user, 'login', {}), touchStreak(user.uid)])

    return { ok: true, data: { home: ROLE_HOME[user.role] } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kirishda xatolik'
    return { ok: false, error: message }
  }
}

export async function logoutAction(): Promise<void> {
  const user = await getSessionUser()
  if (user) await logEvent(user, 'logout', {})
  await destroySession()
  redirect('/login')
}

/**
 * Ochiq ro'yxatdan o'tish. Yangi hisob "pending" holatda bo'ladi —
 * administrator tasdiqlagandan keyin faollashadi (PLAN 2).
 */
export async function registerAction(input: {
  idToken: string
  displayName: string
  university?: string
  faculty?: string
}): Promise<ActionResult<{ pending: boolean }>> {
  try {
    const decoded = await adminAuth().verifyIdToken(input.idToken, true)
    const ref = adminDb().collection(COL.users).doc(decoded.uid)
    const existing = await ref.get()

    if (existing.exists) {
      return { ok: true, data: { pending: (existing.data() as UserDoc).status === 'pending' } }
    }

    const doc: Partial<UserDoc> = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: input.displayName,
      role: 'student',
      locale: 'uz',
      university: input.university,
      faculty: input.faculty,
      status: 'pending',
      consentGiven: false,
      totalXp: 0,
      createdAt: FieldValue.serverTimestamp() as never,
    }
    await ref.set(doc, { merge: true })
    await setUserClaims(decoded.uid, { role: 'student' })

    return { ok: true, data: { pending: true } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ro‘yxatdan o‘tishda xatolik'
    return { ok: false, error: message }
  }
}

/** Tadqiqotda ishtirok etishga rozilik (informed consent) — PLAN 9.4. */
export async function giveConsentAction(input: {
  agreeParticipation: boolean
  agreeDataUse: boolean
}): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }
  if (!input.agreeParticipation) {
    return { ok: false, error: 'Davom etish uchun ishtirok shartlarini tasdiqlang.' }
  }

  await adminDb().collection(COL.users).doc(user.uid).set(
    {
      consentGiven: true,
      consentAt: FieldValue.serverTimestamp(),
      dataUseConsent: input.agreeDataUse,
    },
    { merge: true }
  )

  await logEvent(user, 'consent_given', { dataUse: input.agreeDataUse })
  revalidatePath('/', 'layout')
  return { ok: true, data: undefined }
}

/** 1-bosqich: maqsad qo'yish va o'quv faoliyatini tashkil etish. */
export async function completeOnboardingAction(
  data: Omit<OnboardingData, 'completedAt'>
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  await adminDb()
    .collection(COL.users)
    .doc(user.uid)
    .set(
      {
        onboarding: { ...data, completedAt: FieldValue.serverTimestamp() },
      },
      { merge: true }
    )

  await logEvent(user, 'onboarding_complete', {
    goal: data.goal,
    track: data.professionalTrack,
    targetSkills: data.targetSkills,
  })

  revalidatePath('/', 'layout')
  return { ok: true, data: undefined }
}

/** Profil sozlamalari. */
export async function updateProfileAction(input: {
  displayName?: string
  locale?: 'uz' | 'en' | 'ru'
}): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const patch: Record<string, unknown> = {}
  if (input.displayName?.trim()) patch.displayName = input.displayName.trim().slice(0, 80)
  if (input.locale) patch.locale = input.locale
  if (!Object.keys(patch).length) return { ok: true, data: undefined }

  await adminDb().collection(COL.users).doc(user.uid).set(patch, { merge: true })
  revalidatePath('/', 'layout')
  return { ok: true, data: undefined }
}
