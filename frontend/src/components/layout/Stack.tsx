import React from 'react';

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
type AlignItems = 'start' | 'center' | 'end' | 'stretch';

interface StackProps<T extends React.ElementType = 'div'> {
  as?: T;
  gap?: SpacingSize;
  align?: AlignItems;
  className?: string;
  children: React.ReactNode;
}

const spacingMap: Record<SpacingSize, string> = {
  none: 'space-y-0',
  xs: 'space-y-1',   // 8px
  sm: 'space-y-2',   // 16px 
  md: 'space-y-3',   // 24px
  lg: 'space-y-4',   // 32px
  xl: 'space-y-6',   // 48px
};

const alignMap: Record<AlignItems, string> = {
  start: 'items-start',
  center: 'items-center', 
  end: 'items-end',
  stretch: 'items-stretch',
};

export default function Stack<T extends React.ElementType = 'div'>({
  as,
  gap = 'md',
  align = 'stretch',
  className = '',
  children,
  ...props
}: StackProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof StackProps<T>>) {
  const Component = as || 'div';
  
  const classes = [
    'flex flex-col',
    spacingMap[gap],
    alignMap[align],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}