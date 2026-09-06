'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils/cn'

export interface NavLinkProps extends Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'> {
  href: string
  /** Aynan mos kelishi shart (prefiks bo‘yicha emas) */
  exact?: boolean
  activeClassName?: string
  children: React.ReactNode
}

export function isPathActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLink({
  href,
  exact = false,
  className,
  activeClassName,
  children,
  ...props
}: NavLinkProps) {
  const pathname = usePathname() ?? ''
  const active = isPathActive(pathname, href, exact)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-active={active ? 'true' : undefined}
      className={cn(className, active && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  )
}
