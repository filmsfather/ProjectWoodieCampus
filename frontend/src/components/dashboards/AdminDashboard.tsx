import React, { useState, useEffect } from 'react';
import { AdminApi } from '../../services/adminApi';
import { WorkbookApi } from '../../services/workbookApi';
import { ProblemApi } from '../../services/problemApi';
import SubjectManagement from '../admin/SubjectManagement';

interface AdminDashboardProps {
  userId: string;
}

interface SystemMetrics {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalWorkbooks: number;
  totalProblems: number;
  todayActivities: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalWorkbooks: 0,
    totalProblems: 0,
    todayActivities: 0,
    systemHealth: 'healthy'
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'subjects'>('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 데이터 로드
      const [usersData, workbooksData, problemsData] = await Promise.all([
        AdminApi.getUsers().catch(() => ({ users: [], pagination: { total: 0 } })),
        WorkbookApi.getWorkbooks().catch(() => []),
        ProblemApi.getProblems().catch(() => [])
      ]);

      const users = 'users' in usersData ? usersData.users : [];
      const students = users.filter((user: any) => user.role === 'student');
      const teachers = users.filter((user: any) => user.role === 'teacher');
      const admins = users.filter((user: any) => user.role === 'admin');

      const workbooks = Array.isArray(workbooksData) ? workbooksData : [];
      const problems = Array.isArray(problemsData) ? problemsData : [];

      // 시스템 메트릭스 계산
      setMetrics({
        totalUsers: users.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalAdmins: admins.length,
        totalWorkbooks: workbooks.length,
        totalProblems: problems.length,
        todayActivities: calculateTodayActivities(users, workbooks, problems),
        systemHealth: determineSystemHealth(users.length, workbooks.length)
      });

      // 최근 가입한 사용자
      setRecentUsers(users.slice(-5).reverse());

      // 시스템 로그 생성 (실제로는 백엔드에서 가져와야 함)
      setSystemLogs(generateSystemLogs(users, workbooks, problems));

    } catch (error) {
      console.error('관리자 대시보드 데이터 로딩 실패:', error);
      setError('대시보드를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayActivities = (users: any[], workbooks: any[], problems: any[]) => {
    const today = new Date().toDateString();
    let activities = 0;

    // 오늘 가입한 사용자
    users.forEach(user => {
      if (user.created_at && new Date(user.created_at).toDateString() === today) {
        activities++;
      }
    });

    // 오늘 생성된 문제집
    workbooks.forEach(workbook => {
      if (workbook.created_at && new Date(workbook.created_at).toDateString() === today) {
        activities++;
      }
    });

    // 오늘 생성된 문제
    problems.forEach(problem => {
      if (problem.created_at && new Date(problem.created_at).toDateString() === today) {
        activities++;
      }
    });

    return activities;
  };

  const determineSystemHealth = (userCount: number, workbookCount: number): 'healthy' | 'warning' | 'error' => {
    if (userCount === 0 && workbookCount === 0) return 'error';
    if (userCount < 5 || workbookCount < 3) return 'warning';
    return 'healthy';
  };

  const generateSystemLogs = (users: any[], workbooks: any[], problems: any[]) => {
    const logs: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
      level: string;
    }> = [];
    
    // 사용자 활동 로그
    users.slice(-3).forEach(user => {
      logs.push({
        id: `user-${user.id}`,
        type: 'user',
        message: `새 ${getRoleDisplayName(user.role)} 계정 생성: ${user.username}`,
        timestamp: user.created_at || new Date().toISOString(),
        level: 'info'
      });
    });

    // 문제집 활동 로그
    workbooks.slice(-2).forEach(workbook => {
      logs.push({
        id: `workbook-${workbook.id}`,
        type: 'content',
        message: `새 문제집 생성: ${workbook.title}`,
        timestamp: workbook.created_at || new Date().toISOString(),
        level: 'info'
      });
    });

    // 문제 활동 로그
    problems.slice(-2).forEach(problem => {
      logs.push({
        id: `problem-${problem.id}`,
        type: 'content',
        message: `새 문제 생성: ${problem.title}`,
        timestamp: problem.created_at || new Date().toISOString(),
        level: 'info'
      });
    });

    // 시간순 정렬
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'teacher': return '교사';
      case 'student': return '학생';
      default: return '사용자';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '날짜 미상';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'content': return '📝';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>대시보드를 로드하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-message">
          <h3>❌ 오류 발생</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  // 섹션에 따른 렌더링
  if (activeSection === 'subjects') {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <button 
            className="back-button"
            onClick={() => setActiveSection('dashboard')}
          >
            ← 대시보드로 돌아가기
          </button>
          <h1>교과목 관리</h1>
        </div>
        <SubjectManagement />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>관리자 대시보드</h1>
        <p>시스템 전반을 관리하고 모니터링하세요</p>
      </div>
      
      <div className="dashboard-content">
        {/* 시스템 상태 */}
        <div className="system-health">
          <div className="health-indicator">
            <span className="health-icon">{getHealthIcon(metrics.systemHealth)}</span>
            <div className="health-content">
              <h3>시스템 상태</h3>
              <p className={`health-status ${getHealthColor(metrics.systemHealth)}`}>
                {metrics.systemHealth === 'healthy' && '정상'}
                {metrics.systemHealth === 'warning' && '주의'}
                {metrics.systemHealth === 'error' && '오류'}
              </p>
            </div>
          </div>
        </div>

        {/* 전체 통계 */}
        <div className="stats-section">
          <div className="stat-card primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>전체 사용자</h3>
              <p className="stat-number">{metrics.totalUsers}</p>
              <p className="stat-label">명</p>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <h3>학생</h3>
              <p className="stat-number">{metrics.totalStudents}</p>
              <p className="stat-label">명</p>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <h3>교사</h3>
              <p className="stat-number">{metrics.totalTeachers}</p>
              <p className="stat-label">명</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>관리자</h3>
              <p className="stat-number">{metrics.totalAdmins}</p>
              <p className="stat-label">명</p>
            </div>
          </div>
        </div>

        {/* 컨텐츠 통계 */}
        <div className="content-stats">
          <div className="stat-card secondary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>문제집</h3>
              <p className="stat-number">{metrics.totalWorkbooks}</p>
              <p className="stat-label">개</p>
            </div>
          </div>
          
          <div className="stat-card secondary">
            <div className="stat-icon">❓</div>
            <div className="stat-content">
              <h3>문제</h3>
              <p className="stat-number">{metrics.totalProblems}</p>
              <p className="stat-label">개</p>
            </div>
          </div>
          
          <div className="stat-card secondary">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>오늘의 활동</h3>
              <p className="stat-number">{metrics.todayActivities}</p>
              <p className="stat-label">건</p>
            </div>
          </div>
        </div>

        {/* 관리 작업 */}
        <div className="admin-actions">
          <h2>관리 작업</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => window.location.href = '/admin'}
            >
              <span className="action-icon">👤</span>
              <div className="action-content">
                <h4>사용자 관리</h4>
                <p>사용자를 생성하고 관리합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn success"
              onClick={() => window.location.href = '/workbooks'}
            >
              <span className="action-icon">📚</span>
              <div className="action-content">
                <h4>문제집 관리</h4>
                <p>모든 문제집을 확인합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn info"
              onClick={() => window.location.href = '/problems'}
            >
              <span className="action-icon">❓</span>
              <div className="action-content">
                <h4>문제 관리</h4>
                <p>모든 문제를 확인합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn secondary"
              onClick={() => {
                // 교과목 관리 섹션을 표시하도록 상태 변경
                setActiveSection('subjects');
              }}
            >
              <span className="action-icon">📖</span>
              <div className="action-content">
                <h4>교과목 관리</h4>
                <p>교과목을 생성하고 관리합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn warning"
              onClick={() => {
                // 시스템 설정 페이지로 이동 (향후 구현)
                alert('시스템 설정 페이지는 향후 구현 예정입니다.');
              }}
            >
              <span className="action-icon">⚙️</span>
              <div className="action-content">
                <h4>시스템 설정</h4>
                <p>시스템 전반을 설정합니다</p>
              </div>
            </button>
          </div>
        </div>

        {/* 최근 사용자 */}
        <div className="recent-users">
          <h2>최근 가입 사용자</h2>
          {recentUsers.length > 0 ? (
            <div className="user-list">
              {recentUsers.map((user) => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <div className="user-avatar">
                      {getRoleDisplayName(user.role).charAt(0)}
                    </div>
                    <div className="user-content">
                      <h4>{user.full_name || user.username}</h4>
                      <p className="user-email">{user.email}</p>
                      <div className="user-meta">
                        <span className={`role-badge ${user.role}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                        <span className="join-date">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-users">
              <p>👤 최근 가입한 사용자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 시스템 로그 */}
        <div className="system-logs">
          <h2>시스템 활동 로그</h2>
          {systemLogs.length > 0 ? (
            <div className="log-list">
              {systemLogs.map((log) => (
                <div key={log.id} className={`log-item ${log.level}`}>
                  <div className="log-icon">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="log-content">
                    <span className="log-message">{log.message}</span>
                    <span className="log-time">{formatDate(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-logs">
              <p>📋 시스템 로그가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;