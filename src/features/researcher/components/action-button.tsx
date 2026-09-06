'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ActionResult } from '@/types'

export interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Server action — `ActionResult` qaytarishi kerak */
  action: () => Promise<ActionResult<unknown>>
  successMessage?: string
  /** Tasdiqlash dialogi matni (berilsa — avval so'raladi) */
  confirmTitle?: string
  confirmDescription?: string
  onDone?: (result: ActionResult<unknown>) => void
}

/**
 * Server action'ni chaqiradigan tugma: yuklanish holati, toast xabari va
 * (ixtiyoriy) tasdiqlash dialogi bilan.
 */
export function ActionButton({
  action,
  successMessage = 'Bajarildi',
  confirmTitle,
  confirmDescription,
  onDone,
  children,
  ...props
}: ActionButtonProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  async function run() {
    setPending(true)
    try {
      const result = await action()
      if (result.ok) {
        toast.success(successMessage)
        router.refresh()
      } else {
        toast.error(result.error)
      }
      onDone?.(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kutilmagan xatolik')
    } finally {
      setPending(false)
      setOpen(false)
    }
  }

  if (!confirmTitle) {
    return (
      <Button {...props} loading={pending} onClick={() => void run()}>
        {children}
      </Button>
    )
  }

  return (
    <>
      <Button {...props} loading={pending} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            {confirmDescription ? (
              <DialogDescription>{confirmDescription}</DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant={props.variant === 'destructive' ? 'destructive' : 'default'}
              loading={pending}
              onClick={() => void run()}
            >
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
