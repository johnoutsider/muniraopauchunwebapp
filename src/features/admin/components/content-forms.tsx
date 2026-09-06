'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  CEFR_LEVELS,
  DOMAINS,
  DOMAIN_LABELS,
  GRAMMAR_TOPICS,
  SKILLS,
  SKILL_LABELS,
  STAGES,
  STAGE_META,
  type CefrLevel,
  type Domain,
  type Skill,
} from '@/config/constants'
import type { CourseDoc, ModuleDoc } from '@/types'

import { saveCourseAction, saveModuleAction, togglePublishAction } from '../actions'

/* ------------------------------------------------------------------ */
/* Kurs formasi                                                        */
/* ------------------------------------------------------------------ */

export interface CourseFormDialogProps {
  trigger: React.ReactNode
  course?: CourseDoc & { id: string }
  nextOrder: number
}

export function CourseFormDialog({ trigger, course, nextOrder }: CourseFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [title, setTitle] = React.useState(course?.title ?? '')
  const [description, setDescription] = React.useState(course?.description ?? '')
  const [cefrFrom, setCefrFrom] = React.useState<CefrLevel>(course?.cefrRange?.[0] ?? 'A2')
  const [cefrTo, setCefrTo] = React.useState<CefrLevel>(course?.cefrRange?.[1] ?? 'B2')
  const [order, setOrder] = React.useState(course?.order ?? nextOrder)
  const [published, setPublished] = React.useState(course?.published ?? false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveCourseAction({
        id: course?.id,
        title,
        description,
        cefrFrom,
        cefrTo,
        order,
        published,
      })
      if (result.ok) {
        toast.success(course ? 'Kurs yangilandi' : 'Kurs yaratildi')
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? 'Kursni tahrirlash' : 'Yangi kurs'}</DialogTitle>
          <DialogDescription>
            Kurs — modullar to‘plami. Nashr etilmagan kurs talabalarga ko‘rinmaydi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-title">Nomi</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-description">Tavsif</Label>
            <Textarea
              id="course-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>CEFR (dan)</Label>
              <Select value={cefrFrom} onValueChange={(value) => setCefrFrom(value as CefrLevel)}>
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
              <Label>CEFR (gacha)</Label>
              <Select value={cefrTo} onValueChange={(value) => setCefrTo(value as CefrLevel)}>
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
              <Label htmlFor="course-order">Tartib</Label>
              <Input
                id="course-order"
                type="number"
                min={0}
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="course-published" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="course-published">Nashr etilgan</Label>
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
/* Modul formasi                                                       */
/* ------------------------------------------------------------------ */

export interface ModuleFormDialogProps {
  trigger: React.ReactNode
  courseId: string
  module?: ModuleDoc & { id: string }
  nextOrder: number
}

export function ModuleFormDialog({
  trigger,
  courseId,
  module: moduleDoc,
  nextOrder,
}: ModuleFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [title, setTitle] = React.useState(moduleDoc?.title ?? '')
  const [description, setDescription] = React.useState(moduleDoc?.description ?? '')
  const [stage, setStage] = React.useState<ModuleDoc['stage']>(moduleDoc?.stage ?? 4)
  const [skill, setSkill] = React.useState<Skill>(moduleDoc?.skill ?? 'vocabulary')
  const [domain, setDomain] = React.useState<Domain>(moduleDoc?.domain ?? 'economics')
  const [topicId, setTopicId] = React.useState(moduleDoc?.topicId ?? '')
  const [order, setOrder] = React.useState(moduleDoc?.order ?? nextOrder)
  const [estimatedMin, setEstimatedMin] = React.useState(moduleDoc?.estimatedMin ?? 45)
  const [published, setPublished] = React.useState(moduleDoc?.published ?? false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveModuleAction({
        id: moduleDoc?.id,
        courseId,
        title,
        description,
        stage,
        skill,
        domain,
        topicId: topicId || undefined,
        order,
        estimatedMin,
        published,
      })
      if (result.ok) {
        toast.success(moduleDoc ? 'Modul yangilandi' : 'Modul yaratildi')
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{moduleDoc ? 'Modulni tahrirlash' : 'Yangi modul'}</DialogTitle>
          <DialogDescription>
            Modul metodikaning 8 bosqichidan biriga va bitta ko‘nikmaga bog‘lanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="module-title">Nomi</Label>
            <Input
              id="module-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="module-description">Tavsif</Label>
            <Textarea
              id="module-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Bosqich</Label>
              <Select
                value={String(stage)}
                onValueChange={(value) => setStage(Number(value) as ModuleDoc['stage'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}. {STAGE_META[item].uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ko‘nikma</Label>
              <Select value={skill} onValueChange={(value) => setSkill(value as Skill)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILLS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {SKILL_LABELS[item].uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Soha</Label>
              <Select value={domain} onValueChange={(value) => setDomain(value as Domain)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {DOMAIN_LABELS[item].uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Grammatik mavzu</Label>
              <Select value={topicId || '__none__'} onValueChange={(value) => setTopicId(value === '__none__' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlanmagan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanlanmagan</SelectItem>
                  {GRAMMAR_TOPICS.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module-order">Tartib</Label>
              <Input
                id="module-order"
                type="number"
                min={0}
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module-min">Davomiyligi (daq)</Label>
              <Input
                id="module-min"
                type="number"
                min={1}
                value={estimatedMin}
                onChange={(event) => setEstimatedMin(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="module-published" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="module-published">Nashr etilgan</Label>
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
/* Nashr tugmasi                                                       */
/* ------------------------------------------------------------------ */

export function PublishToggle({
  collection,
  id,
  published,
}: {
  collection: 'courses' | 'modules' | 'lessons'
  id: string
  published: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [value, setValue] = React.useState(published)

  return (
    <Switch
      checked={value}
      disabled={pending}
      aria-label="Nashr holati"
      onCheckedChange={async (checked) => {
        setValue(checked)
        setPending(true)
        try {
          const result = await togglePublishAction({ collection, id, published: checked })
          if (result.ok) {
            toast.success(checked ? 'Nashr etildi' : 'Nashrdan olindi')
            router.refresh()
          } else {
            setValue(!checked)
            toast.error(result.error)
          }
        } finally {
          setPending(false)
        }
      }}
    />
  )
}
