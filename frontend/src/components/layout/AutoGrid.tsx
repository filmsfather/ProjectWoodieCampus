import React from 'react';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

interface AutoGridProps<T extends React.ElementType = 'div'> {
  as?: T;
  minWidth?: string;
  gap?: SpacingSize;
  gapX?: SpacingSize;
  gapY?: SpacingSize;
  equalHeight?: boolean;
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

export default function AutoGrid<T extends React.ElementType = 'div'>({
  as,
  minWidth = '280px',
  gap,
  gapX,
  gapY,
  equalHeight = false,
  responsive,
  className = '',
  children,
  ...props
}: AutoGridProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof AutoGridProps<T>>) {
  const Component = as || 'div';
  
  const classes = [
    'grid',
    gap && gapMap[gap],
    gapX && gapXMap[gapX], 
    gapY && gapYMap[gapY],
    equalHeight && 'grid-rows-[masonry]',
    className
  ].filter(Boolean).join(' ');

  // CSS Grid auto-fit 스타일 생성
  const getGridTemplate = (width: string) => 
    `repeat(auto-fit, minmax(${width}, 1fr))`;

  const style: React.CSSProperties = {
    gridTemplateColumns: getGridTemplate(minWidth),
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