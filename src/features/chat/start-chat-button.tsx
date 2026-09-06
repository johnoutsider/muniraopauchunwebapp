'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { startDirectChatAction } from './actions'

/** Aniq bir foydalanuvchi bilan suhbat ochish (masalan, guruh o'qituvchisi). */
export function StartChatButton({
  targetUid,
  label,
  variant = 'outline',
  className,
}: {
  targetUid: string
  label: string
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function start() {
    setLoading(true)
    const result = await startDirectChatAction(targetUid)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.push(`/student/communication/chats/${result.data.chatId}`)
    router.refresh()
  }

  return (
    <Button variant={variant} className={className} loading={loading} onClick={() => void start()}>
      {label}
    </Button>
  )
}
