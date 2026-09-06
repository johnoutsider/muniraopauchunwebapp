'use server'

import { randomBytes } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { COL, type CefrLevel, type Domain, type Role, type Skill } from '@/config/constants'
import { adminAuth, adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireUser, setUserClaims } from '@/lib/firebase/session'
import {
  CONTROL_GROUP_FLAGS,
  EXPERIMENTAL_GROUP_FLAGS,
  type ActionResult,
  type CourseDoc,
  type FeatureFlags,
  type GlobalSettingsDoc,
  type GroupDoc,
  type ItemDoc,
  type LessonBlock,
  type LessonDoc,
  type LexiconDoc,
  type ModuleDoc,
  type UserDoc,
} from '@/types'

import { logAudit } from './audit'

/**
 * Administrator server amallari (PLAN.md 8.19).
 * Har bir mutatsiya `auditLogs` ga yoziladi (PLAN 10).
 *
 * PAROL SIYOSATI: platforma hech qachon parolni ko'rsatmaydi va o'rnatmaydi.
 * Yangi hisob tasodifiy (hech qayerga qaytarilmaydigan) parol bilan yaratiladi,
 * foydalanuvchi esa Firebase'ning "parolni tiklash" xatini olib o'zi
 * o'rnatadi (xat brauzerdan yuboriladi — `send-reset-button.tsx`).
 */

function fail(err: unknown, fallback: string): ActionResult<never> {
  const message = err instanceof Error ? err.message : fallback
  console.error('[admin/actions]', message)
  return { ok: false, error: message }
}

async function requireAdmin() {
  return requireUser(['admin'])
}

/* ================================================================== */
/* 1. Foydalanuvchilar                                                 */
/* ================================================================== */

export interface CreateUserInput {
  email: string
  displayName: string
  role: Role
  groupId?: string
  cohortId?: string
  university?: string
  faculty?: string
}

export async function createUserAction(
  input: CreateUserInput
): Promise<ActionResult<{ uid: string }>> {
  try {
    const actor = await requireAdmin()
    const email = input.email.trim().toLowerCase()
    if (!email || !email.includes('@')) return { ok: false, error: 'Email noto‘g‘ri.' }
    if (!input.displayName.trim()) return { ok: false, error: 'F.I.Sh. kiritilishi shart.' }

    const auth = adminAuth()
    let uid: string
    try {
      const existing = await auth.getUserByEmail(email)
      uid = existing.uid
    } catch {
      // Tasodifiy parol — hech qachon qaytarilmaydi va ko'rsatilmaydi
      const created = await auth.createUser({
        email,
        displayName: input.displayName.trim(),
        password: randomBytes(24).toString('base64url'),
        emailVerified: false,
      })
      uid = created.uid
    }

    const db = adminDb()
    const group = input.groupId
      ? ((await db.collection(COL.groups).doc(input.groupId).get()).data() as GroupDoc | undefined)
      : undefined

    const doc: Partial<UserDoc> = {
      uid,
      email,
      displayName: input.displayName.trim(),
      role: input.role,
      locale: 'uz',
      university: input.university,
      faculty: input.faculty,
      cohortId: input.cohortId ?? group?.cohortId,
      groupId: input.groupId,
      expGroup: group?.type,
      status: 'active',
      mustChangePassword: true,
      totalXp: 0,
      createdAt: FieldValue.serverTimestamp() as never,
    }
    await db.collection(COL.users).doc(uid).set(doc, { merge: true })
    await setUserClaims(uid, {
      role: input.role,
      groupId: input.groupId,
      expGroup: group?.type,
    })

    if (input.groupId) await refreshGroupCount(input.groupId)

    await logAudit(actor, 'user.create', uid, { email, role: input.role })
    revalidatePath('/admin/users')
    return { ok: true, data: { uid } }
  } catch (err) {
    return fail(err, 'Foydalanuvchi yaratishda xatolik')
  }
}

export interface UpdateUserInput {
  uid: string
  displayName?: string
  role?: Role
  groupId?: string | null
  cohortId?: string | null
  university?: string
  faculty?: string
}

export async function updateUserAction(input: UpdateUserInput): Promise<ActionResult<{ uid: string }>> {
  try {
    const actor = await requireAdmin()
    const db = adminDb()

    const patch: Record<string, unknown> = {}
    if (input.displayName !== undefined) patch.displayName = input.displayName.trim()
    if (input.role !== undefined) patch.role = input.role
    if (input.university !== undefined) patch.university = input.university
    if (input.faculty !== undefined) patch.faculty = input.faculty
    if (input.cohortId !== undefined) patch.cohortId = input.cohortId ?? FieldValue.delete()

    let expGroup: GroupDoc['type'] | undefined
    let previousGroupId: string | undefined

    if (input.groupId !== undefined) {
      const before = (await db.collection(COL.users).doc(input.uid).get()).data() as
        | UserDoc
        | undefined
      previousGroupId = before?.groupId
      if (input.groupId) {
        const group = (await db.collection(COL.groups).doc(input.groupId).get()).data() as
          | GroupDoc
          | undefined
        if (!group) return { ok: false, error: 'Guruh topilmadi.' }
        expGroup = group.type
        patch.groupId = input.groupId
        patch.expGroup = group.type
        patch.cohortId = group.cohortId
      } else {
        patch.groupId = FieldValue.delete()
        patch.expGroup = FieldValue.delete()
      }
    }

    if (input.displayName !== undefined) {
      await adminAuth()
        .updateUser(input.uid, { displayName: input.displayName.trim() })
        .catch(() => undefined)
    }

    await db.collection(COL.users).doc(input.uid).set(patch, { merge: true })
    await setUserClaims(input.uid, {
      ...(input.role ? { role: input.role } : {}),
      ...(input.groupId !== undefined ? { groupId: input.groupId ?? '' } : {}),
      ...(expGroup ? { expGroup } : {}),
    })

    if (input.groupId) await refreshGroupCount(input.groupId)
    if (previousGroupId && previousGroupId !== input.groupId) {
      await refreshGroupCount(previousGroupId)
    }

    await logAudit(actor, input.role ? 'user.role' : 'user.update', input.uid, {
      role: input.role ?? null,
      groupId: input.groupId ?? null,
    })
    revalidatePath('/admin/users')
    revalidatePath('/admin/groups')
    return { ok: true, data: { uid: input.uid } }
  } catch (err) {
    return fail(err, 'Foydalanuvchini yangilashda xatolik')
  }
}

export async function setUserStatusAction(
  uid: string,
  status: UserDoc['status']
): Promise<ActionResult<{ uid: string }>> {
  try {
    const actor = await requireAdmin()
    await adminDb().collection(COL.users).doc(uid).set({ status }, { merge: true })
    await adminAuth()
      .updateUser(uid, { disabled: status === 'disabled' })
      .catch(() => undefined)
    if (status === 'disabled') {
      await adminAuth()
        .revokeRefreshTokens(uid)
        .catch(() => undefined)
    }
    await logAudit(actor, status === 'active' ? 'user.approve' : 'user.status', uid, { status })
    revalidatePath('/admin/users')
    return { ok: true, data: { uid } }
  } catch (err) {
    return fail(err, 'Holatni o‘zgartirishda xatolik')
  }
}

/**
 * Parolni tiklash xati brauzerdan (Firebase Auth client SDK) yuboriladi;
 * bu amal faqat audit yozuvini qoldiradi. Server hech qachon parol
 * o'rnatmaydi va ko'rsatmaydi.
 */
export async function logPasswordResetAction(input: {
  uid: string
  email: string
}): Promise<ActionResult<{ uid: string }>> {
  try {
    const actor = await requireAdmin()
    await logAudit(actor, 'user.password_reset', input.uid, { email: input.email })
    return { ok: true, data: { uid: input.uid } }
  } catch (err) {
    return fail(err, 'Audit yozuvida xatolik')
  }
}

export type BulkOperation = 'approve' | 'disable' | 'enable' | 'setRole' | 'setGroup'

export async function bulkUsersAction(input: {
  uids: string[]
  operation: BulkOperation
  role?: Role
  groupId?: string
}): Promise<ActionResult<{ affected: number }>> {
  try {
    const actor = await requireAdmin()
    if (!input.uids.length) return { ok: false, error: 'Foydalanuvchi tanlanmagan.' }
    if (input.uids.length > 200) return { ok: false, error: 'Bir vaqtda 200 tadan ko‘p emas.' }

    const db = adminDb()
    let affected = 0

    for (const uid of input.uids) {
      switch (input.operation) {
        case 'approve':
        case 'enable':
          await db.collection(COL.users).doc(uid).set({ status: 'active' }, { merge: true })
          await adminAuth()
            .updateUser(uid, { disabled: false })
            .catch(() => undefined)
          break
        case 'disable':
          await db.collection(COL.users).doc(uid).set({ status: 'disabled' }, { merge: true })
          await adminAuth()
            .updateUser(uid, { disabled: true })
            .catch(() => undefined)
          break
        case 'setRole':
          if (!input.role) return { ok: false, error: 'Rol tanlanmagan.' }
          await db.collection(COL.users).doc(uid).set({ role: input.role }, { merge: true })
          await setUserClaims(uid, { role: input.role }).catch(() => undefined)
          break
        case 'setGroup': {
          if (!input.groupId) return { ok: false, error: 'Guruh tanlanmagan.' }
          const group = (await db.collection(COL.groups).doc(input.groupId).get()).data() as
            | GroupDoc
            | undefined
          if (!group) return { ok: false, error: 'Guruh topilmadi.' }
          await db
            .collection(COL.users)
            .doc(uid)
            .set(
              { groupId: input.groupId, expGroup: group.type, cohortId: group.cohortId },
              { merge: true }
            )
          await setUserClaims(uid, { groupId: input.groupId, expGroup: group.type }).catch(
            () => undefined
          )
          break
        }
      }
      affected += 1
    }

    if (input.operation === 'setGroup' && input.groupId) await refreshGroupCount(input.groupId)

    await logAudit(actor, 'user.bulk', undefined, {
      operation: input.operation,
      count: affected,
      role: input.role ?? null,
      groupId: input.groupId ?? null,
    })
    revalidatePath('/admin/users')
    return { ok: true, data: { affected } }
  } catch (err) {
    return fail(err, 'Ommaviy amalda xatolik')
  }
}

async function refreshGroupCount(groupId: string): Promise<void> {
  const db = adminDb()
  const snap = await db
    .collection(COL.users)
    .where('role', '==', 'student')
    .where('groupId', '==', groupId)
    .count()
    .get()
  await db.collection(COL.groups).doc(groupId).set({ studentCount: snap.data().count }, { merge: true })
}

/* ================================================================== */
/* 2. Kohortlar va guruhlar                                            */
/* ================================================================== */

export interface CohortInput {
  id?: string
  name: string
  university: string
  faculty?: string
  startDate: string
  endDate?: string
  teacherIds: string[]
}

export async function saveCohortAction(input: CohortInput): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    if (!input.name.trim()) return { ok: false, error: 'Kohort nomi bo‘sh bo‘lmasligi kerak.' }
    if (!input.university.trim()) return { ok: false, error: 'Universitet nomini kiriting.' }
    if (!input.startDate) return { ok: false, error: 'Boshlanish sanasini kiriting.' }

    const db = adminDb()
    const payload = {
      name: input.name.trim(),
      university: input.university.trim(),
      faculty: input.faculty?.trim() ?? '',
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      teacherIds: input.teacherIds,
    }

    let id = input.id
    if (id) {
      await db.collection(COL.cohorts).doc(id).set(payload, { merge: true })
    } else {
      const ref = await db
        .collection(COL.cohorts)
        .add({ ...payload, studentCount: 0, createdAt: FieldValue.serverTimestamp() })
      id = ref.id
    }

    await logAudit(actor, input.id ? 'cohort.update' : 'cohort.create', id, { name: payload.name })
    revalidatePath('/admin/cohorts')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Kohortni saqlashda xatolik')
  }
}

export async function deleteCohortAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    const db = adminDb()
    const groups = await db.collection(COL.groups).where('cohortId', '==', id).limit(1).get()
    if (!groups.empty) {
      return { ok: false, error: 'Avval ushbu kohortdagi guruhlarni o‘chiring yoki ko‘chiring.' }
    }
    await db.collection(COL.cohorts).doc(id).delete()
    await logAudit(actor, 'cohort.delete', id, {})
    revalidatePath('/admin/cohorts')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Kohortni o‘chirishda xatolik')
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    const db = adminDb()
    const students = await db.collection(COL.users).where('groupId', '==', id).limit(1).get()
    if (!students.empty) {
      return { ok: false, error: 'Guruhda talabalar bor — avval ularni boshqa guruhga ko‘chiring.' }
    }
    await db.collection(COL.groups).doc(id).delete()
    await logAudit(actor, 'group.delete', id, {})
    revalidatePath('/admin/groups')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Guruhni o‘chirishda xatolik')
  }
}

/**
 * Guruh darajasidagi feature flag'lar. Nazorat guruhida AI flagini yoqish —
 * eksperiment dizaynini buzadi, shuning uchun `confirmDesignBreak` majburiy.
 */
export async function updateGroupFlagsAction(input: {
  groupId: string
  flags: Partial<FeatureFlags>
  confirmDesignBreak?: boolean
}): Promise<ActionResult<{ groupId: string }>> {
  try {
    const actor = await requireAdmin()
    const db = adminDb()
    const snap = await db.collection(COL.groups).doc(input.groupId).get()
    const group = snap.data() as GroupDoc | undefined
    if (!group) return { ok: false, error: 'Guruh topilmadi.' }

    const AI_KEYS: Array<keyof FeatureFlags> = [
      'aiTutor',
      'aiFeedback',
      'adaptive',
      'pronunciationAI',
      'aiRolePlay',
      'promptLab',
      'corpusVerification',
      'semanticNetwork',
    ]

    const enabledAi = AI_KEYS.filter((key) => input.flags[key] === true)
    if (group.type === 'control' && enabledAi.length && !input.confirmDesignBreak) {
      return {
        ok: false,
        error: `Nazorat guruhida AI imkoniyatini yoqish eksperiment dizaynini buzadi (${enabledAi.join(', ')}). Tasdiqlash talab qilinadi.`,
        code: 'design_break',
      }
    }

    const base = group.type === 'control' ? CONTROL_GROUP_FLAGS : EXPERIMENTAL_GROUP_FLAGS
    const featureFlags: FeatureFlags = { ...base, ...group.featureFlags, ...input.flags }

    await db.collection(COL.groups).doc(input.groupId).set({ featureFlags }, { merge: true })
    await logAudit(actor, 'group.flags', input.groupId, {
      type: group.type,
      changed: Object.keys(input.flags),
      enabledAiInControl: group.type === 'control' ? enabledAi : [],
    })

    revalidatePath('/admin/groups')
    revalidatePath('/researcher/groups')
    return { ok: true, data: { groupId: input.groupId } }
  } catch (err) {
    return fail(err, 'Flaglarni saqlashda xatolik')
  }
}

export async function moveStudentsAction(input: {
  uids: string[]
  groupId: string
}): Promise<ActionResult<{ moved: number }>> {
  try {
    const actor = await requireAdmin()
    if (!input.uids.length) return { ok: false, error: 'Talaba tanlanmagan.' }

    const db = adminDb()
    const group = (await db.collection(COL.groups).doc(input.groupId).get()).data() as
      | GroupDoc
      | undefined
    if (!group) return { ok: false, error: 'Guruh topilmadi.' }

    const previous = new Set<string>()
    const batch = db.batch()
    for (const uid of input.uids) {
      const before = (await db.collection(COL.users).doc(uid).get()).data() as UserDoc | undefined
      if (before?.groupId) previous.add(before.groupId)
      batch.set(
        db.collection(COL.users).doc(uid),
        { groupId: input.groupId, expGroup: group.type, cohortId: group.cohortId },
        { merge: true }
      )
    }
    await batch.commit()

    for (const uid of input.uids) {
      await setUserClaims(uid, { groupId: input.groupId, expGroup: group.type }).catch(() => undefined)
    }

    await refreshGroupCount(input.groupId)
    for (const groupId of previous) await refreshGroupCount(groupId)

    await logAudit(actor, 'user.group', input.groupId, {
      moved: input.uids.length,
      groupType: group.type,
    })
    revalidatePath('/admin/groups')
    revalidatePath('/admin/users')
    return { ok: true, data: { moved: input.uids.length } }
  } catch (err) {
    return fail(err, 'Talabalarni ko‘chirishda xatolik')
  }
}

/* ================================================================== */
/* 3. Kontent: kurs / modul / dars                                     */
/* ================================================================== */

export interface CourseInput {
  id?: string
  title: string
  description: string
  cefrFrom: CefrLevel
  cefrTo: CefrLevel
  order: number
  published: boolean
}

export async function saveCourseAction(input: CourseInput): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    if (!input.title.trim()) return { ok: false, error: 'Kurs nomi bo‘sh bo‘lmasligi kerak.' }

    const db = adminDb()
    const payload: Partial<CourseDoc> = {
      title: input.title.trim(),
      description: input.description.trim(),
      cefrRange: [input.cefrFrom, input.cefrTo],
      order: input.order,
      published: input.published,
    }

    let id = input.id
    if (id) {
      await db.collection(COL.courses).doc(id).set(payload, { merge: true })
    } else {
      const ref = await db
        .collection(COL.courses)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp() })
      id = ref.id
    }

    await logAudit(actor, input.id ? 'course.update' : 'course.create', id, {
      title: payload.title,
      published: input.published,
    })
    revalidatePath('/admin/courses')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Kursni saqlashda xatolik')
  }
}

export async function togglePublishAction(input: {
  collection: 'courses' | 'modules' | 'lessons'
  id: string
  published: boolean
}): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    await adminDb()
      .collection(COL[input.collection])
      .doc(input.id)
      .set({ published: input.published }, { merge: true })

    const action =
      input.collection === 'courses'
        ? 'course.publish'
        : input.collection === 'modules'
          ? 'module.update'
          : 'lesson.publish'
    await logAudit(actor, action, input.id, { published: input.published })
    revalidatePath('/admin/courses')
    return { ok: true, data: { id: input.id } }
  } catch (err) {
    return fail(err, 'Nashr holatini o‘zgartirishda xatolik')
  }
}

export interface ModuleInput {
  id?: string
  courseId: string
  title: string
  description?: string
  stage: ModuleDoc['stage']
  skill: Skill
  domain: Domain
  topicId?: string
  order: number
  estimatedMin?: number
  published: boolean
}

export async function saveModuleAction(input: ModuleInput): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    if (!input.title.trim()) return { ok: false, error: 'Modul nomi bo‘sh bo‘lmasligi kerak.' }
    if (!input.courseId) return { ok: false, error: 'Kursni tanlang.' }

    const db = adminDb()
    const payload: Partial<ModuleDoc> = {
      courseId: input.courseId,
      title: input.title.trim(),
      description: input.description?.trim(),
      stage: input.stage,
      skill: input.skill,
      domain: input.domain,
      topicId: input.topicId,
      order: input.order,
      estimatedMin: input.estimatedMin,
      published: input.published,
    }

    let id = input.id
    if (id) await db.collection(COL.modules).doc(id).set(payload, { merge: true })
    else id = (await db.collection(COL.modules).add(payload)).id

    await logAudit(actor, input.id ? 'module.update' : 'module.create', id, {
      title: payload.title,
    })
    revalidatePath('/admin/courses')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Modulni saqlashda xatolik')
  }
}

export interface LessonInput {
  id?: string
  moduleId: string
  courseId: string
  title: string
  summary?: string
  type: LessonDoc['type']
  cefr: CefrLevel
  estimatedMin: number
  order: number
  published: boolean
  blocks: LessonBlock[]
}

export async function saveLessonAction(input: LessonInput): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    if (!input.title.trim()) return { ok: false, error: 'Dars nomi bo‘sh bo‘lmasligi kerak.' }
    if (!input.moduleId) return { ok: false, error: 'Modulni tanlang.' }

    const db = adminDb()
    const payload: Partial<LessonDoc> = {
      moduleId: input.moduleId,
      courseId: input.courseId,
      title: input.title.trim(),
      summary: input.summary?.trim(),
      type: input.type,
      cefr: input.cefr,
      estimatedMin: input.estimatedMin,
      order: input.order,
      published: input.published,
      blocks: input.blocks,
    }

    let id = input.id
    if (id) {
      await db.collection(COL.lessons).doc(id).set(payload, { merge: true })
    } else {
      const ref = await db.collection(COL.lessons).add({
        ...payload,
        createdBy: actor.uid,
        createdAt: FieldValue.serverTimestamp(),
      })
      id = ref.id
    }

    await logAudit(actor, input.id ? 'lesson.update' : 'lesson.create', id, {
      title: payload.title,
      blocks: input.blocks.length,
    })
    revalidatePath('/admin/courses')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Darsni saqlashda xatolik')
  }
}

/* ================================================================== */
/* 4. Mashq banki                                                      */
/* ================================================================== */

export interface ItemInput {
  id: string
  stem?: string
  instruction?: string
  topic?: string
  difficulty?: number
  cefr?: CefrLevel
  domain?: Domain
  skill?: Skill
  answerKey?: string[]
  explanation?: ItemDoc['explanation']
  errorTags?: ItemDoc['errorTags']
  tags?: string[]
}

export async function saveItemAction(input: ItemInput): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      if (key === 'id' || value === undefined) continue
      patch[key] = value
    }
    if (!Object.keys(patch).length) return { ok: false, error: 'O‘zgarish yo‘q.' }

    await adminDb().collection(COL.items).doc(input.id).set(patch, { merge: true })
    await logAudit(actor, 'item.update', input.id, { fields: Object.keys(patch) })
    revalidatePath('/admin/items')
    return { ok: true, data: { id: input.id } }
  } catch (err) {
    return fail(err, 'Mashqni saqlashda xatolik')
  }
}

export async function setItemStatusAction(input: {
  id: string
  status: ItemDoc['status']
}): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    await adminDb()
      .collection(COL.items)
      .doc(input.id)
      .set(
        {
          status: input.status,
          approvedBy: input.status === 'approved' ? actor.uid : FieldValue.delete(),
        },
        { merge: true }
      )
    await logAudit(actor, 'item.status', input.id, { status: input.status })
    revalidatePath('/admin/items')
    return { ok: true, data: { id: input.id } }
  } catch (err) {
    return fail(err, 'Mashq holatini o‘zgartirishda xatolik')
  }
}

/* ================================================================== */
/* 5. Lug'at (lexicon)                                                 */
/* ================================================================== */

export interface LexiconInput {
  id?: string
  word: string
  lemma: string
  pos: string
  ipa?: string
  cefr: CefrLevel
  domains: Domain[]
  definitions: LexiconDoc['definitions']
  collocations: LexiconDoc['collocations']
  synonyms: string[]
  antonyms: string[]
  wordFamily: string[]
  examples: LexiconDoc['examples']
  professionalContext: string
  communicativeTask?: string
  semanticLinks: LexiconDoc['semanticLinks']
  status: LexiconDoc['status']
}

export async function saveLexiconAction(
  input: LexiconInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireAdmin()
    if (!input.word.trim()) return { ok: false, error: 'So‘z bo‘sh bo‘lmasligi kerak.' }

    const db = adminDb()
    const payload: Partial<LexiconDoc> = {
      word: input.word.trim(),
      lemma: input.lemma.trim() || input.word.trim().toLowerCase(),
      pos: input.pos,
      ipa: input.ipa,
      cefr: input.cefr,
      domains: input.domains,
      definitions: input.definitions,
      collocations: input.collocations,
      synonyms: input.synonyms,
      antonyms: input.antonyms,
      wordFamily: input.wordFamily,
      examples: input.examples,
      professionalContext: input.professionalContext,
      communicativeTask: input.communicativeTask,
      semanticLinks: input.semanticLinks,
      status: input.status,
    }

    let id = input.id
    if (id) {
      await db.collection(COL.lexicon).doc(id).set(payload, { merge: true })
    } else {
      const ref = await db
        .collection(COL.lexicon)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp() })
      id = ref.id
    }

    await logAudit(actor, input.id ? 'lexicon.update' : 'lexicon.create', id, {
      word: payload.word,
      status: input.status,
    })
    revalidatePath('/admin/lexicon')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'So‘zni saqlashda xatolik')
  }
}

/* ================================================================== */
/* 6. Global sozlamalar                                                */
/* ================================================================== */

export async function updateGlobalFlagsAction(input: {
  flags: Partial<FeatureFlags>
  confirmDesignBreak?: boolean
}): Promise<ActionResult<{ updated: string[] }>> {
  try {
    const actor = await requireAdmin()
    const db = adminDb()

    const experimentSnap = await db.collection(COL.experiments).limit(5).get()
    const running = experimentSnap.docs.some(
      (doc) => (doc.data() as { status?: string }).status === 'running'
    )

    const AI_KEYS: Array<keyof FeatureFlags> = [
      'aiTutor',
      'aiFeedback',
      'adaptive',
      'pronunciationAI',
      'aiRolePlay',
      'promptLab',
      'corpusVerification',
      'semanticNetwork',
    ]
    const touchedAi = Object.keys(input.flags).filter((key) =>
      AI_KEYS.includes(key as keyof FeatureFlags)
    )

    if (running && touchedAi.length && !input.confirmDesignBreak) {
      return {
        ok: false,
        error: `Eksperiment davom etmoqda. AI flagini (${touchedAi.join(', ')}) o‘zgartirish tadqiqot dizaynini buzadi va natijalarni yaroqsiz qiladi. Tasdiqlash talab qilinadi.`,
        code: 'design_break',
      }
    }

    await db
      .collection(COL.settings)
      .doc('global')
      .set({ featureFlags: input.flags }, { merge: true })

    await logAudit(actor, 'settings.flags', 'global', {
      flags: input.flags,
      experimentRunning: running,
    })
    revalidatePath('/admin/flags')
    return { ok: true, data: { updated: Object.keys(input.flags) } }
  } catch (err) {
    return fail(err, 'Flaglarni saqlashda xatolik')
  }
}

export async function updateModelsAction(input: {
  main: string
  fast: string
}): Promise<ActionResult<{ main: string; fast: string }>> {
  try {
    const actor = await requireAdmin()
    if (!input.main.trim() || !input.fast.trim()) {
      return { ok: false, error: 'Model identifikatorlari bo‘sh bo‘lmasligi kerak.' }
    }
    await adminDb()
      .collection(COL.settings)
      .doc('global')
      .set({ models: { main: input.main.trim(), fast: input.fast.trim() } }, { merge: true })
    await logAudit(actor, 'settings.models', 'global', input)
    revalidatePath('/admin/flags')
    return { ok: true, data: input }
  } catch (err) {
    return fail(err, 'Model sozlamalarini saqlashda xatolik')
  }
}

export async function updateLimitsAction(input: {
  messagesPerDay: number
  tokensPerDay: number
}): Promise<ActionResult<{ messagesPerDay: number; tokensPerDay: number }>> {
  try {
    const actor = await requireAdmin()
    if (input.messagesPerDay < 1 || input.tokensPerDay < 1000) {
      return { ok: false, error: 'Limitlar juda kichik.' }
    }
    await adminDb()
      .collection(COL.settings)
      .doc('global')
      .set(
        { limits: { messagesPerDay: input.messagesPerDay, tokensPerDay: input.tokensPerDay } },
        { merge: true }
      )
    await logAudit(actor, 'settings.limits', 'global', input)
    revalidatePath('/admin/flags')
    return { ok: true, data: input }
  } catch (err) {
    return fail(err, 'Limitlarni saqlashda xatolik')
  }
}

export async function updateAnnouncementAction(input: {
  text: string
  level: 'info' | 'warning'
  until?: string
  clear?: boolean
}): Promise<ActionResult<{ cleared: boolean }>> {
  try {
    const actor = await requireAdmin()
    const db = adminDb()

    if (input.clear || !input.text.trim()) {
      await db
        .collection(COL.settings)
        .doc('global')
        .set({ announcement: FieldValue.delete() }, { merge: true })
      await logAudit(actor, 'settings.announcement', 'global', { cleared: true })
      revalidatePath('/admin/flags')
      return { ok: true, data: { cleared: true } }
    }

    await db
      .collection(COL.settings)
      .doc('global')
      .set(
        {
          announcement: {
            text: input.text.trim(),
            level: input.level,
            until: input.until ? new Date(input.until) : null,
          },
        },
        { merge: true }
      )
    await logAudit(actor, 'settings.announcement', 'global', {
      level: input.level,
      length: input.text.trim().length,
    })
    revalidatePath('/admin/flags')
    return { ok: true, data: { cleared: false } }
  } catch (err) {
    return fail(err, 'E’lonni saqlashda xatolik')
  }
}

export async function setMaintenanceAction(
  enabled: boolean
): Promise<ActionResult<{ enabled: boolean }>> {
  try {
    const actor = await requireAdmin()
    await adminDb()
      .collection(COL.settings)
      .doc('global')
      .set({ maintenanceMode: enabled }, { merge: true })
    await logAudit(actor, 'settings.maintenance', 'global', { enabled })
    revalidatePath('/admin/flags')
    return { ok: true, data: { enabled } }
  } catch (err) {
    return fail(err, 'Texnik rejimni o‘zgartirishda xatolik')
  }
}

/** Sozlamalar hujjatini o'qish (klient formasi uchun). */
export async function getSettingsAction(): Promise<ActionResult<GlobalSettingsDoc | null>> {
  try {
    await requireAdmin()
    const snap = await adminDb().collection(COL.settings).doc('global').get()
    return { ok: true, data: (snap.data() as GlobalSettingsDoc | undefined) ?? null }
  } catch (err) {
    return fail(err, 'Sozlamalarni o‘qishda xatolik')
  }
}
