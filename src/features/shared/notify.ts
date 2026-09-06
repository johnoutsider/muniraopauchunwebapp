import 'server-only'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'

/**
 * Bildirishnoma yaratish. Barcha modullar shu funksiyadan foydalanadi,
 * shunda format va o'qilgan/o'qilmagan mantiq bir joyda turadi.
 */
export async function notify(
  uid: string,
  input: { type: string; text: string; link?: string }
): Promise<void> {
  try {
    await adminDb()
      .collection(COL.notifications)
      .doc(uid)
      .collection('items')
      .add({
        type: input.type,
        text: input.text.slice(0, 300),
        link: input.link ?? null,
        read: false,
        ts: FieldValue.serverTimestamp(),
      })
  } catch (err) {
    console.error('[notify] failed', err)
  }
}

/** Bir nechta foydalanuvchiga (guruh topshirig'i, loyiha e'loni). */
export async function notifyMany(
  uids: string[],
  input: { type: string; text: string; link?: string }
): Promise<void> {
  if (!uids.length) return
  const db = adminDb()
  const batch = db.batch()
  for (const uid of uids.slice(0, 400)) {
    const ref = db.collection(COL.notifications).doc(uid).collection('items').doc()
    batch.set(ref, {
      type: input.type,
      text: input.text.slice(0, 300),
      link: input.link ?? null,
      read: false,
      ts: FieldValue.serverTimestamp(),
    })
  }
  try {
    await batch.commit()
  } catch (err) {
    console.error('[notify] batch failed', err)
  }
}
