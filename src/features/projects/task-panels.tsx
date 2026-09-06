'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Check, FileUp, Loader2, Mic, MessagesSquare, Save, Upload } from 'lucide-react'
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { EconChart } from '@/components/charts/econ-chart'
import { getFirebaseStorage } from '@/lib/firebase/client'
import { relativeTime, wordCount } from '@/lib/utils/format'
import { ChatWindow } from '@/features/chat/chat-window'
import type { CaseStudyTask, ProjectDoc } from '@/types'

import {
  addPresentationFileAction,
  ensureProjectChannelAction,
  saveTaskWorkAction,
} from './actions'
import {
  PRESENTATION_MAX_BYTES,
  isPresentationFile,
  type GrammarExample,
  type TaskWorkRow,
  type VocabChoice,
} from './types'

/* ------------------------------------------------------------------ */
/* 1. read — keys matni                                                */
/* ------------------------------------------------------------------ */

export function ReadPanel({
  projectId,
  task,
  scenario,
  work,
  disabled,
}: {
  projectId: string
  task: CaseStudyTask
  scenario: string
  work?: TaskWorkRow
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <article className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
        {scenario.split('\n').map((paragraph, index) =>
          paragraph.trim() ? (
            <p key={index} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ) : null
        )}
      </article>

      <NotesBox
        projectId={projectId}
        task={task}
        work={work}
        disabled={disabled}
        label="Asosiy faktlar va savollaringiz"
        placeholder="List the three facts that matter most for the diagnosis, and one question the brief does not answer."
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. analyze_chart — grafik tahlili                                   */
/* ------------------------------------------------------------------ */

const CHART_QUESTIONS = [
  'Ko‘rsatkich qaysi davrda eng keskin o‘zgargan? (rose sharply / fell steadily)',
  'Ikki chiziq qayerda kesishadi va bu nimani anglatadi?',
  'O‘zgarishni foizda ifodalang va sababini bir jumlada tushuntiring.',
]

export function ChartPanel({
  projectId,
  task,
  chartData,
  chartType,
  chartCaption,
  work,
  disabled,
}: {
  projectId: string
  task: CaseStudyTask
  chartData?: Array<Record<string, unknown>>
  chartType?: 'line' | 'bar'
  chartCaption?: string
  work?: TaskWorkRow
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      {chartData?.length ? (
        <EconChart
          chartType={chartType ?? 'line'}
          data={chartData}
          caption={chartCaption}
          height={280}
        />
      ) : (
        <EmptyState
          title="Grafik ma’lumoti yo‘q"
          description="Bu keys uchun grafik biriktirilmagan — matndagi raqamlarga tayaning."
        />
      )}

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium">Yo‘naltiruvchi savollar</p>
        <ul className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          {CHART_QUESTIONS.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </div>

      <NotesBox
        projectId={projectId}
        task={task}
        work={work}
        disabled={disabled}
        label="Grafik tavsifi (ingliz tilida)"
        placeholder="Describe the trend in five to seven sentences using the language of trends."
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Umumiy: erkin matn maydoni (read / analyze_chart)                    */
/* ------------------------------------------------------------------ */

function NotesBox({
  projectId,
  task,
  work,
  disabled,
  label,
  placeholder,
}: {
  projectId: string
  task: CaseStudyTask
  work?: TaskWorkRow
  disabled?: boolean
  label: string
  placeholder: string
}) {
  const router = useRouter()
  const [text, setText] = React.useState(work?.text ?? '')
  const [saving, setSaving] = React.useState(false)

  async function save() {
    setSaving(true)
    const result = await saveTaskWorkAction({
      projectId,
      taskId: task.id,
      kind: task.kind,
      text,
    })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Saqlandi.')
    router.refresh()
  }

  const words = wordCount(text)

  return (
    <div className="space-y-2">
      <Label htmlFor={`notes-${task.id}`}>{label}</Label>
      <Textarea
        id={`notes-${task.id}`}
        value={text}
        rows={8}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {words} so‘z{task.minWords ? ` / kamida ${task.minWords}` : ''}
          {task.minWords && words >= task.minWords ? ' ✓' : ''}
          {work?.updatedByName ? ` · oxirgi tahrir: ${work.updatedByName}` : ''}
        </span>
        <Button
          size="sm"
          variant="outline"
          loading={saving}
          disabled={disabled}
          onClick={() => void save()}
        >
          <Save className="size-3.5" />
          Saqlash
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. select_vocab — lug'at checklisti + asoslash                       */
/* ------------------------------------------------------------------ */

export function VocabPanel({
  projectId,
  task,
  requiredVocab,
  work,
  disabled,
}: {
  projectId: string
  task: CaseStudyTask
  requiredVocab: string[]
  work?: TaskWorkRow
  disabled?: boolean
}) {
  const router = useRouter()
  const [choices, setChoices] = React.useState<VocabChoice[]>(() =>
    requiredVocab.map((word) => {
      const existing = work?.vocab?.find((item) => item.word === word)
      return {
        word,
        selected: existing?.selected ?? false,
        justification: existing?.justification ?? '',
      }
    })
  )
  const [saving, setSaving] = React.useState(false)

  const selected = choices.filter((choice) => choice.selected)
  const missingJustification = selected.filter(
    (choice) => wordCount(choice.justification) < 3
  ).length

  async function save() {
    if (missingJustification > 0) {
      toast.error('Har bir tanlangan termin uchun bitta to‘liq jumla yozing.')
      return
    }
    setSaving(true)
    const result = await saveTaskWorkAction({
      projectId,
      taskId: task.id,
      kind: task.kind,
      vocab: choices,
    })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Jamoa lug‘ati saqlandi.')
    router.refresh()
  }

  if (!requiredVocab.length) {
    return (
      <EmptyState
        title="Terminlar ro‘yxati yo‘q"
        description="Bu keys uchun majburiy lug‘at belgilanmagan."
      />
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Kerakli terminlarni belgilang va har biri uchun <strong>bitta jumlada</strong> nima uchun
        aynan shu termin kerakligini yozing.
      </p>

      <ul className="space-y-2">
        {choices.map((choice, index) => (
          <li key={choice.word} className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id={`vocab-${index}`}
                checked={choice.selected}
                disabled={disabled}
                onCheckedChange={(value) =>
                  setChoices((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, selected: Boolean(value) } : item
                    )
                  )
                }
                className="mt-1"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`vocab-${index}`} className="cursor-pointer text-sm font-medium">
                  {choice.word}
                </Label>
                {choice.selected ? (
                  <Input
                    value={choice.justification}
                    disabled={disabled}
                    placeholder="Why does the team need this term? (one sentence in English)"
                    onChange={(event) =>
                      setChoices((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, justification: event.target.value } : item
                        )
                      )
                    }
                  />
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Tanlandi: {selected.length} / {requiredVocab.length}
          {missingJustification ? ` · ${missingJustification} ta asoslash yetishmaydi` : ''}
        </p>
        <Button size="sm" loading={saving} disabled={disabled} onClick={() => void save()}>
          <Save className="size-3.5" />
          Lug‘atni saqlash
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. use_grammar — struktura + misol                                   */
/* ------------------------------------------------------------------ */

export function GrammarPanel({
  projectId,
  task,
  requiredGrammar,
  work,
  disabled,
}: {
  projectId: string
  task: CaseStudyTask
  requiredGrammar: string[]
  work?: TaskWorkRow
  disabled?: boolean
}) {
  const router = useRouter()
  const [examples, setExamples] = React.useState<GrammarExample[]>(() =>
    requiredGrammar.map((structure) => ({
      structure,
      example: work?.grammar?.find((item) => item.structure === structure)?.example ?? '',
    }))
  )
  const [saving, setSaving] = React.useState(false)

  const filled = examples.filter((item) => item.example.trim().length > 0).length

  async function save() {
    setSaving(true)
    const result = await saveTaskWorkAction({
      projectId,
      taskId: task.id,
      kind: task.kind,
      grammar: examples,
    })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Misollar saqlandi.')
    router.refresh()
  }

  if (!requiredGrammar.length) {
    return (
      <EmptyState
        title="Grammatik strukturalar ko‘rsatilmagan"
        description="Bu keys uchun majburiy strukturalar belgilanmagan."
      />
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Har bir struktura uchun keys ma’lumotlariga asoslangan bitta ingliz tilidagi jumla yozing.
      </p>

      <ul className="space-y-2">
        {examples.map((item, index) => (
          <li key={item.structure} className="space-y-1.5 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{item.structure}</Badge>
              {item.example.trim() ? <Check className="size-3.5 text-emerald-600" /> : null}
            </div>
            <Textarea
              value={item.example}
              rows={2}
              disabled={disabled}
              aria-label={`${item.structure} uchun misol`}
              placeholder="Write one sentence about this case using the structure."
              onChange={(event) =>
                setExamples((prev) =>
                  prev.map((entry, i) =>
                    i === index ? { ...entry, example: event.target.value } : entry
                  )
                )
              }
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          To‘ldirildi: {filled} / {examples.length}
        </p>
        <Button size="sm" loading={saving} disabled={disabled} onClick={() => void save()}>
          <Save className="size-3.5" />
          Saqlash
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. explain_problem — Speaking Lab'ga o'tish                          */
/* ------------------------------------------------------------------ */

export function speakingLabHref(params: {
  projectId: string
  caseStudyId?: string
  task: CaseStudyTask
  type: 'dialogue' | 'presentation'
}): string {
  const query = new URLSearchParams({
    taskId: params.task.id,
    title: params.task.title,
    type: params.type,
    projectId: params.projectId,
  })
  if (params.caseStudyId) query.set('caseStudyId', params.caseStudyId)
  if (params.task.minSeconds) query.set('minSeconds', String(params.task.minSeconds))
  return `/student/speaking-lab?${query.toString()}`
}

export function SpeakingTaskPanel({
  projectId,
  caseStudyId,
  task,
  type = 'dialogue',
}: {
  projectId: string
  caseStudyId?: string
  task: CaseStudyTask
  type?: 'dialogue' | 'presentation'
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Og‘zaki topshiriq</p>
        <p className="mt-1 text-muted-foreground">
          Yozuvni Speaking Lab’da bajaring — u yerda talaffuz va ravonlik bo‘yicha baho olasiz.
          {task.minSeconds
            ? ` Minimal davomiylik: ${Math.round(task.minSeconds / 60)} daqiqa.`
            : ''}
        </p>
      </div>
      <Button asChild>
        <Link href={speakingLabHref({ projectId, caseStudyId, task, type })}>
          <Mic />
          Speaking Lab’da bajarish
          <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. group_discuss — loyiha kanali                                     */
/* ------------------------------------------------------------------ */

export function DiscussPanel({
  projectId,
  chatId,
  me,
}: {
  projectId: string
  chatId: string | null
  me: { uid: string; displayName: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function openChannel() {
    setLoading(true)
    const result = await ensureProjectChannelAction(projectId)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  if (!chatId) {
    return (
      <EmptyState
        icon={<MessagesSquare />}
        title="Jamoa kanali hali ochilmagan"
        description="Kanalni oching — muhokama, qarorlar va fayllar shu yerda saqlanadi."
        action={
          <Button onClick={() => void openChannel()} loading={loading}>
            Kanalni ochish
          </Button>
        }
      />
    )
  }

  return (
    <ChatWindow
      chatId={chatId}
      me={me}
      showSenderNames
      heightClass="h-[50vh]"
      emptyTitle="Muhokama boshlanmagan"
      emptyDescription="Kun tartibini yozing va har bir a’zoga so‘z bering."
    />
  )
}

/* ------------------------------------------------------------------ */
/* 9. presentation — fayl yuklash                                       */
/* ------------------------------------------------------------------ */

export function PresentationPanel({
  projectId,
  caseStudyId,
  task,
  files,
  disabled,
}: {
  projectId: string
  caseStudyId?: string
  task: CaseStudyTask
  files: ProjectDoc['presentationFiles']
  disabled?: boolean
}) {
  const router = useRouter()
  const [progress, setProgress] = React.useState<number | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  async function upload(file: File) {
    if (!isPresentationFile(file)) {
      toast.error('Faqat PDF yoki PPTX fayl yuklash mumkin.')
      return
    }
    if (file.size > PRESENTATION_MAX_BYTES) {
      toast.error('Fayl hajmi 25 MB dan oshmasligi kerak.')
      return
    }

    const safeName = file.name.replace(/[^\w.\- ]+/g, '').slice(0, 80) || 'presentation'
    const path = `projects/${projectId}/${Date.now()}-${safeName}`
    setProgress(0)

    try {
      const uploadTask = uploadBytesResumable(storageRef(getFirebaseStorage(), path), file, {
        contentType: file.type || 'application/octet-stream',
      })
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) =>
            setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
          reject,
          () => resolve()
        )
      })
    } catch {
      setProgress(null)
      toast.error('Faylni yuklab bo‘lmadi. Internet aloqasini tekshiring.')
      return
    }

    const result = await addPresentationFileAction({
      projectId,
      name: safeName,
      path,
      size: file.size,
    })
    setProgress(null)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Fayl yuklandi.')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <FileUp className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium">Slaydlarni yuklang</p>
        <p className="text-xs text-muted-foreground">PDF yoki PPTX, 25 MB gacha.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void upload(file)
          }}
        />
        <Button
          className="mt-3"
          variant="outline"
          disabled={disabled || progress !== null}
          onClick={() => inputRef.current?.click()}
        >
          {progress !== null ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {progress}%
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Fayl tanlash
            </>
          )}
        </Button>
      </div>

      {files?.length ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <PresentationFileRow key={file.path} file={file} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Hali fayl yuklanmagan.</p>
      )}

      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-medium">Taqdimot yozuvi (ixtiyoriy)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Har bir a’zo o‘z qismini Speaking Lab’da yozib olsa, talaffuz va ravonlik bo‘yicha ham
          baho oladi.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href={speakingLabHref({ projectId, caseStudyId, task, type: 'presentation' })}>
            <Mic className="size-3.5" />
            Speaking Lab’da yozib olish
          </Link>
        </Button>
      </div>
    </div>
  )
}

function PresentationFileRow({
  file,
}: {
  file: NonNullable<ProjectDoc['presentationFiles']>[number]
}) {
  const [loading, setLoading] = React.useState(false)

  async function open() {
    setLoading(true)
    try {
      const url = await getDownloadURL(storageRef(getFirebaseStorage(), file.path))
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Faylni ochib bo‘lmadi — huquqingiz yo‘q yoki fayl o‘chirilgan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-3">
      <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{file.name}</span>
        <span className="text-xs text-muted-foreground">{relativeTime(file.at)}</span>
      </span>
      <Button size="sm" variant="outline" loading={loading} onClick={() => void open()}>
        Ochish
      </Button>
    </li>
  )
}
