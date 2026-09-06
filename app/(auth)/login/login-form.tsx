'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { toast } from 'sonner'
import { LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { loginAction } from '@/features/auth/actions'

function authErrorToUz(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email yoki parol noto‘g‘ri.'
    case 'auth/too-many-requests':
      return 'Juda ko‘p urinish. Bir necha daqiqadan keyin qayta urinib ko‘ring.'
    case 'auth/user-disabled':
      return 'Bu hisob o‘chirilgan. Administratorga murojaat qiling.'
    case 'auth/network-request-failed':
      return 'Internet aloqasi yo‘q. Ulanishni tekshiring.'
    default:
      return 'Kirishda xatolik yuz berdi.'
  }
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      const idToken = await cred.user.getIdToken(true)
      const result = await loginAction(idToken)

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Xush kelibsiz!')
      const next = params.get('next')
      router.push(next && next.startsWith('/') ? next : result.data.home)
      router.refresh()
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      toast.error(authErrorToUz(code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Elektron pochta</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="talaba@uzswlu.uz"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Parol</Label>
          <Link href="/reset-password" className="text-xs text-primary hover:underline">
            Parolni unutdingizmi?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        <LogIn />
        Kirish
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Hisobingiz yo‘qmi?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Ro‘yxatdan o‘tish
        </Link>
      </p>
    </form>
  )
}
