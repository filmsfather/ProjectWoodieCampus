import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 성능 최적화 설정
  build: {
    // 코드 스플리팅 설정
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리를 별도 청크로 분리
          'react-vendor': ['react', 'react-dom'],
          // 라우팅 라이브러리를 별도 청크로 분리
          'router-vendor': ['react-router-dom'],
        },
      },
    },
    
    // 청크 사이즈 경고 임계값 (KB)
    chunkSizeWarningLimit: 1000,
    
    // 압축 설정
    minify: 'terser',
    
    // Source map 설정 (프로덕션에서는 비활성화)
    sourcemap: false,
  },
  
  // 개발 서버 설정
  server: {
    port: 5173,
    host: '0.0.0.0',
    
    // HMR 성능 최적화
    hmr: {
      overlay: true,
    },
  },
  
  // 사전 번들링 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
  },
  
  // 에일리어스 설정 (빠른 모듈 해석)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },
})
