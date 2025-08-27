import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../services/authService';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  allowedRoles = [],
  requireAuth = true 
}) => {
  // 인증 확인
  const isAuthenticated = AuthService.isAuthenticated();
  const currentUser = AuthService.getCurrentUser();

  // 인증이 필요하지만 로그인하지 않은 경우
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 인증은 되었지만 사용자 정보가 없는 경우
  if (requireAuth && isAuthenticated && !currentUser) {
    // 토큰은 있지만 사용자 정보가 없는 경우 로그아웃 처리
    AuthService.logout();
    return <Navigate to="/login" replace />;
  }

  // 역할 권한 확인 (허용된 역할이 지정된 경우)
  if (allowedRoles.length > 0 && currentUser) {
    const userRole = currentUser.role;
    if (!allowedRoles.includes(userRole)) {
      // 권한이 없는 경우 대시보드로 리다이렉트
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 모든 조건을 만족하는 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default PrivateRoute;