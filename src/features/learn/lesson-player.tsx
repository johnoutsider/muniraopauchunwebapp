'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import { completeLessonAction, logLessonViewAction } from './actions'

export interface LessonPlayerProps {
  lessonId: string
  title: string
  estimatedMin: number
  done: boolean
  prev: { id: string; title: string } | null
  next: { id: string; title: string } | null
  /** Yo'nalishdagi mos qadam sarlavhasi (bo'lsa) */
  pathStepTitle?: string | null
  children: React.ReactNode
}

/**
 * Dars pleyeri: yopishqoq jarayon paneli, oldingi/keyingi navigatsiya va
 * «Darsni yakunlash» amali (XP + event + yo'nalish qadami).
 */
export function LessonPlayer({
  lessonId,
  title,
  estimatedMin,
  done,
  prev,
  next,
  pathStepTitle,
  children,
}: LessonPlayerProps) {
  const router = useRouter()
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const [completed, setCompleted] = React.useState(done)
  const [pending, setPending] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const openedAt = React.useRef(Date.now())

  // Dars ochilganini bir marta qayd etamiz
  React.useEffect(() => {
    openedAt.current = Date.now()
    void logLessonViewAction(lessonId)
  }, [lessonId])

  React.useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      setScrollProgress(total > 0 ? Math.min(100, Math.round((doc.scrollTop / total) * 100)) : 100)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  async function handleComplete() {
    setPending(true)
    setError(null)
    const result = await completeLessonAction({
      lessonId,
      timeMs: Date.now() - openedAt.current,
    })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setCompleted(true)
    setMessage(
      result.data.xp
        ? `Dars yakunlandi: +${result.data.xp} XP${result.data.stepDone ? ' · yo‘nalish qadami bajarildi' : ''}`
        : 'Dars allaqachon yakunlangan edi.'
    )
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Yopishqoq jarayon paneli */}
      <div className="no-print sticky top-0 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{title}</p>
            <Progress value={scrollProgress} className="mt-1 h-1.5" aria-label="O‘qish jarayoni" />
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {estimatedMin} daq
          </span>
          {completed ? (
            <Badge variant="success" className="shrink-0">
              <CheckCircle2 />
              Bajarildi
            </Badge>
          ) : null}
        </div>
      </div>

      {pathStepTitle ? (
        <p className="text-xs text-muted-foreground">
          O‘quv yo‘lingizdagi qadam: <span className="font-medium">{pathStepTitle}</span>
        </p>
      ) : null}

      {children}

      {/* Yakunlash */}
      <Card className="no-print">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {completed ? 'Bu dars yakunlangan' : 'Darsni yakunladingizmi?'}
            </p>
            <p className="text-xs text-muted-foreground">
              {completed
                ? 'Istalgan vaqtda qaytib ko‘rishingiz mumkin.'
                : 'Yakunlash XP beradi va o‘quv yo‘lingizdagi mos qadamni yopadi.'}
            </p>
            {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={() => void handleComplete()}
            loading={pending}
            disabled={pending}
            variant={completed ? 'outline' : 'default'}
          >
            <CheckCircle2 />
            {completed ? 'Qayta belgilash' : 'Darsni yakunlash'}
          </Button>
        </CardContent>
      </Card>

      {/* Navigatsiya */}
      <nav className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/student/learn/${prev.id}`}>
              <ArrowLeft />
              <span className="truncate">{prev.title}</span>
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/student/learn">
              <ArrowLeft />
              Darslar katalogi
            </Link>
          </Button>
        )}

        {next ? (
          <Button asChild className="justify-end">
            <Link href={`/student/learn/${next.id}`}>
              <span className="truncate">{next.title}</span>
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="justify-end">
            <Link href="/student/practice">
              Mashq maydoniga o‘tish
              <ArrowRight />
            </Link>
          </Button>
        )}
      </nav>
    </div>
  )
}
