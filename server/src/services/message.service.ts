import { db } from "../db";
import { messages, users, transactions } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

export class MessageService {
  async sendMessage(
    senderId: number,
    receiverId: number,
    content: string,
    coinCost: number = 1
  ) {
    return await db.transaction(async (tx) => {
      // Kullanıcının coin durumunu kontrol et
      const sender = await tx
        .select()
        .from(users)
        .where(eq(users.id, senderId))
        .limit(1);

      if (!sender.length || sender[0].coins < coinCost) {
        throw new Error("Yetersiz coin");
      }

      // Coin harca
      await tx
        .update(users)
        .set({ coins: sender[0].coins - coinCost })
        .where(eq(users.id, senderId));

      // İşlemi kaydet
      await tx.insert(transactions).values({
        userId: senderId,
        type: "spend",
        amount: coinCost,
        description: `Mesaj gönderimi - ${receiverId}`,
        createdAt: new Date(),
      });

      // Mesajı kaydet
      const [message] = await tx
        .insert(messages)
        .values({
          senderId,
          receiverId,
          content,
          coinCost,
          status: "sent",
          createdAt: new Date(),
        })
        .returning();

      return message;
    });
  }

  async getUserMessages(userId: number) {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
  }
} 