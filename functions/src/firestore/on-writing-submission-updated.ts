import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

import { COL, REGION } from '../constants';
import { createNotification } from '../lib/helpers';

/**
 * onWritingSubmissionUpdated — status `reviewed` ga o'tganda talabaga
 * bildirishnoma yuboradi (PLAN 8.5: Write → AI Feedback → Revise → Submit → o'qituvchi bahosi).
 *
 * Faqat status HAQIQATAN o'zgargan holatda ishlaydi — draft saqlash har safar
 * bildirishnoma yaratmasligi uchun.
 */
export const onWritingSubmissionUpdated = onDocumentUpdated(
  { document: `${COL.writingSubmissions}/{submissionId}`, region: REGION, retry: false },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    try {
      if (before.status === 'reviewed' || after.status !== 'reviewed') return;

      const uid = after.uid as string | undefined;
      if (!uid) return;

      const title = (after.taskTitle as string) ?? 'Yozma ish';
      const feedback = (after.teacherFeedback ?? {}) as Record<string, unknown>;
      const score = typeof feedback.score === 'number' ? ` — baho: ${feedback.score}` : '';

      await createNotification(uid, {
        type: 'writing_reviewed',
        text: `"${title}" ishingiz tekshirildi${score}. Feedback bilan tanishing.`,
        link: `/student/writing-lab?submission=${event.params.submissionId}`,
      });

      logger.info('onWritingSubmissionUpdated: bildirishnoma yuborildi', { uid });
    } catch (err) {
      logger.error('onWritingSubmissionUpdated xato', err);
    }
  }
);
