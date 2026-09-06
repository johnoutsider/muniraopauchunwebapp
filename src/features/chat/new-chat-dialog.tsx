'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GraduationCap, MessageSquarePlus, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { SearchInput } from '@/components/shared/search-input'
import { initials } from '@/lib/utils/format'

import { startDirectChatAction } from './actions'
import type { ChatCandidate } from './types'

/** «Yangi suhbat»: sinfdosh yoki guruh o'qituvchisi bilan DM ochish. */
export function NewChatDialog({ candidates }: { candidates: ChatCandidate[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [pendingUid, setPendingUid] = React.useState<string | null>(null)

  const filtered = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  async function start(candidate: ChatCandidate) {
    setPendingUid(candidate.uid)
    const result = await startDirectChatAction(candidate.uid)
    setPendingUid(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setOpen(false)
    router.push(`/student/communication/chats/${result.data.chatId}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus />
          Yangi suhbat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi suhbat</DialogTitle>
          <DialogDescription>
            O‘z guruhingiz talabasi yoki guruh o‘qituvchingiz bilan yozishishingiz mumkin.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <EmptyState
            title="Suhbatdosh topilmadi"
            description="Siz hali guruhga biriktirilmagansiz yoki guruhda boshqa talaba yo‘q."
          />
        ) : (
          <div className="space-y-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Ism bo‘yicha qidirish…"
              delay={150}
            />
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {filtered.map((candidate) => (
                <li key={candidate.uid}>
                  <button
                    type="button"
                    disabled={pendingUid !== null}
                    onClick={() => void start(candidate)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:opacity-60"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(candidate.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{candidate.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {candidate.role === 'teacher' ? (
                          <>
                            <GraduationCap className="size-3" /> O‘qituvchi
                          </>
                        ) : (
                          <>
                            <User className="size-3" /> Sinfdosh
                          </>
                        )}
                        {candidate.existingChatId ? ' · suhbat mavjud' : ''}
                      </span>
                    </span>
                    {pendingUid === candidate.uid ? (
                      <span className="text-xs text-muted-foreground">ochilmoqda…</span>
                    ) : null}
                  </button>
                </li>
              ))}
              {filtered.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Hech kim topilmadi.
                </li>
              ) : null}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
