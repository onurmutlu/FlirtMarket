import { Express } from 'express';
import { Server } from 'http';
import { setupBot } from '../telegram/bot';
import authRouter from './auth';
import coinsRouter from './coins';
import messagesRouter from './messages';
import performerRouter from './performer';
import adminRouter from './admin';
import usersRouter from './users';
import { setServer } from '../services/MessageService';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = new Server(app);

  // Server'ı MessageService'e aktar
  setServer(server);

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/coins', coinsRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/performer', performerRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/users', usersRouter);

  // Setup Telegram bot
  setupBot(server);

  return server;
} 