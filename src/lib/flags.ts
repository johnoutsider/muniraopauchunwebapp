import 'server-only'

import { cache } from 'react'

import { adminDb } from './firebase/admin'
import { COL } from '@/config/constants'
import {
  CONTROL_GROUP_FLAGS,
  EXPERIMENTAL_GROUP_FLAGS,
  type FeatureFlags,
  type GlobalSettingsDoc,
  type GroupDoc,
  type SessionUser,
} from '@/types'

/**
 * Feature flags — eksperiment dizayni uchun markaziy nuqta (PLAN 1.5).
 * Nazorat guruhida AI bilan bog'liq hamma narsa SERVERDA o'chiriladi:
 * mos komponentlar umuman render qilinmaydi va API route'lar 403 qaytaradi.
 */
export const resolveFlags = cache(async (user: SessionUser | null): Promise<FeatureFlags> => {
  // O'qituvchi/tadqiqotchi/admin uchun hamma narsa ochiq (ular kontentni ko'radi)
  if (!user) return CONTROL_GROUP_FLAGS
  if (user.role !== 'student') return EXPERIMENTAL_GROUP_FLAGS

  const base: FeatureFlags =
    user.expGroup === 'control' ? { ...CONTROL_GROUP_FLAGS } : { ...EXPERIMENTAL_GROUP_FLAGS }

  const db = adminDb()
  const [groupSnap, globalSnap] = await Promise.all([
    user.groupId ? db.collection(COL.groups).doc(user.groupId).get() : Promise.resolve(null),
    db.collection(COL.settings).doc('global').get(),
  ])

  const groupFlags = (groupSnap?.data() as GroupDoc | undefined)?.featureFlags
  const globalFlags = (globalSnap.data() as GlobalSettingsDoc | undefined)?.featureFlags

  return { ...base, ...(groupFlags ?? {}), ...(globalFlags ?? {}) }
})

/** Server komponent/action ichida: flag yoqilganini talab qiladi. */
export async function assertFlag(user: SessionUser | null, flag: keyof FeatureFlags) {
  const flags = await resolveFlags(user)
  if (!flags[flag]) {
    throw new Error(`Bu imkoniyat sizning guruhingiz uchun yoqilmagan (${flag}).`)
  }
  return flags
}

/** API route'lar uchun: 403 javob qaytarish oson bo'lsin. */
export async function checkFlag(
  user: SessionUser | null,
  flag: keyof FeatureFlags
): Promise<boolean> {
  const flags = await resolveFlags(user)
  return Boolean(flags[flag])
}

export const getGlobalSettings = cache(async (): Promise<GlobalSettingsDoc | null> => {
  const snap = await adminDb().collection(COL.settings).doc('global').get()
  return (snap.data() as GlobalSettingsDoc | undefined) ?? null
})
