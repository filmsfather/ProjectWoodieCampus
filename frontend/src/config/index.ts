// 환경변수 설정
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: 'Woodie Campus',
    version: '1.0.0',
    isDev: import.meta.env.VITE_DEV_MODE === 'true',
  },
  routes: {
    home: '/',
    login: '/login',
    dashboard: '/dashboard',
    problems: '/problems',
    admin: '/admin',
  }
};

// 환경변수 검증
export const validateConfig = () => {
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }

  return missing.length === 0;
};