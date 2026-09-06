import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

import { db, FieldValue } from '../lib/firebase';
import { COL, PORTFOLIO_MIN_PRON_SCORE, REGION } from '../constants';
import { toNumber } from '../lib/helpers';

/**
 * onSpeakingSubmissionCreated — talaba yangi audio topshirsa:
 * agar Azure `pronScore` uning avvalgi ENG YAXSHI natijasidan yuqori bo'lsa,
 * avtomatik `portfolioItems` yozuvi yaratiladi (PLAN 8.13 — portfolio o'zi yig'iladi).
 *
 * Defensive: azure natijasi hali kelmagan bo'lsa yoki ball past bo'lsa — jim chiqadi.
 */
export const onSpeakingSubmissionCreated = onDocumentCreated(
  { document: `${COL.speakingSubmissions}/{submissionId}`, region: REGION, retry: false },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    try {
      const data = snap.data() ?? {};
      const uid = data.uid as string | undefined;
      if (!uid) return;

      const azure = (data.azure ?? {}) as Record<string, unknown>;
      const score = toNumber(azure.pronScore, NaN);
      if (!Number.isFinite(score) || score < PORTFOLIO_MIN_PRON_SCORE) return;

      // Avvalgi eng yaxshi natija (joriy hujjatdan tashqari).
      const prev = await db
        .collection(COL.speakingSubmissions)
        .where('uid', '==', uid)
        .orderBy('ts', 'desc')
        .limit(50)
        .get();

      let best = 0;
      for (const doc of prev.docs) {
        if (doc.id === snap.id) continue;
        const prevScore = toNumber(
          ((doc.data().azure ?? {}) as Record<string, unknown>).pronScore,
          0
        );
        if (prevScore > best) best = prevScore;
      }

      if (score <= best) return;

      await db.collection(COL.portfolioItems).add({
        uid,
        type: 'speaking',
        refId: snap.id,
        title: (data.taskTitle as string) ?? 'Speaking',
        preview: (data.transcript as string) ?? (data.referenceText as string) ?? '',
        score: Math.round(score),
        pinned: false,
        note: `Yangi shaxsiy rekord: ${Math.round(score)} ball (avvalgi eng yaxshi: ${Math.round(best)}).`,
        createdAt: FieldValue.serverTimestamp(),
      });

      logger.info('portfolioItems: yangi speaking rekordi', { uid, score, best });
    } catch (err) {
      logger.error('onSpeakingSubmissionCreated xato', err);
    }
  }
);
