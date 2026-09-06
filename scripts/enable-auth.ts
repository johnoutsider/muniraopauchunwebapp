/**
 * enable-auth — Firebase Authentication ni yoqadi va Email/Password provayderini
 * ishga tushiradi.
 *
 * Firebase CLI da bu buyruq yo'q, shuning uchun Identity Platform Admin API ga
 * to'g'ridan-to'g'ri murojaat qilamiz. Token — `firebase login` bergan ruxsat.
 *
 * Ishlatish:
 *   npx tsx scripts/enable-auth.ts --project=<loyiha-id>
 */

import { c, log, parseArgs, runMain } from './_lib'
import { getCliAccessToken } from './google-auth'

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const project = args.get('project')
  if (!project) {
    log.error('--project=<loyiha-id> majburiy.')
    process.exitCode = 1
    return
  }

  log.title('Authentication sozlanmoqda')
  log.detail(`Loyiha: ${c.bold(project)}`)

  const token = await getCliAccessToken()
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }

  /* 1. Identity Platform konfiguratsiyasi bormi? ---------------------- */
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`
  let response = await fetch(configUrl, { headers })

  if (response.status === 404 || response.status === 403) {
    log.step('Identity Platform ishga tushirilmoqda...')
    const init = await fetch(
      `https://identitytoolkit.googleapis.com/v2/projects/${project}/identityPlatform:initializeAuth`,
      { method: 'POST', headers, body: '{}' }
    )
    const initJson = (await init.json()) as { error?: { message?: string } }
    if (initJson.error && !/already/i.test(initJson.error.message ?? '')) {
      log.warn(`Ishga tushirib bo‘lmadi: ${initJson.error.message}`)
      log.detail(
        `Konsolda qo‘lda yoqing: https://console.firebase.google.com/project/${project}/authentication/providers`
      )
      process.exitCode = 1
      return
    }
    log.ok('Identity Platform yoqildi.')
    response = await fetch(configUrl, { headers })
  } else {
    log.ok('Authentication allaqachon yoqilgan.')
  }

  /* 2. Email/Password provayderi -------------------------------------- */
  log.step('Email/Password provayderi yoqilmoqda...')
  const patch = await fetch(`${configUrl}?updateMask=signIn.email`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      signIn: { email: { enabled: true, passwordRequired: true } },
    }),
  })
  const patchJson = (await patch.json()) as { error?: { message?: string }; signIn?: unknown }

  if (patchJson.error) {
    log.warn(`Provayderni yoqib bo‘lmadi: ${patchJson.error.message}`)
    log.detail(
      `Konsolda qo‘lda yoqing: https://console.firebase.google.com/project/${project}/authentication/providers`
    )
    process.exitCode = 1
    return
  }
  log.ok('Email/Password yoqildi.')

  /* 3. Ruxsat etilgan domenlar ---------------------------------------- */
  log.step('Ruxsat etilgan domenlar tekshirilmoqda...')
  const current = (await (await fetch(configUrl, { headers })).json()) as {
    authorizedDomains?: string[]
  }
  const domains = new Set(current.authorizedDomains ?? [])
  const before = domains.size
  domains.add('localhost')
  domains.add(`${project}.firebaseapp.com`)
  domains.add(`${project}.web.app`)

  if (domains.size !== before) {
    await fetch(`${configUrl}?updateMask=authorizedDomains`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ authorizedDomains: [...domains] }),
    })
  }
  log.ok(`Ruxsat etilgan domenlar: ${[...domains].join(', ')}`)
  log.blank()
  log.info('Vercel domeni tayyor bo‘lgach uni ham shu ro‘yxatga qo‘shish kerak.')
}

runMain(main)
