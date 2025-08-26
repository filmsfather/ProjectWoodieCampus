import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    {
      path: '/dashboard',
      label: '대시보드',
      icon: '📊',
    },
    {
      path: '/problems',
      label: '문제 풀기',
      icon: '📝',
    },
    {
      path: '/review',
      label: '복습하기',
      icon: '🔄',
    },
    {
      path: '/progress',
      label: '학습 진도',
      icon: '📈',
    },
    {
      path: '/settings',
      label: '설정',
      icon: '⚙️',
    },
  ];

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
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-label">오늘의 학습</span>
            <span className="stat-value">3/5</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">연속 학습</span>
            <span className="stat-value">7일</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;