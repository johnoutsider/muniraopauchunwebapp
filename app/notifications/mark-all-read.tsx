'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

/** Barcha bildirishnomalarni o'qilgan deb belgilaydi (/api/notifications). */
export function MarkAllReadButton() {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function markAll() {
    setPending(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        toast.error('Belgilab bo‘lmadi. Qaytadan urinib ko‘ring.')
        return
      }
      router.refresh()
    } catch {
      toast.error('Tarmoq xatosi.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={markAll} loading={pending}>
      <CheckCheck />
      Hammasini o‘qilgan deb belgilash
    </Button>
  )
}
