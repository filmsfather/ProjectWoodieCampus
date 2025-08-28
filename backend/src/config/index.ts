import dotenv from 'dotenv';

dotenv.config();

// 환경변수 설정
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], // React, Vite dev servers
  }
};

// 환경변수 검증
export const validateConfig = () => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  return true;
};

export default config;