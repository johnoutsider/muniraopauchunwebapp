'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOMAIN_LABELS, SKILL_LABELS, type Domain, type Skill } from '@/config/constants'

export interface CatalogueFiltersProps {
  skills: Skill[]
  domains: Domain[]
  skill?: string
  domain?: string
}

const ALL = 'all'

/** Katalog filtri — ko'nikma va kasbiy soha bo'yicha (PLAN 8.4). */
export function CatalogueFilters({ skills, domains, skill, domain }: CatalogueFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const apply = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === ALL) params.delete(key)
      else params.set(key, value)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const hasFilters = Boolean((skill && skill !== ALL) || (domain && domain !== ALL))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={skill || ALL} onValueChange={(value) => apply('skill', value)}>
        <SelectTrigger className="w-44" aria-label="Ko‘nikma bo‘yicha filtr">
          <SelectValue placeholder="Ko‘nikma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Barcha ko‘nikmalar</SelectItem>
          {skills.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {SKILL_LABELS[entry].uz}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={domain || ALL} onValueChange={(value) => apply('domain', value)}>
        <SelectTrigger className="w-44" aria-label="Soha bo‘yicha filtr">
          <SelectValue placeholder="Soha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Barcha sohalar</SelectItem>
          {domains.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {DOMAIN_LABELS[entry].uz}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          <X />
          Filtrni tozalash
        </Button>
      ) : null}
    </div>
  )
}
