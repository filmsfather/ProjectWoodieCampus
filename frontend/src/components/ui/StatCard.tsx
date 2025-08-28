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
      <Cluster gap="md" align="center">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <Stack gap="xs" className="flex-1">
          <h3 className="font-semibold text-neutral-900">{title}</h3>
          <p className={`text-2xl font-bold ${variantMap[variant]}`}>{value}</p>
          <p className="text-sm text-neutral-600">{subtitle}</p>
        </Stack>
      </Cluster>
    </Card>
  );
}