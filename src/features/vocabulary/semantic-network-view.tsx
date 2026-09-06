'use client'

import * as React from 'react'
import { Loader2, Network, RefreshCw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AiBadge } from '@/components/shared/ai-badge'
import { cn } from '@/lib/utils/cn'
import type { SemanticNetworkDoc } from '@/types'

type NetworkNode = SemanticNetworkDoc['nodes'][number]
type NetworkEdge = SemanticNetworkDoc['edges'][number]

interface NetworkPayload {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  networkId?: string | null
  seedWord?: string
}

/** Radial joylashuv: markazda seed so'z, atrofida qolganlari aylana bo'ylab. */
function layout(nodes: NetworkNode[], seedId: string, width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const others = nodes.filter((n) => n.id !== seedId)
  const radius = Math.min(width, height) / 2 - 70

  const positions = new Map<string, { x: number; y: number }>()
  positions.set(seedId, { x: cx, y: cy })

  others.forEach((node, index) => {
    const angle = (index / Math.max(1, others.length)) * Math.PI * 2 - Math.PI / 2
    positions.set(node.id, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    })
  })

  return positions
}

const RELATION_COLORS: Record<string, string> = {
  cause: 'var(--color-chart-5)',
  effect: 'var(--color-chart-4)',
  opposite: 'var(--color-chart-6)',
  synonym: 'var(--color-chart-3)',
  collocate: 'var(--color-chart-2)',
  related: 'var(--color-chart-1)',
}

function relationColor(relation: string): string {
  return RELATION_COLORS[relation] ?? 'var(--color-chart-1)'
}

export function SemanticNetworkView({
  initialWord,
  initialNetwork,
  enabled,
}: {
  initialWord: string
  initialNetwork: NetworkPayload | null
  enabled: boolean
}) {
  const [word, setWord] = React.useState(initialWord)
  const [network, setNetwork] = React.useState<NetworkPayload | null>(initialNetwork)
  const [selected, setSelected] = React.useState<NetworkNode | null>(null)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const WIDTH = 720
  const HEIGHT = 460

  async function generate(seed: string) {
    const clean = seed.trim()
    if (!clean) return
    setPending(true)
    setError(null)
    setSelected(null)
    try {
      const response = await fetch('/api/ai/semantic-network', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seedWord: clean }),
      })
      if (response.status === 403) {
        setError('Semantik tarmoq sizning guruhingiz uchun yoqilmagan.')
        return
      }
      if (response.status === 429) {
        setError('Bugungi AI limiti tugadi. Ertaga qayta urinib ko‘ring.')
        return
      }
      if (!response.ok) {
        setError('Tarmoqni yaratib bo‘lmadi. Keyinroq urinib ko‘ring.')
        return
      }
      const payload = (await response.json()) as NetworkPayload
      if (!payload?.nodes?.length) {
        setError('Bo‘sh natija qaytdi.')
        return
      }
      setNetwork({ ...payload, seedWord: clean })
    } catch {
      setError('Tarmoq xatosi. Internetni tekshiring.')
    } finally {
      setPending(false)
    }
  }

  const seedId = React.useMemo(() => {
    if (!network) return ''
    const seed = (network.seedWord ?? word).toLowerCase()
    const match = network.nodes.find(
      (n) => n.id.toLowerCase() === seed || n.label.toLowerCase() === seed
    )
    return match?.id ?? network.nodes[0]?.id ?? ''
  }, [network, word])

  const positions = React.useMemo(
    () => (network ? layout(network.nodes, seedId, WIDTH, HEIGHT) : new Map()),
    [network, seedId]
  )

  const relations = React.useMemo(() => {
    if (!network) return []
    return [...new Set(network.edges.map((e) => e.relation))]
  }, [network])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="size-4 text-primary" />
                Semantik tarmoq
              </CardTitle>
              <CardDescription>
                So‘z alohida emas, bog‘lanishlar tarmog‘ida o‘rganiladi: inflation → prices →
                purchasing power → consumer spending → monetary policy.
              </CardDescription>
            </div>
            <AiBadge label="AI yaratgan" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void generate(word)
            }}
            className="flex flex-wrap gap-2"
          >
            <div className="relative min-w-52 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="inflation"
                className="pl-9"
                maxLength={80}
                disabled={!enabled}
              />
            </div>
            <Button type="submit" loading={pending} disabled={!enabled || !word.trim()}>
              <RefreshCw />
              Tarmoq tuzish
            </Button>
          </form>

          {!enabled && (
            <Alert variant="info">
              <AlertDescription>
                Bu imkoniyat sizning guruhingiz uchun yoqilmagan. Lug‘at kartalaridagi
                kollokatsiya, sinonim va antonimlardan foydalaning.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="warning">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {relations.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {relations.map((relation) => (
                <span key={relation} className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: relationColor(relation) }}
                  />
                  {relation}
                </span>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border bg-muted/20">
            {pending && !network ? (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Tarmoq tuzilmoqda...
              </div>
            ) : network ? (
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="h-auto w-full min-w-[640px]"
                role="img"
                aria-label={`${network.seedWord ?? word} so‘zining semantik tarmog‘i`}
              >
                {network.edges.map((edge: NetworkEdge, index) => {
                  const from = positions.get(edge.source)
                  const to = positions.get(edge.target)
                  if (!from || !to) return null
                  return (
                    <g key={`${edge.source}-${edge.target}-${index}`}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={relationColor(edge.relation)}
                        strokeWidth={1.5}
                        strokeOpacity={0.5}
                      />
                    </g>
                  )
                })}

                {network.nodes.map((node) => {
                  const pos = positions.get(node.id)
                  if (!pos) return null
                  const isSeed = node.id === seedId
                  const isSelected = selected?.id === node.id
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer"
                      onClick={() => setSelected(node)}
                    >
                      <circle
                        r={isSeed ? 34 : 26}
                        fill={isSeed ? 'var(--color-primary)' : 'var(--color-card)'}
                        stroke={isSelected ? 'var(--color-primary)' : 'var(--color-border)'}
                        strokeWidth={isSelected ? 3 : 1.5}
                      />
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fontSize={isSeed ? 12 : 10}
                        fontWeight={isSeed ? 600 : 500}
                        fill={isSeed ? 'var(--color-primary-foreground)' : 'var(--color-foreground)'}
                      >
                        {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            ) : (
              <div className="flex h-80 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Network className="size-8" />
                <p>So‘z kiriting va &laquo;Tarmoq tuzish&raquo; tugmasini bosing.</p>
              </div>
            )}
          </div>

          {selected && (
            <div className={cn('rounded-lg border border-border p-4')}>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium">{selected.label}</span>
                {selected.group && <Badge variant="secondary">{selected.group}</Badge>}
              </div>
              {selected.definition ? (
                <p className="text-sm text-muted-foreground">{selected.definition}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Ta‘rif berilmagan.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setWord(selected.label)
                  void generate(selected.label)
                }}
                disabled={!enabled || pending}
              >
                <Network />
                Shu so‘zdan tarmoq tuzish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
