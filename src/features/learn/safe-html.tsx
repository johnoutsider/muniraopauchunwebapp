import * as React from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * Dars matnini XAVFSIZ ko'rsatish.
 *
 * `dangerouslySetInnerHTML` UMUMAN ishlatilmaydi (PLAN 10 — XSS). Kontent
 * kichik oq ro'yxat (whitelist) bo'yicha tokenlarga ajratiladi va React
 * elementlariga aylantiriladi. Ruxsat etilmagan teglar (script, iframe, img,
 * a, style, on* atributlar) tashlab yuboriladi — faqat ularning matni qoladi.
 */

const ALLOWED = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'code',
  'ul',
  'ol',
  'li',
  'h3',
  'h4',
  'blockquote',
  'span',
])

const CLASSES: Record<string, string> = {
  p: 'text-sm leading-relaxed',
  h3: 'text-base font-semibold',
  h4: 'text-sm font-semibold',
  ul: 'list-disc space-y-1 pl-5 text-sm leading-relaxed',
  ol: 'list-decimal space-y-1 pl-5 text-sm leading-relaxed',
  li: '',
  code: 'rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]',
  strong: 'font-semibold',
  b: 'font-semibold',
  em: 'italic',
  i: 'italic',
  u: 'underline',
  blockquote: 'border-l-2 border-border pl-3 text-sm italic text-muted-foreground',
  span: '',
}

const TAG_MAP: Record<string, string> = { b: 'strong', i: 'em' }

const TOKEN_RE = /<\/?\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|<!--[\s\S]*?-->|[^<]+/g

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
}

function decode(text: string): string {
  return text.replace(/&[#a-zA-Z0-9]+;/g, (entity) => ENTITIES[entity] ?? entity)
}

interface Node {
  tag: string | null
  children: Array<Node | string>
}

function parse(html: string): Node {
  const root: Node = { tag: null, children: [] }
  const stack: Node[] = [root]

  for (const match of html.matchAll(TOKEN_RE)) {
    const raw = match[0]
    const tagName = match[1]?.toLowerCase()

    // Oddiy matn
    if (!raw.startsWith('<')) {
      const text = decode(raw)
      if (text.trim() || text.includes(' ')) stack[stack.length - 1].children.push(text)
      continue
    }

    // Izoh (comment) — tashlab yuboriladi
    if (raw.startsWith('<!--')) continue
    if (!tagName) continue

    const closing = /^<\/\s*/.test(raw)
    const selfClosing = /\/>$/.test(raw) || tagName === 'br'

    if (!ALLOWED.has(tagName)) continue

    if (tagName === 'br') {
      stack[stack.length - 1].children.push({ tag: 'br', children: [] })
      continue
    }

    if (closing) {
      // Faqat mos ochilgan tegni yopamiz
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tag === tagName) {
          stack.length = i
          break
        }
      }
      continue
    }

    const node: Node = { tag: tagName, children: [] }
    stack[stack.length - 1].children.push(node)
    if (!selfClosing) stack.push(node)
  }

  return root
}

function render(node: Node | string, key: React.Key): React.ReactNode {
  if (typeof node === 'string') return <React.Fragment key={key}>{node}</React.Fragment>
  if (node.tag === 'br') return <br key={key} />

  const children = node.children.map((child, index) => render(child, index))
  if (!node.tag) return <React.Fragment key={key}>{children}</React.Fragment>

  const tag = TAG_MAP[node.tag] ?? node.tag
  return React.createElement(
    tag,
    { key, className: CLASSES[node.tag] || undefined },
    children.length ? children : null
  )
}

export interface SafeHtmlProps {
  html: string
  className?: string
}

/** Server va klient komponentlarda ishlaydi — hook ishlatilmaydi. */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  if (!html?.trim()) {
    return <p className="text-sm text-muted-foreground">Matn kiritilmagan.</p>
  }

  const tree = parse(html)

  return (
    <div className={cn('space-y-3', className)}>
      {tree.children.map((child, index) => render(child, index))}
    </div>
  )
}
