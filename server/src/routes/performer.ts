import { Router } from 'express';
import { authenticateUser, requirePerformer } from '../auth/middleware';
import { storage } from '../storage';

const router = Router();

// Performer yetkisi kontrolü
router.use(authenticateUser);
router.use(requirePerformer);

// Performer istatistiklerini getir
router.get('/:id/stats', async (req, res) => {
  try {
    const performerId = parseInt(req.params.id);
    
    // Kullanıcının kendi istatistiklerini görmesini sağla
    if (performerId !== req.user!.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu istatistikleri görüntüleme yetkiniz yok' 
      });
    }

    // Performer'ı kontrol et
    const performer = await storage.getUserById(performerId);
    if (!performer) {
      return res.status(404).json({
        success: false,
        message: 'Performer bulunamadı'
      });
    }

    // Son 7 günlük mesajları getir
    const lastWeekMessages = await storage.getMessagesForPerformer(performerId, 7);
    
    // Aktif sohbetleri getir
    const activeChats = await storage.getActiveChatsForPerformer(performerId);
    
    // Toplam kazancı hesapla
    const transactions = await storage.getTransactionsForUser(performerId);
    const totalEarnings = transactions
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Son 7 günlük kazancı hesapla
    const weeklyEarnings = transactions
      .filter(t => t.type === 'earn' && t.createdAt && t.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Yanıt oranını hesapla
    const totalMessages = lastWeekMessages.length;
    const respondedMessages = lastWeekMessages.filter(m => m.read).length;
    const responseRate = totalMessages > 0 ? (respondedMessages / totalMessages) * 100 : 0;
    
    // Ortalama puanı getir
    const averageRating = performer.rating || 0;

    res.json({
      totalEarnings,
      weeklyEarnings,
      responseRate,
      averageRating,
      totalMessages,
      activeChats: activeChats.length
    });
  } catch (error) {
    console.error('Performer stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'İstatistikler alınırken bir hata oluştu' 
    });
  }
});

// Performer referanslarını getir
router.get('/referrals', async (req, res) => {
  try {
    const performerId = req.user!.userId;
    
    // Son 30 günlük referansları getir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactions = await storage.getTransactionsForUser(performerId);
    const referralTransactions = transactions.filter(t => 
      t.type === 'referral' && 
      t.createdAt && 
      t.createdAt > thirtyDaysAgo
    );

    // Referans yapılan kullanıcıları getir
    const referredUsers = await Promise.all(
      referralTransactions.map(async t => {
        if (!t.relatedUserId) return null;
        const user = await storage.getUserById(t.relatedUserId);
        return user ? {
          id: user.id,
          displayName: user.displayName,
          createdAt: t.createdAt,
          bonus: t.amount
        } : null;
      })
    );

    res.json({
      success: true,
      data: {
        referrals: referredUsers.filter(Boolean),
        totalBonus: referralTransactions.reduce((sum, t) => sum + t.amount, 0),
        totalCount: referralTransactions.length
      }
    });
  } catch (error) {
    console.error('Referrals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Referans bilgileri alınırken bir hata oluştu' 
    });
  }
});

// Performer rozetlerini getir
router.get('/badges', async (req, res) => {
  try {
    const performerId = req.user!.userId;
    
    // Performer'ı getir
    const performer = await storage.getUserById(performerId);
    if (!performer) {
      return res.status(404).json({
        success: false,
        message: 'Performer bulunamadı'
      });
    }

    // Son 30 günlük istatistikleri getir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Mesajları getir
    const messages = await storage.getMessagesForPerformer(performerId, 30);
    const totalMessages = messages.length;
    const respondedMessages = messages.filter(m => m.read).length;
    const responseRate = totalMessages > 0 ? (respondedMessages / totalMessages) * 100 : 0;
    
    // İşlemleri getir
    const transactions = await storage.getTransactionsForUser(performerId);
    const monthlyEarnings = transactions
      .filter(t => t.type === 'earn' && t.createdAt && t.createdAt > thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Rozetleri hesapla
    const badges = [
      {
        id: 'fast_responder',
        name: 'Hızlı Yanıtlayıcı',
        description: 'Mesajların %90\'ından fazlasını yanıtladı',
        earned: responseRate >= 90
      },
      {
        id: 'top_earner',
        name: 'Yüksek Kazanç',
        description: 'Bu ay 1000+ coin kazandı',
        earned: monthlyEarnings >= 1000
      },
      {
        id: 'active_chatter',
        name: 'Aktif Sohbetçi',
        description: 'Bu ay 100+ mesaj gönderdi',
        earned: totalMessages >= 100
      },
      {
        id: 'five_star',
        name: '5 Yıldız',
        description: '5.0 puan ortalamasına sahip',
        earned: performer.rating === 5
      }
    ];

    res.json({
      success: true,
      data: {
        badges,
        stats: {
          responseRate,
          monthlyEarnings,
          totalMessages,
          rating: performer.rating || 0
        }
      }
    });
  } catch (error) {
    console.error('Badges error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Rozetler alınırken bir hata oluştu' 
    });
  }
});

export default router; 