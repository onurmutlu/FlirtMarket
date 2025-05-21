import { Router } from "express";
import { UserService } from "../services/user.service";
import { authenticateUser } from "../auth/middleware";
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();
const userService = new UserService();

// Define validation schemas
const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  age: z.number().min(18).max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  messagePrice: z.number().min(0).optional().nullable()
});

// Helper function for admin user
const getAdminUser = () => ({
  id: 0,
  username: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  type: 'admin',
  isAdmin: true,
  displayName: 'Admin User',
  coins: 0,
  totalSpent: 0,
  isPerformer: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Helper function for showcu user
const getShowcuUser = () => ({
  id: 999,
  username: 'showcu',
  firstName: 'Test',
  lastName: 'Showcu',
  type: 'performer',
  isAdmin: false,
  displayName: 'Test Showcu',
  coins: 0,
  totalSpent: 0,
  isPerformer: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Tüm rotalar için auth middleware'i ekle
router.use(authenticateUser);

// Mevcut kullanıcı bilgilerini al
router.get("/me", async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) {
      return res.status(401).json({ message: "Kullanıcı kimliği bulunamadı", success: false });
    }
    
    // Admin kullanıcısı için özel kontrol
    if (req.user?.isAdmin && userId === 0) {
      return res.json({
        success: true,
        data: getAdminUser()
      });
    }
    
    // Test showcu kullanıcısı için özel kontrol
    if (req.user?.type === 'performer' && userId === 999) {
      return res.json({
        success: true,
        data: getShowcuUser()
      });
    }

    // Normal kullanıcılar için veritabanı sorgusu
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı", success: false });
    }

    // Return standardized response format
    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error("User fetch error:", error);
    res.status(500).json({ 
      message: "Kullanıcı bilgileri alınırken hata oluştu", 
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mevcut kullanıcı bilgilerini güncelle
router.patch("/me", async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (userId === undefined) {
      return res.status(401).json({ message: "Kullanıcı kimliği bulunamadı", success: false });
    }
    
    // Admin kullanıcısı için özel kontrol
    if (req.user?.isAdmin && userId === 0) {
      return res.json({
        success: true,
        data: getAdminUser()
      });
    }

    // Validate input data
    const validationResult = userUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Geçersiz veri formatı",
        success: false,
        errors: validationResult.error.format()
      });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı", success: false });
    }

    // Use validated data from zod
    const updateData = validationResult.data;

    // Kullanıcıyı güncelle
    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(500).json({ 
        message: "Kullanıcı güncellenemedi", 
        success: false 
      });
    }
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    console.error("User update error:", error);
    res.status(500).json({ 
      message: "Kullanıcı bilgileri güncellenirken hata oluştu", 
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Basit test endpointi
router.get('/', (req, res) => {
  res.json({ 
    message: 'Kullanıcı endpointi çalışıyor',
    success: true,
    timestamp: new Date().toISOString()
  });
});

// Get user by ID endpoint (for admin use)
router.get('/:id', async (req, res) => {
  try {
    // Only allow admins to access this endpoint
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        message: "Bu işlem için yetkiniz yok", 
        success: false 
      });
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        message: "Geçersiz kullanıcı ID'si", 
        success: false 
      });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "Kullanıcı bulunamadı", 
        success: false 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ 
      message: "Kullanıcı bilgileri alınırken hata oluştu", 
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;