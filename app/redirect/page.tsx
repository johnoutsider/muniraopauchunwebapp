import { redirect } from 'next/navigation'

import { ROLE_HOME } from '@/config/constants'
import { getSessionUser } from '@/lib/firebase/session'

/** Kirgandan keyin rolga qarab yo'naltirish. */
export default async function RedirectPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  redirect(ROLE_HOME[user.role])
}
