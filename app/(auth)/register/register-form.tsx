'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { toast } from 'sonner'
import { CheckCircle2, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { registerAction } from '@/features/auth/actions'

export function RegisterForm() {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    university: 'O‘zbekiston davlat jahon tillari universiteti',
    faculty: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Parol kamida 8 belgidan iborat bo‘lishi kerak.')
      return
    }
    setLoading(true)
    try {
      const auth = getFirebaseAuth()
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      await updateProfile(cred.user, { displayName: form.displayName.trim() })
      await sendEmailVerification(cred.user).catch(() => null)

      const idToken = await cred.user.getIdToken(true)
      const result = await registerAction({
        idToken,
        displayName: form.displayName.trim(),
        university: form.university,
        faculty: form.faculty,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      await auth.signOut()
      setDone(true)
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/email-already-in-use')
        toast.error('Bu email allaqachon ro‘yxatdan o‘tgan.')
      else if (code === 'auth/weak-password') toast.error('Parol juda oddiy.')
      else if (code === 'auth/invalid-email') toast.error('Email formati noto‘g‘ri.')
      else toast.error('Ro‘yxatdan o‘tishda xatolik.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4" />
        <AlertTitle>Ariza qabul qilindi</AlertTitle>
        <AlertDescription>
          Hisobingiz administrator tasdig‘ini kutmoqda. Tasdiqlangach, email orqali xabar olasiz va{' '}
          <Link href="/login" className="font-medium underline">
            tizimga kirishingiz
          </Link>{' '}
          mumkin bo‘ladi.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">F.I.Sh.</Label>
        <Input
          id="displayName"
          required
          value={form.displayName}
          onChange={(e) => set('displayName', e.target.value)}
          placeholder="Aliyev Alisher Alievich"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Elektron pochta</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="faculty">Fakultet / yo‘nalish</Label>
        <Input
          id="faculty"
          value={form.faculty}
          onChange={(e) => set('faculty', e.target.value)}
          placeholder="Iqtisodiyot"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Parol</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Kamida 8 belgi"
        />
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        <UserPlus />
        Ro‘yxatdan o‘tish
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </form>
  )
}
