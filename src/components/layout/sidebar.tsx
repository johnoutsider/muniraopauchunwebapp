'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, PanelLeft, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { APP_NAME, STAGE_META, type Role, type Stage } from '@/config/constants'
import type { FeatureFlags } from '@/types'
import { cn } from '@/lib/utils/cn'

import { NavLink, isPathActive } from './nav-link'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
  flag?: keyof FeatureFlags
  stage?: number
}

const ROLE_LABEL: Record<Role, string> = {
  student: 'Talaba',
  teacher: 'O‘qituvchi',
  researcher: 'Tadqiqotchi',
  admin: 'Administrator',
}

const PHASE_LABEL: Record<'organizational' | 'practical' | 'reflective', string> = {
  organizational: 'Tayyorgarlik',
  practical: 'O‘rganish va mashq',
  reflective: 'Baholash va refleksiya',
}

/** Bosqich raqamidan bo‘lim sarlavhasini aniqlaydi (PLAN 5-bo‘lim, 8 bosqich). */
function groupTitle(stage?: number): string | null {
  if (!stage) return null
  const meta = STAGE_META[stage as Stage]
  return meta ? PHASE_LABEL[meta.phase] : null
}

/** Ketma-ket elementlarni sarlavha bo‘yicha guruhlaydi (tartib saqlanadi). */
export function groupNavItems(items: NavItem[]): Array<{ title: string | null; items: NavItem[] }> {
  const groups: Array<{ title: string | null; items: NavItem[] }> = []
  for (const item of items) {
    const title = groupTitle(item.stage)
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.items.push(item)
    else groups.push({ title, items: [item] })
  }
  return groups
}

/** Flag o‘chirilgan bo‘lsa element umuman render qilinmaydi (nazorat guruhi — PLAN 1.5). */
export function filterNavItems(items: NavItem[], flags?: Partial<FeatureFlags>): NavItem[] {
  if (!flags) return items
  return items.filter((item) => (item.flag ? flags[item.flag] !== false : true))
}

export interface SidebarProps {
  role: Role
  items: NavItem[]
  flags?: Partial<FeatureFlags>
  /** Desktopda tor rejim */
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Mobil Sheet ichida — havola bosilganda yopish uchun */
  onNavigate?: () => void
  /** Sheet ichida ishlatilganda ramka/kenglik berilmaydi */
  inSheet?: boolean
  className?: string
}

export function Sidebar({
  role,
  items,
  flags,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  inSheet = false,
  className,
}: SidebarProps) {
  const visible = React.useMemo(() => filterNavItems(items, flags), [items, flags])
  const groups = React.useMemo(() => groupNavItems(visible), [visible])
  const isCollapsed = collapsed && !inSheet

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Asosiy navigatsiya"
        className={cn(
          'flex h-full min-h-0 flex-col gap-2',
          !inSheet && 'border-r border-border bg-card',
          !inSheet && (isCollapsed ? 'w-16' : 'w-64'),
          className
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-3 pt-3',
            isCollapsed && 'flex-col justify-center gap-1'
          )}
        >
          <Link
            href="/"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            {isCollapsed ? null : (
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">{APP_NAME}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {ROLE_LABEL[role]}
                </span>
              </span>
            )}
          </Link>
          {onToggleCollapse && !inSheet ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto hidden size-8 text-muted-foreground lg:inline-flex"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Menyuni kengaytirish' : 'Menyuni yig‘ish'}
            >
              {isCollapsed ? <PanelLeft className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          ) : null}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 px-2 pb-4 pt-1">
            {groups.map((group, index) => (
              <div key={group.title ?? `group-${index}`} className="flex flex-col gap-0.5">
                {group.title && !isCollapsed ? (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </p>
                ) : null}
                {group.title && isCollapsed ? <div className="mx-2 my-1 h-px bg-border" /> : null}
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    collapsed={isCollapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </nav>
    </TooltipProvider>
  )
}

function SidebarItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  const link = (
    <NavLink
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        collapsed && 'justify-center px-0'
      )}
      activeClassName="bg-primary/10 font-medium text-foreground dark:bg-primary/20"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge !== '' ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {item.badge}
            </Badge>
          ) : null}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export { isPathActive }
