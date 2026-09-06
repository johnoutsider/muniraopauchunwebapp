'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL, XP } from '@/config/constants'
import { awardXp, bumpDailyStats, logEvent } from '@/lib/analytics/events'
import { wordCount } from '@/lib/utils/format'
import type { ActionResult, GroupDoc, WritingAiFeedback, WritingSubmissionDoc } from '@/types'

import { GENRE_ORDER, type WritingGenre } from './genres'

const MAX_TEXT_CHARS = 12_000
const MAX_DRAFTS = 20

function cleanText(value: unknown): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .slice(0, MAX_TEXT_CHARS)
}

function isGenre(value: unknown): value is WritingGenre {
  return typeof value === 'string' && (GENRE_ORDER as string[]).includes(value)
}

export interface SaveDraftInput {
  submissionId?: string
  taskId: string
  taskTitle: string
  genre: WritingGenre
  text: string
}

export interface SaveDraftResult {
  submissionId: string
  draftNo: number
  wordCount: number
  savedAt: number
}

/**
 * Qoralamani avtomatik saqlash (PLAN 8.5).
 * Oxirgi qoralama — joriy ish nusxasi: har avtosaqlash uni yangilaydi,
 * yangi qoralama esa faqat «Qayta ishlash» bosilganda qo'shiladi.
 */
export async function saveDraft(input: SaveDraftInput): Promise<ActionResult<SaveDraftResult>> {
  const user = await requireStudent()
  const text = cleanText(input.text)
  const words = wordCount(text)

  if (!isGenre(input.genre)) {
    return { ok: false, error: 'Janr noto‘g‘ri.', code: 'bad_input' }
  }
  if (!input.taskId) {
    return { ok: false, error: 'Topshiriq aniqlanmadi.', code: 'bad_input' }
  }

  const db = adminDb()

  try {
    /* Yangi topshiriq — hujjat yaratamiz */
    if (!input.submissionId) {
      const doc: Omit<WritingSubmissionDoc, 'createdAt'> & {
        createdAt: FirebaseFirestore.FieldValue
      } = {
        uid: user.uid,
        participantCode: user.participantCode,
        expGroup: user.expGroup,
        taskId: input.taskId,
        taskTitle: input.taskTitle.slice(0, 160),
        genre: input.genre,
        drafts: [{ text, wordCount: words, ts: Date.now() }],
        wordCount: words,
        status: 'draft',
        createdAt: FieldValue.serverTimestamp(),
      }
      const ref = await db.collection(COL.writingSubmissions).add(doc)
      return {
        ok: true,
        data: { submissionId: ref.id, draftNo: 1, wordCount: words, savedAt: Date.now() },
      }
    }

    /* Mavjud hujjat — oxirgi qoralamani yangilaymiz */
    const ref = db.collection(COL.writingSubmissions).doc(input.submissionId)
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() as WritingSubmissionDoc | undefined
      if (!snap.exists || !data || data.uid !== user.uid) {
        throw new Error('not_found')
      }
      if (data.status !== 'draft') {
        throw new Error('locked')
      }

      const drafts = [...(data.drafts ?? [])]
      const current = { text, wordCount: words, ts: Date.now() }
      if (drafts.length === 0) drafts.push(current)
      else drafts[drafts.length - 1] = { ...drafts[drafts.length - 1], ...current }

      tx.set(ref, { drafts, wordCount: words }, { merge: true })
      return drafts.length
    })

    return {
      ok: true,
      data: {
        submissionId: input.submissionId,
        draftNo: result,
        wordCount: words,
        savedAt: Date.now(),
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'not_found') {
      return { ok: false, error: 'Ish topilmadi yoki sizga tegishli emas.', code: 'not_found' }
    }
    if (message === 'locked') {
      return {
        ok: false,
        error: 'Bu ish allaqachon o‘qituvchiga yuborilgan — uni tahrirlab bo‘lmaydi.',
        code: 'locked',
      }
    }
    console.error('[writing] saveDraft failed', err)
    return { ok: false, error: 'Qoralamani saqlab bo‘lmadi.', code: 'internal' }
  }
}

/** AI feedbackini oxirgi qoralamaga biriktiradi (route qaytargan natija). */
export async function saveAiFeedback(input: {
  submissionId: string
  feedback: WritingAiFeedback
}): Promise<ActionResult<{ draftNo: number }>> {
  const user = await requireStudent()
  if (!input.submissionId) {
    return { ok: false, error: 'Ish aniqlanmadi.', code: 'bad_input' }
  }

  const db = adminDb()
  const ref = db.collection(COL.writingSubmissions).doc(input.submissionId)

  try {
    const draftNo = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() as WritingSubmissionDoc | undefined
      if (!snap.exists || !data || data.uid !== user.uid) throw new Error('not_found')

      const drafts = [...(data.drafts ?? [])]
      if (drafts.length === 0) throw new Error('not_found')
      drafts[drafts.length - 1] = { ...drafts[drafts.length - 1], aiFeedback: input.feedback }

      tx.set(ref, { drafts }, { merge: true })
      return drafts.length
    })

    return { ok: true, data: { draftNo } }
  } catch (err) {
    console.error('[writing] saveAiFeedback failed', err)
    return { ok: false, error: 'AI feedbackini saqlab bo‘lmadi.', code: 'internal' }
  }
}

/** «Qayta ishlash»: joriy matndan yangi qoralama ochadi (draft raqami oshadi). */
export async function startNewDraft(
  submissionId: string
): Promise<ActionResult<{ draftNo: number }>> {
  const user = await requireStudent()
  if (!submissionId) return { ok: false, error: 'Ish aniqlanmadi.', code: 'bad_input' }

  const db = adminDb()
  const ref = db.collection(COL.writingSubmissions).doc(submissionId)

  try {
    const draftNo = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() as WritingSubmissionDoc | undefined
      if (!snap.exists || !data || data.uid !== user.uid) throw new Error('not_found')
      if (data.status !== 'draft') throw new Error('locked')

      const drafts = [...(data.drafts ?? [])]
      if (drafts.length >= MAX_DRAFTS) throw new Error('too_many')

      const last = drafts[drafts.length - 1]
      drafts.push({ text: last?.text ?? '', wordCount: last?.wordCount ?? 0, ts: Date.now() })
      tx.set(ref, { drafts }, { merge: true })
      return drafts.length
    })

    await logEvent(user, 'writing_revise', { submissionId, draftNo })
    return { ok: true, data: { draftNo } }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'too_many') {
      return {
        ok: false,
        error: `Qoralamalar soni chegarasiga yetdi (${MAX_DRAFTS}). Ishni o‘qituvchiga yuboring.`,
        code: 'too_many',
      }
    }
    if (message === 'locked') {
      return {
        ok: false,
        error: 'Ish yuborilgan — yangi qoralama ochib bo‘lmaydi.',
        code: 'locked',
      }
    }
    console.error('[writing] startNewDraft failed', err)
    return { ok: false, error: 'Yangi qoralama ochib bo‘lmadi.', code: 'internal' }
  }
}

/** «O'qituvchiga yuborish»: status → submitted, o'qituvchiga bildirishnoma. */
export async function submitToTeacher(input: {
  submissionId: string
  text: string
}): Promise<ActionResult<{ status: 'submitted' }>> {
  const user = await requireStudent()
  const text = cleanText(input.text)
  const words = wordCount(text)

  if (!input.submissionId) return { ok: false, error: 'Ish aniqlanmadi.', code: 'bad_input' }
  if (words < 20) {
    return {
      ok: false,
      error: 'Matn juda qisqa — kamida 20 ta so‘z yozing.',
      code: 'too_short',
    }
  }

  const db = adminDb()
  const ref = db.collection(COL.writingSubmissions).doc(input.submissionId)

  try {
    const taskTitle = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() as WritingSubmissionDoc | undefined
      if (!snap.exists || !data || data.uid !== user.uid) throw new Error('not_found')
      if (data.status !== 'draft') throw new Error('already')

      const drafts = [...(data.drafts ?? [])]
      const current = { text, wordCount: words, ts: Date.now() }
      if (drafts.length === 0) drafts.push(current)
      else drafts[drafts.length - 1] = { ...drafts[drafts.length - 1], ...current }

      tx.set(
        ref,
        {
          drafts,
          finalText: text,
          wordCount: words,
          status: 'submitted',
          groupId: user.groupId ?? null,
          submittedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      return data.taskTitle
    })

    /* O'qituvchini xabardor qilamiz */
    try {
      if (user.groupId) {
        const groupSnap = await db.collection(COL.groups).doc(user.groupId).get()
        const teacherId = (groupSnap.data() as GroupDoc | undefined)?.teacherId
        if (teacherId) {
          await db
            .collection(COL.notifications)
            .doc(teacherId)
            .collection('items')
            .add({
              type: 'writing_submitted',
              text: `${user.displayName}: «${taskTitle}» yozma ishi baholashga yuborildi.`,
              link: `/teacher/review?submission=${input.submissionId}`,
              read: false,
              ts: FieldValue.serverTimestamp(),
            })
        }
      }
    } catch (err) {
      console.error('[writing] teacher notification failed', err)
    }

    await Promise.all([
      logEvent(user, 'writing_submit', {
        submissionId: input.submissionId,
        wordCount: words,
      }),
      bumpDailyStats(user, { writingSubmissions: 1 }),
      awardXp(user, XP.WRITING_SUBMIT, 'writing_submit', input.submissionId),
    ])

    revalidatePath('/student/writing-lab')
    revalidatePath(`/student/writing-lab/${input.submissionId}`)
    return { ok: true, data: { status: 'submitted' } }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'already') {
      return { ok: false, error: 'Bu ish allaqachon yuborilgan.', code: 'already' }
    }
    if (message === 'not_found') {
      return { ok: false, error: 'Ish topilmadi.', code: 'not_found' }
    }
    console.error('[writing] submitToTeacher failed', err)
    return { ok: false, error: 'Ishni yuborib bo‘lmadi.', code: 'internal' }
  }
}
