import { NextResponse } from 'next/server'

import { adminBucket, adminDb, FieldValue } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/firebase/session'
import { checkFlag } from '@/lib/flags'
import { assessPronunciation, problematicPhonemes } from '@/lib/speech/azure'
import { AUDIO, COL, XP } from '@/config/constants'
import { awardXp, bumpDailyStats, logEvent } from '@/lib/analytics/events'
import type { SpeakingSubmissionDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Talaffuzni baholash: audio → Azure Pronunciation Assessment → Firestore.
 * AI pedagogik izohi alohida `/api/ai/speaking-feedback` orqali olinadi,
 * chunki u nazorat guruhi uchun o'chirilgan (PLAN 1.5, 8.3).
 */
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi.' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Fayl yuborilmadi.' }, { status: 400 })
  }

  const file = form.get('audio')
  const referenceText = (form.get('referenceText') as string | null)?.trim() || undefined
  const taskId = (form.get('taskId') as string | null) ?? 'free-speech'
  const taskTitle = (form.get('taskTitle') as string | null) ?? 'Talaffuz mashqi'
  const type = ((form.get('type') as string | null) ?? 'sentence') as SpeakingSubmissionDoc['type']
  const durationSec = Number(form.get('durationSec') ?? 0)

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Audio fayl topilmadi.' }, { status: 400 })
  }
  if (file.size > AUDIO.MAX_BYTES) {
    return NextResponse.json({ error: 'Audio hajmi juda katta (maks 8 MB).' }, { status: 413 })
  }
  if (durationSec > AUDIO.MAX_DURATION_SEC + 5) {
    return NextResponse.json(
      { error: `Yozuv juda uzun (maks ${AUDIO.MAX_DURATION_SEC} soniya).` },
      { status: 413 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const db = adminDb()

  // Nechanchi urinish ekanini aniqlaymiz (Record → Analyze → Feedback → Retry)
  const previous = await db
    .collection(COL.speakingSubmissions)
    .where('uid', '==', user.uid)
    .where('taskId', '==', taskId)
    .count()
    .get()
  const attemptNo = (previous.data().count ?? 0) + 1

  // Audioni Storage'ga saqlaymiz (o'qituvchi keyin eshitadi)
  const path = `speaking/${user.uid}/${Date.now()}-${taskId}.wav`
  try {
    await adminBucket()
      .file(path)
      .save(buffer, {
        contentType: 'audio/wav',
        metadata: { metadata: { uid: user.uid, taskId } },
      })
  } catch (err) {
    console.error('[speech/assess] storage upload failed', err)
  }

  let assessment
  try {
    assessment = await assessPronunciation({ audio: buffer, referenceText })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Talaffuzni baholab bo‘lmadi.'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const doc: Partial<SpeakingSubmissionDoc> = {
    uid: user.uid,
    participantCode: user.participantCode,
    expGroup: user.expGroup,
    taskId,
    taskTitle,
    type,
    audioPath: path,
    durationSec,
    referenceText,
    transcript: assessment.recognizedText,
    azure: assessment,
    attemptNo,
    ts: FieldValue.serverTimestamp() as never,
  }

  const ref = await db.collection(COL.speakingSubmissions).add(doc)

  await Promise.all([
    logEvent(user, 'speaking_submit', {
      taskId,
      type,
      attemptNo,
      pronScore: assessment.pronScore,
      accuracy: assessment.accuracyScore,
      fluency: assessment.fluencyScore,
      completeness: assessment.completenessScore,
      prosody: assessment.prosodyScore ?? null,
      durationSec,
    }),
    bumpDailyStats(user, { speakingSubmissions: 1 }),
    awardXp(user, XP.SPEAKING_SUBMIT, 'speaking_submit', ref.id),
  ])

  const aiEnabled = await checkFlag(user, 'pronunciationAI')

  return NextResponse.json({
    id: ref.id,
    assessment,
    problematicSounds: problematicPhonemes(assessment),
    attemptNo,
    aiFeedbackAvailable: aiEnabled,
  })
}
