import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getBot } from './bot';

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://t.me/YourBot/app';

export async function sendMessageToPerformer(
  recipientId: number,
  senderId: number,
  senderName: string,
  message: string
): Promise<boolean> {
  try {
    // Şovcu kullanıcıyı bul
    const performer = await db
      .select({
        telegramId: users.telegramId,
        firstName: users.firstName
      })
      .from(users)
      .where(eq(users.id, recipientId))
      .then(res => res[0]);

    if (!performer) {
      console.warn(`Şovcu bulunamadı (ID: ${recipientId})`);
      return false;
    }

    if (!performer.telegramId) {
      console.warn(`Şovcunun Telegram ID'si yok (ID: ${recipientId})`);
      return false;
    }

    const bot = getBot();
    if (!bot) {
      console.warn('Telegram bot başlatılmamış');
      return false;
    }

    // Mesaj metnini oluştur
    const messageText = `
💌 Yeni mesaj aldınız!
👤 *${senderName}*: "${message}"
    `.trim();

    // Yanıtla butonu için inline keyboard
    const keyboard = {
      inline_keyboard: [
        [{
          text: "💬 Yanıtla",
          web_app: { url: `${WEBAPP_URL}?chat=${senderId}` }
        }]
      ]
    };

    // Mesajı gönder
    await bot.sendMessage(performer.telegramId, messageText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    return true;
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return false;
  }
} 