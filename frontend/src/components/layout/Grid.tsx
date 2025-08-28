import React from 'react';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 'auto' | string;
type AlignItems = 'start' | 'center' | 'end' | 'stretch';
type JustifyItems = 'start' | 'center' | 'end' | 'stretch';

interface GridProps<T extends React.ElementType = 'div'> {
  as?: T;
  columns?: GridColumns;
  gap?: SpacingSize;
  gapX?: SpacingSize;
  gapY?: SpacingSize;
  alignItems?: AlignItems;
  justifyItems?: JustifyItems;
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

const columnsMap: Record<string, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-2',
  '3': 'grid-cols-3',
  '4': 'grid-cols-4',
  '5': 'grid-cols-5',
  '6': 'grid-cols-6',
  'auto': 'grid-cols-auto',
};

const alignItemsMap: Record<AlignItems, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyItemsMap: Record<JustifyItems, string> = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
};

export default function Grid<T extends React.ElementType = 'div'>({
  as,
  columns = 1,
  gap,
  gapX,
  gapY,
  alignItems = 'stretch',
  justifyItems = 'stretch',
  className = '',
  children,
  ...props
}: GridProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof GridProps<T>>) {
  const Component = as || 'div';
  
  // Grid columns 처리
  const gridCols = typeof columns === 'string' && columns !== 'auto' 
    ? columns  // 커스텀 템플릿 문자열
    : columnsMap[String(columns)] || 'grid-cols-1';
  
  const classes = [
    'grid',
    gridCols,
    gap && gapMap[gap],
    gapX && gapXMap[gapX],
    gapY && gapYMap[gapY],
    alignItemsMap[alignItems],
    justifyItemsMap[justifyItems],
    className
  ].filter(Boolean).join(' ');

  const style = typeof columns === 'string' && columns !== 'auto' && !columnsMap[columns]
    ? { gridTemplateColumns: columns }
    : undefined;

  return (
    <Component className={classes} style={style} {...props}>
      {children}
    </Component>
  );
}