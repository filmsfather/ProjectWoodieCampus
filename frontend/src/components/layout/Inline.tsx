import React from 'react';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
type AlignItems = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

interface InlineProps<T extends React.ElementType = 'div'> {
  as?: T;
  gap?: SpacingSize;
  align?: AlignItems;
  justify?: JustifyContent;
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

const spacingMap: Record<SpacingSize, string> = {
  none: 'space-x-0',
  xs: 'space-x-1',   // 8px
  sm: 'space-x-2',   // 16px
  md: 'space-x-3',   // 24px
  lg: 'space-x-4',   // 32px
  xl: 'space-x-6',   // 48px
};

const alignMap: Record<AlignItems, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const justifyMap: Record<JustifyContent, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export default function Inline<T extends React.ElementType = 'div'>({
  as,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
  children,
  ...props
}: InlineProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof InlineProps<T>>) {
  const Component = as || 'div';
  
  const classes = [
    'flex',
    spacingMap[gap],
    alignMap[align],
    justifyMap[justify],
    wrap ? 'flex-wrap' : 'flex-nowrap',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}