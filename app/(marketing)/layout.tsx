import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

import { APP_NAME } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { getSessionUser } from '@/lib/firebase/session'

/** Sessiyaga qarab «Kirish» yoki «Kabinet» ko'rsatiladi — sahifa dinamik. */
export const dynamic = 'force-dynamic'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="hidden sm:inline">{APP_NAME}</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/about">Metodika</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={user ? '/redirect' : '/login'}>{user ? 'Kabinet' : 'Kirish'}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {APP_NAME} &middot; O&lsquo;zbekiston davlat jahon tillari universiteti &middot; DSc
            tadqiqot platformasi
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground">
              Metodika
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Maxfiylik
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
