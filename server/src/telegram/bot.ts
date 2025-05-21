import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { log } from '../vite';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { storage } from '../storage';
import { USER_TYPES } from '@shared/schema';
import { generateReferralCode } from '../utils';
import { sendMessageToPerformer } from './notify';
import { config } from "../config";
import { UserService } from "../services/user.service";
import { MessageService } from "../services/message.service";

const userService = new UserService();
const messageService = new MessageService();

let bot: Telegraf | null = null;
let wsServer: WebSocketServer | null = null;
let isPolling = false;

function getBot() {
  return bot;
}

export function setupBot(server: Server) {
  try {
    // Eğer bot zaten başlatılmışsa ve polling yapıyorsa durdur
    if (bot && isPolling) {
      log('Bot already exists and polling, stopping previous instance');
      bot.stop('SIGINT');
      bot = null;
      isPolling = false;
    } else if (bot) {
      log('Bot already exists but not polling, reusing instance');
      return; // Eğer bot varsa ve polling yapmıyorsa yeniden kullanabiliriz
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      log('TELEGRAM_BOT_TOKEN not set, bot will not be started');
      return;
    }

    // Bot yapılandırması - webhook modu kullanılacak
    bot = new Telegraf(token, {
      telegram: {
        webhookReply: true
      }
    });

    // WebSocket sunucusu - WebApp için
    wsServer = new WebSocketServer({ server });
    log('WebSocket server created on HTTP server');
    
    wsServer.on('connection', (ws) => {
      log('Client connected to WebSocket server');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          log(`Received message: ${JSON.stringify(data)}`);
          
          // İstemciden gelen komutları işle
          if (data.type === 'telegram_auth' && data.initData) {
            // Telegram doğrulama verileri
            handleTelegramAuth(data.initData, data.ref)
              .then(user => {
                ws.send(JSON.stringify({ 
                  type: 'auth_result', 
                  success: true, 
                  user 
                }));
              })
              .catch(error => {
                ws.send(JSON.stringify({
                  type: 'auth_result',
                  success: false,
                  error: error.message
                }));
              });
          }
        } catch (err) {
          log(`Error processing WebSocket message: ${err}`);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });
    });
    
    // Bot hata işleyicisi
    bot.catch((err: unknown, ctx: Context<Update>) => {
      log(`Telegram bot error: ${err}`);
    });

    // Bot komutlarını ekle
    setupBotCommands();

    // Production ortamında webhook kullan, development ortamında webhook simülasyonu yap
    if (process.env.NODE_ENV === 'production') {
      const webhookDomain = process.env.WEBHOOK_DOMAIN;
      if (!webhookDomain) {
        log('WARNING: WEBHOOK_DOMAIN not set, bot will not use webhooks in production');
      } else {
        const webhookPath = `/telegram-webhook/${token}`;
        const webhookUrl = `${webhookDomain}${webhookPath}`;
        
        // Webhook ayarla
        bot.telegram.setWebhook(webhookUrl)
          .then(() => {
            log(`Webhook set to ${webhookUrl}`);
          })
          .catch(err => {
            log(`Failed to set webhook: ${err}`);
          });
          
        log('Telegram bot configured for webhook mode in production');
      }
    } else {
      // Development modunda webhook simülasyonu
      log('Development mode: Starting bot without polling');
      
      // Sadece bot'u başlat ama webhook veya polling kullanma
      bot.launch()
        .then(() => {
          log('Telegram bot launched in development mode');
        })
        .catch(err => {
          log(`Failed to launch bot: ${err}`);
        });
      
      // Webhook kullanıyoruz, polling yapmıyoruz
      isPolling = false;
    }

    // Uygulama kapatıldığında botun da düzgün kapatılması
    process.once('SIGINT', () => {
      if (bot) bot.stop('SIGINT');
      if (wsServer) wsServer.close();
    });
    process.once('SIGTERM', () => {
      if (bot) bot.stop('SIGTERM');
      if (wsServer) wsServer.close();
    });

  } catch (error) {
    log(`Error setting up Telegram bot: ${error}`);
  }
}

// Bot komutlarını ve işlevlerini ayarla
function setupBotCommands() {
  if (!bot) return;

  // Start komutu
  bot.start((ctx: Context) => {
    ctx.reply('FlirtMarket botuna hoş geldiniz! Sohbet etmek için web uygulamasını kullanabilirsiniz.');
  });

  // Help komutu
  bot.help((ctx: Context) => {
    ctx.reply('Bu bot FlirtMarket uygulaması için tasarlanmıştır. Web uygulamasından giriş yaparak kullanabilirsiniz.');
  });

  // Test komutu
  bot.command('test', (ctx: Context) => {
    ctx.reply('Bot çalışıyor!');
  });
}

// Telegram doğrulama işlemi
async function handleTelegramAuth(initData: string, ref?: string) {
  try {
    // Burada normalde Telegram doğrulama verileri işlenir
    // Test için basit bir kullanıcı döndürüyoruz
    let user = await storage.getUserByTelegramId(initData);
    
    if (!user) {
      // Test kullanıcısı oluştur
      user = await storage.createUser({
        firstName: 'Telegram',
        lastName: 'User',
        telegramId: initData,
        type: USER_TYPES.REGULAR,
        coins: 1000,
        referralCode: generateReferralCode()
      });
      
      // Referral işlemlerini kontrol et
      if (ref) {
        const referringUser = await storage.getUserByReferralCode(ref);
        if (referringUser) {
          await storage.processReferralBonus(referringUser.id, user.id);
        }
      }
    }
    
    return user;
  } catch (error) {
    log(`Error handling Telegram auth: ${error}`);
    throw new Error('Authentication failed');
  }
}

// Export for external use
export { getBot };
