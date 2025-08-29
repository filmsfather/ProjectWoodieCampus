import React, { useState, useEffect } from 'react';
import { AdminApi } from '../../services/adminApi';
import { WorkbookApi } from '../../services/workbookApi';
import { ProblemApi } from '../../services/problemApi';
// import SubjectManagement from '../admin/SubjectManagement';

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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          <div 
            className="text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-8)'
            }}
          >
            <div 
              className="animate-spin rounded-full mx-auto mb-4"
              style={{
                height: '48px',
                width: '48px',
                border: '2px solid var(--color-neutral-200)',
                borderBottom: '2px solid var(--color-primary)'
              }}
            ></div>
            <p style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>
              관리자 대시보드를 로드하고 있습니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          <div 
            className="text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-8)'
            }}
          >
            <h3 
              className="mb-4"
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: 'var(--color-text-primary)'
              }}
            >
              ❌ 오류 발생
            </h3>
            <p 
              className="mb-6"
              style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}
            >
              {error}
            </p>
            <button 
              onClick={loadDashboardData} 
              className="transition-all duration-200"
              style={{
                padding: 'var(--space-3) var(--space-6)',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                fontWeight: '500',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: 'none'
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 섹션에 따른 렌더링
  if (activeSection === 'subjects') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          <div 
            className="mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(90, 100, 80, 0.05) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)'
            }}
          >
            <button 
              className="mb-4 transition-all duration-200"
              onClick={() => setActiveSection('dashboard')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--color-neutral-100)',
                color: 'var(--color-primary)',
                fontWeight: '500',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-light)',
                cursor: 'pointer'
              }}
            >
              ← 대시보드로 돌아가기
            </button>
            <h1 
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: '700',
                color: 'var(--color-text-primary)'
              }}
            >
              교과목 관리
            </h1>
          </div>
          {/* <SubjectManagement /> */}
          <div 
            className="text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-8)',
              color: 'var(--color-text-secondary)'
            }}
          >
            교과목 관리 기능은 임시로 비활성화되었습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div 
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(90, 100, 80, 0.05) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)'
            }}
          >
            {/* 배경 워터마크 */}
            <div 
              className="absolute inset-0 flex items-center justify-end pr-8 opacity-5 pointer-events-none"
              style={{ transform: 'scale(1.5) translateX(20px)' }}
            >
              <div style={{ fontSize: '120px' }}>⚙️</div>
            </div>
            
            <div className="relative z-10">
              <h1 
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)'
                }}
              >
                관리자 대시보드
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                시스템 전반을 관리하고 모니터링하세요
              </p>
            </div>
          </div>
        </div>
        {/* 시스템 상태 */}
        <div className="mb-8">
          <div 
            className="transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)'
            }}
          >
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '2rem' }}>{getHealthIcon(metrics.systemHealth)}</span>
              <div>
                <h3 
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-1)'
                  }}
                >
                  시스템 상태
                </h3>
                <p 
                  style={{
                    color: metrics.systemHealth === 'healthy' ? '#10b981' : 
                           metrics.systemHealth === 'warning' ? '#f59e0b' : '#ef4444',
                    fontWeight: '500',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  {metrics.systemHealth === 'healthy' && '정상'}
                  {metrics.systemHealth === 'warning' && '주의'}
                  {metrics.systemHealth === 'error' && '오류'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  전체 사용자
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.totalUsers}명
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(90, 100, 80, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                👥
              </div>
            </div>
          </div>

          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  학생
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.totalStudents}명
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                🎓
              </div>
            </div>
          </div>

          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  교사
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.totalTeachers}명
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                👨‍🏫
              </div>
            </div>
          </div>

          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  관리자
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.totalAdmins}명
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(170, 70, 50, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                ⚡
              </div>
            </div>
          </div>
        </div>

        {/* 컨텐츠 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  문제집
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.totalWorkbooks}개
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                📚
              </div>
            </div>
          </div>

          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  문제
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.totalProblems}개
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                ❓
              </div>
            </div>
          </div>

          <div 
            className="group relative transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ padding: 'var(--space-6)' }} className="flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500',
                    color: 'var(--color-secondary)'
                  }}
                >
                  오늘의 활동
                </div>
                <div 
                  className="numeric-mono"
                  style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {metrics.todayActivities}건
                </div>
              </div>
              <div 
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.5rem'
                }}
              >
                📈
              </div>
            </div>
          </div>
        </div>

        {/* 관리 작업 */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2 
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-6)'
            }}
          >
            관리 작업
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              className="group relative transition-all duration-300 hover:shadow-lg text-left"
              onClick={() => window.location.href = '/admin'}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(90, 100, 80, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.5rem'
                  }}
                >
                  👤
                </div>
                <div className="flex-1">
                  <h4 
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)'
                    }}
                  >
                    사용자 관리
                  </h4>
                  <p 
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    사용자를 생성하고 관리합니다
                  </p>
                </div>
              </div>
            </button>
            
            <button 
              className="group relative transition-all duration-300 hover:shadow-lg text-left"
              onClick={() => window.location.href = '/workbooks'}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.5rem'
                  }}
                >
                  📚
                </div>
                <div className="flex-1">
                  <h4 
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)'
                    }}
                  >
                    문제집 관리
                  </h4>
                  <p 
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    모든 문제집을 확인합니다
                  </p>
                </div>
              </div>
            </button>
            
            <button 
              className="group relative transition-all duration-300 hover:shadow-lg text-left"
              onClick={() => window.location.href = '/problems'}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.5rem'
                  }}
                >
                  ❓
                </div>
                <div className="flex-1">
                  <h4 
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)'
                    }}
                  >
                    문제 관리
                  </h4>
                  <p 
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    모든 문제를 확인합니다
                  </p>
                </div>
              </div>
            </button>
            
            <button 
              className="group relative transition-all duration-300 hover:shadow-lg text-left"
              onClick={() => {
                setActiveSection('subjects');
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.5rem'
                  }}
                >
                  📖
                </div>
                <div className="flex-1">
                  <h4 
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)'
                    }}
                  >
                    교과목 관리
                  </h4>
                  <p 
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    교과목을 생성하고 관리합니다
                  </p>
                </div>
              </div>
            </button>
            
            <button 
              className="group relative transition-all duration-300 hover:shadow-lg text-left"
              onClick={() => {
                alert('시스템 설정 페이지는 향후 구현 예정입니다.');
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.5rem'
                  }}
                >
                  ⚙️
                </div>
                <div className="flex-1">
                  <h4 
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)'
                    }}
                  >
                    시스템 설정
                  </h4>
                  <p 
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    시스템 전반을 설정합니다
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 최근 사용자 */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2 
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-6)'
            }}
          >
            최근 가입 사용자
          </h2>
          {recentUsers.length > 0 ? (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              {recentUsers.map((user, index) => (
                <div key={user.id}>
                  <div className="flex items-center gap-4 py-4">
                    <div 
                      className="flex items-center justify-center text-white font-medium"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: user.role === 'admin' ? 'var(--color-accent)' : 
                                       user.role === 'teacher' ? 'var(--color-primary)' : 
                                       'var(--color-info)',
                        borderRadius: '50%',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      {getRoleDisplayName(user.role).charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 
                        style={{
                          fontSize: 'var(--font-size-base)',
                          fontWeight: '600',
                          color: 'var(--color-text-primary)',
                          marginBottom: 'var(--space-1)'
                        }}
                      >
                        {user.full_name || user.username}
                      </h4>
                      <p 
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--space-2)'
                        }}
                      >
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: user.role === 'admin' ? 'rgba(170, 70, 50, 0.1)' : 
                                           user.role === 'teacher' ? 'rgba(90, 100, 80, 0.1)' : 
                                           'rgba(59, 130, 246, 0.1)',
                            color: user.role === 'admin' ? 'var(--color-accent)' : 
                                   user.role === 'teacher' ? 'var(--color-primary)' : 
                                   'var(--color-info)'
                          }}
                        >
                          {getRoleDisplayName(user.role)}
                        </span>
                        <span 
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)'
                          }}
                        >
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < recentUsers.length - 1 && (
                    <div 
                      style={{
                        height: '1px',
                        backgroundColor: 'var(--color-border-light)'
                      }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-8)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>👤</div>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                최근 가입한 사용자가 없습니다.
              </p>
            </div>
          )}
        </div>

        {/* 시스템 로그 */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2 
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-6)'
            }}
          >
            시스템 활동 로그
          </h2>
          {systemLogs.length > 0 ? (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              {systemLogs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start gap-3 py-3">
                    <div 
                      className="flex items-center justify-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'var(--color-neutral-100)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                          marginBottom: 'var(--space-1)'
                        }}
                      >
                        {log.message}
                      </p>
                      <span 
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  {index < systemLogs.length - 1 && (
                    <div 
                      style={{
                        height: '1px',
                        backgroundColor: 'var(--color-border-light)'
                      }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-8)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📋</div>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                시스템 로그가 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;