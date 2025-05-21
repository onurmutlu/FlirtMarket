import { Router } from 'express';
import { CoinService } from '../services/CoinService';
import { authenticateUser } from '../auth/middleware';
import { z } from 'zod';

const router = Router();

// Coin satın alma endpoint'i
router.post('/purchase', authenticateUser, async (req, res) => {
  const schema = z.object({
    amount: z.number().positive(),
  });

  try {
    const { amount } = schema.parse(req.body);
    const success = await CoinService.purchaseCoins(req.user!.userId, amount);

    if (success) {
      res.json({ success: true, message: 'Coin satın alma başarılı' });
    } else {
      res.status(400).json({ success: false, message: 'Coin satın alma başarısız' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Geçersiz istek' });
  }
});

// Coin transfer endpoint'i
router.post('/transfer', authenticateUser, async (req, res) => {
  const schema = z.object({
    toUserId: z.number(),
    amount: z.number().positive(),
    description: z.string()
  });

  try {
    const { toUserId, amount, description } = schema.parse(req.body);
    const success = await CoinService.transferCoins(req.user!.userId, toUserId, amount, description);

    if (success) {
      res.json({ success: true, message: 'Transfer başarılı' });
    } else {
      res.status(400).json({ success: false, message: 'Transfer başarısız' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Geçersiz istek' });
  }
});

// Bakiye sorgulama endpoint'i
router.get('/balance', authenticateUser, async (req, res) => {
  try {
    const balance = await CoinService.checkBalance(req.user!.userId);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bakiye sorgulanamadı' });
  }
});

// İşlem geçmişi endpoint'i
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const history = await CoinService.getTransactionHistory(req.user!.userId);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İşlem geçmişi alınamadı' });
  }
});

export default router; 