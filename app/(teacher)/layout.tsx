import { requireUser } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { RoleShell } from '@/features/shell/role-shell'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(['teacher', 'admin'])
  const flags = await resolveFlags(user)

  return (
    <RoleShell user={user} flags={flags}>
      {children}
    </RoleShell>
  )
}
