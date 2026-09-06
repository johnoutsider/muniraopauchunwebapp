import { NextResponse } from 'next/server'

import { destroySession, getSessionUser } from '@/lib/firebase/session'
import { logEvent } from '@/lib/analytics/events'

export const runtime = 'nodejs'

export async function POST() {
  const user = await getSessionUser()
  if (user) await logEvent(user, 'logout', {})
  await destroySession()
  return NextResponse.json({ ok: true })
}
