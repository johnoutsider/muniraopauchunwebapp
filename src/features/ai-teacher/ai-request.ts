'use client'

/**
 * AI API route'lariga klientdan murojaat qilishning yagona qatlami.
 * Barcha laboratoriyalar (AI Teacher, Speaking, Writing, Prompt Lab, Corpus)
 * shu yerdan foydalanadi — 401 / 403 / 429 holatlari hamma joyda bir xil
 * o'zbekcha xabar bilan ko'rsatilishi kerak (PLAN 7.4, 17-bo'lim).
 */

export interface AiRequestError {
  message: string
  status: number
  code?: string
  /** Kunlik limit tugagan — UI limit ko'rsatkichini qizartiradi. */
  quotaExceeded: boolean
  /** Guruh uchun flag o'chirilgan — AI paneli o'rniga izoh ko'rsatiladi. */
  flagDisabled: boolean
  /** Sessiya tugagan — qayta kirish kerak. */
  unauthenticated: boolean
  aborted: boolean
}

export type AiRequestResult<T> = { ok: true; data: T } | { ok: false; error: AiRequestError }

const STATUS_MESSAGES: Record<number, string> = {
  400: 'So‘rov noto‘g‘ri shakllantirildi. Kiritilgan matnni tekshirib, qaytadan urinib ko‘ring.',
  401: 'Sessiya muddati tugagan. Iltimos, tizimga qaytadan kiring.',
  403: 'Bu imkoniyat sizning guruhingiz uchun yoqilmagan.',
  404: 'Ma’lumot topilmadi.',
  409: 'Hozircha yetarli ma’lumot yo‘q.',
  413: 'Yuborilgan ma’lumot juda katta.',
  429: 'Bugungi AI limitiga yetdingiz. Ertaga yangilanadi — hozircha statik materiallardan foydalaning.',
  500: 'Serverda xatolik yuz berdi. Birozdan so‘ng qaytadan urinib ko‘ring.',
  502: 'AI xizmati javob bermadi. Birozdan so‘ng qaytadan urinib ko‘ring.',
  503: 'AI xizmati vaqtincha ishlamayapti. Birozdan so‘ng qaytadan urinib ko‘ring.',
}

export function abortedError(): AiRequestError {
  return {
    message: 'So‘rov to‘xtatildi.',
    status: 0,
    quotaExceeded: false,
    flagDisabled: false,
    unauthenticated: false,
    aborted: true,
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException ? err.name === 'AbortError' : false
}

export async function errorFromResponse(response: Response): Promise<AiRequestError> {
  let payload: { error?: string; code?: string } = {}
  try {
    payload = (await response.json()) as { error?: string; code?: string }
  } catch {
    // Javob JSON emas — status bo'yicha standart matn ishlatiladi
  }
  const status = response.status
  return {
    message:
      payload.error ||
      STATUS_MESSAGES[status] ||
      'Kutilmagan xatolik. Birozdan so‘ng qaytadan urinib ko‘ring.',
    status,
    code: payload.code,
    quotaExceeded: status === 429 || payload.code === 'quota_exceeded',
    flagDisabled: status === 403,
    unauthenticated: status === 401,
    aborted: false,
  }
}

export function networkError(err: unknown): AiRequestError {
  if (isAbortError(err)) return abortedError()
  return {
    message: 'Tarmoq bilan bog‘lanib bo‘lmadi. Internetni tekshirib, qaytadan urinib ko‘ring.',
    status: 0,
    quotaExceeded: false,
    flagDisabled: false,
    unauthenticated: false,
    aborted: false,
  }
}

/** JSON so'rov → JSON javob. Xatolar hech qachon istisno sifatida tashlanmaydi. */
export async function postAi<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal
): Promise<AiRequestResult<T>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    return { ok: false, error: networkError(err) }
  }

  if (!response.ok) return { ok: false, error: await errorFromResponse(response) }

  try {
    return { ok: true, data: (await response.json()) as T }
  } catch {
    return {
      ok: false,
      error: {
        message: 'AI javobini o‘qib bo‘lmadi. Qaytadan urinib ko‘ring.',
        status: response.status,
        quotaExceeded: false,
        flagDisabled: false,
        unauthenticated: false,
        aborted: false,
      },
    }
  }
}

/** FormData so'rov (audio yuborish) → JSON javob. */
export async function postForm<T>(
  url: string,
  form: FormData,
  signal?: AbortSignal
): Promise<AiRequestResult<T>> {
  let response: Response
  try {
    response = await fetch(url, { method: 'POST', body: form, signal })
  } catch (err) {
    return { ok: false, error: networkError(err) }
  }

  if (!response.ok) return { ok: false, error: await errorFromResponse(response) }

  try {
    return { ok: true, data: (await response.json()) as T }
  } catch {
    return {
      ok: false,
      error: {
        message: 'Javobni o‘qib bo‘lmadi. Qaytadan urinib ko‘ring.',
        status: response.status,
        quotaExceeded: false,
        flagDisabled: false,
        unauthenticated: false,
        aborted: false,
      },
    }
  }
}
