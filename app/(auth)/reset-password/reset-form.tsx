'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendPasswordResetEmail } from 'firebase/auth'
import { MailCheck, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getFirebaseAuth } from '@/lib/firebase/client'

export function ResetForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
      setSent(true)
    } catch {
      // Xavfsizlik uchun mavjud/mavjud emasligini oshkor qilmaymiz
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Alert variant="info">
        <MailCheck className="size-4" />
        <AlertTitle>Xat yuborildi</AlertTitle>
        <AlertDescription>
          Agar bu email tizimda mavjud bo‘lsa, parolni tiklash havolasi yuborildi. Pochtangizni
          tekshiring (spam papkasini ham).{' '}
          <Link href="/login" className="font-medium underline">
            Kirish sahifasi
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Elektron pochta</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" loading={loading}>
        <Send />
        Tiklash havolasini yuborish
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kirishga qaytish
        </Link>
      </p>
    </form>
  )
}
