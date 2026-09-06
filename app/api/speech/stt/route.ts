import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/firebase/session'
import { speechToText } from '@/lib/speech/azure'
import { AUDIO } from '@/config/constants'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Ovozli role-play va speaking topshiriqlari uchun transkript. */
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
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Audio fayl topilmadi.' }, { status: 400 })
  }
  if (file.size > AUDIO.MAX_BYTES) {
    return NextResponse.json({ error: 'Audio hajmi juda katta.' }, { status: 413 })
  }

  try {
    const result = await speechToText({ audio: Buffer.from(await file.arrayBuffer()) })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nutqni matnga aylantirib bo‘lmadi.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
