import * as functionsV1 from 'firebase-functions/v1';
import { logger } from 'firebase-functions';

import { auth, db, FieldValue } from '../lib/firebase';
import { COL, DEFAULT_USER, REGION } from '../constants';

/**
 * onUserCreated — Firebase Auth'da yangi hisob paydo bo'lganda:
 *   1) `users/{uid}` hujjatini standart qiymatlar bilan yaratadi,
 *   2) `invites/{emailKey}` hujjati bo'lsa (admin bulk import oldindan yozadi) —
 *      undagi rol/guruh/eksperiment guruhi/participantCode'ni oladi va custom
 *      claims sifatida o'rnatadi.
 *
 * Nega v1 trigger: Auth `onCreate` faqat 1-avlod triggeri sifatida mavjud.
 * 2-avlod muqobili (`beforeUserCreated`) Identity Platform'ga yangilashni talab
 * qiladi, MVP uchun shart emas. Qolgan barcha funksiyalar v2.
 */
export const onUserCreated = functionsV1
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const uid = user.uid;
    const email = (user.email ?? '').toLowerCase().trim();

    try {
      const userRef = db.collection(COL.users).doc(uid);
      const existing = await userRef.get();
      if (existing.exists) {
        // Server (bulk import) hujjatni allaqachon yaratgan — faqat claims'ni moslaymiz.
        await applyClaims(uid, existing.data() ?? {});
        return;
      }

      // Oldindan tayyorlangan taklif hujjati: invites/{email}
      let invite: Record<string, unknown> = {};
      if (email) {
        const inviteSnap = await db.collection(COL.invites).doc(email).get();
        if (inviteSnap.exists) invite = inviteSnap.data() ?? {};
      }

      const doc: Record<string, unknown> = {
        uid,
        email,
        displayName: user.displayName ?? (invite.displayName as string) ?? email.split('@')[0] ?? '',
        photoURL: user.photoURL ?? null,
        role: (invite.role as string) ?? DEFAULT_USER.role,
        locale: (invite.locale as string) ?? DEFAULT_USER.locale,
        status: invite.role ? 'active' : DEFAULT_USER.status,
        totalXp: DEFAULT_USER.totalXp,
        consentGiven: DEFAULT_USER.consentGiven,
        consentAt: null,
        mustChangePassword: Boolean(invite.mustChangePassword ?? false),
        createdAt: FieldValue.serverTimestamp(),
        lastActiveAt: FieldValue.serverTimestamp(),
      };

      // Ixtiyoriy tadqiqot maydonlari — faqat mavjud bo'lsa yoziladi.
      if (invite.groupId) doc.groupId = invite.groupId;
      if (invite.groupIds) doc.groupIds = invite.groupIds;
      if (invite.cohortId) doc.cohortId = invite.cohortId;
      if (invite.expGroup) doc.expGroup = invite.expGroup;
      if (invite.participantCode) doc.participantCode = invite.participantCode;
      if (invite.university) doc.university = invite.university;
      if (invite.faculty) doc.faculty = invite.faculty;

      await userRef.set(doc, { merge: true });
      await applyClaims(uid, doc);

      // Taklif ishlatildi — qayta ishlatilmasin.
      if (email && Object.keys(invite).length > 0) {
        await db
          .collection(COL.invites)
          .doc(email)
          .set({ usedAt: FieldValue.serverTimestamp(), usedByUid: uid }, { merge: true });
      }

      logger.info('onUserCreated: users hujjati yaratildi', { uid, role: doc.role });
    } catch (err) {
      // Trigger hech qachon throw qilmaydi: ro'yxatdan o'tish oqimi to'xtab qolmasin.
      logger.error('onUserCreated xato', { uid, err });
    }
  });

/** Custom claims (role, groupId, groupIds, expGroup, participantCode) — PLAN 2. */
async function applyClaims(uid: string, data: Record<string, unknown>): Promise<void> {
  const claims: Record<string, unknown> = {
    role: (data.role as string) ?? DEFAULT_USER.role,
  };
  if (data.groupId) claims.groupId = data.groupId;
  if (data.groupIds) claims.groupIds = data.groupIds;
  if (data.expGroup) claims.expGroup = data.expGroup;
  if (data.participantCode) claims.participantCode = data.participantCode;

  try {
    const record = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, { ...(record.customClaims ?? {}), ...claims });
  } catch (err) {
    logger.error('applyClaims xato', { uid, err });
  }
}
