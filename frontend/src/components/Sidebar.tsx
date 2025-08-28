import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthService } from '../services/authService';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}

const Sidebar: React.FC = () => {
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

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        {currentUser && (
          <div className="user-info">
            <div className="user-profile">
              <div className="user-avatar">
                {currentUser.fullName?.charAt(0) || currentUser.username?.charAt(0) || '👤'}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {currentUser.fullName || currentUser.username}
                </div>
                <div className="user-role">
                  {currentUser.role === 'admin' && '관리자'}
                  {currentUser.role === 'teacher' && '교사'}
                  {currentUser.role === 'student' && '학생'}
                </div>
              </div>
            </div>
            
            {currentUser.role === 'student' && (
              <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-label">오늘의 복습</span>
                  <span className="stat-value">-</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">연속 학습</span>
                  <span className="stat-value">-</span>
                </div>
              </div>
            )}

            <button 
              className="logout-btn"
              onClick={() => {
                AuthService.logout();
                window.location.href = '/login';
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;