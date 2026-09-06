import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Deploy tekshiruvi: qaysi tashqi xizmatlar sozlangan. Sirlar oshkor qilinmaydi. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    services: {
      firebaseAdmin: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT
      ),
      firebaseClient: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      azureSpeech: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
      appCheck: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY),
      cron: Boolean(process.env.CRON_SECRET),
    },
  })
}
