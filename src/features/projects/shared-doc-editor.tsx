'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Check, Loader2, Save } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { relativeTime, wordCount } from '@/lib/utils/format'
import type { TimeValue } from '@/types'

import { saveSharedDocAction } from './actions'
import { SHARED_DOC_DEBOUNCE_MS } from './types'

export interface SharedDocEditorProps {
  projectId: string
  field: 'solution' | 'report'
  initialText: string
  initialVersion: number
  lastEditedByName?: string
  lastEditedAt?: TimeValue
  minWords?: number
  placeholder?: string
  disabled?: boolean
}

/**
 * Jamoaning umumiy matn maydoni (PLAN 8.10).
 * Saqlash ~2 soniya kechiktiriladi; `sharedDocVersion` siljigan bo'lsa saqlash
 * rad etiladi va talabaga eng so'nggi versiyani yuklash taklif qilinadi.
 */
export function SharedDocEditor({
  projectId,
  field,
  initialText,
  initialVersion,
  lastEditedByName,
  lastEditedAt,
  minWords,
  placeholder,
  disabled = false,
}: SharedDocEditorProps) {
  const [text, setText] = React.useState(initialText)
  const [version, setVersion] = React.useState(initialVersion)
  const [saving, setSaving] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<number | null>(null)
  const [editor, setEditor] = React.useState<string | undefined>(lastEditedByName)
  const [conflict, setConflict] = React.useState<{
    text: string
    version: number
    byName?: string
  } | null>(null)

  const textRef = React.useRef(text)
  const versionRef = React.useRef(version)
  const dirtyRef = React.useRef(false)

  React.useEffect(() => {
    textRef.current = text
  }, [text])
  React.useEffect(() => {
    versionRef.current = version
  }, [version])

  const save = React.useCallback(async () => {
    if (disabled || !dirtyRef.current) return
    setSaving(true)
    const result = await saveSharedDocAction({
      projectId,
      field,
      text: textRef.current,
      baseVersion: versionRef.current,
    })
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    if (result.data.status === 'conflict') {
      setConflict({
        text: result.data.text,
        version: result.data.version,
        byName: result.data.byName,
      })
      return
    }

    dirtyRef.current = false
    setVersion(result.data.version)
    setSavedAt(Date.now())
    setConflict(null)
  }, [disabled, field, projectId])

  // Debounce: yozish to'xtaganidan ~2 soniya keyin saqlanadi
  React.useEffect(() => {
    if (!dirtyRef.current) return
    const timer = setTimeout(() => void save(), SHARED_DOC_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, save])

  const words = wordCount(text)

  return (
    <div className="space-y-3">
      {conflict ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Hujjat boshqa a’zo tomonidan o‘zgartirildi</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {conflict.byName ? `${conflict.byName} ` : 'Jamoadosh '}
              hujjatni yangiladi, shuning uchun sizning o‘zgarishingiz saqlanmadi. Yangi versiyani
              yuklab, matningizni qayta qo‘shing.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(text).catch(() => undefined)
                  toast.success('Sizning matningiz vaqtinchalik xotiraga nusxalandi.')
                }}
              >
                Matnimni nusxalash
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setText(conflict.text)
                  setVersion(conflict.version)
                  setEditor(conflict.byName)
                  dirtyRef.current = false
                  setConflict(null)
                }}
              >
                Yangi versiyani yuklash
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <Textarea
        value={text}
        rows={14}
        disabled={disabled}
        aria-label={field === 'solution' ? 'Yechim matni' : 'Hisobot matni'}
        placeholder={placeholder}
        onChange={(event) => {
          dirtyRef.current = true
          setText(event.target.value)
        }}
        className="min-h-64 font-mono text-sm leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {words} so‘z
          {minWords ? ` / kamida ${minWords}` : ''}
          {minWords && words >= minWords ? ' ✓' : ''}
          {' · versiya '}
          {version}
          {editor ? ` · oxirgi tahrir: ${editor}` : ''}
          {lastEditedAt && !savedAt ? ` (${relativeTime(lastEditedAt)})` : ''}
        </span>
        <span className="flex items-center gap-2">
          {saving ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> saqlanmoqda…
            </span>
          ) : savedAt ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <Check className="size-3" /> saqlandi
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || saving}
            onClick={() => {
              dirtyRef.current = true
              void save()
            }}
          >
            <Save className="size-3.5" />
            Saqlash
          </Button>
        </span>
      </div>
    </div>
  )
}
