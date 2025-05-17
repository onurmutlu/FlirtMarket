import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        telegramId: string;
        type: string;
      };
    }
  }
}

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for certain routes
  if (req.path === '/auth/telegram') {
    return next();
  }

  // Development mode bypass
  if (process.env.NODE_ENV === 'development' && req.query.dev_mode === 'true') {
    req.user = {
      userId: 1,
      telegramId: '123456789',
      type: 'regular'
    };
    return next();
  }

  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      telegramId: string;
      type: string;
    };

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
