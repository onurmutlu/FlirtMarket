import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { verifyToken } from "./jwt";
import { UserService } from "../services/user.service";
import jwt from "jsonwebtoken";

// Request tipini genişlet
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        telegramId: string;
        type: string;
        isAdmin?: boolean;
        testData?: any;
      };
    }
  }
}

const userService = new UserService();

// JWT secret kontrolü
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && req.query.dev_mode === 'true') {
      req.user = {
        userId: 1,
        telegramId: '123456789',
        type: 'regular'
      };
      return next();
    }

    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    
    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, JWT_SECRET) as { 
        userId: number;
        telegramId?: string;
        type: string;
        isAdmin?: boolean;
      };
      
      // Admin token'ı özel kontrolü
      if (decoded.isAdmin) {
        req.user = {
          userId: decoded.userId || 0,
          telegramId: '',
          type: 'admin',
          isAdmin: true
        };
        return next();
      }
      
      // Normal kullanıcı için kontrol
      if (!decoded.userId) {
        return res.status(401).json({ message: "Invalid token payload" });
      }
      
      // Kullanıcıyı bul (veritabanında varsa)
      try {
        const user = await userService.getUserById(decoded.userId);
        
        if (user) {
          req.user = {
            userId: user.id,
            telegramId: user.telegramId || '',
            type: user.type
          };
        } else {
          req.user = {
            userId: decoded.userId,
            telegramId: decoded.telegramId || '',
            type: decoded.type
          };
        }
        
        next();
      } catch (userError) {
        // Veritabanı hatası veya kullanıcı bulunamadı durumunda
        // Token bilgilerini kullan
        req.user = {
          userId: decoded.userId,
          telegramId: decoded.telegramId || '',
          type: decoded.type
        };
        next();
      }
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error('Auth hatası:', error);
    res.status(401).json({ message: 'Kimlik doğrulama hatası' });
  }
};

// Admin yetkisi kontrolü
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.type !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin yetkisi gerekli" });
  }
  
  next();
};

// Performer yetkisi kontrolü
export const requirePerformer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.type !== 'performer') {
    return res.status(403).json({ message: "Performer yetkisi gerekli" });
  }
  
  next();
};

// JWT token oluştur
export const generateToken = (payload: { 
  userId: number;
  telegramId?: string;
  type: string;
  isAdmin?: boolean;
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}; 