import { Router } from 'express';
import { MessageService } from '../services/MessageService';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Mesaj gönderme endpoint'i
router.post('/send', async (req, res) => {
  const schema = z.object({
    message: z.string().min(1),
    recipientId: z.number(),
    initData: z.string()
  });

  try {
    const { message, recipientId, initData } = schema.parse(req.body);

    // initData'dan Telegram ID'yi al
    const telegramId = initData.split('&').find(param => param.startsWith('user='))?.split('=')[1];
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telegram kullanıcı bilgisi bulunamadı' 
      });
    }

    // Telegram ID ile kullanıcıyı bul
    const sender = await storage.getUserByTelegramId(telegramId);
    
    if (!sender) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gönderen kullanıcı bulunamadı' 
      });
    }

    // Mesajı gönder
    const result = await MessageService.sendMessage(
      sender.id,
      recipientId,
      message
    );

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error || 'Mesaj gönderilemedi' 
      });
    }
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Geçersiz istek' 
    });
  }
});

export default router; 