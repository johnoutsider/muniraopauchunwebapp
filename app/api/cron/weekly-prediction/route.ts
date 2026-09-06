import { NextResponse } from 'next/server'

import { predictProgress } from '@/lib/analytics/aggregate'
import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

/** Haftalik AI Progress Prediction (PLAN 6, 7.2). */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 401 })
  }

  try {
    const students = await adminDb()
      .collection(COL.users)
      .where('role', '==', 'student')
      .where('status', '==', 'active')
      .select('uid')
      .get()

    let done = 0
    let failed = 0

    // Ketma-ket bo'laklarda ishlaymiz — Firestore va xotira yukini cheklash uchun
    const uids = students.docs.map((d) => d.id)
    for (let i = 0; i < uids.length; i += 10) {
      const chunk = uids.slice(i, i + 10)
      const results = await Promise.allSettled(chunk.map((uid) => predictProgress(uid)))
      for (const result of results) {
        if (result.status === 'fulfilled') done += 1
        else failed += 1
      }
    }

    return NextResponse.json({ ok: true, students: uids.length, done, failed })
  } catch (err) {
    console.error('[cron/weekly-prediction] failed', err)
    return NextResponse.json({ ok: false, error: 'Prognoz bajarilmadi.' }, { status: 500 })
  }
}
