import { NextResponse } from 'next/server'

import { ROLE_HOME } from '@/config/constants'
import { destroySession, getSessionUser } from '@/lib/firebase/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Kirgandan keyin rolga qarab yo'naltirish.
 *
 * Route Handler (sahifa emas), chunki cookie o'chirish faqat shu yerda mumkin.
 * Yaroqsiz sessiya cookie (masalan, boshqa loyiha/emulyatordan qolgan) bo'lsa,
 * uni o'chiramiz — aks holda middleware /login ni /redirect ga, bu yer esa
 * /login ga qaytarib, cheksiz aylanma hosil bo'lardi.
 */
export async function GET(request: Request) {
  const user = await getSessionUser()
  const url = new URL(request.url)

  if (!user) {
    await destroySession()
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  return NextResponse.redirect(new URL(ROLE_HOME[user.role], url.origin))
}
