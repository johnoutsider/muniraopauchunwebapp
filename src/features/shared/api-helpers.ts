import 'server-only'

import { NextResponse } from 'next/server'
import type { z } from 'zod'

import { getSessionUser } from '@/lib/firebase/session'
import { checkFlag } from '@/lib/flags'
import type { FeatureFlags, SessionUser, ActionResult } from '@/types'

/**
 * API route'lar uchun umumiy qatlam: autentifikatsiya → feature flag →
 * so'rov validatsiyasi. Nazorat guruhi AI route'lariga umuman kira olmaydi
 * (PLAN 1.5, 7.4) — UI'da yashirish yetarli emas.
 */

export type RouteContext<T> = {
  user: SessionUser
  body: T
}

export async function guardRoute<S extends z.ZodTypeAny>(
  request: Request,
  options: { schema: S; flag?: keyof FeatureFlags; roles?: SessionUser['role'][] }
): Promise<{ ok: true; ctx: RouteContext<z.infer<S>> } | { ok: false; response: NextResponse }> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Avtorizatsiya talab qilinadi.' }, { status: 401 }),
    }
  }

  if (options.roles && !options.roles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 403 }),
    }
  }

  if (options.flag && !(await checkFlag(user, options.flag))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Bu imkoniyat sizning guruhingiz uchun yoqilmagan.', code: 'flag_disabled' },
        { status: 403 }
      ),
    }
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'So‘rov formati noto‘g‘ri.' }, { status: 400 }),
    }
  }

  const parsed = options.schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'So‘rov maydonlari noto‘g‘ri.', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      ),
    }
  }

  return { ok: true, ctx: { user, body: parsed.data } }
}

/** AI xizmatining `ActionResult` javobini HTTP javobga aylantiradi. */
export function aiResponse<T>(result: ActionResult<T>): NextResponse {
  if (result.ok) return NextResponse.json(result.data)
  const status =
    result.code === 'quota_exceeded'
      ? 429
      : result.code === 'ai_not_configured'
        ? 503
        : result.code === 'empty_input'
          ? 400
          : 502
  return NextResponse.json({ error: result.error, code: result.code }, { status })
}

/** AI servislariga uzatiladigan foydalanuvchi (analitika uchun). */
export function analyticsUser(user: SessionUser) {
  return {
    uid: user.uid,
    participantCode: user.participantCode,
    expGroup: user.expGroup,
    groupId: user.groupId,
  }
}
