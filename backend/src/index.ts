import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import security middleware
import { SecurityMiddleware } from './middleware/securityMiddleware';

// Import routes
import authRoutes from './routes/auth';
import problemRoutes from './routes/problems';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import workbookRoutes from './routes/workbookRoutes';
import solutionRoutes from './routes/solutionRoutes';
import reviewRoutes from './routes/reviewRoutes';
import schedulerRoutes from './routes/schedulerRoutes';

// Import Supabase connection
import { testSupabaseConnection } from './config/supabase';
import { config, validateConfig } from './config';
import { autoSeedAdminIfNeeded } from './scripts/seedAdmin';
import { setupStorageBucket } from './scripts/setupStorage';
import { SchedulerService } from './services/schedulerService';

// Load environment variables
dotenv.config();

// Validate configuration
validateConfig();

const app = express();
const PORT = config.server.port;

// Trust proxy for nginx reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(SecurityMiddleware.securityHeaders);
app.use(SecurityMiddleware.validateUserAgent);
app.use(SecurityMiddleware.validateInput);
app.use(SecurityMiddleware.slowDownAttacks);
app.use(SecurityMiddleware.apiRateLimit);

// Standard middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/workbooks', workbookRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Test Supabase connection
  await testSupabaseConnection();
  
  // Setup Storage bucket
  await setupStorageBucket();
  
  // Auto-seed admin account if needed
  await autoSeedAdminIfNeeded();
  
  // Initialize scheduler service
  SchedulerService.initialize();
});

export default app;