import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <FileQuestion className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Sahifa topilmadi</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Havola eskirgan yoki sahifa ko&lsquo;chirilgan bo&lsquo;lishi mumkin.
      </p>
      <Button asChild>
        <Link href="/">Bosh sahifaga qaytish</Link>
      </Button>
    </div>
  )
}
