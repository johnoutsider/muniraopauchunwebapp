import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { db } from '../lib/firebase';
import { COL, REGION, TIMEZONE } from '../constants';
import { addDays, dayKey } from '../lib/helpers';

/**
 * scheduledStreakReset — har kuni 00:30 (Asia/Tashkent), kun almashgach.
 * Agar talaba KECHA ham, BUGUN ham mashq qilmagan bo'lsa (lastDay < kecha),
 * `streaks/{uid}.current` nolga tushadi. `longest` tegilmaydi.
 *
 * Nima uchun "kecha" bilan taqqoslanadi: kun boshida bugun hali hech kim
 * ishlamagan bo'ladi, shuning uchun faqat kechagi kunni o'tkazib yuborganlar
 * jazolanadi (PLAN 8.12 — streak).
 */
export const scheduledStreakReset = onSchedule(
  {
    schedule: '30 0 * * *',
    timeZone: TIMEZONE,
    region: REGION,
    retryCount: 1,
    memory: '256MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const yesterday = dayKey(addDays(new Date(), -1));

    try {
      // Bitta tengsizlik filtri (lastDay) — qo'shimcha kompozit indeks kerak emas.
      // `current > 0` shartini kodda tekshiramiz.
      const snap = await db.collection(COL.streaks).where('lastDay', '<', yesterday).get();

      if (snap.empty) {
        logger.info('scheduledStreakReset: uzilgan streak yo‘q', { yesterday });
        return;
      }

      let batch = db.batch();
      let inBatch = 0;
      let reset = 0;

      for (const doc of snap.docs) {
        const current = doc.data()?.current;
        if (typeof current !== 'number' || current <= 0) continue;
        batch.update(doc.ref, { current: 0, brokenAt: yesterday });
        inBatch += 1;
        reset += 1;
        if (inBatch >= 400) {
          await batch.commit();
          batch = db.batch();
          inBatch = 0;
        }
      }
      if (inBatch > 0) await batch.commit();

      logger.info('scheduledStreakReset tayyor', { reset, yesterday });
    } catch (err) {
      logger.error('scheduledStreakReset xato', err);
    }
  }
);
