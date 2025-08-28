import React from 'react';
import { Stack, Cluster } from '../layout/index';
import Card from './Card';

// Responsive Table
interface Column<T = any> {
  key: keyof T;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  className?: string;
}

export function ResponsiveTable<T = any>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  mobileCardRender,
  onSort,
  className = ''
}: ResponsiveTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T) => {
    if (!columns.find(col => col.key === key)?.sortable) return;
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <div className="overflow-hidden bg-white rounded-lg border border-neutral-200">
            <div className="animate-pulse">
              <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
                <div className="flex space-x-4">
                  {columns.map((_, index) => (
                    <div key={index} className="h-4 bg-neutral-200 rounded flex-1"></div>
                  ))}
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-6 py-4 border-b border-neutral-100">
                  <div className="flex space-x-4">
                    {columns.map((_, colIndex) => (
                      <div key={colIndex} className="h-4 bg-neutral-200 rounded flex-1"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="text-center py-12">
        <Stack gap="md" align="center">
          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-neutral-600">{emptyMessage}</p>
        </Stack>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden bg-white rounded-lg border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`
                      px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider
                      ${column.sortable ? 'cursor-pointer hover:bg-neutral-100 select-none' : ''}
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.title}
                      {column.sortable && (
                        <svg 
                          className={`w-4 h-4 ${sortKey === column.key ? 'text-neutral-900' : 'text-neutral-400'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={sortKey === column.key && sortDirection === 'desc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} 
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {data.map((item, index) => (
                <tr key={keyExtractor(item, index)} className="hover:bg-neutral-50">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`
                        px-6 py-4 whitespace-nowrap text-fluid-sm text-neutral-900
                        ${column.align === 'center' ? 'text-center' : ''}
                        ${column.align === 'right' ? 'text-right' : ''}
                      `}
                    >
                      {column.render 
                        ? column.render(item[column.key], item, index)
                        : String(item[column.key] || '-')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <Card key={keyExtractor(item, index)}>
            {mobileCardRender ? mobileCardRender(item, index) : (
              <Stack gap="sm">
                {columns.slice(0, 3).map((column) => ( // Show first 3 columns in mobile
                  <div key={String(column.key)}>
                    <span className="text-fluid-xs text-neutral-600 font-medium">
                      {column.title}:
                    </span>
                    <span className="ml-2 text-fluid-sm text-neutral-900">
                      {column.render 
                        ? column.render(item[column.key], item, index)
                        : String(item[column.key] || '-')
                      }
                    </span>
                  </div>
                ))}
              </Stack>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Simple List Component
interface ListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

interface ResponsiveListProps {
  items: ListItem[];
  loading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: ListItem) => void;
  className?: string;
}

export function ResponsiveList({
  items,
  loading = false,
  emptyMessage = '항목이 없습니다.',
  onItemClick,
  className = ''
}: ResponsiveListProps) {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <Cluster gap="md" align="center">
              <div className="w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-neutral-200 rounded flex-shrink-0"></div>
            </Cluster>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="text-center py-12">
        <Stack gap="md" align="center">
          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-neutral-600">{emptyMessage}</p>
        </Stack>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <Card
          key={item.id}
          className={onItemClick ? 'cursor-pointer hover:border-role-primary transition-colors' : ''}
          onClick={() => onItemClick?.(item)}
        >
          <Cluster gap="md" align="center" justify="between">
            <Cluster gap="md" align="center" className="flex-1 min-w-0">
              {item.icon && (
                <div className="flex-shrink-0 text-2xl">
                  {item.icon}
                </div>
              )}
              <Stack gap="xs" className="flex-1 min-w-0">
                <h3 className="text-fluid-base font-medium text-neutral-900 text-ellipsis-1">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-fluid-sm text-neutral-600 text-ellipsis-1">
                    {item.subtitle}
                  </p>
                )}
                {item.description && (
                  <p className="text-fluid-xs text-neutral-500 text-ellipsis-2 reading-leading">
                    {item.description}
                  </p>
                )}
                {item.meta && (
                  <div className="text-fluid-xs text-neutral-500">
                    {item.meta}
                  </div>
                )}
              </Stack>
            </Cluster>
            {item.actions && (
              <div className="flex-shrink-0">
                {item.actions}
              </div>
            )}
          </Cluster>
        </Card>
      ))}
    </div>
  );
}

export default ResponsiveTable;