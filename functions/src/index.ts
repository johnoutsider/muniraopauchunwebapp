/**
 * LinguaEcon AI — Cloud Functions kirish nuqtasi.
 *
 * Bu yerda FAQAT Firestore triggerlari va cron ishlari bo'ladi (PLAN 1.2):
 * og'ir/asinxron, foydalanuvchi so'rovidan mustaqil vazifalar. AI chaqiruvlari
 * va HTTP API Vercel tomonda (Next.js Route Handler / Server Action) qoladi —
 * shunda Anthropic va Azure kalitlari bitta joyda saqlanadi.
 *
 * Deploy: `firebase deploy --only functions` (predeploy `npm run build` ni chaqiradi).
 */

import { setGlobalOptions } from 'firebase-functions/v2';

import { REGION } from './constants';

// Barcha 2-avlod funksiyalari Frankfurt'da — Firestore bilan bir regionda.
setGlobalOptions({
  region: REGION,
  maxInstances: 10,
  memory: '256MiB',
  timeoutSeconds: 120,
});

/* --- Auth triggeri --- */
export { onUserCreated } from './auth/on-user-created';

/* --- Firestore triggerlari --- */
export { onSpeakingSubmissionCreated } from './firestore/on-speaking-submission-created';
export { onWritingSubmissionUpdated } from './firestore/on-writing-submission-updated';
export { onAttemptCreated } from './firestore/on-attempt-created';
export { onChatMessageCreated } from './firestore/on-chat-message-created';

/* --- Rejalashtirilgan (cron) ishlar --- */
export { scheduledDailyAggregation } from './scheduled/daily-aggregation';
export { scheduledWeeklyPrediction } from './scheduled/weekly-prediction';
export { scheduledStreakReset } from './scheduled/streak-reset';
