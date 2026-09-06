'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import { awardXp, logEvent } from '@/lib/analytics/events'
import { wordCount } from '@/lib/utils/format'
import type { ActionResult, ProjectDoc, SessionUser, UserDoc } from '@/types'

import {
  PRESENTATION_MAX_BYTES,
  type GrammarExample,
  type SharedDocSaveResult,
  type TaskKind,
  type VocabChoice,
} from './types'

/**
 * Group Project Zone server action'lari (PLAN 8.10).
 *
 * Har bir yozuvdan oldin loyiha a'zoligi SERVERDA tekshiriladi.
 * Umumiy hujjat `sharedDocVersion` bilan optimistik bloklanadi:
 * versiya siljigan bo'lsa saqlash rad etiladi va talabaga qayta yuklash taklif qilinadi.
 */

/** Loyihani topshirgani uchun XP (PLAN 8.12 — gamifikatsiya). */
const PROJECT_SUBMIT_XP = 150
const MAX_SHARED_DOC_CHARS = 20000

async function currentStudent(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || user.role !== 'student') return null
  return user
}

async function loadProjectIfMember(
  projectId: string,
  uid: string
): Promise<(ProjectDoc & { id: string }) | null> {
  if (!projectId || projectId.includes('/')) return null
  const snap = await adminDb().collection(COL.projects).doc(projectId).get()
  if (!snap.exists) return null
  const data = snap.data() as ProjectDoc
  if (!data.memberUids?.includes(uid)) return null
  return { id: snap.id, ...data }
}

function memberName(project: ProjectDoc, uid: string, fallback: string): string {
  return project.members?.find((member) => member.uid === uid)?.name || fallback
}

/* ------------------------------------------------------------------ */
/* Loyiha kanali                                                       */
/* ------------------------------------------------------------------ */

/** Loyiha chat kanalini ochadi (`chats/project_{projectId}`). */
export async function ensureProjectChannelAction(
  projectId: string
): Promise<ActionResult<{ chatId: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const project = await loadProjectIfMember(projectId, user.uid)
  if (!project) return { ok: false, error: 'Bu loyiha sizga tegishli emas.', code: 'forbidden' }

  const db = adminDb()
  const chatId = `project_${projectId}`
  const chatRef = db.collection(COL.chats).doc(chatId)
  const existing = await chatRef.get()

  const memberNames: Record<string, string> = {}
  for (const member of project.members ?? []) memberNames[member.uid] = member.name
  const memberUids = [...project.memberUids]

  if (project.groupId) {
    const groupSnap = await db.collection(COL.groups).doc(project.groupId).get()
    const teacherId = (groupSnap.data() as { teacherId?: string } | undefined)?.teacherId
    if (teacherId) {
      const teacher = await db.collection(COL.users).doc(teacherId).get()
      if (teacher.exists) {
        memberUids.push(teacherId)
        memberNames[teacherId] = (teacher.data() as UserDoc).displayName
      }
    }
  }
  for (const uid of memberUids) {
    if (!memberNames[uid]) memberNames[uid] = uid === user.uid ? user.displayName : 'Ishtirokchi'
  }

  if (existing.exists) {
    await chatRef.set(
      { memberUids: FieldValue.arrayUnion(...memberUids), memberNames },
      { merge: true }
    )
  } else {
    await chatRef.set({
      type: 'project',
      title: `${project.title} — jamoa kanali`,
      projectId,
      groupId: project.groupId,
      memberUids,
      memberNames,
      lastMessage: { text: '', senderUid: '', ts: FieldValue.serverTimestamp() },
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  revalidatePath(`/student/projects/${projectId}`)
  return { ok: true, data: { chatId } }
}

/* ------------------------------------------------------------------ */
/* Bosqich holati                                                      */
/* ------------------------------------------------------------------ */

export async function setTaskStatusAction(input: {
  projectId: string
  taskId: string
  status: 'todo' | 'doing' | 'done'
}): Promise<ActionResult<{ status: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const project = await loadProjectIfMember(input.projectId, user.uid)
  if (!project) return { ok: false, error: 'Bu loyiha sizga tegishli emas.', code: 'forbidden' }
  if (project.status !== 'active') {
    return { ok: false, error: 'Loyiha topshirilgan — o‘zgartirib bo‘lmaydi.', code: 'locked' }
  }

  const db = adminDb()
  const previous = project.taskStatus?.[input.taskId] ?? 'todo'
  const delta = (input.status === 'done' ? 1 : 0) - (previous === 'done' ? 1 : 0)

  const batch = db.batch()
  batch.set(
    db.collection(COL.projects).doc(project.id),
    { taskStatus: { [input.taskId]: input.status } },
    { merge: true }
  )
  batch.set(
    db.collection(COL.projects).doc(project.id).collection('contributions').doc(user.uid),
    {
      uid: user.uid,
      name: memberName(project, user.uid, user.displayName),
      tasksDone: FieldValue.increment(delta),
      lastActiveAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  await batch.commit()

  revalidatePath(`/student/projects/${project.id}`)
  return { ok: true, data: { status: input.status } }
}

/* ------------------------------------------------------------------ */
/* Topshiriq ishi (vocab / grammar / grafik tahlili / qaydlar)          */
/* ------------------------------------------------------------------ */

export async function saveTaskWorkAction(input: {
  projectId: string
  taskId: string
  kind: TaskKind
  text?: string
  vocab?: VocabChoice[]
  grammar?: GrammarExample[]
}): Promise<ActionResult<{ savedAt: number }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }
  if (!input.taskId || input.taskId.includes('/') || input.taskId.startsWith('_')) {
    return { ok: false, error: 'Topshiriq identifikatori noto‘g‘ri.' }
  }

  const project = await loadProjectIfMember(input.projectId, user.uid)
  if (!project) return { ok: false, error: 'Bu loyiha sizga tegishli emas.', code: 'forbidden' }
  if (project.status !== 'active') {
    return { ok: false, error: 'Loyiha topshirilgan — o‘zgartirib bo‘lmaydi.', code: 'locked' }
  }

  const db = adminDb()
  const ref = db.collection(COL.projects).doc(project.id).collection('taskWork').doc(input.taskId)
  const previous = await ref.get()
  const previousData = previous.data() as
    { text?: string; vocab?: VocabChoice[]; grammar?: GrammarExample[] } | undefined

  const text = (input.text ?? '').slice(0, MAX_SHARED_DOC_CHARS)
  const vocab = (input.vocab ?? []).slice(0, 60).map((item) => ({
    word: String(item.word).slice(0, 80),
    selected: Boolean(item.selected),
    justification: String(item.justification ?? '').slice(0, 400),
  }))
  const grammar = (input.grammar ?? []).slice(0, 30).map((item) => ({
    structure: String(item.structure).slice(0, 120),
    example: String(item.example ?? '').slice(0, 600),
  }))

  const previousWords = countWork(previousData)
  const nextWords = countWork({ text, vocab, grammar })

  const batch = db.batch()
  batch.set(
    ref,
    {
      taskId: input.taskId,
      kind: input.kind,
      text,
      vocab,
      grammar,
      updatedByUid: user.uid,
      updatedByName: memberName(project, user.uid, user.displayName),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  batch.set(
    db.collection(COL.projects).doc(project.id).collection('contributions').doc(user.uid),
    {
      uid: user.uid,
      name: memberName(project, user.uid, user.displayName),
      wordsWritten: FieldValue.increment(Math.max(0, nextWords - previousWords)),
      lastActiveAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  await batch.commit()

  await logEvent(user, 'project_contribution', {
    projectId: project.id,
    taskId: input.taskId,
    kind: input.kind,
    words: nextWords,
  })

  revalidatePath(`/student/projects/${project.id}`)
  return { ok: true, data: { savedAt: Date.now() } }
}

function countWork(data?: {
  text?: string
  vocab?: VocabChoice[]
  grammar?: GrammarExample[]
}): number {
  if (!data) return 0
  let total = data.text ? wordCount(data.text) : 0
  for (const item of data.vocab ?? []) {
    if (item.selected && item.justification) total += wordCount(item.justification)
  }
  for (const item of data.grammar ?? []) {
    if (item.example) total += wordCount(item.example)
  }
  return total
}

/* ------------------------------------------------------------------ */
/* Umumiy hujjat (yechim / hisobot) — optimistik versiya nazorati       */
/* ------------------------------------------------------------------ */

export async function saveSharedDocAction(input: {
  projectId: string
  field: 'solution' | 'report'
  text: string
  baseVersion: number
}): Promise<ActionResult<SharedDocSaveResult>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }
  if (input.field !== 'solution' && input.field !== 'report') {
    return { ok: false, error: 'Hujjat maydoni noto‘g‘ri.' }
  }

  const project = await loadProjectIfMember(input.projectId, user.uid)
  if (!project) return { ok: false, error: 'Bu loyiha sizga tegishli emas.', code: 'forbidden' }
  if (project.status !== 'active') {
    return { ok: false, error: 'Loyiha topshirilgan — o‘zgartirib bo‘lmaydi.', code: 'locked' }
  }

  const text = (input.text ?? '').slice(0, MAX_SHARED_DOC_CHARS)
  const db = adminDb()
  const projectRef = db.collection(COL.projects).doc(project.id)
  const sharedMetaRef = projectRef.collection('taskWork').doc('_shared')
  const contributionRef = projectRef.collection('contributions').doc(user.uid)
  const name = memberName(project, user.uid, user.displayName)

  const result = await db.runTransaction<SharedDocSaveResult>(async (tx) => {
    const snap = await tx.get(projectRef)
    const data = snap.data() as ProjectDoc
    const currentVersion = data.sharedDocVersion ?? 0

    if (currentVersion !== input.baseVersion) {
      return {
        status: 'conflict',
        version: currentVersion,
        text: (data[input.field] as string | undefined) ?? '',
        byName: undefined,
      }
    }

    const previousWords = wordCount((data[input.field] as string | undefined) ?? '')
    const nextWords = wordCount(text)
    const wordsAdded = Math.max(0, nextWords - previousWords)

    tx.set(
      projectRef,
      {
        [input.field]: text,
        sharedDoc: text,
        sharedDocVersion: currentVersion + 1,
      },
      { merge: true }
    )
    tx.set(
      sharedMetaRef,
      {
        taskId: '_shared',
        kind: input.field === 'solution' ? 'propose_solution' : 'write_report',
        updatedByUid: user.uid,
        updatedByName: name,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    tx.set(
      contributionRef,
      {
        uid: user.uid,
        name,
        wordsWritten: FieldValue.increment(wordsAdded),
        lastActiveAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return { status: 'saved', version: currentVersion + 1, wordsAdded }
  })

  if (result.status === 'conflict') {
    return {
      ok: true,
      data: { ...result, byName: await lastEditorName(project.id) },
    }
  }

  await logEvent(user, 'project_contribution', {
    projectId: project.id,
    field: input.field,
    words: wordCount(text),
    wordsAdded: result.wordsAdded,
  })

  return { ok: true, data: result }
}

async function lastEditorName(projectId: string): Promise<string | undefined> {
  const snap = await adminDb()
    .collection(COL.projects)
    .doc(projectId)
    .collection('taskWork')
    .doc('_shared')
    .get()
  return (snap.data() as { updatedByName?: string } | undefined)?.updatedByName
}

/* ------------------------------------------------------------------ */
/* Prezentatsiya fayllari                                              */
/* ------------------------------------------------------------------ */

/**
 * Fayl klientdan to'g'ridan-to'g'ri Storage'ga yuklanadi
 * (`projects/{projectId}/…` — storage.rules a'zolarga ruxsat beradi),
 * shundan keyin metama'lumot shu action orqali yoziladi.
 */
export async function addPresentationFileAction(input: {
  projectId: string
  name: string
  path: string
  size: number
}): Promise<ActionResult<{ count: number }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const project = await loadProjectIfMember(input.projectId, user.uid)
  if (!project) return { ok: false, error: 'Bu loyiha sizga tegishli emas.', code: 'forbidden' }
  if (!input.path.startsWith(`projects/${input.projectId}/`)) {
    return { ok: false, error: 'Fayl manzili noto‘g‘ri.' }
  }
  if (input.size <= 0 || input.size > PRESENTATION_MAX_BYTES) {
    return { ok: false, error: 'Fayl hajmi 25 MB dan oshmasligi kerak.' }
  }
  if ((project.presentationFiles?.length ?? 0) >= 10) {
    return { ok: false, error: 'Fayllar soni chegarasiga yetdingiz (10 ta).' }
  }

  await adminDb()
    .collection(COL.projects)
    .doc(project.id)
    .set(
      {
        presentationFiles: FieldValue.arrayUnion({
          name: input.name.slice(0, 120),
          path: input.path,
          uploadedBy: user.uid,
          at: new Date(),
        }),
      },
      { merge: true }
    )

  await logEvent(user, 'project_contribution', {
    projectId: project.id,
    kind: 'presentation_upload',
    size: input.size,
  })

  revalidatePath(`/student/projects/${project.id}`)
  return { ok: true, data: { count: (project.presentationFiles?.length ?? 0) + 1 } }
}

/* ------------------------------------------------------------------ */
/* Loyihani topshirish                                                 */
/* ------------------------------------------------------------------ */

export async function submitProjectAction(
  projectId: string
): Promise<ActionResult<{ status: ProjectDoc['status'] }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const project = await loadProjectIfMember(projectId, user.uid)
  if (!project) return { ok: false, error: 'Bu loyiha sizga tegishli emas.', code: 'forbidden' }
  if (project.status !== 'active') {
    return { ok: false, error: 'Loyiha allaqachon topshirilgan.', code: 'already_submitted' }
  }
  if (!project.report?.trim() && !project.solution?.trim()) {
    return {
      ok: false,
      error: 'Topshirishdan oldin kamida yechim yoki hisobot matnini yozing.',
      code: 'empty',
    }
  }

  const db = adminDb()
  await db
    .collection(COL.projects)
    .doc(project.id)
    .set({ status: 'submitted', submittedAt: FieldValue.serverTimestamp() }, { merge: true })

  // O'qituvchiga bildirishnoma (PLAN 8.17 — baholash navbati).
  if (project.groupId) {
    const groupSnap = await db.collection(COL.groups).doc(project.groupId).get()
    const teacherId = (groupSnap.data() as { teacherId?: string } | undefined)?.teacherId
    if (teacherId) {
      await db
        .collection(COL.notifications)
        .doc(teacherId)
        .collection('items')
        .add({
          type: 'project_submitted',
          text: `«${project.title}» loyihasi baholash uchun topshirildi.`,
          link: `/teacher/review?project=${project.id}`,
          read: false,
          ts: FieldValue.serverTimestamp(),
        })
    }
  }

  await logEvent(user, 'project_contribution', {
    projectId: project.id,
    kind: 'submit',
    caseStudyId: project.caseStudyId,
    members: project.memberUids.length,
    reportWords: wordCount(project.report ?? ''),
    solutionWords: wordCount(project.solution ?? ''),
  })
  await awardXp(user, PROJECT_SUBMIT_XP, 'project_submit', project.id)

  revalidatePath('/student/projects')
  revalidatePath(`/student/projects/${project.id}`)
  return { ok: true, data: { status: 'submitted' } }
}
