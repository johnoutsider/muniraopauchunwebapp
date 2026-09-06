'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import type { ActionResult, PortfolioItemDoc } from '@/types'

import { portfolioDocId, type PortfolioType } from './queries'

const TYPES: PortfolioType[] = ['writing', 'speaking', 'project', 'achievement', 'feedback']
const MAX_NOTE = 600

interface UpsertInput {
  type: string
  refId: string
  title: string
  preview?: string
  score?: number
}

function validate(input: UpsertInput): { type: PortfolioType; refId: string; title: string } | null {
  const type = input?.type as PortfolioType
  if (!TYPES.includes(type)) return null
  const refId = typeof input?.refId === 'string' ? input.refId.trim() : ''
  if (!refId || refId.length > 160) return null
  const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 200) : ''
  if (!title) return null
  return { type, refId, title }
}

/** Portfolio yozuvini «pin» qilish yoki olib tashlash (PLAN 8.13). */
export async function togglePinAction(
  input: UpsertInput & { pinned: boolean }
): Promise<ActionResult<{ pinned: boolean }>> {
  const user = await requireStudent()
  const valid = validate(input)
  if (!valid) return { ok: false, error: 'Portfolio yozuvi ma’lumotlari noto‘g‘ri.' }
  if (typeof input.pinned !== 'boolean') return { ok: false, error: 'Qiymat noto‘g‘ri.' }

  const id = portfolioDocId(valid.type, valid.refId)
  const doc: Partial<PortfolioItemDoc> = {
    uid: user.uid,
    type: valid.type,
    refId: valid.refId,
    title: valid.title,
    preview: typeof input.preview === 'string' ? input.preview.slice(0, 400) : undefined,
    score: typeof input.score === 'number' && Number.isFinite(input.score) ? input.score : undefined,
    pinned: input.pinned,
  }

  await adminDb()
    .collection(COL.portfolioItems)
    .doc(id)
    .set({ ...doc, updatedAt: FieldValue.serverTimestamp() }, { merge: true })

  revalidatePath('/student/portfolio')
  return { ok: true, data: { pinned: input.pinned } }
}

/** Yozuvga shaxsiy izoh qo'shish. */
export async function savePortfolioNoteAction(
  input: UpsertInput & { note: string }
): Promise<ActionResult<{ note: string }>> {
  const user = await requireStudent()
  const valid = validate(input)
  if (!valid) return { ok: false, error: 'Portfolio yozuvi ma’lumotlari noto‘g‘ri.' }

  const note = typeof input.note === 'string' ? input.note.trim().slice(0, MAX_NOTE) : ''

  const id = portfolioDocId(valid.type, valid.refId)
  await adminDb()
    .collection(COL.portfolioItems)
    .doc(id)
    .set(
      {
        uid: user.uid,
        type: valid.type,
        refId: valid.refId,
        title: valid.title,
        note,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

  revalidatePath('/student/portfolio')
  return { ok: true, data: { note } }
}
