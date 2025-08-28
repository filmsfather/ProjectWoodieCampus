import React, { lazy, Suspense } from 'react';
import { Skeleton } from '../components/ui/Skeleton';

// 라우트별 코드 스플리팅을 위한 지연 로딩 컴포넌트
const LazyStudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const LazyTeacherDashboard = lazy(() => import('../pages/teacher/Dashboard'));
const LazyAdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const LazyClassManagement = lazy(() => import('../pages/teacher/ClassManagement'));
const LazySubjectManagement = lazy(() => import('../pages/admin/SubjectManagement'));

// 로딩 상태를 위한 스켈레톤 컴포넌트
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
      </div>
      
      {/* 카드 그리드 스켈레톤 */}
      <div className="grid gap-4 auto-fit-cards-md">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse bg-white rounded-lg border border-neutral-200 p-4">
            <div className="h-6 bg-neutral-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/4 mb-4"></div>
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
            <div className="flex space-x-4">
              <div className="h-4 bg-neutral-200 rounded flex-1"></div>
              <div className="h-4 bg-neutral-200 rounded flex-1"></div>
              <div className="h-4 bg-neutral-200 rounded flex-1"></div>
            </div>
          </div>
          {/* 테이블 로우 */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="px-6 py-4 border-b border-neutral-100">
              <div className="flex space-x-4">
                <div className="h-4 bg-neutral-200 rounded flex-1"></div>
                <div className="h-4 bg-neutral-200 rounded flex-1"></div>
                <div className="h-4 bg-neutral-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 지연 로딩 컴포넌트 래퍼
interface LazyComponentProps {
  fallback?: React.ReactNode;
}

export const StudentDashboard: React.FC<LazyComponentProps> = ({ fallback = <DashboardSkeleton /> }) => (
  <Suspense fallback={fallback}>
    <LazyStudentDashboard />
  </Suspense>
);

export const TeacherDashboard: React.FC<LazyComponentProps> = ({ fallback = <DashboardSkeleton /> }) => (
  <Suspense fallback={fallback}>
    <LazyTeacherDashboard />
  </Suspense>
);

export const AdminDashboard: React.FC<LazyComponentProps> = ({ fallback = <DashboardSkeleton /> }) => (
  <Suspense fallback={fallback}>
    <LazyAdminDashboard />
  </Suspense>
);

export const ClassManagement: React.FC<LazyComponentProps> = ({ fallback = <TableSkeleton /> }) => (
  <Suspense fallback={fallback}>
    <LazyClassManagement />
  </Suspense>
);

export const SubjectManagement: React.FC<LazyComponentProps> = ({ fallback = <TableSkeleton /> }) => (
  <Suspense fallback={fallback}>
    <LazySubjectManagement />
  </Suspense>
);

// 프리로딩 유틸리티
export const preloadRoutes = {
  student: () => import('../pages/student/Dashboard'),
  teacher: () => import('../pages/teacher/Dashboard'),
  admin: () => import('../pages/admin/Dashboard'),
  classManagement: () => import('../pages/teacher/ClassManagement'),
  subjectManagement: () => import('../pages/admin/SubjectManagement'),
};

// 사용자 역할에 따른 프리로딩
export function preloadUserRoutes(role: 'student' | 'teacher' | 'admin') {
  switch (role) {
    case 'student':
      preloadRoutes.student();
      break;
    case 'teacher':
      preloadRoutes.teacher();
      preloadRoutes.classManagement();
      break;
    case 'admin':
      preloadRoutes.admin();
      preloadRoutes.subjectManagement();
      break;
  }
}

// 컴포넌트 수준에서 지연 로딩
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallbackComponent?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return React.forwardRef<any, T>((props, ref) => (
    <Suspense fallback={fallbackComponent ? <fallbackComponent /> : <Skeleton />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

export default {
  StudentDashboard,
  TeacherDashboard,
  AdminDashboard,
  ClassManagement,
  SubjectManagement,
  preloadRoutes,
  preloadUserRoutes,
  createLazyComponent
};