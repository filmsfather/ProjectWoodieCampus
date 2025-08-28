import React from 'react';
import { Cluster, Stack } from '../layout/index';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'role';
  className?: string;
}

const variantMap = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning', 
  error: 'text-error',
  info: 'text-info',
  role: 'text-role-primary',
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'role',
  className = ''
}: StatCardProps) {
  return (
    <Card hover className={className}>
      <Cluster gap="3" align="center">
        <div className="text-fluid-3xl flex-shrink-0">{icon}</div>
        <Stack gap="xs" className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-fluid-base text-ellipsis-1">
            {title}
          </h3>
          <p className={`text-fluid-3xl font-bold numeric-mono ${variantMap[variant]}`}>
            {value}
          </p>
          <p className="text-fluid-sm text-neutral-600 text-ellipsis-2 reading-leading">
            {subtitle}
          </p>
        </Stack>
      </Cluster>
    </Card>
  );
}