import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthService } from '../services/authService';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // 모바일용 네비게이션 아이템 (최대 5개)
  const allNavItems: NavItem[] = [
    {
      path: '/dashboard',
      label: '대시보드',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['student', 'teacher', 'admin'],
    },
    {
      path: '/problems',
      label: '문제',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['teacher', 'admin'],
    },
    {
      path: '/workbooks',
      label: '문제집',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      roles: ['student', 'teacher', 'admin'],
    },
    {
      path: '/teacher',
      label: '반 관리',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ['teacher', 'admin'],
    },
    {
      path: '/admin',
      label: '관리',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      roles: ['admin'],
    },
  ];

  // 사용자 역할에 따라 네비게이션 필터링 (최대 4개까지)
  const getNavItems = (): NavItem[] => {
    if (!currentUser) {
      return [allNavItems[0]]; // 대시보드만
    }

    const filteredItems = allNavItems.filter(item => 
      !item.roles || item.roles.includes(currentUser.role)
    );

    // 최대 4개 아이템으로 제한 (모바일 바텀 네비게이션 최적화)
    return filteredItems.slice(0, 4);
  };

  const navItems = getNavItems();

  if (!currentUser || navItems.length === 0) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-fixed safe-area-inset-bottom"
      role="navigation"
      aria-label="메인 내비게이션"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center p-2 min-w-0 flex-1
                transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-role-primary focus:ring-offset-2
                ${isActive 
                  ? 'text-role-primary' 
                  : 'text-neutral-600 hover:text-role-primary'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label} ${isActive ? '(현재 페이지)' : ''}`}
            >
              <div className={`
                ${isActive ? 'scale-110' : 'scale-100'}
                transition-transform duration-200
              `}>
                {item.icon}
              </div>
              <span className={`
                text-xs mt-1 font-medium truncate max-w-full
                ${isActive ? 'text-role-primary' : 'text-neutral-600'}
              `}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area bottom padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
};

export default MobileBottomNav;