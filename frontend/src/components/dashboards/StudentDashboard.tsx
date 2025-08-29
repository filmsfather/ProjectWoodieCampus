import React, { useState, useEffect } from 'react';
import { ReviewApi } from '../../services/reviewApi';
import { WorkbookApi } from '../../services/workbookApi';
import type { ReviewProgress, ReviewTarget, DailyStats } from '../../services/reviewApi';
import { Stack, Grid, Cluster, AutoGrid } from '../layout/index';
import { StatCard, Card, CardHeader, CardContent, SkeletonGrid, EmptyState, EmptyIcons } from '../ui';

interface StudentDashboardProps {
  userId: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ }) => {
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null);
  const [todayReviews, setTodayReviews] = useState<ReviewTarget[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [recentWorkbooks, setRecentWorkbooks] = useState<any[]>([]);
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
      const [progressData, todayReviewsData, statsData, workbooksData] = await Promise.all([
        ReviewApi.getReviewProgress(),
        ReviewApi.getTodayReviewTargets(1, 5),
        ReviewApi.getDailyStats(),
        WorkbookApi.getWorkbooks().catch(() => ({ success: false, data: [] }))
      ]);

      if (progressData.success && progressData.data) {
        setReviewProgress(progressData.data);
      }

      if (todayReviewsData.success) {
        setTodayReviews(todayReviewsData.data || []);
      }

      if (statsData.success && statsData.data) {
        setDailyStats(statsData.data);
      }

      if (Array.isArray(workbooksData)) {
        setRecentWorkbooks(workbooksData.slice(0, 5));
      } else if (workbooksData && 'data' in workbooksData) {
        setRecentWorkbooks(workbooksData.data.slice(0, 5));
      }

    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
      setError('대시보드를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = () => {
    if (!reviewProgress) return 0;
    const total = reviewProgress.todayTotal;
    const completed = reviewProgress.masteryDistribution.completed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getStreakDays = () => {
    // 임시로 하드코딩, 나중에 백엔드에서 연속 학습일 API 구현
    return 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          {/* 헤더 스켈레톤 */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div 
              className="animate-pulse mb-2"
              style={{ 
                height: '32px',
                backgroundColor: 'var(--color-neutral-200)',
                borderRadius: 'var(--radius-md)',
                width: '200px'
              }}
            ></div>
            <div 
              className="animate-pulse"
              style={{ 
                height: '20px',
                backgroundColor: 'var(--color-neutral-200)',
                borderRadius: 'var(--radius-md)',
                width: '400px'
              }}
            ></div>
          </div>
          
          {/* 통계 카드 스켈레톤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  height: '120px'
                }}
              >
                <div 
                  className="mb-2"
                  style={{
                    height: '16px',
                    backgroundColor: 'var(--color-neutral-200)',
                    borderRadius: 'var(--radius-sm)',
                    width: '60%'
                  }}
                ></div>
                <div 
                  style={{
                    height: '24px',
                    backgroundColor: 'var(--color-neutral-200)',
                    borderRadius: 'var(--radius-sm)',
                    width: '40%'
                  }}
                ></div>
              </div>
            ))}
          </div>
          
          {/* 로딩 메시지 */}
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
              학습 대시보드를 로드하고 있습니다...
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
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>❌</div>
            <h3 
              className="mb-4"
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: 'var(--color-text-primary)'
              }}
            >
              오류 발생
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
                backgroundColor: 'var(--color-primary)',
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
              <div style={{ fontSize: '120px' }}>📚</div>
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
                학습 대시보드
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                오늘의 학습 현황을 확인하고 복습을 진행하세요
              </p>
            </div>
          </div>
        </div>
      
      {/* 통계 카드 그리드 */}
      <AutoGrid cardSize="md" gap="md" stretch>
        <StatCard
          title="오늘의 복습"
          value={reviewProgress?.todayTotal || 0}
          subtitle="문제"
          icon="📚"
          variant="role"
        />
        
        <StatCard
          title="학습 진도"
          value={`${calculateCompletionRate()}%`}
          subtitle="완료"
          icon="✅"
          variant="success"
        />
        
        <StatCard
          title="연속 학습"
          value={getStreakDays()}
          subtitle="일"
          icon="🔥"
          variant="warning"
        />

        {dailyStats && (
          <StatCard
            title="오늘의 정답률"
            value={`${dailyStats.totalReviewsCompleted > 0 
              ? Math.round((dailyStats.correctAnswers / dailyStats.totalReviewsCompleted) * 100)
              : 0}%`}
            subtitle="정확도"
            icon="🎯"
            variant="info"
          />
        )}
      </AutoGrid>

      {/* 숙련도 분포 차트 */}
      {reviewProgress && (
        <Card>
          <CardHeader 
            title="학습 진행 현황" 
          />
          <CardContent>
            <Stack gap="md">
            
            {/* 진행률 바 */}
            <div className="w-full bg-neutral-100 rounded-lg h-12 flex overflow-hidden">
              <div 
                className="bg-neutral-300 flex items-center justify-center text-xs font-medium text-neutral-700"
                style={{width: `${(reviewProgress.masteryDistribution.level0 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}
              >
                {reviewProgress.masteryDistribution.level0 > 0 && reviewProgress.masteryDistribution.level0}
              </div>
              <div 
                className="bg-yellow-200 flex items-center justify-center text-xs font-medium text-yellow-800"
                style={{width: `${(reviewProgress.masteryDistribution.level1 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}
              >
                {reviewProgress.masteryDistribution.level1 > 0 && reviewProgress.masteryDistribution.level1}
              </div>
              <div 
                className="bg-blue-200 flex items-center justify-center text-xs font-medium text-blue-800"
                style={{width: `${(reviewProgress.masteryDistribution.level2 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}
              >
                {reviewProgress.masteryDistribution.level2 > 0 && reviewProgress.masteryDistribution.level2}
              </div>
              <div 
                className="bg-purple-200 flex items-center justify-center text-xs font-medium text-purple-800"
                style={{width: `${(reviewProgress.masteryDistribution.level3 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}
              >
                {reviewProgress.masteryDistribution.level3 > 0 && reviewProgress.masteryDistribution.level3}
              </div>
              <div 
                className="bg-success text-white flex items-center justify-center text-xs font-medium"
                style={{width: `${(reviewProgress.masteryDistribution.completed / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}
              >
                {reviewProgress.masteryDistribution.completed > 0 && reviewProgress.masteryDistribution.completed}
              </div>
            </div>
            
            {/* 범례 */}
            <Cluster gap="md" wrap className="text-sm">
              <Cluster gap="xs" align="center">
                <div className="w-3 h-3 rounded bg-neutral-300"></div>
                <span>처음 학습</span>
              </Cluster>
              <Cluster gap="xs" align="center">
                <div className="w-3 h-3 rounded bg-yellow-200"></div>
                <span>1일 복습</span>
              </Cluster>
              <Cluster gap="xs" align="center">
                <div className="w-3 h-3 rounded bg-blue-200"></div>
                <span>3일 복습</span>
              </Cluster>
              <Cluster gap="xs" align="center">
                <div className="w-3 h-3 rounded bg-purple-200"></div>
                <span>7일 복습</span>
              </Cluster>
              <Cluster gap="xs" align="center">
                <div className="w-3 h-3 rounded bg-success"></div>
                <span>학습 완료</span>
              </Cluster>
            </Cluster>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* 오늘의 복습 목록 */}
      <Card>
        <CardHeader title="오늘의 복습" />
        <CardContent>
          <Stack gap="md">
          
          {todayReviews.length > 0 ? (
            <Stack gap="sm">
              {todayReviews.map((review) => (
                <div key={review.id} className="border border-neutral-200 rounded-lg p-4 hover:border-primary-light transition-colors">
                  <Cluster justify="between" align="center" className="w-full">
                    <Stack gap="xs" className="flex-1">
                      <h4 className="font-medium text-neutral-900">{review.problem?.title || '문제 제목 없음'}</h4>
                      <p className="text-sm text-neutral-600">{review.problem?.subject}</p>
                      <Cluster gap="xs">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          review.mastery_level === 0 ? 'bg-neutral-100 text-neutral-700' :
                          review.mastery_level === 1 ? 'bg-yellow-100 text-yellow-800' :
                          review.mastery_level === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          레벨 {review.mastery_level}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700">
                          {review.problem?.difficulty || '보통'}
                        </span>
                      </Cluster>
                    </Stack>
                    <button 
                      className="px-4 py-2 role-primary rounded-lg transition-colors text-sm font-medium"
                      onClick={() => window.location.href = `/problems/solve/${review.problem_id}`}
                    >
                      복습하기
                    </button>
                  </Cluster>
                </div>
              ))}
            </Stack>
          ) : (
            <EmptyState
              icon="🎉"
              title="오늘 복습할 문제가 없습니다!"
              description="새로운 문제를 풀어보세요."
            />
          )}
          </Stack>
        </CardContent>
      </Card>

      {/* 내 문제집 목록 */}
      <Card>
        <CardHeader title="내 문제집" />
        <CardContent>
          <Stack gap="md">
          
          {recentWorkbooks.length > 0 ? (
            <Grid columns={2} gap="md" className="md:grid-cols-1">
              {recentWorkbooks.slice(0, 5).map((workbook) => (
                <div key={workbook.id} className="border border-neutral-200 rounded-lg p-4 hover:border-primary-light transition-colors">
                  <Cluster justify="between" align="start" className="w-full">
                    <Stack gap="xs" className="flex-1">
                      <h4 className="font-medium text-neutral-900">{workbook.title}</h4>
                      <p className="text-sm text-neutral-600">{workbook.description}</p>
                      <Cluster gap="xs" wrap>
                        <span className="px-2 py-1 rounded text-xs role-primary">
                          {workbook.subject}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700">
                          {workbook.grade_level ? `${workbook.grade_level}학년` : '전체'}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700">
                          {workbook.estimated_time ? `${workbook.estimated_time}분` : '시간 미정'}
                        </span>
                      </Cluster>
                    </Stack>
                    <button 
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors text-sm font-medium whitespace-nowrap ml-4"
                      onClick={() => window.location.href = `/workbooks/${workbook.id}`}
                    >
                      풀기
                    </button>
                  </Cluster>
                </div>
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={EmptyIcons.document}
              title="아직 문제집이 없습니다"
              description="문제집을 만들어 학습을 시작하세요!"
              action={
                <button
                  className="btn-spacing bg-role-primary text-white rounded-lg hover:bg-role-primary/90 transition-colors font-medium"
                  onClick={() => window.location.href = '/workbooks/create'}
                >
                  문제집 만들기
                </button>
              }
            />
          )}
          </Stack>
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      {dailyStats && (
        <Card>
          <CardHeader title="오늘의 학습 활동" />
          <CardContent>
            
            <Grid columns={4} gap="md" className="md:grid-cols-2 sm:grid-cols-1">
              <Stack gap="xs" align="center" className="text-center">
                <span className="text-sm text-neutral-600">완료한 복습</span>
                <span className="text-2xl font-bold text-role-primary">{dailyStats.totalReviewsCompleted}개</span>
              </Stack>
              <Stack gap="xs" align="center" className="text-center">
                <span className="text-sm text-neutral-600">정답</span>
                <span className="text-2xl font-bold text-success">{dailyStats.correctAnswers}개</span>
              </Stack>
              <Stack gap="xs" align="center" className="text-center">
                <span className="text-sm text-neutral-600">오답</span>
                <span className="text-2xl font-bold text-error">{dailyStats.incorrectAnswers}개</span>
              </Stack>
              {dailyStats.averageTimeSpent > 0 && (
                <Stack gap="xs" align="center" className="text-center">
                  <span className="text-sm text-neutral-600">평균 소요시간</span>
                  <span className="text-2xl font-bold text-role-primary">{Math.round(dailyStats.averageTimeSpent)}초</span>
                </Stack>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};

export default StudentDashboard;