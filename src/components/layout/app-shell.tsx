'use client'

import * as React from 'react'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { FeatureFlags, SessionUser } from '@/types'
import { cn } from '@/lib/utils/cn'

import { Sidebar, type NavItem } from './sidebar'
import { Topbar } from './topbar'

const COLLAPSE_KEY = 'le_sidebar_collapsed'

export interface AppShellProps {
  user: SessionUser
  items: NavItem[]
  flags?: Partial<FeatureFlags>
  unreadCount?: number
  /** Topbar qidiruv sloti */
  search?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function AppShell({
  user,
  items,
  flags,
  unreadCount,
  search,
  className,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {
      /* localStorage mavjud bo‘lmasligi mumkin */
    }
  }, [])

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        /* e'tiborsiz */
      }
      return next
    })
  }, [])

  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <Sidebar
          role={user.role}
          items={items}
          flags={flags}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobil sidebar — Sheet ichida */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:p-0">
          <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
          <div className="h-full pt-2">
            <Sidebar
              role={user.role}
              items={items}
              flags={flags}
              inSheet
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          unreadCount={unreadCount}
          search={search}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className={cn('min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6', className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
