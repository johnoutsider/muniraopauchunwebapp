import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { db, FieldValue } from '../lib/firebase';
import { COL, PREDICTION, REGION, TIMEZONE } from '../constants';
import { addDays, clamp, dayKey, linearTrend, toNumber } from '../lib/helpers';

const SKILLS = [
  'vocabulary',
  'grammar',
  'pronunciation',
  'listening',
  'reading',
  'writing',
  'speaking',
  'professional',
] as const;

/**
 * scheduledWeeklyPrediction — har dushanba 03:00 (Asia/Tashkent).
 * Har bir aktiv talaba uchun oxirgi 28 kunlik `statsDaily` bo'yicha ODDIY CHIZIQLI
 * TREND quradi va `predictions/{uid}` hujjatini yozadi (PLAN 6 — AI Progress Prediction).
 *
 * Bu yerda AI CHAQIRILMAYDI: matematik trend arzon va tushuntirib beriladigan.
 * Claude'ning qisqa izohi keyinroq Vercel cron (`/api/cron/weekly-prediction`) da
 * o'qituvchi uchun qo'shiladi — shunda AI kaliti faqat Vercel'da qoladi (PLAN 1.5.2).
 */
export const scheduledWeeklyPrediction = onSchedule(
  {
    schedule: '0 3 * * 1',
    timeZone: TIMEZONE,
    region: REGION,
    retryCount: 1,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const since = dayKey(addDays(new Date(), -PREDICTION.WINDOW_DAYS));

    try {
      const users = await db
        .collection(COL.users)
        .where('role', '==', 'student')
        .where('status', '==', 'active')
        .get();

      if (users.empty) {
        logger.info('scheduledWeeklyPrediction: aktiv talaba yo‘q');
        return;
      }

      let written = 0;
      let batch = db.batch();
      let inBatch = 0;

      for (const userDoc of users.docs) {
        const uid = userDoc.id;

        const stats = await db
          .collection(COL.statsDaily)
          .where('uid', '==', uid)
          .where('date', '>=', since)
          // desc — `statsDaily (uid ASC, date DESC)` indeksidan foydalanish uchun
          .orderBy('date', 'desc')
          .limit(PREDICTION.WINDOW_DAYS)
          .get();

        if (stats.size < PREDICTION.MIN_POINTS) continue;

        // Trend uchun vaqt bo'yicha o'sish tartibiga qaytaramiz.
        const rows = stats.docs
          .map((d) => d.data())
          .reverse()
          .map((data, i) => ({ i, data }));

        // Har ko'nikma uchun alohida trend; ma'lumot bo'lmasa — o'tkazib yuboriladi.
        const predictedPostScores: Record<string, number> = {};
        for (const skill of SKILLS) {
          const points = rows
            .map((r) => ({
              x: r.i,
              y: toNumber(
                ((r.data.skillScores ?? {}) as Record<string, unknown>)[skill],
                NaN
              ),
            }))
            .filter((p) => Number.isFinite(p.y));

          if (points.length < PREDICTION.MIN_POINTS) continue;

          const { a, b } = linearTrend(points);
          // Post-test ~ 8 hafta keyin ≈ 56 kunlik nuqtaga ekstrapolyatsiya.
          const horizon = points[points.length - 1].x + 56;
          predictedPostScores[skill] = Math.round(clamp(a + b * horizon, 0, 100));
        }

        // Umumiy prognoz: ko'nikma prognozlari o'rtachasi; bo'lmasa — correctRate trendi.
        const values = Object.values(predictedPostScores);
        let predictedTotal: number;
        if (values.length > 0) {
          predictedTotal = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
        } else {
          const ratePoints = rows
            .map((r) => ({ x: r.i, y: toNumber(r.data.correctRate, NaN) * 100 }))
            .filter((p) => Number.isFinite(p.y));
          if (ratePoints.length < PREDICTION.MIN_POINTS) continue;
          const { a, b } = linearTrend(ratePoints);
          predictedTotal = Math.round(
            clamp(a + b * (ratePoints[ratePoints.length - 1].x + 56), 0, 100)
          );
        }

        // Faollik: oxirgi 7 kunda nechta kun ishlagan.
        const activeDays = rows.filter((r) => toNumber(r.data.attempts) > 0).length;
        const inactive = activeDays < 3;

        let riskLevel: 'low' | 'medium' | 'high';
        if (predictedTotal >= PREDICTION.RISK_LOW_MIN && !inactive) riskLevel = 'low';
        else if (predictedTotal >= PREDICTION.RISK_MEDIUM_MIN) riskLevel = 'medium';
        else riskLevel = 'high';

        batch.set(
          db.collection(COL.predictions).doc(uid),
          {
            uid,
            predictedPostScores,
            predictedTotal,
            riskLevel,
            method: 'linear_trend',
            windowDays: PREDICTION.WINDOW_DAYS,
            dataPoints: rows.length,
            activeDays,
            generatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        inBatch += 1;
        written += 1;

        if (inBatch >= 400) {
          await batch.commit();
          batch = db.batch();
          inBatch = 0;
        }
      }

      if (inBatch > 0) await batch.commit();
      logger.info('scheduledWeeklyPrediction tayyor', { written });
    } catch (err) {
      logger.error('scheduledWeeklyPrediction xato', err);
    }
  }
);
