import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton = false }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // 드롭다운 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const isAuthenticated = !!currentUser;

  return (
    <header className="sticky top-0 z-sticky bg-white border-b border-neutral-200 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-container mx-auto">
        {/* 왼쪽: 햄버거 메뉴 + 로고 */}
        <div className="flex items-center gap-3">
          {/* 햄버거 메뉴 버튼 (모바일에서만 표시) */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md hover:bg-neutral-100 transition-colors"
              aria-label="메뉴 열기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
            <h1 className="text-xl font-bold text-role-primary">Woodie Campus</h1>
          </Link>
        </div>
        
        {/* 중앙: 데스크톱 내비게이션 */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-neutral-700 hover:text-role-primary transition-colors"
              >
                대시보드
              </Link>
              <Link 
                to="/problems" 
                className="text-sm font-medium text-neutral-700 hover:text-role-primary transition-colors"
              >
                문제
              </Link>
              {(currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                <Link 
                  to="/admin" 
                  className="text-sm font-medium text-neutral-700 hover:text-role-primary transition-colors"
                >
                  관리
                </Link>
              )}
            </>
          ) : (
            <Link 
              to="/login" 
              className="text-sm font-medium text-neutral-700 hover:text-role-primary transition-colors"
            >
              로그인
            </Link>
          )}
        </nav>
        
        {/* 오른쪽: 사용자 메뉴 */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100 transition-colors"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-role-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {currentUser.fullName?.charAt(0) || currentUser.username?.charAt(0) || '👤'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-neutral-900">
                  {currentUser.fullName || currentUser.username}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 드롭다운 메뉴 */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-dropdown">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900">
                      {currentUser.fullName || currentUser.username}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {currentUser.role === 'admin' && '관리자'}
                      {currentUser.role === 'teacher' && '교사'}
                      {currentUser.role === 'student' && '학생'}
                    </p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors">
                    프로필
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors">
                    설정
                  </button>
                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-role-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-role-primary/90 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;