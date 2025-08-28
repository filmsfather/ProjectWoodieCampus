import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { AuthService } from '../services/authService';

interface LayoutProps {
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ showSidebar = true }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    
    // 반응형 브레이크포인트 체크 (768px = md)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ESC 키로 모바일 드로어 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen && isMobile) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen && isMobile) {
      document.addEventListener('keydown', handleKeyDown);
      // 드로어가 열릴 때 포커스 트랩
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen, isMobile]);

  // 사이드바 토글
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 모바일에서 사이드바 외부 클릭시 닫기
  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // 인증되지 않은 사용자는 사이드바 숨김
  const shouldShowNavigation = currentUser && showSidebar;

  return (
    <div className="min-h-screen bg-neutral-50" data-role={currentUser?.role || 'guest'}>
      {/* 스킵 링크 (접근성) */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-tooltip bg-white px-4 py-2 rounded-md shadow-lg border border-neutral-200 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-role-primary"
      >
        메인 콘텐츠로 이동
      </a>
      
      {/* 헤더 */}
      <Header 
        onMenuClick={toggleSidebar}
        showMenuButton={shouldShowNavigation && isMobile}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* 데스크톱 사이드바 */}
        {shouldShowNavigation && !isMobile && (
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
        )}
        
        {/* 모바일 사이드바 (드로어) */}
        {shouldShowNavigation && isMobile && (
          <>
            {/* 백드롭 */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-modal-backdrop lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
              />
            )}
            
            {/* 드로어 */}
            <div 
              className={`
                fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white
                transform transition-transform duration-300 ease-in-out z-modal
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                shadow-lg border-r border-neutral-200
              `}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
              tabIndex={-1}
            >
              <div className="sr-only" id="drawer-title">내비게이션 메뉴</div>
              <Sidebar onLinkClick={closeSidebar} />
            </div>
          </>
        )}
        
        {/* 메인 콘텐츠 */}
        <main 
          id="main-content"
          role="main"
          className={`
            flex-1 overflow-auto
            ${shouldShowNavigation && isMobile ? 'pb-16' : ''}
          `}
          tabIndex={-1}
        >
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* 모바일 바텀 네비게이션 */}
      {shouldShowNavigation && isMobile && (
        <MobileBottomNav />
      )}
    </div>
  );
};

export default Layout;