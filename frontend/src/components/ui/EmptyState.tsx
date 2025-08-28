import React from 'react';
import Card from './Card';
import { Stack } from '../layout/index';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-64 ${className}`}>
      <div className="text-center max-w-sm">
        {icon && (
          <div className="text-6xl text-neutral-400 mb-4 flex justify-center">
            {icon}
          </div>
        )}
        <Stack gap="xs">
          <h3 className="text-fluid-lg font-medium text-neutral-900">
            {title}
          </h3>
          {description && (
            <p className="text-fluid-sm text-neutral-600 reading-leading">
              {description}
            </p>
          )}
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </Stack>
      </div>
    </div>
  );
}

interface EmptyCardGridProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyCardGrid({
  icon,
  title,
  description,
  action,
  className = ''
}: EmptyCardGridProps) {
  return (
    <Card className={`col-span-full ${className}`}>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </Card>
  );
}

// 일반적인 빈 상태 아이콘들
export const EmptyIcons = {
  noData: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  search: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  document: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  user: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  folder: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
};

export default EmptyState;