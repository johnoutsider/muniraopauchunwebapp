'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/shared/data-table'
import {
  CEFR_LEVELS,
  DOMAINS,
  DOMAIN_LABELS,
  type CefrLevel,
  type Domain,
} from '@/config/constants'
import type { LexiconDoc } from '@/types'

import { saveLexiconAction } from '../actions'

export type LexiconRow = LexiconDoc & { id: string }

const RELATIONS = [
  'synonym',
  'antonym',
  'hypernym',
  'hyponym',
  'related',
  'part_of',
  'causes',
] as const

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* Muharrir dialogi                                                    */
/* ------------------------------------------------------------------ */

export function LexiconFormDialog({
  trigger,
  word,
}: {
  trigger: React.ReactNode
  word?: LexiconRow
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const [form, setForm] = React.useState({
    word: word?.word ?? '',
    lemma: word?.lemma ?? '',
    pos: word?.pos ?? 'noun',
    ipa: word?.ipa ?? '',
    cefr: (word?.cefr ?? 'B1') as CefrLevel,
    professionalContext: word?.professionalContext ?? '',
    communicativeTask: word?.communicativeTask ?? '',
    status: (word?.status ?? 'draft') as LexiconDoc['status'],
    synonyms: (word?.synonyms ?? []).join('\n'),
    antonyms: (word?.antonyms ?? []).join('\n'),
    wordFamily: (word?.wordFamily ?? []).join('\n'),
  })
  const [domains, setDomains] = React.useState<Domain[]>(word?.domains ?? ['economics'])
  const [definitions, setDefinitions] = React.useState<LexiconDoc['definitions']>(
    word?.definitions ?? [{ text: '', textUz: '' }]
  )
  const [collocations, setCollocations] = React.useState<LexiconDoc['collocations']>(
    word?.collocations ?? []
  )
  const [examples, setExamples] = React.useState<LexiconDoc['examples']>(word?.examples ?? [])
  const [semanticLinks, setSemanticLinks] = React.useState<LexiconDoc['semanticLinks']>(
    word?.semanticLinks ?? []
  )

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveLexiconAction({
        id: word?.id,
        word: form.word,
        lemma: form.lemma,
        pos: form.pos,
        ipa: form.ipa || undefined,
        cefr: form.cefr,
        domains,
        definitions: definitions.filter((definition) => definition.text.trim()),
        collocations: collocations.filter((collocation) => collocation.text.trim()),
        synonyms: lines(form.synonyms),
        antonyms: lines(form.antonyms),
        wordFamily: lines(form.wordFamily),
        examples: examples.filter((example) => example.sentence.trim()),
        professionalContext: form.professionalContext,
        communicativeTask: form.communicativeTask || undefined,
        semanticLinks: semanticLinks.filter((link) => link.word.trim()),
        status: form.status,
      })
      if (result.ok) {
        toast.success(word ? 'So‘z yangilandi' : 'So‘z qo‘shildi')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{word ? `«${word.word}» so‘zini tahrirlash` : 'Yangi so‘z'}</DialogTitle>
          <DialogDescription>
            Kasbiy lug‘at birligi: ta’rif, kollokatsiyalar, semantik bog‘lanishlar va kasbiy
            kontekst (PLAN 8.1).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="lex-word">So‘z</Label>
              <Input
                id="lex-word"
                value={form.word}
                onChange={(event) => update('word', event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lex-lemma">Lemma</Label>
              <Input
                id="lex-lemma"
                value={form.lemma}
                onChange={(event) => update('lemma', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lex-pos">So‘z turkumi</Label>
              <Input
                id="lex-pos"
                value={form.pos}
                onChange={(event) => update('pos', event.target.value)}
                placeholder="noun / verb / adjective"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lex-ipa">Transkripsiya (IPA)</Label>
              <Input
                id="lex-ipa"
                value={form.ipa}
                onChange={(event) => update('ipa', event.target.value)}
                placeholder="ɪnˈfleɪʃn"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>CEFR</Label>
              <Select
                value={form.cefr}
                onValueChange={(value) => update('cefr', value as CefrLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Holat</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update('status', value as LexiconDoc['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="approved">Tasdiqlangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sohalar</Label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((domain) => (
                <label
                  key={domain}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={domains.includes(domain)}
                    onCheckedChange={() =>
                      setDomains((prev) =>
                        prev.includes(domain)
                          ? prev.filter((item) => item !== domain)
                          : [...prev, domain]
                      )
                    }
                  />
                  {DOMAIN_LABELS[domain].uz}
                </label>
              ))}
            </div>
          </div>

          {/* Ta'riflar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ta’riflar</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDefinitions((prev) => [...prev, { text: '', textUz: '' }])}
              >
                <Plus />
                Qo‘shish
              </Button>
            </div>
            {definitions.map((definition, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                <Input
                  value={definition.text}
                  onChange={(event) =>
                    setDefinitions((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, text: event.target.value } : item
                      )
                    )
                  }
                  placeholder="Ta’rif (ingliz tilida)"
                />
                <div className="flex gap-2">
                  <Input
                    value={definition.textUz ?? ''}
                    onChange={(event) =>
                      setDefinitions((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, textUz: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Ta’rif (o‘zbekcha)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDefinitions((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Kollokatsiyalar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Kollokatsiyalar</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCollocations((prev) => [...prev, { text: '', corpusCount: 0, verified: false }])
                }
              >
                <Plus />
                Qo‘shish
              </Button>
            </div>
            {collocations.map((collocation, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
              >
                <Input
                  className="min-w-48 flex-1"
                  value={collocation.text}
                  onChange={(event) =>
                    setCollocations((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, text: event.target.value } : item
                      )
                    )
                  }
                  placeholder="rising inflation"
                />
                <Input
                  className="w-32"
                  type="number"
                  min={0}
                  value={collocation.corpusCount ?? 0}
                  onChange={(event) =>
                    setCollocations((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, corpusCount: Number(event.target.value) } : item
                      )
                    )
                  }
                  placeholder="Korpus chastotasi"
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={collocation.verified ?? false}
                    onCheckedChange={(value) =>
                      setCollocations((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, verified: value === true } : item
                        )
                      )
                    }
                  />
                  Korpusda tekshirilgan
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollocations((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          {/* Misollar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Misollar</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setExamples((prev) => [...prev, { sentence: '', source: '', translationUz: '' }])
                }
              >
                <Plus />
                Qo‘shish
              </Button>
            </div>
            {examples.map((example, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    value={example.sentence}
                    onChange={(event) =>
                      setExamples((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, sentence: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Misol gap (ingliz tilida)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setExamples((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={example.translationUz ?? ''}
                    onChange={(event) =>
                      setExamples((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, translationUz: event.target.value } : item
                        )
                      )
                    }
                    placeholder="O‘zbekcha tarjima"
                  />
                  <Input
                    value={example.source ?? ''}
                    onChange={(event) =>
                      setExamples((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, source: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Manba (The Economist, 2024)"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Semantik bog'lanishlar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Semantik bog‘lanishlar</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSemanticLinks((prev) => [...prev, { word: '', relation: 'related' }])
                }
              >
                <Plus />
                Qo‘shish
              </Button>
            </div>
            {semanticLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border border-border p-3">
                <Input
                  className="flex-1"
                  value={link.word}
                  onChange={(event) =>
                    setSemanticLinks((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, word: event.target.value } : item
                      )
                    )
                  }
                  placeholder="Bog‘liq so‘z"
                />
                <Select
                  value={link.relation}
                  onValueChange={(value) =>
                    setSemanticLinks((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, relation: value } : item))
                    )
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((relation) => (
                      <SelectItem key={relation} value={relation}>
                        {relation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSemanticLinks((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="lex-syn">Sinonimlar</Label>
              <Textarea
                id="lex-syn"
                rows={3}
                value={form.synonyms}
                onChange={(event) => update('synonyms', event.target.value)}
                placeholder="Har qatorda bittadan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lex-ant">Antonimlar</Label>
              <Textarea
                id="lex-ant"
                rows={3}
                value={form.antonyms}
                onChange={(event) => update('antonyms', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lex-family">So‘z oilasi</Label>
              <Textarea
                id="lex-family"
                rows={3}
                value={form.wordFamily}
                onChange={(event) => update('wordFamily', event.target.value)}
                placeholder="inflate, inflationary…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lex-context">Kasbiy kontekst</Label>
            <Textarea
              id="lex-context"
              rows={2}
              value={form.professionalContext}
              onChange={(event) => update('professionalContext', event.target.value)}
              placeholder="Bu so‘z qaysi kasbiy vaziyatlarda ishlatiladi"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lex-task">Kommunikativ topshiriq</Label>
            <Textarea
              id="lex-task"
              rows={2}
              value={form.communicativeTask}
              onChange={(event) => update('communicativeTask', event.target.value)}
              placeholder="Masalan: «Inflatsiya sabablarini mijozga tushuntiring»"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" loading={pending}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Jadval                                                              */
/* ------------------------------------------------------------------ */

export function LexiconTable({ rows }: { rows: LexiconRow[] }) {
  const columns = React.useMemo<ColumnDef<LexiconRow, unknown>[]>(
    () => [
      {
        accessorKey: 'word',
        header: 'So‘z',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="font-medium">{row.original.word}</p>
            {row.original.ipa ? (
              <p className="font-mono text-xs text-muted-foreground">/{row.original.ipa}/</p>
            ) : null}
          </div>
        ),
      },
      { accessorKey: 'pos', header: 'Turkum' },
      {
        accessorKey: 'cefr',
        header: 'CEFR',
        cell: ({ row }) => <Badge variant="secondary">{row.original.cefr}</Badge>,
      },
      {
        id: 'domains',
        header: 'Sohalar',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.domains ?? []).slice(0, 3).map((domain) => (
              <Badge key={domain} variant="outline">
                {DOMAIN_LABELS[domain]?.uz ?? domain}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'collocations',
        header: 'Kollokatsiyalar',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.collocations?.length ?? 0} ta (
            {row.original.collocations?.filter((item) => item.verified).length ?? 0} tekshirilgan)
          </span>
        ),
      },
      {
        id: 'links',
        header: 'Bog‘lanishlar',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.semanticLinks?.length ?? 0}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Holat',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'approved' ? 'success' : 'warning'}>
            {row.original.status === 'approved' ? 'Tasdiqlangan' : 'Qoralama'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <LexiconFormDialog
              word={row.original}
              trigger={
                <Button variant="ghost" size="icon" title="Tahrirlash">
                  <Pencil />
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      pageSize={20}
      searchPlaceholder="So‘z bo‘yicha qidirish…"
      emptyMessage="So‘z topilmadi"
    />
  )
}
