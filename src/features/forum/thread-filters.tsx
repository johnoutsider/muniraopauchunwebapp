'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/shared/search-input'
import { cn } from '@/lib/utils/cn'

/** Forum filtrlari: qidiruv, saralash, teg. Holat URL'da saqlanadi. */
export function ThreadFilters({
  tags,
  sort,
  tag,
  search,
}: {
  tags: Array<{ tag: string; count: number }>
  sort: 'new' | 'active'
  tag?: string
  search?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const push = React.useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          defaultValue={search}
          placeholder="Mavzu, matn yoki muallif bo‘yicha qidirish…"
          onChange={(value) => push({ q: value || undefined })}
          className="sm:max-w-md"
        />
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={sort === 'active' ? 'default' : 'outline'}
            onClick={() => push({ sort: 'active' })}
          >
            Faol muhokamalar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === 'new' ? 'default' : 'outline'}
            onClick={() => push({ sort: 'new' })}
          >
            Yangilari
          </Button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => push({ tag: undefined })}>
            <Badge variant={tag ? 'outline' : 'default'} className="cursor-pointer">
              Barchasi
            </Badge>
          </button>
          {tags.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => push({ tag: tag === item.tag ? undefined : item.tag })}
            >
              <Badge
                variant={tag === item.tag ? 'default' : 'outline'}
                className={cn('cursor-pointer')}
              >
                #{item.tag}
                <span className="opacity-60">{item.count}</span>
              </Badge>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
