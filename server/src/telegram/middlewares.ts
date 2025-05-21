import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Telegram auth check constant
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

/**
 * Validates Telegram Web App init data to ensure it comes from Telegram
 */
export function validateTelegramWebAppData(req: Request, res: Response, next: NextFunction) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Cannot validate Telegram data.");
    return next();
  }

  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ message: "Missing Telegram Web App init data" });
  }

  try {
    // Parse the data
    const parsedData = new URLSearchParams(initData);
    
    // Extract hash and data to check
    const hash = parsedData.get('hash');
    parsedData.delete('hash');
    
    if (!hash) {
      return res.status(400).json({ message: "Invalid init data format: missing hash" });
    }

    // Sort parameters alphabetically
    const dataCheckString = Array.from(parsedData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Generate HMAC-SHA-256 signature
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // Validate the signature
    if (calculatedHash !== hash) {
      return res.status(403).json({ message: "Invalid Telegram Web App data" });
    }

    // Check data is not too old (max 1 hour)
    const authDate = parsedData.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      if (currentTimestamp - authTimestamp > 3600) {
        return res.status(403).json({ message: "Telegram authorization data is expired" });
      }
    }

    next();
  } catch (error) {
    console.error("Error validating Telegram Web App data:", error);
    res.status(400).json({ message: "Failed to validate Telegram data" });
  }
}
