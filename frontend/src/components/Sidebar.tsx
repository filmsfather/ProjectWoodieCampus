import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthService } from '../services/authService';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // 역할별 메뉴 아이템 정의
  const allMenuItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: '대시보드',
      icon: '📊',
      roles: ['student', 'teacher', 'admin'],
    },
    {
      path: '/problems',
      label: '문제 관리',
      icon: '📝',
      roles: ['teacher', 'admin'],
    },
    {
      path: '/workbooks',
      label: '문제집 관리',
      icon: '📚',
      roles: ['student', 'teacher', 'admin'],
    },
    {
      path: '/teacher',
      label: '반 관리',
      icon: '🏫',
      roles: ['teacher', 'admin'],
    },
    {
      path: '/admin',
      label: '사용자 관리',
      icon: '👤',
      roles: ['admin'],
    },
  ];

  // 현재 사용자 역할에 따라 메뉴 필터링
  const getMenuItems = (): MenuItem[] => {
    if (!currentUser) {
      return [{
        path: '/dashboard',
        label: '대시보드',
        icon: '📊',
      }];
    }

    return allMenuItems.filter(item => 
      !item.roles || item.roles.includes(currentUser.role)
    );
  };

  const menuItems = getMenuItems();

  const handleLinkClick = () => {
    onLinkClick?.();
  };

  return (
    <aside className="h-full flex flex-col bg-white">
      {/* 내비게이션 메뉴 */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-role-primary/10 text-role-primary border-r-2 border-role-primary' 
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-role-primary'
                    }
                  `}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* 사이드바 하단 */}
      <div className="border-t border-neutral-200 p-4">
        {currentUser && (
          <div className="space-y-4">
            {/* 사용자 프로필 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-role-primary text-white rounded-full flex items-center justify-center font-medium">
                {currentUser.fullName?.charAt(0) || currentUser.username?.charAt(0) || '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {currentUser.fullName || currentUser.username}
                </p>
                <p className="text-xs text-neutral-600">
                  {currentUser.role === 'admin' && '관리자'}
                  {currentUser.role === 'teacher' && '교사'}
                  {currentUser.role === 'student' && '학생'}
                </p>
              </div>
            </div>
            
            {/* 학생 전용 통계 */}
            {currentUser.role === 'student' && (
              <div className="bg-neutral-50 rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-600">오늘의 복습</span>
                  <span className="text-xs font-medium text-neutral-900">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-600">연속 학습</span>
                  <span className="text-xs font-medium text-neutral-900">-</span>
                </div>
              </div>
            )}

            {/* 로그아웃 버튼 */}
            <button 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              onClick={() => {
                AuthService.logout();
                window.location.href = '/login';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;