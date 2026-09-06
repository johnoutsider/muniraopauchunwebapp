'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { openGroupChannelAction } from './actions'

/** Guruh kanali hali ochilmagan bo'lsa — uni yaratadi (server a'zolikni tekshiradi). */
export function OpenGroupChannelButton({
  groupId,
  label = 'Guruh kanalini ochish',
}: {
  groupId: string
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function open() {
    setLoading(true)
    const result = await openGroupChannelAction(groupId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <Button onClick={() => void open()} loading={loading}>
      <UsersRound />
      {label}
    </Button>
  )
}
