'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import {
  COL,
  DOMAINS,
  CEFR_LEVELS,
  ITEM_TYPES,
  PROJECT_RUBRIC,
  SKILLS,
  SPEAKING_RUBRIC,
  WRITING_RUBRIC,
} from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import type { ActionResult, ItemDoc, ProjectDoc, SessionUser, WritingSubmissionDoc } from '@/types'

import {
  accessErrorMessage,
  assertTeachesGroup,
  assertTeachesStudent,
  requireTeacher,
} from './guards'

/**
 * O'qituvchi server action'lari (PLAN 8.17).
 *
 * Qoidalar:
 *  1. Har bir action `requireTeacher()` bilan boshlanadi.
 *  2. Guruhga/talabaga tegishli har bir amal `assertTeachesGroup` yoki
 *     `assertTeachesStudent` orqali qayta tekshiriladi — route parametriga ishonilmaydi.
 *  3. Kirish ma'lumotlari zod bilan validatsiya qilinadi.
 *  4. Baholash yozuvlari IDEMPOTENT: qayta yuborilsa baho yangilanadi, lekin
 *     bildirishnoma va audit yozuvi takrorlanmaydi.
 */

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

function fail(err: unknown): ActionResult<never> {
  return { ok: false, error: accessErrorMessage(err), code: 'forbidden' }
}

async function audit(
  user: SessionUser,
  action: string,
  target: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await adminDb().collection(COL.auditLogs).add({
      actorUid: user.uid,
      actorRole: user.role,
      action,
      target,
      meta,
      ts: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('[teacher] audit failed', action, err)
  }
}

async function notifyStudent(
  uid: string,
  notification: { type: string; text: string; link?: string }
): Promise<void> {
  try {
    await adminDb()
      .collection(COL.notifications)
      .doc(uid)
      .collection('items')
      .add({ ...notification, read: false, ts: FieldValue.serverTimestamp() })
  } catch (err) {
    console.error('[teacher] notifyStudent failed', err)
  }
}

const rubricSchema = (keys: readonly string[]) =>
  z
    .record(z.string(), z.number().int().min(0).max(5))
    .refine((value) => Object.keys(value).every((key) => keys.includes(key)), {
      message: 'Noma’lum rubrika mezoni',
    })

/** 0–5 rubrika ballaridan 0–100 umumiy ball. */
function rubricTotal(scores: Record<string, number>, keys: readonly string[]): number {
  const values = keys.map((key) => scores[key]).filter((v): v is number => typeof v === 'number')
  if (!values.length) return 0
  return Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 5)) * 100)
}

/* ------------------------------------------------------------------ */
/* 1. Talaba haqida o'qituvchi izohi                                   */
/* ------------------------------------------------------------------ */

const noteSchema = z.object({
  uid: z.string().min(1),
  text: z.string().max(4000),
})

export async function saveTeacherNoteAction(
  input: z.input<typeof noteSchema>
): Promise<ActionResult<{ saved: boolean }>> {
  const user = await requireTeacher()
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Izoh matni juda uzun yoki noto‘g‘ri.' }

  try {
    const student = await assertTeachesStudent(user, parsed.data.uid)
    const text = parsed.data.text.trim()

    await adminDb()
      .collection(COL.users)
      .doc(student.id)
      .set(
        {
          teacherNotes: {
            [user.uid]: text
              ? {
                  text,
                  byUid: user.uid,
                  byName: user.displayName,
                  at: new Date().toISOString(),
                }
              : FieldValue.delete(),
          },
        },
        { merge: true }
      )

    await audit(user, 'teacher.note.save', student.id, { length: text.length })
    revalidatePath(`/teacher/students/${student.id}`)
    return { ok: true, data: { saved: true } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 2. Writing baholash                                                 */
/* ------------------------------------------------------------------ */

const writingReviewSchema = z.object({
  submissionId: z.string().min(1),
  rubricScores: rubricSchema(WRITING_RUBRIC),
  comment: z.string().min(1, 'Izoh yozing').max(4000),
})

export async function reviewWritingAction(
  input: z.input<typeof writingReviewSchema>
): Promise<ActionResult<{ score: number; alreadyReviewed: boolean }>> {
  const user = await requireTeacher()
  const parsed = writingReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }

  try {
    const db = adminDb()
    const ref = db.collection(COL.writingSubmissions).doc(parsed.data.submissionId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'Topshiriq topilmadi.' }

    const submission = snap.data() as WritingSubmissionDoc
    const student = await assertTeachesStudent(user, submission.uid)

    const score = rubricTotal(parsed.data.rubricScores, WRITING_RUBRIC)

    // Idempotentlik: allaqachon baholangan bo'lsa faqat baho yangilanadi.
    const alreadyReviewed = submission.status === 'reviewed'

    await ref.set(
      {
        status: 'reviewed',
        rubricScores: parsed.data.rubricScores,
        teacherFeedback: {
          text: parsed.data.comment.trim(),
          score,
          byUid: user.uid,
          at: FieldValue.serverTimestamp(),
        },
        reviewedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    if (!alreadyReviewed) {
      await Promise.all([
        notifyStudent(student.id, {
          type: 'writing_reviewed',
          text: `«${submission.taskTitle}» ishingiz baholandi: ${score}/100`,
          link: `/student/writing-lab/${ref.id}`,
        }),
        audit(user, 'teacher.review.writing', ref.id, { uid: student.id, score }),
      ])
    } else {
      await audit(user, 'teacher.review.writing.update', ref.id, { uid: student.id, score })
    }

    revalidatePath('/teacher/review')
    revalidatePath(`/teacher/students/${student.id}`)
    return { ok: true, data: { score, alreadyReviewed } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 3. Speaking baholash                                                */
/* ------------------------------------------------------------------ */

const speakingReviewSchema = z.object({
  submissionId: z.string().min(1),
  rubricScores: rubricSchema(SPEAKING_RUBRIC),
  comment: z.string().min(1, 'Izoh yozing').max(4000),
})

export async function reviewSpeakingAction(
  input: z.input<typeof speakingReviewSchema>
): Promise<ActionResult<{ score: number; alreadyReviewed: boolean }>> {
  const user = await requireTeacher()
  const parsed = speakingReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }

  try {
    const db = adminDb()
    const ref = db.collection(COL.speakingSubmissions).doc(parsed.data.submissionId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'Topshiriq topilmadi.' }

    const submission = snap.data() as { uid: string; taskTitle?: string; teacherFeedback?: unknown }
    const student = await assertTeachesStudent(user, submission.uid)
    const score = rubricTotal(parsed.data.rubricScores, SPEAKING_RUBRIC)
    const alreadyReviewed = Boolean(submission.teacherFeedback)

    await ref.set(
      {
        rubricScores: parsed.data.rubricScores,
        teacherFeedback: {
          text: parsed.data.comment.trim(),
          score,
          byUid: user.uid,
          at: FieldValue.serverTimestamp(),
        },
        reviewStatus: 'reviewed',
      },
      { merge: true }
    )

    if (!alreadyReviewed) {
      await Promise.all([
        notifyStudent(student.id, {
          type: 'speaking_reviewed',
          text: `«${submission.taskTitle ?? 'Speaking'}» topshirig‘ingiz baholandi: ${score}/100`,
          link: `/student/speaking-lab/${ref.id}`,
        }),
        audit(user, 'teacher.review.speaking', ref.id, { uid: student.id, score }),
      ])
    } else {
      await audit(user, 'teacher.review.speaking.update', ref.id, { uid: student.id, score })
    }

    revalidatePath('/teacher/review')
    revalidatePath(`/teacher/students/${student.id}`)
    return { ok: true, data: { score, alreadyReviewed } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 4. Loyiha baholash (jamoa bahosi + a'zolar bo'yicha tuzatish)       */
/* ------------------------------------------------------------------ */

const projectReviewSchema = z.object({
  projectId: z.string().min(1),
  rubricScores: rubricSchema(PROJECT_RUBRIC),
  comment: z.string().min(1, 'Izoh yozing').max(4000),
  memberAdjustments: z.record(z.string(), z.number().int().min(-20).max(20)).default({}),
})

export async function reviewProjectAction(
  input: z.input<typeof projectReviewSchema>
): Promise<ActionResult<{ teamScore: number; alreadyReviewed: boolean }>> {
  const user = await requireTeacher()
  const parsed = projectReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }

  try {
    const db = adminDb()
    const ref = db.collection(COL.projects).doc(parsed.data.projectId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'Loyiha topilmadi.' }

    const project = snap.data() as ProjectDoc
    await assertTeachesGroup(user, project.groupId)

    const memberUids = project.memberUids ?? []
    for (const uid of Object.keys(parsed.data.memberAdjustments)) {
      if (!memberUids.includes(uid)) {
        return { ok: false, error: 'Tuzatish faqat loyiha a’zolari uchun berilishi mumkin.' }
      }
    }

    const teamScore = rubricTotal(parsed.data.rubricScores, PROJECT_RUBRIC)
    const alreadyReviewed = project.status === 'graded'

    const memberScores: Record<string, number> = {}
    for (const uid of memberUids) {
      const adjustment = parsed.data.memberAdjustments[uid] ?? 0
      memberScores[uid] = Math.max(0, Math.min(100, teamScore + adjustment))
    }

    await ref.set(
      {
        status: 'graded',
        teacherScores: parsed.data.rubricScores,
        teacherComment: parsed.data.comment.trim(),
        teamScore,
        memberScores,
        gradedBy: user.uid,
        gradedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    if (!alreadyReviewed) {
      await Promise.all([
        ...memberUids.map((uid) =>
          notifyStudent(uid, {
            type: 'project_graded',
            text: `«${project.title}» loyihasi baholandi: ${memberScores[uid]}/100`,
            link: `/student/projects/${ref.id}`,
          })
        ),
        audit(user, 'teacher.review.project', ref.id, { teamScore, members: memberUids.length }),
      ])
    } else {
      await audit(user, 'teacher.review.project.update', ref.id, { teamScore })
    }

    revalidatePath('/teacher/review')
    return { ok: true, data: { teamScore, alreadyReviewed } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 5. Kontent tasdiqlash (human-in-the-loop)                           */
/* ------------------------------------------------------------------ */

const itemPatchSchema = z.object({
  itemId: z.string().min(1),
  stem: z.string().min(1).max(2000).optional(),
  instruction: z.string().max(600).optional(),
  options: z
    .array(z.object({ id: z.string().min(1).max(40), text: z.string().min(1).max(600) }))
    .max(10)
    .optional(),
  answerKey: z.array(z.string().max(400)).max(20).optional(),
  explanation: z
    .object({
      why: z.string().max(1500),
      how: z.string().max(1500),
      whereElse: z.string().max(1500),
    })
    .optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  cefr: z.enum(CEFR_LEVELS).optional(),
  skill: z.enum(SKILLS).optional(),
  domain: z.enum(DOMAINS).optional(),
  type: z.enum(ITEM_TYPES).optional(),
  topic: z.string().max(120).optional(),
})

export async function updateItemAction(
  input: z.input<typeof itemPatchSchema>
): Promise<ActionResult<{ updated: boolean }>> {
  const user = await requireTeacher()
  const parsed = itemPatchSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }

  const { itemId, ...patch } = parsed.data
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
  if (!Object.keys(clean).length) return { ok: true, data: { updated: false } }

  try {
    const ref = adminDb().collection(COL.items).doc(itemId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'Mashq topilmadi.' }

    await ref.set(
      { ...clean, editedBy: user.uid, editedAt: FieldValue.serverTimestamp() },
      {
        merge: true,
      }
    )
    await audit(user, 'teacher.item.edit', itemId, { fields: Object.keys(clean) })
    revalidatePath('/teacher/content')
    return { ok: true, data: { updated: true } }
  } catch (err) {
    return fail(err)
  }
}

const decisionSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1).max(100),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(600).optional(),
})

/**
 * Mashqni tasdiqlash / rad etish. Tasdiqlangan mashq item bank'ka tushadi
 * va qayta ishlatiladi (PLAN 1.5, 7.4). IDEMPOTENT: bir xil qaror qayta
 * yuborilsa hujjat o'zgarmaydi.
 */
export async function decideItemsAction(
  input: z.input<typeof decisionSchema>
): Promise<ActionResult<{ changed: number; skipped: number }>> {
  const user = await requireTeacher()
  const parsed = decisionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }
  if (parsed.data.decision === 'rejected' && !parsed.data.reason?.trim()) {
    return { ok: false, error: 'Rad etish sababini yozing.' }
  }

  try {
    const db = adminDb()
    const refs = parsed.data.itemIds.map((id) => db.collection(COL.items).doc(id))
    const snaps = await db.getAll(...refs)

    const batch = db.batch()
    let changed = 0
    let skipped = 0

    for (const snap of snaps) {
      if (!snap.exists) {
        skipped += 1
        continue
      }
      const item = snap.data() as ItemDoc
      if (item.status === parsed.data.decision) {
        skipped += 1
        continue
      }
      batch.set(
        snap.ref,
        {
          status: parsed.data.decision,
          approvedBy: parsed.data.decision === 'approved' ? user.uid : FieldValue.delete(),
          rejectedBy: parsed.data.decision === 'rejected' ? user.uid : FieldValue.delete(),
          rejectionReason:
            parsed.data.decision === 'rejected'
              ? (parsed.data.reason ?? '').trim()
              : FieldValue.delete(),
          reviewedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      changed += 1
    }

    if (changed) await batch.commit()
    await audit(user, `teacher.item.${parsed.data.decision}`, parsed.data.itemIds.join(','), {
      changed,
      skipped,
    })
    revalidatePath('/teacher/content')
    return { ok: true, data: { changed, skipped } }
  } catch (err) {
    return fail(err)
  }
}

const lessonDecisionSchema = z.object({
  lessonId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(600).optional(),
})

export async function decideLessonAction(
  input: z.input<typeof lessonDecisionSchema>
): Promise<ActionResult<{ published: boolean }>> {
  const user = await requireTeacher()
  const parsed = lessonDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Ma’lumot noto‘g‘ri.' }
  if (parsed.data.decision === 'rejected' && !parsed.data.reason?.trim()) {
    return { ok: false, error: 'Rad etish sababini yozing.' }
  }

  try {
    const ref = adminDb().collection(COL.lessons).doc(parsed.data.lessonId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'Dars topilmadi.' }

    const approved = parsed.data.decision === 'approved'
    await ref.set(
      {
        published: approved,
        approvedBy: approved ? user.uid : FieldValue.delete(),
        rejectionReason: approved ? FieldValue.delete() : (parsed.data.reason ?? '').trim(),
        reviewedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    await audit(user, `teacher.lesson.${parsed.data.decision}`, ref.id, {})
    revalidatePath('/teacher/content')
    return { ok: true, data: { published: approved } }
  } catch (err) {
    return fail(err)
  }
}

const lexiconDecisionSchema = z.object({
  wordId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(600).optional(),
})

export async function decideLexiconAction(
  input: z.input<typeof lexiconDecisionSchema>
): Promise<ActionResult<{ approved: boolean }>> {
  const user = await requireTeacher()
  const parsed = lexiconDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Ma’lumot noto‘g‘ri.' }
  if (parsed.data.decision === 'rejected' && !parsed.data.reason?.trim()) {
    return { ok: false, error: 'Rad etish sababini yozing.' }
  }

  try {
    const ref = adminDb().collection(COL.lexicon).doc(parsed.data.wordId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'So‘z topilmadi.' }

    const approved = parsed.data.decision === 'approved'
    await ref.set(
      {
        status: approved ? 'approved' : 'draft',
        approvedBy: approved ? user.uid : FieldValue.delete(),
        rejectionReason: approved ? FieldValue.delete() : (parsed.data.reason ?? '').trim(),
        reviewedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    await audit(user, `teacher.lexicon.${parsed.data.decision}`, ref.id, {})
    revalidatePath('/teacher/content')
    return { ok: true, data: { approved } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 6. Topshiriqlar                                                     */
/* ------------------------------------------------------------------ */

const assignmentSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(3, 'Sarlavha juda qisqa').max(160),
  description: z.string().max(2000).default(''),
  kind: z.enum(['lesson', 'practice', 'writing', 'speaking', 'test', 'project']),
  refId: z.string().max(160).optional(),
  dueAt: z.string().min(4, 'Muddatni tanlang'),
})

export async function createAssignmentAction(
  input: z.input<typeof assignmentSchema>
): Promise<ActionResult<{ id: string }>> {
  const user = await requireTeacher()
  const parsed = assignmentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }

  const dueAt = new Date(parsed.data.dueAt)
  if (Number.isNaN(dueAt.getTime())) return { ok: false, error: 'Muddat sanasi noto‘g‘ri.' }

  try {
    const group = await assertTeachesGroup(user, parsed.data.groupId)
    const db = adminDb()

    const ref = await db.collection(COL.assignments).add({
      groupId: group.id,
      teacherId: user.uid,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      kind: parsed.data.kind,
      refId: parsed.data.refId?.trim() || null,
      dueAt,
      createdAt: FieldValue.serverTimestamp(),
    })

    const studentsSnap = await db
      .collection(COL.users)
      .where('groupId', '==', group.id)
      .where('role', '==', 'student')
      .get()

    await Promise.all(
      studentsSnap.docs.map((doc) =>
        notifyStudent(doc.id, {
          type: 'assignment_created',
          text: `Yangi topshiriq: ${parsed.data.title.trim()}`,
          link: '/student/dashboard',
        })
      )
    )

    await audit(user, 'teacher.assignment.create', ref.id, { groupId: group.id })
    revalidatePath('/teacher/assignments')
    revalidatePath(`/teacher/groups/${group.id}`)
    return { ok: true, data: { id: ref.id } }
  } catch (err) {
    return fail(err)
  }
}

const assignmentUpdateSchema = assignmentSchema.extend({ assignmentId: z.string().min(1) })

export async function updateAssignmentAction(
  input: z.input<typeof assignmentUpdateSchema>
): Promise<ActionResult<{ id: string }>> {
  const user = await requireTeacher()
  const parsed = assignmentUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri.' }
  }

  const dueAt = new Date(parsed.data.dueAt)
  if (Number.isNaN(dueAt.getTime())) return { ok: false, error: 'Muddat sanasi noto‘g‘ri.' }

  try {
    const db = adminDb()
    const ref = db.collection(COL.assignments).doc(parsed.data.assignmentId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: false, error: 'Topshiriq topilmadi.' }

    // Ham eski, ham yangi guruh o'qituvchiga tegishli bo'lishi shart.
    await assertTeachesGroup(user, (snap.data() as { groupId?: string }).groupId)
    const group = await assertTeachesGroup(user, parsed.data.groupId)

    await ref.set(
      {
        groupId: group.id,
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        kind: parsed.data.kind,
        refId: parsed.data.refId?.trim() || null,
        dueAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    await audit(user, 'teacher.assignment.update', ref.id, { groupId: group.id })
    revalidatePath('/teacher/assignments')
    return { ok: true, data: { id: ref.id } }
  } catch (err) {
    return fail(err)
  }
}

export async function deleteAssignmentAction(
  assignmentId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const user = await requireTeacher()
  if (!assignmentId) return { ok: false, error: 'Topshiriq ko‘rsatilmagan.' }

  try {
    const ref = adminDb().collection(COL.assignments).doc(assignmentId)
    const snap = await ref.get()
    if (!snap.exists) return { ok: true, data: { deleted: false } }

    await assertTeachesGroup(user, (snap.data() as { groupId?: string }).groupId)
    await ref.delete()
    await audit(user, 'teacher.assignment.delete', ref.id, {})
    revalidatePath('/teacher/assignments')
    return { ok: true, data: { deleted: true } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 7. Suhbat (o'qituvchi ↔ talaba)                                     */
/* ------------------------------------------------------------------ */

/** Suhbat id'si deterministik — bir juftlik uchun ikkinchi chat yaratilmaydi. */
function teacherChatId(teacherUid: string, studentUid: string): string {
  return `teacher_${teacherUid}_${studentUid}`
}

export async function openTeacherChatAction(
  studentUid: string
): Promise<ActionResult<{ chatId: string }>> {
  const user = await requireTeacher()
  try {
    const student = await assertTeachesStudent(user, studentUid)
    const chatId = teacherChatId(user.uid, student.id)

    await adminDb()
      .collection(COL.chats)
      .doc(chatId)
      .set(
        {
          type: 'teacher',
          title: student.displayName ?? '',
          memberUids: [user.uid, student.id],
          memberNames: { [user.uid]: user.displayName, [student.id]: student.displayName ?? '' },
          groupId: student.groupId ?? null,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    revalidatePath('/teacher/chats')
    return { ok: true, data: { chatId } }
  } catch (err) {
    return fail(err)
  }
}

const messageSchema = z.object({
  studentUid: z.string().min(1),
  text: z.string().min(1, 'Xabar bo‘sh').max(2000),
})

export async function sendTeacherMessageAction(
  input: z.input<typeof messageSchema>
): Promise<ActionResult<{ chatId: string }>> {
  const user = await requireTeacher()
  const parsed = messageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Xabar noto‘g‘ri.' }
  }

  try {
    const student = await assertTeachesStudent(user, parsed.data.studentUid)
    const db = adminDb()
    const chatId = teacherChatId(user.uid, student.id)
    const chatRef = db.collection(COL.chats).doc(chatId)
    const text = parsed.data.text.trim()

    await chatRef.set(
      {
        type: 'teacher',
        title: student.displayName ?? '',
        memberUids: [user.uid, student.id],
        memberNames: { [user.uid]: user.displayName, [student.id]: student.displayName ?? '' },
        groupId: student.groupId ?? null,
        createdAt: FieldValue.serverTimestamp(),
        lastMessage: { text, senderUid: user.uid, ts: new Date() },
      },
      { merge: true }
    )

    await chatRef.collection('messages').add({
      senderUid: user.uid,
      senderName: user.displayName,
      text,
      deleted: false,
      ts: FieldValue.serverTimestamp(),
    })

    await Promise.all([
      notifyStudent(student.id, {
        type: 'teacher_message',
        text: `${user.displayName}: ${text.slice(0, 80)}`,
        link: `/student/communication/chats/${chatId}`,
      }),
      logEvent(user, 'chat_message', { chatId, to: student.id, length: text.length }),
    ])

    revalidatePath('/teacher/chats')
    return { ok: true, data: { chatId } }
  } catch (err) {
    return fail(err)
  }
}

/* ------------------------------------------------------------------ */
/* 8. CSV eksport (analitika jadvallari)                               */
/* ------------------------------------------------------------------ */

function toCsv(headers: string[], rows: Array<Array<string | number | null>>): string {
  const escape = (value: string | number | null): string => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n')
}

const csvSchema = z.object({
  groupId: z.string().min(1),
  table: z.enum(['students', 'errors', 'items']),
})

export async function exportAnalyticsCsvAction(
  input: z.input<typeof csvSchema>
): Promise<ActionResult<{ filename: string; csv: string }>> {
  const user = await requireTeacher()
  const parsed = csvSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Eksport parametrlari noto‘g‘ri.' }

  try {
    const group = await assertTeachesGroup(user, parsed.data.groupId)
    // Dinamik import — action fayli query modulini qattiq bog'lamasin
    const { getGroupAnalytics, getGroupDetail } = await import('./queries')

    if (parsed.data.table === 'students') {
      const detail = await getGroupDetail(user, group.id)
      const csv = toCsv(
        [
          'participantCode',
          'ism',
          'guruh',
          'guruh_turi',
          'oxirgi_faollik_kun',
          'urinishlar',
          'togri_foiz',
          'vaqt_daqiqa',
          'ai_xabarlar',
          'xp',
          'streak',
          'yonalish_foiz',
          'risk',
        ],
        detail.rows.map((row) => [
          row.participantCode,
          row.displayName,
          row.groupName,
          row.groupType ?? '',
          row.daysInactive,
          row.attempts,
          row.correctRate,
          row.timeOnTaskMin,
          row.aiMessages,
          row.totalXp,
          row.streak,
          row.pathProgress,
          row.riskLevel ?? '',
        ])
      )
      return {
        ok: true,
        data: { filename: `talabalar_${group.name}.csv`, csv },
      }
    }

    const analytics = await getGroupAnalytics(user, group.id)

    if (parsed.data.table === 'errors') {
      const csv = toCsv(
        ['xato_tegi', 'nomi', 'soni'],
        analytics.errorDistribution.map((row) => [row.tag, row.name, row.value])
      )
      return { ok: true, data: { filename: `xatolar_${group.name}.csv`, csv } }
    }

    const csv = toCsv(
      ['itemId', 'stem', 'skill', 'topic', 'difficulty', 'urinishlar', 'togri_foiz'],
      analytics.hardestItems.map((row) => [
        row.id,
        row.stem,
        row.skill,
        row.topic,
        row.difficulty,
        row.attempts,
        row.correctRate,
      ])
    )
    return { ok: true, data: { filename: `mashqlar_${group.name}.csv`, csv } }
  } catch (err) {
    return fail(err)
  }
}
