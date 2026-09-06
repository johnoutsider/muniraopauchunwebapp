import type { Metadata } from 'next'
import { Plus, ShieldCheck, UserCheck, Users, UserX } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { requireUser } from '@/lib/firebase/session'

import { UserFormDialog } from '@/features/admin/components/user-form-dialog'
import { UsersTable } from '@/features/admin/components/users-table'
import { listAdminCohorts, listAdminGroups, listAdminUsers } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Foydalanuvchilar' }
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireUser(['admin'])

  const [users, groups, cohorts] = await Promise.all([
    listAdminUsers(),
    listAdminGroups(),
    listAdminCohorts(),
  ])

  const pending = users.filter((user) => user.status === 'pending').length
  const disabled = users.filter((user) => user.status === 'disabled').length
  const students = users.filter((user) => user.role === 'student').length

  const groupOptions = groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
  }))
  const cohortOptions = cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Foydalanuvchilar"
        description="Rollar, guruhlar, holat va parolni tiklash. Har bir o‘zgarish audit jurnaliga yoziladi."
        actions={
          <UserFormDialog
            groups={groupOptions}
            cohorts={cohortOptions}
            trigger={
              <Button>
                <Plus />
                Yangi foydalanuvchi
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami foydalanuvchilar"
          value={users.length}
          sublabel={`${students} ta talaba`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Tasdiq kutmoqda"
          value={pending}
          sublabel={pending ? 'ro‘yxatdan o‘tgan, faollashtirilmagan' : 'navbat bo‘sh'}
          icon={<UserCheck className="size-4" />}
          tone={pending ? 'warning' : 'success'}
        />
        <StatCard
          label="Bloklangan"
          value={disabled}
          sublabel="tizimga kira olmaydi"
          icon={<UserX className="size-4" />}
          tone={disabled ? 'danger' : 'default'}
        />
        <StatCard
          label="Xodimlar"
          value={users.filter((user) => user.role !== 'student').length}
          sublabel="o‘qituvchi, tadqiqotchi, admin"
          icon={<ShieldCheck className="size-4" />}
        />
      </div>

      <Alert variant="info">
        <AlertDescription>
          Platforma parolni <strong>hech qachon ko‘rsatmaydi va o‘rnatmaydi</strong>. Yangi
          foydalanuvchi hisobi tasodifiy parol bilan yaratiladi; foydalanuvchi «Parolni tiklash»
          tugmasi orqali yuborilgan Firebase xati bilan parolni o‘zi belgilaydi.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilar ro‘yxati</CardTitle>
          <CardDescription>
            Qidiruv barcha ustunlar bo‘yicha ishlaydi. Bir nechta qatorni belgilab ommaviy amal
            bajarish mumkin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable rows={users} groups={groupOptions} cohorts={cohortOptions} />
        </CardContent>
      </Card>
    </div>
  )
}
