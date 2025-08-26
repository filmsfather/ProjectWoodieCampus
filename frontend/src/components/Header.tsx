import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  // TODO: 실제 인증 상태 확인
  const isAuthenticated = false;
  const userRole: 'admin' | 'teacher' | 'student' = 'admin'; // 임시로 admin으로 설정

  const handleLogout = () => {
    // TODO: 로그아웃 로직 구현
    console.log('Logging out...');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <h1>Woodie Campus</h1>
          </Link>
        </div>
        
        <nav className="header-nav">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">대시보드</Link>
              <Link to="/problems" className="nav-link">문제</Link>
              {(userRole === 'admin' || userRole === 'teacher') && (
                <Link to="/admin" className="nav-link">관리</Link>
              )}
            </>
          ) : (
            <Link to="/login" className="nav-link">로그인</Link>
          )}
        </nav>
        
        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">사용자</span>
              <div className="user-dropdown">
                <button className="dropdown-item">프로필</button>
                <button className="dropdown-item">설정</button>
                <hr />
                <button className="dropdown-item" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;