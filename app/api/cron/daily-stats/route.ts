import { NextResponse } from 'next/server'

import { aggregateAllGroupsDay } from '@/lib/analytics/aggregate'
import { dayKey } from '@/lib/utils/format'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  const header = request.headers.get('authorization')
  return header === `Bearer ${secret}`
}

/** Kunlik agregatsiya: statsDaily → statsGroupDaily (Vercel Cron). */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 401 })
  }

  // Kechagi kunni yakunlaymiz (kun to'liq tugagan bo'lishi uchun)
  const date = dayKey(new Date(Date.now() - 86400000))

  try {
    const groups = await aggregateAllGroupsDay(date)
    return NextResponse.json({ ok: true, date, groups: groups.length })
  } catch (err) {
    console.error('[cron/daily-stats] failed', err)
    return NextResponse.json({ ok: false, error: 'Agregatsiya bajarilmadi.' }, { status: 500 })
  }
}
