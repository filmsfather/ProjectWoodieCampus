import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualScrollItem {
  id: string | number;
  data: any;
}

interface VirtualScrollProps<T extends VirtualScrollItem> {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
  loading?: boolean;
}

export function VirtualScroll<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScrollEnd,
  loading = false
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    // 스크롤 끝 감지
    if (onScrollEnd) {
      const { scrollHeight, clientHeight } = e.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd]);

  return (
    <div className={className}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* 전체 컨테이너 높이 유지 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 실제 렌더링되는 아이템들 */}
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <div
                key={item.id}
                style={{ height: itemHeight }}
                className="flex items-center"
              >
                {renderItem(item, startIndex + index)}
              </div>
            ))}
          </div>
        </div>
        
        {/* 로딩 표시 */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// 무한 스크롤을 위한 훅
export function useInfiniteScroll<T extends VirtualScrollItem>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean,
  loading: boolean
) {
  const [items, setItems] = useState<T[]>([]);
  
  const handleScrollEnd = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      const newItems = await fetchMore();
      setItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Failed to fetch more items:', error);
    }
  }, [fetchMore, hasMore, loading]);
  
  return {
    items,
    setItems,
    handleScrollEnd
  };
}

export default VirtualScroll;