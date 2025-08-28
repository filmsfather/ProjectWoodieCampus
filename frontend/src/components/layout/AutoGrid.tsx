import React from 'react';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
type CardSize = 'sm' | 'md' | 'lg';

interface AutoGridProps<T extends React.ElementType = 'div'> {
  as?: T;
  minWidth?: string;
  cardSize?: CardSize;  // 카드 규격 프리셋
  gap?: SpacingSize;
  gapX?: SpacingSize;
  gapY?: SpacingSize;
  equalHeight?: boolean;
  stretch?: boolean;  // 카드 높이 균등화
  responsive?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
  children: React.ReactNode;
}

const gapMap: Record<SpacingSize, string> = {
  none: 'gap-0',
  xs: 'gap-1',   // 8px
  sm: 'gap-2',   // 16px
  md: 'gap-3',   // 24px
  lg: 'gap-4',   // 32px
  xl: 'gap-6',   // 48px
};

const gapXMap: Record<SpacingSize, string> = {
  none: 'gap-x-0',
  xs: 'gap-x-1',
  sm: 'gap-x-2',
  md: 'gap-x-3',
  lg: 'gap-x-4',
  xl: 'gap-x-6',
};

const gapYMap: Record<SpacingSize, string> = {
  none: 'gap-y-0',
  xs: 'gap-y-1',
  sm: 'gap-y-2',
  md: 'gap-y-3',
  lg: 'gap-y-4',
  xl: 'gap-y-6',
};

// 카드 규격 프리셋
const cardSizeMap: Record<CardSize, { minWidth: string; maxWidth: string }> = {
  sm: { minWidth: '240px', maxWidth: '280px' },
  md: { minWidth: '280px', maxWidth: '320px' },
  lg: { minWidth: '320px', maxWidth: '400px' },
};

export default function AutoGrid<T extends React.ElementType = 'div'>({
  as,
  minWidth,
  cardSize,
  gap,
  gapX,
  gapY,
  equalHeight = false,
  stretch = false,
  responsive,
  className = '',
  children,
  ...props
}: AutoGridProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof AutoGridProps<T>>) {
  const Component = as || 'div';
  
  // 카드 규격이 지정된 경우 해당 값 사용, 아니면 기본값 또는 props 값 사용
  const effectiveMinWidth = cardSize ? cardSizeMap[cardSize].minWidth : (minWidth || '280px');
  const effectiveMaxWidth = cardSize ? cardSizeMap[cardSize].maxWidth : undefined;
  
  const classes = [
    'grid',
    gap && gapMap[gap],
    gapX && gapXMap[gapX], 
    gapY && gapYMap[gapY],
    stretch && 'items-stretch', // 카드 높이 균등화
    className
  ].filter(Boolean).join(' ');

  // CSS Grid auto-fit 스타일 생성
  const getGridTemplate = (minW: string, maxW?: string) => {
    const maxWidth = maxW || '1fr';
    return `repeat(auto-fit, minmax(${minW}, ${maxWidth}))`;
  };

  const style: React.CSSProperties = {
    gridTemplateColumns: getGridTemplate(effectiveMinWidth, effectiveMaxWidth),
    ...(!gap && !gapX && !gapY && { gap: '24px' }) // 기본 gap
  };

  // 반응형 스타일 적용
  if (responsive) {
    const mediaQueries: string[] = [];
    
    Object.entries(responsive).forEach(([breakpoint, width]) => {
      const bpMap = {
        sm: '640px',
        md: '768px', 
        lg: '1024px',
        xl: '1280px'
      };
      
      if (bpMap[breakpoint as keyof typeof bpMap]) {
        mediaQueries.push(`
          @media (min-width: ${bpMap[breakpoint as keyof typeof bpMap]}) {
            grid-template-columns: ${getGridTemplate(width)};
          }
        `);
      }
    });

    if (mediaQueries.length > 0) {
      // 동적으로 스타일 태그 생성 (실제 프로덕션에서는 CSS-in-JS 라이브러리 사용 권장)
      const styleId = `auto-grid-${Math.random().toString(36).substr(2, 9)}`;
      const styleElement = document.getElementById(styleId) || document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `.${styleId} { ${mediaQueries.join('')} }`;
      
      if (!document.getElementById(styleId)) {
        document.head.appendChild(styleElement);
      }
      
      className += ` ${styleId}`;
    }
  }

  return (
    <Component 
      className={classes} 
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}