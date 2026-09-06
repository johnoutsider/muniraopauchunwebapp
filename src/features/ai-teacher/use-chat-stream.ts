'use client'

import * as React from 'react'

import { abortedError, errorFromResponse, isAbortError, networkError } from './ai-request'
import type { AiRequestError } from './ai-request'
import type { ChatMessage } from './types'

let keySeed = 0
export function nextKey(prefix = 'm'): string {
  keySeed += 1
  return `${prefix}-${Date.now().toString(36)}-${keySeed}`
}

export interface UseChatStreamOptions {
  /** Oqim qaytaradigan route: `/api/ai/tutor` yoki `/api/ai/roleplay` */
  endpoint: string
  initialMessages?: ChatMessage[]
  /** So'rov tanasini quradi (sessionId, kontekst, persona va h.k. shu yerda qo'shiladi). */
  buildBody: (messages: ChatMessage[]) => Record<string, unknown>
  /** Server yangi sessiya ochsa — `X-Session-Id` sarlavhasi orqali xabar beradi. */
  onSessionId?: (sessionId: string) => void
  /** Muvaffaqiyatli javobdan keyin (limit ko'rsatkichini yangilash uchun). */
  onSettled?: (outcome: 'done' | 'aborted' | 'error') => void
}

export interface UseChatStreamApi {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  streaming: boolean
  error: AiRequestError | null
  clearError: () => void
  send: (text: string) => Promise<void>
  /** Javobni yozib olayotgan oqimni to'xtatadi (AbortController). */
  stop: () => void
  reset: (messages?: ChatMessage[]) => void
}

/**
 * Matnli oqimni (`toTextStreamResponse`) o'qib, oxirgi assistant xabariga
 * tokenlarni qo'shib boradi. 401 / 403 / 429 alohida ajratiladi.
 */
export function useChatStream(options: UseChatStreamOptions): UseChatStreamApi {
  const [messages, setMessages] = React.useState<ChatMessage[]>(options.initialMessages ?? [])
  const [streaming, setStreaming] = React.useState(false)
  const [error, setError] = React.useState<AiRequestError | null>(null)

  const abortRef = React.useRef<AbortController | null>(null)
  const buildBodyRef = React.useRef(options.buildBody)
  buildBodyRef.current = options.buildBody
  const onSessionIdRef = React.useRef(options.onSessionId)
  onSessionIdRef.current = options.onSessionId
  const onSettledRef = React.useRef(options.onSettled)
  onSettledRef.current = options.onSettled

  const endpoint = options.endpoint

  React.useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const stop = React.useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const reset = React.useCallback((next: ChatMessage[] = []) => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages(next)
    setError(null)
    setStreaming(false)
  }, [])

  const send = React.useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || streaming) return

      setError(null)

      const userMessage: ChatMessage = { key: nextKey('u'), role: 'user', content }
      const assistantKey = nextKey('a')
      const history = [...messages, userMessage]

      setMessages([
        ...history,
        { key: assistantKey, role: 'assistant', content: '', streaming: true },
      ])
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      let outcome: 'done' | 'aborted' | 'error' = 'done'

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBodyRef.current(history)),
          signal: controller.signal,
        })

        if (!response.ok) {
          const failure = await errorFromResponse(response)
          setError(failure)
          setMessages(history)
          outcome = 'error'
          return
        }

        const sessionId = response.headers.get('X-Session-Id')
        if (sessionId) onSessionIdRef.current?.(sessionId)

        const reader = response.body?.getReader()
        if (!reader) {
          setError({
            message: 'AI javobi bo‘sh keldi. Qaytadan urinib ko‘ring.',
            status: response.status,
            quotaExceeded: false,
            flagDisabled: false,
            unauthenticated: false,
            aborted: false,
          })
          setMessages(history)
          outcome = 'error'
          return
        }

        const decoder = new TextDecoder()
        let acc = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          setMessages([
            ...history,
            { key: assistantKey, role: 'assistant', content: acc, streaming: true },
          ])
        }
        acc += decoder.decode()

        if (!acc.trim()) {
          setError({
            message: 'AI javob qaytarmadi. Savolni boshqacha yozib ko‘ring.',
            status: 200,
            quotaExceeded: false,
            flagDisabled: false,
            unauthenticated: false,
            aborted: false,
          })
          setMessages(history)
          outcome = 'error'
          return
        }

        setMessages([
          ...history,
          { key: assistantKey, role: 'assistant', content: acc, helpful: null },
        ])
      } catch (err) {
        if (isAbortError(err)) {
          outcome = 'aborted'
          setError(abortedError())
          // Qisman javob saqlanadi: talaba yozilgan qismini o'qiy oladi.
          setMessages((current) =>
            current.map((message) =>
              message.key === assistantKey
                ? { ...message, streaming: false, helpful: null }
                : message
            )
          )
        } else {
          outcome = 'error'
          setError(networkError(err))
          setMessages(history)
        }
      } finally {
        abortRef.current = null
        setStreaming(false)
        onSettledRef.current?.(outcome)
      }
    },
    [endpoint, messages, streaming]
  )

  return {
    messages,
    setMessages,
    streaming,
    error,
    clearError: () => setError(null),
    send,
    stop,
    reset,
  }
}
