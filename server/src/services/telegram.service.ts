import { Telegraf } from 'telegraf';

export class TelegramService {
  private bot: Telegraf;

  constructor() {
    // Bot token'ı çevre değişkenlerinden alıyoruz
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN çevre değişkeni bulunamadı. Telegram bildirimleri devre dışı.');
      // @ts-ignore - Bot olmadan da çalışabilmesi için
      this.bot = null;
      return;
    }
    
    this.bot = new Telegraf(token);
    
    // Hata yakalama
    this.bot.catch((err) => {
      console.error('Telegram bot hatası:', err);
    });
  }

  /**
   * Bir kullanıcıya Telegram üzerinden bildirim gönder
   */
  async sendNotification(telegramId: string, message: string): Promise<boolean> {
    try {
      if (!this.bot) {
        console.warn('Telegram bot başlatılmadı. Bildirim gönderilemiyor.');
        return false;
      }
      
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown'
      });
      
      return true;
    } catch (error) {
      console.error(`Telegram bildirimi gönderilirken hata: ${error.message}`);
      return false;
    }
  }

  /**
   * Bir kullanıcıya Telegram üzerinden butonlu bildirim gönder
   */
  async sendNotificationWithButton(telegramId: string, message: string, buttonText: string, url: string): Promise<boolean> {
    try {
      if (!this.bot) {
        console.warn('Telegram bot başlatılmadı. Bildirim gönderilemiyor.');
        return false;
      }
      
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: buttonText, url }]
          ]
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Telegram bildirimi gönderilirken hata: ${error.message}`);
      return false;
    }
  }

  /**
   * Bir kullanıcıya Telegram üzerinden web app butonlu bildirim gönder
   */
  async sendNotificationWithWebApp(telegramId: string, message: string, buttonText: string, webAppUrl: string): Promise<boolean> {
    try {
      if (!this.bot) {
        console.warn('Telegram bot başlatılmadı. Bildirim gönderilemiyor.');
        return false;
      }
      
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: buttonText, web_app: { url: webAppUrl } }]
          ]
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Telegram bildirimi gönderilirken hata: ${error.message}`);
      return false;
    }
  }
}

export default new TelegramService();
