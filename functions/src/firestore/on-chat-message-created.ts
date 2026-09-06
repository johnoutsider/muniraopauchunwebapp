import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

import { db, FieldValue } from '../lib/firebase';
import { COL, REGION } from '../constants';
import { createNotifications } from '../lib/helpers';

const PREVIEW_MAX = 120;

/**
 * onChatMessageCreated — chat xabari yozilganda:
 *   1) ota `chats/{chatId}.lastMessage` yangilanadi (chat ro'yxatini saralash uchun —
 *      indeks: memberUids array-contains + lastMessage.ts desc),
 *   2) qolgan a'zolarga bildirishnoma yaratiladi.
 *
 * Xabarni klient o'zi yozadi (Firestore Rules ruxsat beradi), shuning uchun
 * lastMessage'ni ISHONCHLI qilib server tomonda yangilaymiz.
 */
export const onChatMessageCreated = onDocumentCreated(
  { document: `${COL.chats}/{chatId}/messages/{messageId}`, region: REGION, retry: false },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { chatId } = event.params;

    try {
      const msg = snap.data() ?? {};
      const senderUid = (msg.senderUid as string) ?? '';
      const rawText = typeof msg.text === 'string' ? msg.text : '';
      const text =
        rawText.length > PREVIEW_MAX ? `${rawText.slice(0, PREVIEW_MAX - 1)}…` : rawText;

      const chatRef = db.collection(COL.chats).doc(chatId);
      const chatSnap = await chatRef.get();
      if (!chatSnap.exists) {
        logger.warn('onChatMessageCreated: chat topilmadi', { chatId });
        return;
      }

      const chat = chatSnap.data() ?? {};
      const members = Array.isArray(chat.memberUids) ? (chat.memberUids as string[]) : [];

      await chatRef.update({
        lastMessage: {
          text,
          senderUid,
          ts: msg.ts ?? FieldValue.serverTimestamp(),
        },
      });

      const senderName =
        (msg.senderName as string) ??
        ((chat.memberNames ?? {}) as Record<string, string>)[senderUid] ??
        'Foydalanuvchi';

      const recipients = members.filter((uid) => uid && uid !== senderUid);
      if (recipients.length === 0) return;

      await createNotifications(recipients, {
        type: 'chat_message',
        text: `${senderName}: ${text || 'yangi xabar'}`,
        link: `/student/communication/chats/${chatId}`,
      });
    } catch (err) {
      logger.error('onChatMessageCreated xato', { chatId, err });
    }
  }
);
