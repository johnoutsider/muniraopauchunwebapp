import 'server-only'

import { COL } from '@/config/constants'
import { adminDb, FieldValue } from '@/lib/firebase/admin'
import type { SessionUser } from '@/types'

/**
 * Audit jurnali (PLAN.md 10-bo'lim: "Audit log (admin harakatlari, eksport)").
 *
 * HAR QANDAY ma'muriy o'zgarish shu funksiya orqali yoziladi: rol berish,
 * guruhga ko'chirish, flag o'zgartirish, kontent nashr qilish, eksport.
 * Jurnal o'chirilmaydi — dissertatsiya metodologiyasida "kim, qachon, nimani
 * o'zgartirdi" savoliga javob beradi (eksperiment yaxlitligi).
 */
export async function logAudit(
  actor: Pick<SessionUser, 'uid' | 'role' | 'displayName'>,
  action: string,
  target?: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await adminDb()
      .collection(COL.auditLogs)
      .add({
        actorUid: actor.uid,
        actorRole: actor.role,
        action,
        target: target ?? null,
        meta: { actorName: actor.displayName, ...meta },
        ts: FieldValue.serverTimestamp(),
      })
  } catch (err) {
    // Audit yozuvi asosiy amalni to'xtatmasligi kerak, lekin konsolga chiqadi
    console.error('[audit] logAudit failed', action, err)
  }
}

export { AUDIT_ACTIONS, auditActionLabel, type AuditAction } from './audit-meta'
