import { Router } from 'express';
import { auth } from '../middleware/auth';
import coinService from '../services/coin.service';
import giftService from '../services/gift.service';
import promotionService from '../services/promotion.service';
import subscriptionService from '../services/subscription.service';
import taskService from '../services/task.service';
import lootboxService from '../services/lootbox.service';

const router = Router();

// Coin packages
router.get('/coin-packages', auth, async (req, res) => {
  try {
    const packages = await coinService.getCoinPackages(req.user.userId);
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error getting coin packages:', error);
    res.status(500).json({ success: false, message: error.message || 'Coin paketleri alınırken bir hata oluştu' });
  }
});

router.post('/purchase-coins', auth, async (req, res) => {
  try {
    const { packageId, paymentMethod } = req.body;
    
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Paket ID gerekli' });
    }
    
    const result = await coinService.purchaseCoins(req.user.userId, packageId, paymentMethod || 'card');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error purchasing coins:', error);
    res.status(500).json({ success: false, message: error.message || 'Coin satın alınırken bir hata oluştu' });
  }
});

// Gifts
router.get('/gifts', async (req, res) => {
  try {
    const gifts = await giftService.getAvailableGifts();
    res.json({ success: true, data: gifts });
  } catch (error) {
    console.error('Error getting gifts:', error);
    res.status(500).json({ success: false, message: error.message || 'Hediyeler alınırken bir hata oluştu' });
  }
});

router.post('/send-gift', auth, async (req, res) => {
  try {
    const { recipientId, giftId, messageId } = req.body;
    
    if (!recipientId || !giftId) {
      return res.status(400).json({ success: false, message: 'Alıcı ID ve hediye ID gerekli' });
    }
    
    const giftTransaction = await giftService.sendGift(req.user.userId, recipientId, giftId, messageId);
    res.json({ success: true, data: giftTransaction });
  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({ success: false, message: error.message || 'Hediye gönderilirken bir hata oluştu' });
  }
});

router.get('/gift-leaderboard', async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const validPeriods = ['daily', 'weekly', 'monthly'];
    
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({ success: false, message: 'Geçersiz periyot. daily, weekly veya monthly olmalı' });
    }
    
    const leaderboard = await giftService.getGiftLeaderboard(period as 'daily' | 'weekly' | 'monthly');
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error getting gift leaderboard:', error);
    res.status(500).json({ success: false, message: error.message || 'Hediye liderlik tablosu alınırken bir hata oluştu' });
  }
});

// Subscriptions
router.get('/subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.userId);
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ success: false, message: error.message || 'Abonelikler alınırken bir hata oluştu' });
  }
});

router.post('/subscribe', auth, async (req, res) => {
  try {
    const { performerId, durationDays } = req.body;
    
    if (!performerId || !durationDays) {
      return res.status(400).json({ success: false, message: 'Performer ID ve süre gerekli' });
    }
    
    const subscription = await subscriptionService.subscribe(req.user.userId, performerId, durationDays);
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, message: error.message || 'Abonelik işlemi sırasında bir hata oluştu' });
  }
});

router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'Abonelik ID gerekli' });
    }
    
    const result = await subscriptionService.cancelSubscription(subscriptionId, req.user.userId);
    res.json({ success: true, data: { cancelled: result } });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, message: error.message || 'Abonelik iptal edilirken bir hata oluştu' });
  }
});

// Tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await taskService.getUserTasks(req.user.userId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ success: false, message: error.message || 'Görevler alınırken bir hata oluştu' });
  }
});

router.post('/claim-task-reward', auth, async (req, res) => {
  try {
    const { userTaskId } = req.body;
    
    if (!userTaskId) {
      return res.status(400).json({ success: false, message: 'Görev ID gerekli' });
    }
    
    const result = await taskService.claimTaskReward(req.user.userId, userTaskId);
    res.json({ success: true, data: { claimed: result } });
  } catch (error) {
    console.error('Error claiming task reward:', error);
    res.status(500).json({ success: false, message: error.message || 'Görev ödülü alınırken bir hata oluştu' });
  }
});

// Lootboxes
router.get('/lootboxes', async (req, res) => {
  try {
    const lootboxes = await lootboxService.getAvailableLootboxes();
    res.json({ success: true, data: lootboxes });
  } catch (error) {
    console.error('Error getting lootboxes:', error);
    res.status(500).json({ success: false, message: error.message || 'Sürpriz kutular alınırken bir hata oluştu' });
  }
});

router.post('/open-lootbox', auth, async (req, res) => {
  try {
    const { lootboxId } = req.body;
    
    if (!lootboxId) {
      return res.status(400).json({ success: false, message: 'Sürpriz kutu ID gerekli' });
    }
    
    const reward = await lootboxService.openLootbox(req.user.userId, lootboxId);
    res.json({ success: true, data: reward });
  } catch (error) {
    console.error('Error opening lootbox:', error);
    res.status(500).json({ success: false, message: error.message || 'Sürpriz kutu açılırken bir hata oluştu' });
  }
});

router.get('/can-open-free-lootbox', auth, async (req, res) => {
  try {
    const canOpen = await lootboxService.canOpenFreeLootbox(req.user.userId);
    res.json({ success: true, data: { canOpen } });
  } catch (error) {
    console.error('Error checking free lootbox:', error);
    res.status(500).json({ success: false, message: error.message || 'Ücretsiz sürpriz kutu kontrolü sırasında bir hata oluştu' });
  }
});

// Admin routes
router.post('/admin/create-promotion', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { type, discountPercentage, durationHours, targetUserIds } = req.body;
    
    if (!type || !discountPercentage || !durationHours) {
      return res.status(400).json({ success: false, message: 'Tür, indirim yüzdesi ve süre gerekli' });
    }
    
    const promotion = await promotionService.createPromotion(type, discountPercentage, durationHours, targetUserIds);
    res.json({ success: true, data: promotion });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ success: false, message: error.message || 'Promosyon oluşturulurken bir hata oluştu' });
  }
});

router.post('/admin/create-flash-sale', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { discountPercentage, durationHours } = req.body;
    
    if (!discountPercentage || !durationHours) {
      return res.status(400).json({ success: false, message: 'İndirim yüzdesi ve süre gerekli' });
    }
    
    const flashSale = await promotionService.createFlashSale(discountPercentage, durationHours);
    res.json({ success: true, data: flashSale });
  } catch (error) {
    console.error('Error creating flash sale:', error);
    res.status(500).json({ success: false, message: error.message || 'Flash sale oluşturulurken bir hata oluştu' });
  }
});

router.post('/admin/create-special-event', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { eventName, discountPercentage, durationHours } = req.body;
    
    if (!eventName || !discountPercentage || !durationHours) {
      return res.status(400).json({ success: false, message: 'Etkinlik adı, indirim yüzdesi ve süre gerekli' });
    }
    
    const specialEvent = await promotionService.createSpecialEventPromotion(eventName, discountPercentage, durationHours);
    res.json({ success: true, data: specialEvent });
  } catch (error) {
    console.error('Error creating special event:', error);
    res.status(500).json({ success: false, message: error.message || 'Özel etkinlik oluşturulurken bir hata oluştu' });
  }
});

router.post('/admin/create-task', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { title, description, type, targetType, targetCount, rewardType, rewardAmount, userType } = req.body;
    
    if (!title || !description || !type || !targetType || !targetCount || !rewardType || !rewardAmount || !userType) {
      return res.status(400).json({ success: false, message: 'Tüm görev alanları gerekli' });
    }
    
    const task = await taskService.createTask({
      title,
      description,
      type,
      targetType,
      targetCount,
      rewardType,
      rewardAmount,
      userType,
      isActive: true
    });
    
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: error.message || 'Görev oluşturulurken bir hata oluştu' });
  }
});

router.post('/admin/create-lootbox', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { name, description, price, imageUrl } = req.body;
    
    if (!name || !description || price === undefined) {
      return res.status(400).json({ success: false, message: 'Ad, açıklama ve fiyat gerekli' });
    }
    
    const lootbox = await lootboxService.createLootbox({
      name,
      description,
      price,
      imageUrl,
      isActive: true
    });
    
    res.json({ success: true, data: lootbox });
  } catch (error) {
    console.error('Error creating lootbox:', error);
    res.status(500).json({ success: false, message: error.message || 'Sürpriz kutu oluşturulurken bir hata oluştu' });
  }
});

router.post('/admin/add-lootbox-reward', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    const { lootboxId, rewardType, rewardId, rewardAmount, probability } = req.body;
    
    if (!lootboxId || !rewardType || !probability) {
      return res.status(400).json({ success: false, message: 'Sürpriz kutu ID, ödül türü ve olasılık gerekli' });
    }
    
    const reward = await lootboxService.addLootboxReward({
      lootboxId,
      rewardType,
      rewardId,
      rewardAmount,
      probability
    });
    
    res.json({ success: true, data: reward });
  } catch (error) {
    console.error('Error adding lootbox reward:', error);
    res.status(500).json({ success: false, message: error.message || 'Sürpriz kutu ödülü eklenirken bir hata oluştu' });
  }
});

export default router;
