'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Flag, Lightbulb, Loader2, Sparkles, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AiBadge } from '@/components/shared/ai-badge'
import { PERSONA_LABELS, type AiPersona } from '@/config/constants'

import { deleteAiSession, fetchSessionMessages, rateAssistantMessage } from '../actions'
import { postAi, type AiRequestError } from '../ai-request'
import { nextKey, useChatStream } from '../use-chat-stream'
import type { AiTeacherData, ChatMessage, SessionSummary } from '../types'
import { ChatComposer, ChatError, MessageBubble, QuotaMeter } from './chat-ui'
import { RolePlaySetup } from './roleplay-setup'
import { SessionSidebar } from './session-sidebar'
import { VoiceInput } from './voice-input'

export interface AiTeacherClientProps {
  data: AiTeacherData
  /** `?context=` orqali kelgan dars konteksti (PLAN 8.8 "explain this"). */
  lessonContext?: string
  topic?: string
  /** Role-play rejimi guruh uchun yoqilganmi. */
  rolePlayEnabled: boolean
}

type Mode = 'tutor' | 'roleplay'

function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({ role: message.role, content: message.content }))
}

export function AiTeacherClient({
  data,
  lessonContext,
  topic,
  rolePlayEnabled,
}: AiTeacherClientProps) {
  const router = useRouter()

  const [mode, setMode] = React.useState<Mode>('tutor')
  const [quota, setQuota] = React.useState(data.quota)
  const [hiddenSessions, setHiddenSessions] = React.useState<string[]>([])
  const [loadingSessionId, setLoadingSessionId] = React.useState<string | null>(null)
  const [sessionError, setSessionError] = React.useState<string | null>(null)
  const [contextBanner, setContextBanner] = React.useState(lessonContext ?? '')

  const [ratings, setRatings] = React.useState<Record<string, boolean | null>>({})
  const [ratingPending, setRatingPending] = React.useState<string | null>(null)

  /* ---------------- Tutor ---------------- */
  const [tutorSessionId, setTutorSessionId] = React.useState<string | null>(null)
  const [tutorInput, setTutorInput] = React.useState('')

  /* ---------------- Role-play ---------------- */
  const [persona, setPersona] = React.useState<AiPersona>('client')
  const [scenarioId, setScenarioId] = React.useState('')
  const [rpSessionId, setRpSessionId] = React.useState<string | null>(null)
  const [rpStarted, setRpStarted] = React.useState(false)
  const [rpStarting, setRpStarting] = React.useState(false)
  const [rpFinishing, setRpFinishing] = React.useState(false)
  const [rpError, setRpError] = React.useState<AiRequestError | null>(null)
  const [rpInput, setRpInput] = React.useState('')

  const registerUsage = React.useCallback((outcome: 'done' | 'aborted' | 'error') => {
    if (outcome === 'error') return
    setQuota((current) => ({
      ...current,
      used: current.used + 1,
      remaining: Math.max(0, current.remaining - 1),
    }))
  }, [])

  const tutor = useChatStream({
    endpoint: '/api/ai/tutor',
    buildBody: (messages) => ({
      sessionId: tutorSessionId ?? undefined,
      messages: toApiMessages(messages),
      lessonContext: contextBanner || undefined,
      topic: topic || undefined,
    }),
    onSessionId: (id) => {
      setTutorSessionId((current) => {
        if (!current) router.refresh()
        return id
      })
    },
    onSettled: registerUsage,
  })

  const roleplay = useChatStream({
    endpoint: '/api/ai/roleplay',
    buildBody: (messages) => ({
      sessionId: rpSessionId ?? undefined,
      persona,
      scenarioId: scenarioId || undefined,
      cefr: data.cefr,
      messages: toApiMessages(messages),
    }),
    onSessionId: setRpSessionId,
    onSettled: registerUsage,
  })

  const active = mode === 'tutor' ? tutor : roleplay
  const activeSessionId = mode === 'tutor' ? tutorSessionId : rpSessionId

  /* Limit tugaganini xato javobidan ham aniqlaymiz (429). */
  React.useEffect(() => {
    const failure = tutor.error ?? roleplay.error ?? rpError
    if (failure?.quotaExceeded) {
      setQuota((current) => ({
        ...current,
        blocked: true,
        remaining: 0,
        used: current.limit,
        reason: failure.message,
      }))
    }
  }, [tutor.error, roleplay.error, rpError])

  /* Avtomatik pastga siljish */
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [tutor.messages, roleplay.messages])

  const sessions = data.sessions.filter((session) => !hiddenSessions.includes(session.id))

  /* ---------------- Sessiyalar ---------------- */

  async function handleSelectSession(session: SessionSummary) {
    setSessionError(null)
    setLoadingSessionId(session.id)
    const result = await fetchSessionMessages(session.id)
    setLoadingSessionId(null)

    if (!result.ok) {
      setSessionError(result.error)
      return
    }

    const ratingMap: Record<string, boolean | null> = {}
    for (const message of result.data.messages) {
      if (message.role === 'assistant') ratingMap[message.key] = message.helpful ?? null
    }
    setRatings((current) => ({ ...current, ...ratingMap }))

    if (session.mode === 'roleplay') {
      setMode('roleplay')
      if (session.persona) setPersona(session.persona)
      setScenarioId(session.scenarioId ?? '')
      setRpSessionId(session.id)
      setRpStarted(true)
      setRpError(null)
      roleplay.reset(result.data.messages)
    } else {
      setMode('tutor')
      setTutorSessionId(session.id)
      tutor.reset(result.data.messages)
    }
  }

  function handleNewSession() {
    setSessionError(null)
    if (mode === 'tutor') {
      setTutorSessionId(null)
      setTutorInput('')
      tutor.reset([])
    } else {
      setRpSessionId(null)
      setRpStarted(false)
      setRpInput('')
      setRpError(null)
      roleplay.reset([])
    }
  }

  async function handleDeleteSession(session: SessionSummary) {
    setHiddenSessions((current) => [...current, session.id])
    if (session.id === tutorSessionId) {
      setTutorSessionId(null)
      tutor.reset([])
    }
    if (session.id === rpSessionId) {
      setRpSessionId(null)
      setRpStarted(false)
      roleplay.reset([])
    }
    const result = await deleteAiSession(session.id)
    if (!result.ok) {
      setHiddenSessions((current) => current.filter((id) => id !== session.id))
      setSessionError(result.error)
    }
  }

  /* ---------------- Baholash ---------------- */

  async function handleRate(message: ChatMessage, helpful: boolean) {
    if (!activeSessionId) return
    const nextValue = ratings[message.key] === helpful ? null : helpful
    setRatings((current) => ({ ...current, [message.key]: nextValue }))
    setRatingPending(message.key)
    const result = await rateAssistantMessage({
      sessionId: activeSessionId,
      content: message.content,
      helpful: nextValue,
    })
    setRatingPending(null)
    if (!result.ok) {
      setRatings((current) => ({ ...current, [message.key]: message.helpful ?? null }))
    }
  }

  /* ---------------- Role-play boshqaruvi ---------------- */

  async function handleStartRolePlay() {
    setRpStarting(true)
    setRpError(null)
    const result = await postAi<{ sessionId: string; opening: string }>('/api/ai/roleplay', {
      start: true,
      persona,
      scenarioId: scenarioId || undefined,
      cefr: data.cefr,
      messages: [],
    })
    setRpStarting(false)

    if (!result.ok) {
      setRpError(result.error)
      return
    }

    setRpSessionId(result.data.sessionId)
    setRpStarted(true)
    roleplay.reset([
      { key: nextKey('a'), role: 'assistant', content: result.data.opening, helpful: null },
    ])
    router.refresh()
  }

  const finishRolePlay = React.useCallback(async () => {
    if (rpFinishing || roleplay.streaming) return
    setRpFinishing(true)
    setRpError(null)

    const result = await postAi<{ feedback: string }>('/api/ai/roleplay', {
      finish: true,
      sessionId: rpSessionId ?? undefined,
      persona,
      scenarioId: scenarioId || undefined,
      cefr: data.cefr,
      messages: toApiMessages(roleplay.messages),
    })
    setRpFinishing(false)

    if (!result.ok) {
      setRpError(result.error)
      return
    }

    registerUsage('done')
    roleplay.setMessages((current) => [
      ...current,
      {
        key: nextKey('f'),
        role: 'assistant',
        content: result.data.feedback,
        isFeedback: true,
        helpful: null,
      },
    ])
  }, [data.cefr, persona, registerUsage, roleplay, rpFinishing, rpSessionId, scenarioId])

  function handleSend(mode_: Mode) {
    const value = mode_ === 'tutor' ? tutorInput : rpInput
    if (!value.trim()) return

    if (mode_ === 'roleplay' && value.trim().toLowerCase().startsWith('/end')) {
      setRpInput('')
      void finishRolePlay()
      return
    }

    if (mode_ === 'tutor') {
      setTutorInput('')
      void tutor.send(value)
    } else {
      setRpInput('')
      void roleplay.send(value)
    }
  }

  const personaLabel = PERSONA_LABELS[persona]
  const scenario = data.scenarios.find((item) => item.id === scenarioId) ?? null
  const blocked = quota.blocked

  /* ---------------- Render ---------------- */

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Yon panel */}
      <aside className="space-y-4">
        <QuotaMeter quota={quota} />
        <SessionSidebar
          sessions={sessions}
          activeId={activeSessionId}
          loadingId={loadingSessionId}
          onSelect={(session) => void handleSelectSession(session)}
          onNew={handleNewSession}
          onDelete={(session) => void handleDeleteSession(session)}
        />
        {sessionError && <p className="text-xs text-destructive">{sessionError}</p>}
        {data.weaknesses.length > 0 && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-medium">Sizning ustuvor yo‘nalishlaringiz</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.weaknesses.slice(0, 5).map((item) => (
                <Badge key={item} variant="secondary" className="text-[10px]">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Chat */}
      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList>
              <TabsTrigger value="tutor">
                <Sparkles />
                Suhbat
              </TabsTrigger>
              <TabsTrigger value="roleplay" disabled={!rolePlayEnabled}>
                {personaLabel.emoji} Rol o‘yini
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <AiBadge label="AI javoblari — tekshirib boring" />
            {mode === 'roleplay' && rpStarted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void finishRolePlay()}
                loading={rpFinishing}
                disabled={rpFinishing || roleplay.streaming}
              >
                <Flag />
                Yakunlash
              </Button>
            )}
          </div>
        </div>

        {/* Dars konteksti banneri */}
        {mode === 'tutor' && contextBanner && (
          <div className="flex items-start gap-2 border-b border-border bg-primary/5 px-3 py-2 text-xs">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="min-w-0 flex-1">
              <span className="font-medium">Dars konteksti:</span> {contextBanner}
            </p>
            <button
              type="button"
              onClick={() => setContextBanner('')}
              aria-label="Kontekstni olib tashlash"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Role-play sozlash */}
        {mode === 'roleplay' && !rpStarted ? (
          <div className="flex-1 overflow-y-auto">
            {rpError && (
              <div className="p-4">
                <ChatError error={rpError} />
              </div>
            )}
            <RolePlaySetup
              scenarios={data.scenarios}
              persona={persona}
              onPersonaChange={setPersona}
              scenarioId={scenarioId}
              onScenarioChange={setScenarioId}
              onStart={() => void handleStartRolePlay()}
              starting={rpStarting}
              disabled={blocked}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {mode === 'roleplay' && scenario && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="space-y-1 p-3 text-xs">
                    <p className="font-medium">
                      {personaLabel.emoji} {scenario.title}
                    </p>
                    <p className="text-muted-foreground">{scenario.context}</p>
                  </CardContent>
                </Card>
              )}

              {active.messages.length === 0 && mode === 'tutor' && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm">
                    <p className="font-medium">AI o‘qituvchi 24/7 ochiq.</p>
                    <p className="mt-1 text-muted-foreground">
                      Grammatika, so‘z boyligi, talaffuz yoki kasbiy muloqot bo‘yicha savol bering.
                      Javoblar sizning darajangizga moslashadi va har doim{' '}
                      <span className="font-medium">
                        nima uchun → qanday tuzatish → yana qayerda
                      </span>{' '}
                      tartibida tushuntiriladi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Lightbulb className="size-3.5" />
                      Sizning zaif tomonlaringizga mos takliflar
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {data.starters.map((starter) => (
                        <button
                          key={starter.label}
                          type="button"
                          disabled={blocked}
                          onClick={() => {
                            setTutorInput('')
                            void tutor.send(starter.prompt)
                          }}
                          className="rounded-lg border border-border p-3 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:opacity-50"
                        >
                          <span className="block font-medium">{starter.label}</span>
                          <span className="mt-1 block line-clamp-2 text-muted-foreground">
                            {starter.prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {active.messages.map((message) => (
                <MessageBubble
                  key={message.key}
                  message={message}
                  assistantLabel={mode === 'roleplay' ? `${personaLabel.uz} (AI)` : 'AI o‘qituvchi'}
                  assistantEmoji={mode === 'roleplay' ? personaLabel.emoji : undefined}
                  rating={ratings[message.key] ?? message.helpful ?? null}
                  ratingPending={ratingPending === message.key}
                  onRate={
                    activeSessionId ? (helpful) => void handleRate(message, helpful) : undefined
                  }
                />
              ))}

              {(rpFinishing || loadingSessionId) && (
                <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {rpFinishing ? 'Feedback tayyorlanmoqda…' : 'Suhbat yuklanmoqda…'}
                </p>
              )}

              {active.error && (
                <ChatError
                  error={active.error}
                  onRetry={() => {
                    active.clearError()
                  }}
                />
              )}
              {mode === 'roleplay' && rpError && !active.error && <ChatError error={rpError} />}

              <div ref={bottomRef} />
            </div>

            <ChatComposer
              value={mode === 'tutor' ? tutorInput : rpInput}
              onChange={mode === 'tutor' ? setTutorInput : setRpInput}
              onSubmit={() => handleSend(mode)}
              onStop={active.stop}
              streaming={active.streaming}
              disabled={blocked || rpFinishing}
              placeholder={
                blocked
                  ? 'Bugungi AI limiti tugadi — ertaga davom eting.'
                  : mode === 'roleplay'
                    ? `${personaLabel.uz} bilan ingliz tilida gaplashing… (/end — yakunlash)`
                    : 'Savolingizni yozing… (Enter — yuborish, Shift+Enter — yangi qator)'
              }
              extra={
                mode === 'roleplay' ? (
                  <VoiceInput
                    disabled={blocked || active.streaming || rpFinishing}
                    onTranscript={(text) =>
                      setRpInput((current) => (current ? `${current} ${text}` : text))
                    }
                  />
                ) : undefined
              }
              hint={
                mode === 'roleplay'
                  ? 'Mikrofon tugmasi bilan gapirsangiz, nutqingiz matnga aylantiriladi.'
                  : 'Javob oxirida AI sizga tekshirish uchun savol beradi — uni albatta tekshiring.'
              }
            />
          </>
        )}
      </section>
    </div>
  )
}
