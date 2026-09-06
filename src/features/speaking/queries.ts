import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { problematicPhonemes } from '@/lib/speech/azure'
import {
  getLearningPath,
  getUserDoc,
  listCaseStudies,
  listLexicon,
} from '@/features/shared/queries'
import { COL, type CefrLevel } from '@/config/constants'
import { toMillis } from '@/lib/utils/format'
import type { SessionUser, SpeakingSubmissionDoc } from '@/types'

import { BUILTIN_TASKS } from './tasks'
import type {
  AttemptSummary,
  ProblematicSound,
  SpeakingLabData,
  SpeakingTask,
  SubmissionDetail,
} from './types'

/* ------------------------------------------------------------------ */
/* Topshiriqlar                                                        */
/* ------------------------------------------------------------------ */

/** Lexicon'dagi IPA'li so'zlardan «alohida so'z» topshiriqlari. */
async function lexiconTasks(cefr: CefrLevel): Promise<SpeakingTask[]> {
  try {
    const words = await listLexicon({ limit: 120 })
    return words
      .filter((word) => Boolean(word.ipa) && Boolean(word.word))
      .slice(0, 24)
      .map<SpeakingTask>((word) => ({
        id: `lex-${word.id}`,
        type: 'word',
        title: word.word,
        referenceText: word.word,
        ipa: word.ipa,
        instruction:
          word.professionalContext?.slice(0, 160) ||
          'Transkripsiyaga qarab urg‘uni to‘g‘ri qo‘ying va so‘zni aniq talaffuz qiling.',
        source: 'lexicon',
        cefr: word.cefr ?? cefr,
      }))
  } catch (err) {
    console.error('[speaking] lexiconTasks failed', err)
    return []
  }
}

/** Case study'lardan prezentatsiya topshiriqlari. */
async function caseTasks(): Promise<SpeakingTask[]> {
  try {
    const cases = await listCaseStudies()
    return cases.slice(0, 8).map<SpeakingTask>((item) => ({
      id: `case-${item.id}`,
      type: 'presentation',
      title: item.title,
      referenceText: '',
      instruction: `${item.scenario.slice(0, 260)} — vaziyatni tahlil qilib, 60–120 soniyada o‘z yechimingizni taqdim eting.`,
      minSeconds: 60,
      source: 'case',
      cefr: item.cefr,
    }))
  } catch (err) {
    console.error('[speaking] caseTasks failed', err)
    return []
  }
}

/** O'quv yo'nalishidagi speaking qadamlari. */
async function pathTasks(uid: string): Promise<SpeakingTask[]> {
  try {
    const path = await getLearningPath(uid)
    return (path?.steps ?? [])
      .filter((step) => step.kind === 'speaking' && step.status !== 'done')
      .slice(0, 6)
      .map<SpeakingTask>((step) => ({
        id: `path-${step.id}`,
        type: 'presentation',
        title: step.title,
        referenceText: '',
        instruction: `${step.reason} — 60–120 soniya davomida ingliz tilida gapiring.`,
        minSeconds: 60,
        source: 'path',
      }))
  } catch (err) {
    console.error('[speaking] pathTasks failed', err)
    return []
  }
}

/* ------------------------------------------------------------------ */
/* Urinishlar                                                          */
/* ------------------------------------------------------------------ */

function toAttempt(id: string, data: SpeakingSubmissionDoc): AttemptSummary {
  return {
    id,
    taskId: data.taskId,
    taskTitle: data.taskTitle,
    type: data.type,
    attemptNo: data.attemptNo ?? 1,
    pronScore: Math.round(data.azure?.pronScore ?? 0),
    accuracyScore: Math.round(data.azure?.accuracyScore ?? 0),
    fluencyScore: Math.round(data.azure?.fluencyScore ?? 0),
    completenessScore: Math.round(data.azure?.completenessScore ?? 0),
    prosodyScore: data.azure?.prosodyScore != null ? Math.round(data.azure.prosodyScore) : null,
    durationSec: data.durationSec ?? 0,
    hasAiFeedback: Boolean(data.aiFeedback),
    ts: toMillis(data.ts),
  }
}

export const listRecentSpeakingAttempts = cache(
  async (uid: string, limit = 20): Promise<AttemptSummary[]> => {
    try {
      const snap = await adminDb()
        .collection(COL.speakingSubmissions)
        .where('uid', '==', uid)
        .orderBy('ts', 'desc')
        .limit(limit)
        .get()
      return snap.docs.map((doc) => toAttempt(doc.id, doc.data() as SpeakingSubmissionDoc))
    } catch (err) {
      console.error('[speaking] listRecentSpeakingAttempts failed', err)
      return []
    }
  }
)

/** Bitta topshiriq bo'yicha urinishlar tarixi (eskisidan yangisiga — trend chizig'i). */
export const listTaskAttempts = cache(
  async (uid: string, taskId: string, limit = 12): Promise<AttemptSummary[]> => {
    if (!taskId) return []
    try {
      const snap = await adminDb()
        .collection(COL.speakingSubmissions)
        .where('uid', '==', uid)
        .where('taskId', '==', taskId)
        .orderBy('attemptNo', 'desc')
        .limit(limit)
        .get()
      return snap.docs
        .map((doc) => toAttempt(doc.id, doc.data() as SpeakingSubmissionDoc))
        .reverse()
    } catch (err) {
      console.error('[speaking] listTaskAttempts failed', err)
      return []
    }
  }
)

/* ------------------------------------------------------------------ */
/* Sahifa ma'lumotlari                                                 */
/* ------------------------------------------------------------------ */

export const getSpeakingLabData = cache(async (user: SessionUser): Promise<SpeakingLabData> => {
  const userDoc = await getUserDoc(user.uid)
  const cefr: CefrLevel = userDoc?.onboarding?.selfAssessedLevel ?? 'B1'

  const [lexicon, cases, path, recentAttempts] = await Promise.all([
    lexiconTasks(cefr),
    caseTasks(),
    pathTasks(user.uid),
    listRecentSpeakingAttempts(user.uid),
  ])

  // O'quv yo'nalishi qadamlari birinchi, so'ng platforma to'plami, so'ng kontent bankidan
  const tasks: SpeakingTask[] = [...path, ...BUILTIN_TASKS, ...lexicon, ...cases]

  return { tasks, recentAttempts, cefr }
})

export const getSpeakingSubmission = cache(
  async (uid: string, submissionId: string): Promise<SubmissionDetail | null> => {
    try {
      const snap = await adminDb().collection(COL.speakingSubmissions).doc(submissionId).get()
      const data = snap.data() as SpeakingSubmissionDoc | undefined
      if (!snap.exists || !data || data.uid !== uid) return null

      const problems: ProblematicSound[] = data.azure ? problematicPhonemes(data.azure) : []

      return {
        id: snap.id,
        taskId: data.taskId,
        taskTitle: data.taskTitle,
        type: data.type,
        referenceText: data.referenceText ?? '',
        transcript: data.transcript ?? data.azure?.recognizedText ?? '',
        durationSec: data.durationSec ?? 0,
        attemptNo: data.attemptNo ?? 1,
        azure: data.azure ?? null,
        aiFeedback: data.aiFeedback ?? null,
        problematicSounds: problems,
        teacherFeedback: data.teacherFeedback
          ? { text: data.teacherFeedback.text, score: data.teacherFeedback.score }
          : null,
        ts: toMillis(data.ts),
      }
    } catch (err) {
      console.error('[speaking] getSpeakingSubmission failed', err)
      return null
    }
  }
)
