import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

import { db, FieldValue } from '../lib/firebase';
import { COL, REGION } from '../constants';

/**
 * onAttemptCreated — har bir urinish `items/{itemId}.stats` ni oshiradi:
 *   stats.attempts +1, stats.correct +1 (agar to'g'ri bo'lsa).
 *
 * Nima uchun: item bank qaysi mashq juda qiyin/juda oson ekanini o'zi "o'rganadi"
 * (PLAN 4.2 — items.stats{attempts, correctRate}). O'qituvchi tasdiqlash sahifasida
 * shu ko'rsatkichlarga qarab itemni qayta ko'radi yoki rad etadi.
 *
 * Increment atomik — parallel urinishlar bir-birini bosib ketmaydi.
 * Item o'chirilgan bo'lsa update xato beradi → yutamiz (defensive).
 */
export const onAttemptCreated = onDocumentCreated(
  { document: `${COL.attempts}/{attemptId}`, region: REGION, retry: false },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    try {
      const data = snap.data() ?? {};
      const itemId = data.itemId as string | undefined;
      if (!itemId) return;

      const isCorrect = data.isCorrect === true;

      await db
        .collection(COL.items)
        .doc(itemId)
        .update({
          'stats.attempts': FieldValue.increment(1),
          'stats.correct': FieldValue.increment(isCorrect ? 1 : 0),
          'stats.lastAttemptAt': FieldValue.serverTimestamp(),
        });
    } catch (err) {
      // Odatda: item o'chirilgan yoki hali `stats` maydoni yo'q hujjat.
      logger.warn('onAttemptCreated: items.stats yangilanmadi', err);
    }
  }
);
