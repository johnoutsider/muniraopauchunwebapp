'use client'

import {
  ATTACHMENT_CHUNK_BYTES,
  MAX_ATTACHMENT_BYTES,
  isAllowedAttachmentType,
  type ChatAttachment,
} from './types'
import { finalizeChatAttachmentAction, uploadChatAttachmentChunkAction } from './actions'

/**
 * Faylni Server Action orqali Storage'ga yuklaydi.
 * Server Action tanasi ~1 MB bo'lgani uchun fayl bo'laklab yuboriladi va
 * serverda (Admin SDK) yagona obyektga birlashtiriladi. Shu yo'l bilan
 * a'zolik, fayl turi va hajmi HAR DOIM serverda tekshiriladi.
 */
export async function uploadChatAttachment(
  chatId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ ok: true; data: ChatAttachment } | { ok: false; error: string }> {
  if (!isAllowedAttachmentType(file.type)) {
    return { ok: false, error: 'Faqat rasm (PNG, JPEG, WebP, GIF) va PDF fayllar mumkin.' }
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Fayl hajmi 10 MB dan oshmasligi kerak.' }
  }
  if (file.size === 0) {
    return { ok: false, error: 'Fayl bo‘sh.' }
  }

  const uploadId = createUploadId()
  const chunkCount = Math.ceil(file.size / ATTACHMENT_CHUNK_BYTES)

  for (let index = 0; index < chunkCount; index++) {
    const start = index * ATTACHMENT_CHUNK_BYTES
    const blob = file.slice(start, Math.min(start + ATTACHMENT_CHUNK_BYTES, file.size))

    const formData = new FormData()
    formData.append('chatId', chatId)
    formData.append('uploadId', uploadId)
    formData.append('index', String(index))
    formData.append('chunk', blob)

    const result = await uploadChatAttachmentChunkAction(formData)
    if (!result.ok) return { ok: false, error: result.error }
    onProgress?.(Math.round(((index + 1) / chunkCount) * 95))
  }

  const finalized = await finalizeChatAttachmentAction({
    chatId,
    uploadId,
    chunkCount,
    name: file.name,
    contentType: file.type,
    size: file.size,
  })
  if (!finalized.ok) return { ok: false, error: finalized.error }

  onProgress?.(100)
  return { ok: true, data: finalized.data }
}

function createUploadId(): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return uuid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}
