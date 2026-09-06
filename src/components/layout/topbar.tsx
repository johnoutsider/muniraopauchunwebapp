'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, Settings, Sparkles, User as UserIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { APP_NAME, ROLE_HOME } from '@/config/constants'
import type { SessionUser } from '@/types'
import { cn } from '@/lib/utils/cn'
import { initials } from '@/lib/utils/format'

import { LocaleSwitcher } from './locale-switcher'
import { ThemeToggle } from './theme-toggle'

export interface TopbarProps {
  user: SessionUser
  unreadCount?: number
  /** Qidiruv sloti (sahifaga xos) */
  search?: React.ReactNode
  /** Mobil menyuni ochish (AppShell beradi) */
  onMenuClick?: () => void
  className?: string
}

export function Topbar({ user, unreadCount = 0, search, onMenuClick, className }: TopbarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const settingsHref = user.role === 'student' ? '/student/settings' : '/settings'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* tarmoq xatosi bo‘lsa ham login sahifasiga o‘tamiz */
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4',
        className
      )}
    >
      {onMenuClick ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Menyuni ochish"
        >
          <Menu className="size-5" />
        </Button>
      ) : null}

      <Link
        href={ROLE_HOME[user.role]}
        className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <span className="hidden text-sm font-semibold sm:inline">{APP_NAME}</span>
      </Link>

      <div className="min-w-0 flex-1">{search}</div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          asChild
        >
          <Link href="/notifications" aria-label="Bildirishnomalar">
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <Badge
                variant="danger"
                className="absolute -right-0.5 -top-0.5 min-w-4 justify-center px-1 py-0 text-[10px] leading-4"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            ) : null}
          </Link>
        </Button>

        <ThemeToggle />
        <LocaleSwitcher locale={user.locale} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-1 rounded-full"
              aria-label="Foydalanuvchi menyusi"
            >
              <Avatar className="size-8">
                {user.photoURL ? <AvatarImage src={user.photoURL} alt={user.displayName} /> : null}
                <AvatarFallback>{initials(user.displayName || user.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="text-foreground">
              <span className="block truncate text-sm font-medium">{user.displayName}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user.participantCode ? `${user.participantCode} · ` : ''}
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={settingsHref}>
                  <Settings />
                  <span>Sozlamalar</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={loggingOut}
              onSelect={(event) => {
                event.preventDefault()
                void handleLogout()
              }}
            >
              <LogOut />
              <span>Chiqish</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
