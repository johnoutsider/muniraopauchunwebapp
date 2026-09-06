import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { db, FieldValue } from '../lib/firebase';
import { COL, REGION, TIMEZONE } from '../constants';
import { addDays, dayKey, toNumber } from '../lib/helpers';

interface GroupAcc {
  activeStudents: number;
  totalAttempts: number;
  totalCorrect: number;
  totalAiMessages: number;
  totalTimeOnTaskMin: number;
  correctRateSum: number;
  correctRateCount: number;
}

/**
 * scheduledDailyAggregation — har kuni 02:00 (Asia/Tashkent).
 * Kechagi `statsDaily` hujjatlarini guruh bo'yicha yig'ib `statsGroupDaily/{groupId}_{date}`
 * yozadi (PLAN 4.4). Bu Teacher/Researcher dashboardlaridagi guruh grafiklari uchun
 * asos bo'ladi va har safar yuzlab hujjatni o'qishdan qutqaradi (xarajat — PLAN 16).
 */
export const scheduledDailyAggregation = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: TIMEZONE,
    region: REGION,
    retryCount: 2,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const date = dayKey(addDays(new Date(), -1)); // kechagi kun

    try {
      const snap = await db.collection(COL.statsDaily).where('date', '==', date).get();

      if (snap.empty) {
        logger.info('scheduledDailyAggregation: kechagi statsDaily yo‘q', { date });
        return;
      }

      const byGroup = new Map<string, GroupAcc>();

      for (const doc of snap.docs) {
        const d = doc.data();
        const groupId = (d.groupId as string) ?? '';
        if (!groupId) continue;

        const acc =
          byGroup.get(groupId) ??
          {
            activeStudents: 0,
            totalAttempts: 0,
            totalCorrect: 0,
            totalAiMessages: 0,
            totalTimeOnTaskMin: 0,
            correctRateSum: 0,
            correctRateCount: 0,
          };

        const attempts = toNumber(d.attempts);
        acc.activeStudents += 1;
        acc.totalAttempts += attempts;
        acc.totalCorrect += toNumber(d.correct);
        acc.totalAiMessages += toNumber(d.aiMessages);
        acc.totalTimeOnTaskMin += toNumber(d.timeOnTaskMin);
        if (attempts > 0) {
          acc.correctRateSum += toNumber(d.correctRate);
          acc.correctRateCount += 1;
        }

        byGroup.set(groupId, acc);
      }

      if (byGroup.size === 0) {
        logger.info('scheduledDailyAggregation: guruhli yozuv topilmadi', { date });
        return;
      }

      const batch = db.batch();
      for (const [groupId, acc] of byGroup) {
        const ref = db.collection(COL.statsGroupDaily).doc(`${groupId}_${date}`);
        batch.set(
          ref,
          {
            groupId,
            date,
            activeStudents: acc.activeStudents,
            totalAttempts: acc.totalAttempts,
            totalCorrect: acc.totalCorrect,
            totalAiMessages: acc.totalAiMessages,
            avgCorrectRate:
              acc.correctRateCount > 0
                ? Math.round((acc.correctRateSum / acc.correctRateCount) * 1000) / 1000
                : 0,
            avgTimeOnTaskMin:
              acc.activeStudents > 0
                ? Math.round((acc.totalTimeOnTaskMin / acc.activeStudents) * 10) / 10
                : 0,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();

      logger.info('scheduledDailyAggregation tayyor', { date, groups: byGroup.size });
    } catch (err) {
      logger.error('scheduledDailyAggregation xato', { date, err });
    }
  }
);
