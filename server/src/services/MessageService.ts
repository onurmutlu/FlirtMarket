import { db } from '../db';
import { messages, conversations, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getBot } from '../telegram/bot';
import { CoinService } from './CoinService';
import { Server } from 'http';

let server: Server | null = null;

export function setServer(httpServer: Server) {
  server = httpServer;
}

export class MessageService {
  static async sendMessage(
    senderId: number,
    recipientId: number,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Kullanıcı bakiyesini kontrol et
      const balance = await CoinService.checkBalance(senderId);
      if (balance < 1) {
        return { success: false, error: 'Yetersiz bakiye' };
      }

      // Alıcı kullanıcıyı bul
      const recipient = await db
        .select({
          id: users.id,
          telegramId: users.telegramId,
          firstName: users.firstName,
          type: users.type
        })
        .from(users)
        .where(eq(users.id, recipientId))
        .then(res => res[0]);

      if (!recipient) {
        return { success: false, error: 'Alıcı kullanıcı bulunamadı' };
      }

      // Gönderen kullanıcıyı bul
      const sender = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          username: users.username
        })
        .from(users)
        .where(eq(users.id, senderId))
        .then(res => res[0]);

      if (!sender) {
        return { success: false, error: 'Gönderen kullanıcı bulunamadı' };
      }

      // Konuşma var mı kontrol et, yoksa oluştur
      let conversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.regularUserId, senderId),
            eq(conversations.performerId, recipientId)
          )
        )
        .then(res => res[0]);

      if (!conversation) {
        const [newConversation] = await db
          .insert(conversations)
          .values({
            regularUserId: senderId,
            performerId: recipientId
          })
          .returning();
        conversation = newConversation;
      }

      // Mesajı veritabanına kaydet
      const [savedMessage] = await db
        .insert(messages)
        .values({
          conversationId: conversation.id,
          senderId,
          recipientId,
          content,
          cost: 1
        })
        .returning();

      // Coin transferini gerçekleştir
      const transferSuccess = await CoinService.transferCoins(
        senderId,
        recipientId,
        1,
        `Mesaj gönderimi: ${savedMessage.id}`
      );

      if (!transferSuccess) {
        // Mesajı sil ve hata dön
        await db
          .delete(messages)
          .where(eq(messages.id, savedMessage.id));
        return { success: false, error: 'Coin transferi başarısız' };
      }

      // Yeni mesaj event'ini tetikle
      if (server) {
        server.emit('newMessage', {
          recipientId,
          senderId,
          senderName: sender.username || sender.firstName,
          message: content
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      return { success: false, error: 'Mesaj gönderilemedi' };
    }
  }
} 