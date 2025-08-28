import React from 'react';
import Card from './Card';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({
  className = '',
  width,
  height,
  variant = 'rectangular'
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  const style: React.CSSProperties = {
    width,
    height
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

interface CardSkeletonProps {
  className?: string;
  showActions?: boolean;
}

export function CardSkeleton({ 
  className = '', 
  showActions = true 
}: CardSkeletonProps) {
  return (
    <Card className={className}>
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton height="20px" className="w-3/4" />
          <Skeleton height="16px" className="w-1/2" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-2 mb-4">
        <Skeleton height="16px" />
        <Skeleton height="16px" className="w-5/6" />
        <Skeleton height="16px" className="w-4/6" />
      </div>
      
      {/* Actions skeleton */}
      {showActions && (
        <div className="flex gap-2 mt-auto">
          <Skeleton height="36px" className="w-20" />
          <Skeleton height="36px" className="w-16" />
        </div>
      )}
    </Card>
  );
}

interface SkeletonGridProps {
  count?: number;
  cardSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonGrid({ 
  count = 6, 
  cardSize = 'md',
  className = '' 
}: SkeletonGridProps) {
  return (
    <div className={`grid gap-6 ${className}`} style={{
      gridTemplateColumns: `repeat(auto-fit, minmax(${
        cardSize === 'sm' ? '240px' : cardSize === 'lg' ? '320px' : '280px'
      }, 1fr))`
    }}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

export default Skeleton;