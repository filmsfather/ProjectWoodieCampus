import React from 'react';
import { Stack } from '../layout/index';

interface CardProps<T extends React.ElementType = 'div'> {
  as?: T;
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'p-3',      // 24px - 8pt 기반
  md: 'p-4',      // 32px - 표준 카드 패딩 (16px 대신 32px)
  lg: 'p-6',      // 48px - 8pt 기반
};

export default function Card<T extends React.ElementType = 'div'>({
  as,
  className = '',
  children,
  hover = false,
  padding = 'md',
  ...props
}: CardProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof CardProps<T>>) {
  const Component = as || 'div';
  
  const classes = [
    'bg-white rounded-lg shadow-subtle border border-neutral-200 h-full',
    paddingMap[padding],
    hover && 'hover:border-role-primary transition-colors',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

// Card Header 컴포넌트
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({ 
  title, 
  subtitle, 
  icon, 
  actions, 
  className = '' 
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between card-header-spacing ${className}`}>
      <div className="text-with-icon flex-1">
        {icon && <div className="text-fluid-xl flex-shrink-0">{icon}</div>}
        <Stack gap="xs" className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-fluid-lg text-ellipsis-2 max-w-card-title">
            {title}
          </h3>
          {subtitle && (
            <p className="text-fluid-sm text-neutral-600 reading-leading text-ellipsis-1">
              {subtitle}
            </p>
          )}
        </Stack>
      </div>
      {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
    </div>
  );
}

// Card Content 컴포넌트
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`flex-1 card-content-spacing reading-leading ${className}`}>
      {children}
    </div>
  );
}

// Card Actions 컴포넌트  
interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'between';
}

export function CardActions({ 
  children, 
  className = '', 
  justify = 'end' 
}: CardActionsProps) {
  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center', 
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={`flex items-center gap-2 card-footer-spacing ${justifyMap[justify]} ${className}`}>
      {children}
    </div>
  );
}