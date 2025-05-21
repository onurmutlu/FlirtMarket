import { Router } from "express";
import { UserService } from "../services/user.service";
import { authenticateUser, requireAdmin } from "../auth/middleware";
import { USER_TYPES } from "@shared/schema";
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

const router = Router();
const userService = new UserService();

// Admin girişi - bu endpoint için yetkilendirme gerektirmiyor
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Admin login attempt:", username);

    // Test admin hesabı kontrolü
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 0, isAdmin: true, type: USER_TYPES.ADMIN },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      console.log("Admin login successful");

      return res.json({ 
        token, 
        user: {
          id: 0,
          firstName: 'Admin',
          lastName: 'User',
          type: USER_TYPES.ADMIN,
          isAdmin: true,
          displayName: 'Admin User'
        } 
      });
    }

    console.log("Admin login failed: invalid credentials");
    
    // Gerçek admin hesapları için veritabanı kontrolü - geliştirilebilir
    res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: 'Giriş yapılırken bir hata oluştu' });
  }
});

// ---- Protected Routes ----
// Bundan sonraki tüm rotalar için admin yetkisi gerekiyor

// Middleware'leri sadece korumalı rotalar için ekle
const protectedRouter = Router();
protectedRouter.use(authenticateUser);
protectedRouter.use(requireAdmin);

// Tüm kullanıcıları listele
protectedRouter.get("/users", async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ message: "Kullanıcılar yüklenirken hata oluştu" });
  }
});

// Kullanıcı güncelle
protectedRouter.patch("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Geçersiz kullanıcı ID" });
    }
    
    const { type } = req.body;
    
    if (!type || !['user', 'performer', 'admin'].includes(type)) {
      return res.status(400).json({ message: "Geçersiz kullanıcı tipi" });
    }
    
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Kullanıcı tipini güncelle
    const updatedUser = await storage.updateUser(userId, { type });
    res.json(updatedUser);
  } catch (error) {
    console.error("User update error:", error);
    res.status(500).json({ message: "Kullanıcı güncellenirken hata oluştu" });
  }
});

// Kullanıcıyı sil
protectedRouter.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Geçersiz kullanıcı ID" });
    }
    
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Kullanıcıyı silme işlemi - şimdilik işlem yapmıyoruz
    // Gerçek silme işlemi için veritabanı işlemleri eklenmeli
    res.json({ success: true, message: "Silme işlemi simüle edildi" });
  } catch (error) {
    console.error("User delete error:", error);
    res.status(500).json({ message: "Kullanıcı silinirken hata oluştu" });
  }
});

// Kullanıcının coin bakiyesini düzenle
protectedRouter.post("/users/:id/adjust-coins", async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Geçersiz kullanıcı ID" });
    }
    
    const { amount, reason } = req.body;
    
    if (isNaN(parseInt(amount, 10))) {
      return res.status(400).json({ message: "Geçersiz miktar" });
    }
    
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    let updatedUser;
    const intAmount = parseInt(amount, 10);
    
    if (intAmount >= 0) {
      // Coin ekle
      updatedUser = await storage.addCoins(userId, intAmount, reason || "Admin tarafından eklendi");
    } else {
      // Coin çıkar
      updatedUser = await storage.spendCoins(userId, Math.abs(intAmount), reason || "Admin tarafından çıkarıldı");
      
      if (!updatedUser) {
        return res.status(400).json({ message: "Kullanıcının yeterli coini yok" });
      }
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Coin adjustment error:", error);
    res.status(500).json({ message: "Coin bakiyesi düzenlenirken hata oluştu" });
  }
});

// Admin dashboard verileri
protectedRouter.get('/dashboard', async (req, res) => {
  try {
    // Dashboard verilerini getir
    const users = await storage.getUsersByType(USER_TYPES.REGULAR);
    const performers = await storage.getUsersByType(USER_TYPES.PERFORMER);

    // Toplam kullanıcı ve performer sayıları
    const totalUsers = users.length;
    const totalPerformers = performers.length;
    
    // Örnek mesaj sayısı - gerçek implementasyonda mesaj sayısını almak gerekir
    const totalMessages = 0; // Bu kısmı MessageService ile entegre edebilirsiniz
    
    res.json({
      totalUsers,
      totalPerformers,
      totalMessages,
      recentUsers: users.slice(0, 5),
      recentPerformers: performers.slice(0, 5),
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Korumalı rotaları ana router'a monte et
router.use('/', protectedRouter);

export default router; 