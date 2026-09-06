'use client'

import { AppShell } from '@/components/layout/app-shell'
import { ADMIN_NAV, RESEARCHER_NAV, STUDENT_NAV, TEACHER_NAV } from '@/components/layout/nav-items'
import type { FeatureFlags, SessionUser } from '@/types'
import type { Role } from '@/config/constants'

const NAV_BY_ROLE = {
  student: STUDENT_NAV,
  teacher: TEACHER_NAV,
  researcher: RESEARCHER_NAV,
  admin: ADMIN_NAV,
} as const satisfies Record<Role, unknown>

/**
 * Rolga mos navigatsiyani tanlab AppShell'ni render qiladi.
 * Lucide ikonkalari funksiya bo'lgani uchun nav ro'yxati faqat klient tomonda
 * import qilinadi — server komponentdan prop sifatida uzatilmaydi.
 */
export function RoleShell({
  user,
  flags,
  unreadCount,
  children,
}: {
  user: SessionUser
  flags?: Partial<FeatureFlags>
  unreadCount?: number
  children: React.ReactNode
}) {
  return (
    <AppShell user={user} items={NAV_BY_ROLE[user.role]} flags={flags} unreadCount={unreadCount}>
      {children}
    </AppShell>
  )
}
