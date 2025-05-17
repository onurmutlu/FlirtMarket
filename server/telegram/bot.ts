import TelegramBot from 'node-telegram-bot-api';
import { Server } from 'http';
import { storage } from '../storage';
import { USER_TYPES } from '@shared/schema';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://t.me/YourBot/app';

let bot: TelegramBot | null = null;

export function setupBot(server: Server) {
  if (!TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Bot functionality will be limited.");
    return;
  }

  try {
    bot = new TelegramBot(TOKEN, { polling: true });

    // Handle start command
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      const referralCode = match?.[1]; // Get referral code if present

      if (!telegramId) {
        bot!.sendMessage(chatId, "Error processing your information. Please try again.");
        return;
      }

      try {
        // Check if user already exists
        const existingUser = await storage.getUserByTelegramId(telegramId);
        
        // Welcome message
        let welcomeText = `👋 Hoş geldiniz! Arkadaşlar edinmek ve eğlenmek için platformumuza katılın.\n\nUygulamayı kullanmak için aşağıdaki butona tıklayın.`;
        
        // Add a note about referral if applicable
        if (referralCode && !existingUser) {
          const referrer = await storage.getUserByReferralCode(referralCode);
          if (referrer) {
            welcomeText += `\n\nSizi davet eden: ${referrer.firstName}`;
          }
        }

        // Create URL with referral information if needed
        let appUrl = WEBAPP_URL;
        if (referralCode) {
          appUrl += `?ref=${referralCode}`;
        }
        
        // Send message with webapp button
        await bot!.sendMessage(chatId, welcomeText, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🚀 Uygulamayı Aç", web_app: { url: appUrl } }]
            ]
          }
        });
      } catch (error) {
        console.error("Error handling /start command:", error);
        bot!.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      }
    });

    // Handle referral command
    bot.onText(/\/referral/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();

      if (!telegramId) {
        bot!.sendMessage(chatId, "Error processing your information. Please try again.");
        return;
      }

      try {
        // Get user
        const user = await storage.getUserByTelegramId(telegramId);
        
        if (!user) {
          bot!.sendMessage(chatId, "Önce kayıt olmanız gerekmektedir. Lütfen /start komutunu kullanın.");
          return;
        }

        // Only performers can use referrals
        if (user.type !== USER_TYPES.PERFORMER) {
          bot!.sendMessage(chatId, "Referans programı yalnızca şovcular için kullanılabilir.");
          return;
        }

        const referralLink = `https://t.me/YourBot?start=${user.referralCode}`;
        
        await bot!.sendMessage(chatId, 
          `🎁 Referans Programı\n\nArkadaşlarınızı davet edin ve her kaydolduklarında 50 coin kazanın!\n\nSizin referans linkiniz:\n${referralLink}\n\nBu linki paylaşarak arkadaşlarınızı davet edebilirsiniz.`);
      } catch (error) {
        console.error("Error handling /referral command:", error);
        bot!.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      }
    });

    // Handle balance command
    bot.onText(/\/balance/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();

      if (!telegramId) {
        bot!.sendMessage(chatId, "Error processing your information. Please try again.");
        return;
      }

      try {
        // Get user
        const user = await storage.getUserByTelegramId(telegramId);
        
        if (!user) {
          bot!.sendMessage(chatId, "Önce kayıt olmanız gerekmektedir. Lütfen /start komutunu kullanın.");
          return;
        }

        await bot!.sendMessage(chatId, 
          `💰 Coin Bakiyeniz: ${user.coins || 0}\n\nDaha fazla coin almak veya bakiyenizi yönetmek için uygulamaya girebilirsiniz.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🚀 Uygulamayı Aç", web_app: { url: WEBAPP_URL } }]
            ]
          }
        });
      } catch (error) {
        console.error("Error handling /balance command:", error);
        bot!.sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      }
    });

    // Handle help command
    bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;

      const helpText = `
📱 *Telegram Dating Platform Yardım*

*Kullanılabilir Komutlar:*
/start - Başlatma ve kayıt
/balance - Coin bakiyenizi görüntüleyin
/referral - Referans linkinizi alın (Şovcular için)
/help - Bu yardım mesajını görüntüleyin

*Hakkında:*
Bu platformda erkek kullanıcılar coin harcayarak şovcu profillere mesaj atabilirler. Kadın kullanıcılar hem cevap vererek, hem de referans linki ile kullanıcı getirerek coin kazanabilirler.

Herhangi bir sorunuz varsa lütfen destek ekibimizle iletişime geçin.
      `;

      bot!.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    });

    // Handle notifications for new messages
    server.on('newMessage', async (data: { recipientId: number, senderId: number, senderName: string }) => {
      try {
        const { recipientId, senderId, senderName } = data;
        
        // Get recipient
        const recipient = await storage.getUserById(recipientId);
        
        if (!recipient || !recipient.telegramId) return;
        
        // Send notification
        bot!.sendMessage(recipient.telegramId, 
          `📩 Yeni Mesaj\n\n${senderName} size bir mesaj gönderdi. Görüntülemek için uygulamayı açın.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Mesajı Görüntüle", web_app: { url: WEBAPP_URL } }]
            ]
          }
        });
      } catch (error) {
        console.error("Error sending message notification:", error);
      }
    });

    console.log('Telegram bot started successfully');
  } catch (error) {
    console.error("Error setting up Telegram bot:", error);
  }
}

// Export for external use
export function getBot() {
  return bot;
}
