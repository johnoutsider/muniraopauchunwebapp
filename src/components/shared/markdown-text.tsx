import * as React from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * Minimal va XAVFSIZ markdown renderer.
 * `dangerouslySetInnerHTML` ISHLATILMAYDI — matn React elementlariga parse qilinadi,
 * shuning uchun AI yoki foydalanuvchi matnidagi HTML/skript bajarilmaydi (PLAN 10-bo‘lim, XSS).
 *
 * Qo‘llab-quvvatlanadi: paragraf, satr ko‘chirish, **qalin**, *kursiv*, `kod`,
 * belgili ro‘yxat (-, *, •) va raqamli ro‘yxat (1.).
 */

const INLINE_RE = /(`[^`]+`|\*\*[\s\S]+?\*\*|\*[^*\n]+?\*)/g

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const parts = text.split(INLINE_RE)

  parts.forEach((part, index) => {
    if (!part) return
    const key = `${keyPrefix}-${index}`

    if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      )
      return
    }

    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {parseInline(part.slice(2, -2), key)}
        </strong>
      )
      return
    }

    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>)
      return
    }

    // Oddiy matn — satr ko‘chirishlarni <br /> ga aylantiramiz
    const lines = part.split('\n')
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) nodes.push(<br key={`${key}-br-${lineIndex}`} />)
      if (line) nodes.push(<React.Fragment key={`${key}-t-${lineIndex}`}>{line}</React.Fragment>)
    })
  })

  return nodes
}

type Block =
  { kind: 'p'; lines: string[] } | { kind: 'ul'; items: string[] } | { kind: 'ol'; items: string[] }

const BULLET_RE = /^\s*[-*•]\s+(.*)$/
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  const lines = source.replace(/\r\n/g, '\n').split('\n')

  for (const raw of lines) {
    const line = raw.trimEnd()
    const last = blocks[blocks.length - 1]

    if (!line.trim()) {
      // Bo‘sh satr — joriy blokni yopadi
      if (last) blocks.push({ kind: 'p', lines: [] })
      continue
    }

    const bullet = BULLET_RE.exec(line)
    if (bullet) {
      if (last && last.kind === 'ul') last.items.push(bullet[1])
      else blocks.push({ kind: 'ul', items: [bullet[1]] })
      continue
    }

    const ordered = ORDERED_RE.exec(line)
    if (ordered) {
      if (last && last.kind === 'ol') last.items.push(ordered[1])
      else blocks.push({ kind: 'ol', items: [ordered[1]] })
      continue
    }

    if (last && last.kind === 'p' && last.lines.length > 0) last.lines.push(line)
    else blocks.push({ kind: 'p', lines: [line] })
  }

  return blocks.filter((block) =>
    block.kind === 'p' ? block.lines.length > 0 : block.items.length > 0
  )
}

export interface MarkdownTextProps {
  children: string
  className?: string
}

export function MarkdownText({ children, className }: MarkdownTextProps) {
  const blocks = React.useMemo(() => parseBlocks(children ?? ''), [children])

  return (
    <div className={cn('space-y-2 text-sm leading-relaxed', className)}>
      {blocks.map((block, index) => {
        if (block.kind === 'ul') {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          )
        }

        if (block.kind === 'ol') {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `${index}-${itemIndex}`)}</li>
              ))}
            </ol>
          )
        }

        return <p key={index}>{parseInline(block.lines.join('\n'), String(index))}</p>
      })}
    </div>
  )
}
