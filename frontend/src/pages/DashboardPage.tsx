import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 로그인된 사용자 정보 가져오기
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>대시보드를 로드하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-page error">
        <div className="error-message">
          <h3>❌ 인증 오류</h3>
          <p>로그인 정보를 찾을 수 없습니다.</p>
          <button onClick={() => window.location.href = '/login'} className="login-btn">
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 역할에 따른 대시보드 렌더링
  const renderDashboard = () => {
    switch (user.role) {
      case 'student':
        return <StudentDashboard userId={user.id} />;
      case 'teacher':
        return <TeacherDashboard userId={user.id} />;
      case 'admin':
        return <AdminDashboard userId={user.id} />;
      default:
        return (
          <div className="dashboard-page error">
            <div className="error-message">
              <h3>❓ 알 수 없는 역할</h3>
              <p>사용자 역할을 확인할 수 없습니다: {user.role}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-page">
      {renderDashboard()}
    </div>
  );
};

export default DashboardPage;