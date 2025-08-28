import React from 'react';

// 웹 폰트 최적화 유틸리티

// 폰트 프리로딩
export function preloadWebFonts() {
  const fonts = [
    {
      family: 'Noto Sans KR',
      weights: ['400', '500', '600', '700'],
      display: 'swap'
    },
    {
      family: 'Inter',
      weights: ['400', '500', '600'],
      display: 'swap'
    }
  ];

  fonts.forEach(font => {
    font.weights.forEach(weight => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = `https://fonts.gstatic.com/s/notosanskr/v28/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.woff2`;
      document.head.appendChild(link);
    });
  });
}

// 폰트 로딩 상태 감지
export class FontLoadingManager {
  private loadedFonts = new Set<string>();
  private callbacks: (() => void)[] = [];

  constructor() {
    if ('fonts' in document) {
      this.initFontLoadingDetection();
    }
  }

  private async initFontLoadingDetection() {
    try {
      await document.fonts.ready;
      this.notifyAllLoaded();
    } catch (error) {
      console.warn('Font loading detection failed:', error);
      // 폴백: 타이머 사용
      setTimeout(() => this.notifyAllLoaded(), 200);
    }
  }

  onFontsLoaded(callback: () => void) {
    if (this.areAllFontsLoaded()) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  private notifyAllLoaded() {
    this.callbacks.forEach(callback => callback());
    this.callbacks = [];
  }

  private areAllFontsLoaded(): boolean {
    if (!('fonts' in document)) return true;
    
    const requiredFonts = ['Noto Sans KR', 'Inter'];
    return requiredFonts.every(font => document.fonts.check(`16px "${font}"`));
  }
}

// 싱글톤 인스턴스
export const fontManager = new FontLoadingManager();

// 폰트 로딩 React 훅
export function useFontLoading() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    fontManager.onFontsLoaded(() => {
      setFontsLoaded(true);
    });
  }, []);

  return fontsLoaded;
}

// CSS 폰트 최적화 클래스 생성
export function createFontOptimizedClasses() {
  const style = document.createElement('style');
  style.textContent = `
    /* 폰트 로딩 최적화 */
    .font-loading {
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .font-loaded {
      font-family: 'Noto Sans KR', system-ui, sans-serif;
    }
    
    /* CLS 방지를 위한 폰트 크기 조정 */
    @font-face {
      font-family: 'Noto Sans KR';
      font-display: swap;
      size-adjust: 100%;
    }
    
    @font-face {
      font-family: 'Inter';
      font-display: swap;
      size-adjust: 100%;
    }
  `;
  document.head.appendChild(style);
}

// 초기화 함수
export function initializeFontOptimization() {
  preloadWebFonts();
  createFontOptimizedClasses();
  
  // 폰트 로딩 완료 후 클래스 변경
  fontManager.onFontsLoaded(() => {
    document.documentElement.classList.add('fonts-loaded');
    document.documentElement.classList.remove('fonts-loading');
  });
  
  // 초기 클래스 설정
  document.documentElement.classList.add('fonts-loading');
}