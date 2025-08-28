import React, { useState, useRef, useEffect } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: string; // e.g., '16/9', '4/3', '1/1'
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  sizes?: string;
  srcSet?: string;
  priority?: boolean; // true for above-the-fold images
  placeholder?: string; // base64 or blur data URL
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16/9',
  objectFit = 'cover',
  sizes,
  srcSet,
  priority = false,
  placeholder,
  className = '',
  onLoad,
  onError
}: ResponsiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [inView, setInView] = useState(priority); // If priority, load immediately
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, inView]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    aspectRatio,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f5f5f0' // neutral-50 fallback
  };

  const imageClasses = `
    w-full h-full object-${objectFit} transition-opacity duration-300
    ${imageLoaded ? 'opacity-100' : 'opacity-0'}
    ${className}
  `.trim();

  return (
    <div 
      ref={containerRef}
      style={containerStyle}
      className="bg-neutral-50 rounded"
    >
      {/* Placeholder or loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover blur-sm scale-110"
              aria-hidden="true"
            />
          ) : (
            <div className="animate-pulse bg-neutral-200 w-full h-full rounded">
              <div className="flex items-center justify-center h-full">
                <svg className="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center">
            <svg className="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-neutral-500">이미지 로드 실패</p>
          </div>
        </div>
      )}

      {/* Actual image - only render when in view or priority */}
      {(inView || priority) && !imageError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          sizes={sizes}
          srcSet={srcSet}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
}

// Common aspect ratios
export const AspectRatios = {
  square: '1/1',
  portrait: '3/4',
  landscape: '4/3',
  widescreen: '16/9',
  ultrawide: '21/9',
  golden: '1.618/1'
} as const;

export default ResponsiveImage;