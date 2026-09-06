import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

import { APP_NAME } from '@/config/constants'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          {APP_NAME}
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="p-4 text-center text-xs text-muted-foreground">
        O&lsquo;zbekiston davlat jahon tillari universiteti &middot; DSc tadqiqot platformasi
      </footer>
    </div>
  )
}
