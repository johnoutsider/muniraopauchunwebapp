'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLES, type Role } from '@/config/constants'

import { createUserAction, updateUserAction } from '../actions'
import type { AdminUserRow } from '../queries'

const ROLE_LABELS: Record<Role, string> = {
  student: 'Talaba',
  teacher: 'O‘qituvchi',
  researcher: 'Tadqiqotchi',
  admin: 'Administrator',
}

const NONE = '__none__'

export interface UserFormDialogProps {
  trigger: React.ReactNode
  user?: AdminUserRow
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
  cohorts: Array<{ id: string; name: string }>
}

export function UserFormDialog({ trigger, user, groups, cohorts }: UserFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [email, setEmail] = React.useState(user?.email ?? '')
  const [displayName, setDisplayName] = React.useState(user?.displayName ?? '')
  const [role, setRole] = React.useState<Role>(user?.role ?? 'student')
  const [groupId, setGroupId] = React.useState(user?.groupId ?? NONE)
  const [cohortId, setCohortId] = React.useState(NONE)
  const [university, setUniversity] = React.useState(user?.university ?? '')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = user
        ? await updateUserAction({
            uid: user.uid,
            displayName,
            role,
            groupId: groupId === NONE ? null : groupId,
            university,
          })
        : await createUserAction({
            email,
            displayName,
            role,
            groupId: groupId === NONE ? undefined : groupId,
            cohortId: cohortId === NONE ? undefined : cohortId,
            university,
          })

      if (result.ok) {
        toast.success(user ? 'Foydalanuvchi yangilandi' : 'Foydalanuvchi yaratildi')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
          </DialogTitle>
          <DialogDescription>
            Rol o‘zgarishi Firestore hujjatiga ham, Firebase custom claims’ga ham yoziladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={Boolean(user)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-name">F.I.Sh.</Label>
            <Input
              id="user-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {ROLE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Guruh</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlanmagan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.type === 'experimental' ? 'eksp.' : 'nazorat'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!user ? (
            <div className="space-y-1.5">
              <Label>Kohort</Label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlanmagan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="user-university">Universitet</Label>
            <Input
              id="user-university"
              value={university}
              onChange={(event) => setUniversity(event.target.value)}
            />
          </div>

          {!user ? (
            <Alert variant="info">
              <AlertDescription className="text-xs">
                Parol o‘rnatilmaydi va ko‘rsatilmaydi. Hisob yaratilgach ro‘yxatdagi «Parolni
                tiklash» tugmasi orqali foydalanuvchiga Firebase xati yuboriladi va u parolni o‘zi
                belgilaydi.
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" loading={pending}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
