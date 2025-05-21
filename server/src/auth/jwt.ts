import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Test kullanıcı tipleri
const TEST_USERS = {
  performer: {
    userId: 1,
    telegramId: 'showcu123',
    type: 'performer',
    username: 'showcu',
    firstName: 'Test',
    lastName: 'Showcu',
    bio: 'Test şovcu profili',
    performerDetails: {
      hourlyRate: 100,
      availability: ['Pazartesi', 'Çarşamba', 'Cuma'],
      skills: ['Dans', 'Şarkı', 'Sohbet'],
      rating: 4.5
    }
  },
  regular: {
    userId: 2,
    telegramId: 'user123',
    type: 'regular',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'Kullanıcı',
    coins: 1000
  }
};

// Extend Express Request interface
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

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  // Development modunda otomatik test kullanıcısı
  if (process.env.NODE_ENV === 'development') {
    // URL'den test kullanıcı tipini al, varsayılan olarak regular
    const testUserType = (req.query.test_user as string) || 'regular';
    const testUser = TEST_USERS[testUserType as keyof typeof TEST_USERS];
    
    if (testUser) {
      req.user = {
        ...testUser,
        testData: testUser // Tüm test verisini sakla
      };
      return next();
    }
  }

  // Normal token doğrulama
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      telegramId: string;
      type: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

interface TokenPayload {
  userId: number;
  telegramId: string;
  type: string;
}

export const generateToken = (payload: TokenPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
