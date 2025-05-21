import { Router } from "express";
import { UserService } from "../services/user.service";
import { generateToken } from "../auth/jwt";
import bcrypt from "bcrypt";
import { USER_TYPES } from "@shared/schema";
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { generateReferralCode } from '../utils/referral';
import { getBot } from '../telegram/bot';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { authenticateUser } from '../auth/middleware';

const router = Router();
const userService = new UserService();

// Test kullanıcılarını oluştur
router.post("/setup-test-users", async (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await userService.createTestUsers();
      res.json({ message: "Test kullanıcıları oluşturuldu" });
    } catch (error) {
      console.error("Test kullanıcı oluşturma hatası:", error);
      res.status(500).json({ message: "Test kullanıcıları oluşturulurken hata oluştu" });
    }
  } else {
    res.status(403).json({ message: "Bu endpoint sadece development modunda kullanılabilir" });
  }
});

// Genel login endpointi - kullanıcı tipine göre yönlendirme yapar
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Admin özel hesap kontrolü
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 0, type: USER_TYPES.ADMIN, isAdmin: true },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      console.log("Admin login successful");
      
      return res.json({ 
        token, 
        user: {
          id: 0,
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          type: USER_TYPES.ADMIN,
          isAdmin: true,
          displayName: 'Admin User',
          coins: 0,
          totalSpent: 0,
          isPerformer: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } 
      });
    }
    
    // Showcu özel hesap kontrolü
    if (username === 'showcu' && password === 'showcu123') {
      const token = jwt.sign(
        { userId: 999, type: USER_TYPES.PERFORMER, isAdmin: false },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      console.log("Performer login successful");
      
      return res.json({ 
        token, 
        user: {
          id: 999,
          username: 'showcu',
          firstName: 'Test',
          lastName: 'Showcu',
          type: USER_TYPES.PERFORMER,
          isAdmin: false,
          displayName: 'Test Showcu',
          coins: 0,
          totalSpent: 0,
          isPerformer: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } 
      });
    }

    // Normal kullanıcılar için veritabanı kontrolü
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
    }

    // Şifreyi kontrol et
    const isValidPassword = user.passwordHash ? 
      await bcrypt.compare(password, user.passwordHash) : 
      false;

    if (!isValidPassword) {
      return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
    }

    // Token oluştur
    const token = jwt.sign(
      { userId: user.id, type: user.type, isAdmin: user.type === USER_TYPES.ADMIN },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    return res.json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Giriş yapılırken bir hata oluştu" });
  }
});

// Telegram girişi
router.post('/telegram', async (req, res) => {
  try {
    const { initData, ref } = req.body;

    // Test modu kontrolü
    if (process.env.NODE_ENV === 'development' && initData === 'mock_init_data') {
      let user = await storage.getUserByTelegramId('telegram123');
      
      if (!user) {
        user = await storage.createUser({
          firstName: 'Telegram',
          lastName: 'User',
          type: 'user',
          coins: 1000,
          telegramId: 'telegram123',
          referralCode: generateReferralCode()
        });
      }

      const token = jwt.sign(
        { userId: user.id, type: user.type },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      return res.json({ token, user });
    }

    // Telegram doğrulama kontrolü
    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ message: 'Geçersiz Telegram verisi' });
    }
    
    // Kullanıcı bilgilerini al veya oluştur
    let user = await storage.getUserByTelegramId(initData);
    
    if (!user) {
      // Yeni kullanıcı oluştur
      user = await storage.createUser({
        firstName: 'Telegram',
        lastName: 'User',
        type: 'user',
        coins: 100,
        telegramId: initData,
        referralCode: generateReferralCode()
      });
      
      // Referral kodu varsa işle
      if (ref) {
        const referrer = await storage.getUserByReferralCode(ref);
        if (referrer) {
          await storage.processReferralBonus(referrer.id, user.id);
        }
      }
    }
    
    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId, type: user.type },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
    
    return res.json({ token, user });
  } catch (err) {
    console.error('Telegram auth error:', err);
    res.status(500).json({ message: 'Giriş yapılırken bir hata oluştu' });
  }
});

// Telegram webhook endpoint'i
router.post('/telegram-webhook/:token', (req, res) => {
  try {
    const { token } = req.params;
    
    // Token doğrulama - .env'deki token ile eşleşmeli
    if (token !== process.env.TELEGRAM_BOT_TOKEN) {
      return res.sendStatus(401);
    }
    
    const bot = getBot();
    if (!bot) {
      console.error('Bot instance not found');
      return res.sendStatus(500);
    }
    
    // Update nesnesini al
    const update = req.body as Update;
    
    // Bot'a güncellemeyi işle
    bot.handleUpdate(update)
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        console.error('Error handling update:', err);
        res.sendStatus(500);
      });
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Logout endpoint'i
router.post('/logout', async (req, res) => {
  try {
    // Kullanıcı oturumunu sonlandır - hiçbir veritabanı işlemi yapmadan
    // Clientin oturumu temizlemesi için sadece başarılı yanıt dön
    res.json({ success: true, message: "Başarıyla çıkış yapıldı" });
  } catch (error) {
    console.error("Logout error:", error);
    // Hata olsa bile başarılı yanıt dön
    res.json({ success: true, message: "Çıkış yapıldı" });
  }
});

export default router; 