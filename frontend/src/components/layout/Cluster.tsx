import React from 'react';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
type AlignItems = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

interface ClusterProps<T extends React.ElementType = 'div'> {
  as?: T;
  gap?: SpacingSize;
  align?: AlignItems;
  justify?: JustifyContent;
  wrap?: boolean;
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

export default function Cluster<T extends React.ElementType = 'div'>({
  as,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = true,
  className = '',
  children,
  ...props
}: ClusterProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof ClusterProps<T>>) {
  const Component = as || 'div';
  
  const classes = [
    'flex',
    gapMap[gap],
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