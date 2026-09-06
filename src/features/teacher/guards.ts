import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { requireUser } from '@/lib/firebase/session'
import { serialize } from '@/lib/utils/format'
import type { GroupDoc, SessionUser, UserDoc, WithId } from '@/types'

/**
 * O'qituvchi avtorizatsiyasi — MARKAZIY NUQTA (PLAN 10-bo'lim).
 *
 * Qoida: o'qituvchi FAQAT o'zining `groupIds` ro'yxatidagi guruhlar va
 * ulardagi talabalarni ko'ra va o'zgartira oladi. Route parametriga
 * (`[groupId]`, `[uid]`) hech qachon ishonilmaydi — har bir so'rov va har bir
 * server action serverda qaytadan tekshiriladi.
 *
 * Ruxsat manbai custom claim emas, balki Firestore'dagi `users/{uid}` hujjati:
 * claim eskirgan bo'lishi mumkin, hujjat esa administrator o'zgartirishi bilan
 * darhol yangilanadi.
 */

export class TeacherAccessError extends Error {
  readonly code = 'forbidden'

  constructor(message = 'Bu guruh sizga biriktirilmagan.') {
    super(message)
    this.name = 'TeacherAccessError'
  }
}

/** Sahifa/action boshida: rol tekshiruvi. */
export async function requireTeacher(): Promise<SessionUser> {
  return requireUser(['teacher', 'admin'])
}

/**
 * O'qituvchiga biriktirilgan guruh id'lari.
 * Manba: `users/{uid}.groupIds` + `users/{uid}.groupId` + `groups.teacherId == uid`.
 * Administrator barcha guruhlarni ko'radi (PLAN 2-bo'lim, rollar jadvali).
 */
export const getTeacherGroupIds = cache(async (user: SessionUser): Promise<string[]> => {
  const db = adminDb()

  if (user.role === 'admin') {
    const snap = await db.collection(COL.groups).get()
    return snap.docs.map((d) => d.id)
  }

  const [userSnap, ownedSnap] = await Promise.all([
    db.collection(COL.users).doc(user.uid).get(),
    db.collection(COL.groups).where('teacherId', '==', user.uid).get(),
  ])

  const data = userSnap.data() as UserDoc | undefined
  const ids = new Set<string>()
  for (const id of data?.groupIds ?? []) if (id) ids.add(id)
  if (data?.groupId) ids.add(data.groupId)
  for (const doc of ownedSnap.docs) ids.add(doc.id)

  return [...ids].sort()
})

/** O'qituvchining barcha guruh hujjatlari. */
export const getTeacherGroupDocs = cache(
  async (user: SessionUser): Promise<Array<GroupDoc & WithId>> => {
    const ids = await getTeacherGroupIds(user)
    if (!ids.length) return []
    const db = adminDb()
    const snaps = await db.getAll(...ids.map((id) => db.collection(COL.groups).doc(id)))
    return snaps
      .filter((s) => s.exists)
      .map((s) => serialize({ id: s.id, ...(s.data() as GroupDoc) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
)

/** Tekshirish (xatosiz variant) — UI shartlari uchun. */
export async function canTeachGroup(user: SessionUser, groupId: string): Promise<boolean> {
  if (!groupId) return false
  const ids = await getTeacherGroupIds(user)
  return ids.includes(groupId)
}

/**
 * ASOSIY GUARD. Har bir guruhga tegishli o'qish va yozishdan oldin chaqiriladi.
 * Guruh mavjud bo'lmasa yoki o'qituvchiga biriktirilmagan bo'lsa — xato.
 */
export async function assertTeachesGroup(
  user: SessionUser,
  groupId: string | undefined | null
): Promise<GroupDoc & WithId> {
  if (!groupId || typeof groupId !== 'string') {
    throw new TeacherAccessError('Guruh ko‘rsatilmagan.')
  }
  const allowed = await getTeacherGroupIds(user)
  if (!allowed.includes(groupId)) {
    throw new TeacherAccessError('Bu guruh sizga biriktirilmagan.')
  }

  const snap = await adminDb().collection(COL.groups).doc(groupId).get()
  if (!snap.exists) throw new TeacherAccessError('Guruh topilmadi.')
  return serialize({ id: snap.id, ...(snap.data() as GroupDoc) })
}

/**
 * Talaba guardi: talaba hujjatini o'qiydi va uning guruhini `assertTeachesGroup`
 * orqali tekshiradi. `[uid]` route parametriga ishonilmaydi.
 */
export async function assertTeachesStudent(
  user: SessionUser,
  uid: string | undefined | null
): Promise<UserDoc & WithId> {
  if (!uid || typeof uid !== 'string') {
    throw new TeacherAccessError('Talaba ko‘rsatilmagan.')
  }
  const snap = await adminDb().collection(COL.users).doc(uid).get()
  if (!snap.exists) throw new TeacherAccessError('Talaba topilmadi.')

  const student = serialize({ id: snap.id, ...(snap.data() as UserDoc) })
  if (student.role !== 'student') {
    throw new TeacherAccessError('Bu foydalanuvchi talaba emas.')
  }
  await assertTeachesGroup(user, student.groupId)
  return student
}

/** Bir nechta talabani bir yo'la tekshirish (bulk amallar uchun). */
export async function assertTeachesStudents(
  user: SessionUser,
  uids: string[]
): Promise<Array<UserDoc & WithId>> {
  const unique = [...new Set(uids.filter(Boolean))]
  if (!unique.length) return []
  const results: Array<UserDoc & WithId> = []
  for (const uid of unique) results.push(await assertTeachesStudent(user, uid))
  return results
}

/** ActionResult'ga aylantirish uchun qulay yordamchi. */
export function accessErrorMessage(err: unknown): string {
  if (err instanceof TeacherAccessError) return err.message
  if (err instanceof Error) return err.message
  return 'Kutilmagan xatolik yuz berdi.'
}
