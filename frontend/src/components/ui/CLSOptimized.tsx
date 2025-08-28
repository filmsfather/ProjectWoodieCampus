import React, { useState, useRef, useEffect } from 'react';

// CLS 최적화된 이미지 컴포넌트
interface CLSOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}

export function CLSOptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio = width && height ? `${width}/${height}` : '16/9',
  className = '',
  priority = false
}: CLSOptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const containerStyle: React.CSSProperties = {
    aspectRatio,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f5f5f0'
  };

  return (
    <div style={containerStyle} className={`bg-neutral-50 rounded ${className}`}>
      {!error && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${loaded ? 'opacity-100' : 'opacity-0'}
          `}
          // 명시적 크기 지정으로 CLS 방지
          width={width}
          height={height}
        />
      )}
      
      {/* 로딩 상태 */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="animate-pulse bg-neutral-200 w-full h-full"></div>
        </div>
      )}
      
      {/* 에러 상태 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center">
            <svg className="w-8 h-8 text-neutral-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-neutral-500">이미지 로드 실패</p>
          </div>
        </div>
      )}
    </div>
  );
}

// CLS 최적화된 차트 컨테이너
interface CLSOptimizedChartProps {
  children: React.ReactNode;
  height?: number;
  aspectRatio?: string;
  loading?: boolean;
  className?: string;
}

export function CLSOptimizedChart({
  children,
  height = 300,
  aspectRatio,
  loading = false,
  className = ''
}: CLSOptimizedChartProps) {
  const containerStyle: React.CSSProperties = {
    height: aspectRatio ? 'auto' : `${height}px`,
    aspectRatio: aspectRatio || undefined,
    position: 'relative',
    minHeight: `${height}px` // 최소 높이 보장으로 CLS 방지
  };

  return (
    <div style={containerStyle} className={`${className}`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
          <div className="animate-pulse bg-neutral-200 rounded w-full h-full"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// CLS 최적화된 텍스트 컨테이너 (폰트 로딩 대응)
interface CLSOptimizedTextProps {
  children: React.ReactNode;
  minHeight?: number;
  lines?: number;
  className?: string;
}

export function CLSOptimizedText({
  children,
  minHeight,
  lines,
  className = ''
}: CLSOptimizedTextProps) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    // 웹 폰트 로딩 감지
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        setFontLoaded(true);
      });
    } else {
      // 폴백: 타이머 사용
      setTimeout(() => setFontLoaded(true), 100);
    }
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: minHeight ? `${minHeight}px` : lines ? `${lines * 1.5}em` : undefined,
    visibility: fontLoaded ? 'visible' : 'hidden'
  };

  return (
    <div style={containerStyle} className={className}>
      {children}
    </div>
  );
}

// CLS 최적화된 동적 콘텐츠 컨테이너
interface CLSOptimizedContentProps {
  children: React.ReactNode;
  loading?: boolean;
  minHeight?: number;
  skeletonLines?: number;
  className?: string;
}

export function CLSOptimizedContent({
  children,
  loading = false,
  minHeight = 100,
  skeletonLines = 3,
  className = ''
}: CLSOptimizedContentProps) {
  const containerStyle: React.CSSProperties = {
    minHeight: `${minHeight}px`
  };

  return (
    <div style={containerStyle} className={className}>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: skeletonLines }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-neutral-200 rounded"
              style={{
                width: index === skeletonLines - 1 ? '75%' : '100%'
              }}
            ></div>
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// CLS 최적화를 위한 Intersection Observer 훅
export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, options]);

  return { isIntersecting, hasIntersected };
}

// 성능 지표 측정 훅
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    cls: 0,
    lcp: 0,
    fid: 0
  });

  useEffect(() => {
    // CLS 측정
    if ('web-vital' in window || typeof window !== 'undefined') {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }
        
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      return () => observer.disconnect();
    }
  }, []);

  return metrics;
}

export default {
  CLSOptimizedImage,
  CLSOptimizedChart,
  CLSOptimizedText,
  CLSOptimizedContent,
  useIntersectionObserver,
  usePerformanceMetrics
};