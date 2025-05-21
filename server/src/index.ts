import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import 'dotenv/config';
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import axios from 'axios';
import { setupBot } from './telegram/bot';
import { UserService } from './services/user.service';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { checkDatabaseConnection } from './db';

const app = express();

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'production',
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production',
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === 'production',
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// CORS yapılandırması
app.use(cors({
  origin: process.env.NODE_ENV === "development" 
    ? [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:8000"
      ]
    : process.env.NODE_ENV === 'production' 
      ? ['https://flirtmarket.app', 'https://www.flirtmarket.app'] 
      : ["https://flirtmarket.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsers with size limits for security
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Auth route'larını ekle
app.use("/api/auth", authRoutes);

// Admin route'larını ekle
app.use("/api/admin", adminRoutes);

// Avatar proxy endpoint'i
app.get('/api/avatar-proxy', async (req, res) => {
  try {
    const { name, background, color, size } = req.query;
    const response = await axios.get(
      `https://ui-avatars.com/api/?name=${name}&background=${background}&color=${color}&size=${size}`,
      { responseType: 'arraybuffer' }
    );
    
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).send('Avatar yüklenirken hata oluştu');
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test kullanıcılarını oluştur (sadece development modunda)
if (process.env.NODE_ENV === 'development') {
  const userService = new UserService();
  userService.createTestUsers()
    .then(() => {
      console.log('Test kullanıcıları oluşturuldu veya güncellendi');
    })
    .catch((error) => {
      console.error('Test kullanıcıları oluşturulurken hata:', error);
    });
}

(async () => {
  try {
    // Check database connection before starting the server
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting application.');
      process.exit(1);
    }
    
    const server = await registerRoutes(app);

    // Improved error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log detailed error in development, but not in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Server error:', err);
      } else {
        // In production, log only non-sensitive information
        console.error(`Server error: ${status} - ${message}`);
      }

      // Send standardized error response
      res.status(status).json({ 
        success: false, 
        message,
        // Only include error details in development
        ...(process.env.NODE_ENV === 'development' ? { error: err.stack } : {})
      });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Telegram bot'unu başlat
    setupBot(server);

    // ALWAYS serve the app on port 8000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      log(`[express] serving on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

export default app;
