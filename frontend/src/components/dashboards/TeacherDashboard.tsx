import React, { useState, useEffect } from 'react';
import { WorkbookApi } from '../../services/workbookApi';
import { ProblemApi } from '../../services/problemApi';
import { AdminApi } from '../../services/adminApi';

interface TeacherDashboardProps {
  userId: string;
}

interface SystemStats {
  totalWorkbooks: number;
  totalProblems: number;
  totalStudents: number;
  recentActivities: Array<{
    id: string;
    type: 'workbook_created' | 'problem_created' | 'student_progress';
    title: string;
    timestamp: string;
  }>;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ }) => {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalWorkbooks: 0,
    totalProblems: 0,
    totalStudents: 0,
    recentActivities: []
  });
  const [recentWorkbooks, setRecentWorkbooks] = useState<any[]>([]);
  const [recentProblems, setRecentProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 데이터 로드
      const [workbooksData, problemsData, usersData] = await Promise.all([
        WorkbookApi.getWorkbooks().catch(() => []),
        ProblemApi.getProblems().catch(() => []),
        AdminApi.getUsers().catch(() => ({ users: [], pagination: { total: 0 } }))
      ]);

      // 통계 데이터 설정
      const workbookTotal = Array.isArray(workbooksData) ? workbooksData.length : 0;
      const problemTotal = Array.isArray(problemsData) ? problemsData.length : 0;
      const users = 'users' in usersData ? usersData.users : [];
      const studentTotal = users.filter((user: any) => user.role === 'student').length;

      const workbooks = Array.isArray(workbooksData) ? workbooksData : [];
      const problems = Array.isArray(problemsData) ? problemsData : [];

      setSystemStats({
        totalWorkbooks: workbookTotal,
        totalProblems: problemTotal,
        totalStudents: studentTotal,
        recentActivities: generateRecentActivities(workbooks, problems)
      });

      setRecentWorkbooks(workbooks.slice(0, 5));
      setRecentProblems(problems.slice(0, 5));

    } catch (error) {
      console.error('교사 대시보드 데이터 로딩 실패:', error);
      setError('대시보드를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (workbooks: any[], problems: any[]): SystemStats['recentActivities'] => {
    const activities: SystemStats['recentActivities'] = [];
    
    // 최근 문제집 생성 활동
    workbooks.slice(0, 3).forEach(workbook => {
      activities.push({
        id: `workbook-${workbook.id}`,
        type: 'workbook_created' as const,
        title: `문제집 "${workbook.title}" 생성`,
        timestamp: workbook.created_at || new Date().toISOString()
      });
    });

    // 최근 문제 생성 활동
    problems.slice(0, 3).forEach(problem => {
      activities.push({
        id: `problem-${problem.id}`,
        type: 'problem_created' as const,
        title: `문제 "${problem.title}" 생성`,
        timestamp: problem.created_at || new Date().toISOString()
      });
    });

    // 시간순 정렬
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workbook_created': return '📚';
      case 'problem_created': return '❓';
      case 'student_progress': return '📈';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="teacher-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>대시보드를 로드하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard error">
        <div className="error-message">
          <h3>❌ 오류 발생</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>교사 대시보드</h1>
        <p>문제와 문제집을 관리하고 학생들의 학습 현황을 확인하세요</p>
      </div>
      
      <div className="dashboard-content">
        {/* 시스템 통계 */}
        <div className="stats-section">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>전체 문제집</h3>
              <p className="stat-number">{systemStats.totalWorkbooks}</p>
              <p className="stat-label">개</p>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">❓</div>
            <div className="stat-content">
              <h3>전체 문제</h3>
              <p className="stat-number">{systemStats.totalProblems}</p>
              <p className="stat-label">개</p>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>학생 수</h3>
              <p className="stat-number">{systemStats.totalStudents}</p>
              <p className="stat-label">명</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>최근 활동</h3>
              <p className="stat-number">{systemStats.recentActivities.length}</p>
              <p className="stat-label">건</p>
            </div>
          </div>
        </div>

        {/* 빠른 작업 */}
        <div className="quick-actions">
          <h2>빠른 작업</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => window.location.href = '/problems/create'}
            >
              <span className="action-icon">➕</span>
              <div className="action-content">
                <h4>새 문제 만들기</h4>
                <p>새로운 문제를 생성합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn success"
              onClick={() => window.location.href = '/workbooks'}
            >
              <span className="action-icon">📚</span>
              <div className="action-content">
                <h4>문제집 관리</h4>
                <p>문제집을 생성하고 관리합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn info"
              onClick={() => window.location.href = '/problems'}
            >
              <span className="action-icon">🔍</span>
              <div className="action-content">
                <h4>문제 목록</h4>
                <p>모든 문제를 확인합니다</p>
              </div>
            </button>
            
            <button 
              className="action-btn warning"
              onClick={() => window.location.href = '/admin'}
            >
              <span className="action-icon">⚙️</span>
              <div className="action-content">
                <h4>시스템 관리</h4>
                <p>사용자와 시스템을 관리합니다</p>
              </div>
            </button>
          </div>
        </div>

        {/* 최근 생성한 문제집 */}
        <div className="recent-workbooks">
          <h2>최근 문제집</h2>
          {recentWorkbooks.length > 0 ? (
            <div className="workbook-list">
              {recentWorkbooks.map((workbook) => (
                <div key={workbook.id} className="workbook-item">
                  <div className="workbook-content">
                    <h4>{workbook.title}</h4>
                    <p className="workbook-description">{workbook.description || '설명 없음'}</p>
                    <div className="workbook-meta">
                      <span className="subject-badge">{workbook.subject}</span>
                      <span className="grade-badge">
                        {workbook.grade_level ? `${workbook.grade_level}학년` : '전체'}
                      </span>
                      <span className="problem-count-badge">
                        {workbook.problems?.length || 0}문제
                      </span>
                      <span className="time-badge">
                        {workbook.estimated_time ? `${workbook.estimated_time}분` : '시간 미정'}
                      </span>
                    </div>
                  </div>
                  <div className="workbook-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => window.location.href = `/workbooks/${workbook.id}`}
                    >
                      수정
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-workbooks">
              <p>📚 아직 생성한 문제집이 없습니다.</p>
              <p>새로운 문제집을 만들어보세요!</p>
            </div>
          )}
        </div>

        {/* 최근 생성한 문제 */}
        <div className="recent-problems">
          <h2>최근 문제</h2>
          {recentProblems.length > 0 ? (
            <div className="problem-list">
              {recentProblems.map((problem) => (
                <div key={problem.id} className="problem-item">
                  <div className="problem-content">
                    <h4>{problem.title}</h4>
                    <p className="problem-preview">
                      {problem.content && typeof problem.content === 'string' 
                        ? problem.content.substring(0, 100) + (problem.content.length > 100 ? '...' : '')
                        : '문제 내용 없음'}
                    </p>
                    <div className="problem-meta">
                      <span className="subject-badge">{problem.subject}</span>
                      <span className="difficulty-badge">{problem.difficulty || '보통'}</span>
                      <span className="type-badge">{problem.problem_type}</span>
                    </div>
                  </div>
                  <div className="problem-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => window.location.href = `/problems/solve/${problem.id}`}
                    >
                      보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-problems">
              <p>❓ 아직 생성한 문제가 없습니다.</p>
              <p>새로운 문제를 만들어보세요!</p>
            </div>
          )}
        </div>

        {/* 최근 활동 */}
        <div className="recent-activities">
          <h2>최근 활동</h2>
          {systemStats.recentActivities.length > 0 ? (
            <div className="activity-list">
              {systemStats.recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <span className="activity-title">{activity.title}</span>
                    <span className="activity-time">{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-activities">
              <p>📝 최근 활동이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;