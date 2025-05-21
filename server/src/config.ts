import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || "development",
  WEBAPP_URL: process.env.WEBAPP_URL || "https://flirtmarket.app",
  SESSION_SECRET: process.env.SESSION_SECRET,
  PORT: parseInt(process.env.PORT || "3000", 10),
} as const;

// Tip kontrolü
export type Config = typeof config; 