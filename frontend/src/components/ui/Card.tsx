import React from 'react';
import { Stack } from '../layout/index';

interface CardProps<T extends React.ElementType = 'div'> {
  as?: T;
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  minHeight?: number;
  aspectRatio?: string;
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
  loading = false,
  minHeight,
  aspectRatio,
  ...props
}: CardProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof CardProps<T>>) {
  const Component = as || 'div';
  
  const classes = [
    'bg-white rounded-lg shadow-subtle border border-neutral-200 h-full flex flex-col',
    paddingMap[padding],
    hover && 'hover:border-role-primary transition-colors',
    className
  ].filter(Boolean).join(' ');

  // CLS 방지를 위한 스타일
  const containerStyle: React.CSSProperties = {
    minHeight: minHeight ? `${minHeight}px` : undefined,
    aspectRatio: aspectRatio || undefined,
  };

  return (
    <Component className={classes} style={containerStyle} {...props}>
      {loading ? (
        <CardLoadingSkeleton padding={padding} />
      ) : (
        children
      )}
    </Component>
  );
}

// 카드 로딩 스켈레톤 컴포넌트
interface CardLoadingSkeletonProps {
  padding?: 'sm' | 'md' | 'lg';
}

function CardLoadingSkeleton({ padding = 'md' }: CardLoadingSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
        <div className="w-8 h-8 bg-neutral-200 rounded-full flex-shrink-0"></div>
      </div>
      
      {/* 콘텐츠 스켈레톤 */}
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-full"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
        <div className="h-4 bg-neutral-200 rounded w-4/6"></div>
      </div>
      
      {/* 액션 스켈레톤 */}
      <div className="flex justify-end gap-2 mt-4">
        <div className="w-16 h-8 bg-neutral-200 rounded"></div>
        <div className="w-20 h-8 bg-neutral-200 rounded"></div>
      </div>
    </div>
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
    <div className={`flex items-center gap-2 mt-auto card-footer-spacing ${justifyMap[justify]} ${className}`}>
      {children}
    </div>
  );
}