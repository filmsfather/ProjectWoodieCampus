import React, { useState, useEffect } from 'react';
import { ReviewApi } from '../../services/reviewApi';
import { WorkbookApi } from '../../services/workbookApi';
import type { ReviewProgress, ReviewTarget, DailyStats } from '../../services/reviewApi';

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
      <div className="student-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>대시보드를 로드하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard error">
        <div className="error-message">
          <h3>❌ 오류 발생</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>학습 대시보드</h1>
        <p>오늘의 학습 현황을 확인하고 복습을 진행하세요</p>
      </div>
      
      <div className="dashboard-content">
        {/* 오늘의 통계 */}
        <div className="stats-section">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>오늘의 복습</h3>
              <p className="stat-number">{reviewProgress?.todayTotal || 0}</p>
              <p className="stat-label">문제</p>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>학습 진도</h3>
              <p className="stat-number">{calculateCompletionRate()}%</p>
              <p className="stat-label">완료</p>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>연속 학습</h3>
              <p className="stat-number">{getStreakDays()}</p>
              <p className="stat-label">일</p>
            </div>
          </div>

          {dailyStats && (
            <div className="stat-card info">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>오늘의 정답률</h3>
                <p className="stat-number">
                  {dailyStats.totalReviewsCompleted > 0 
                    ? Math.round((dailyStats.correctAnswers / dailyStats.totalReviewsCompleted) * 100)
                    : 0}%
                </p>
                <p className="stat-label">정확도</p>
              </div>
            </div>
          )}
        </div>

        {/* 숙련도 분포 차트 */}
        {reviewProgress && (
          <div className="mastery-distribution">
            <h2>학습 진행 현황</h2>
            <div className="mastery-chart">
              <div className="mastery-bar">
                <div className="mastery-levels">
                  <div className="mastery-level level-0" 
                       style={{width: `${(reviewProgress.masteryDistribution.level0 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}>
                    <span className="level-label">처음 학습</span>
                    <span className="level-count">{reviewProgress.masteryDistribution.level0}</span>
                  </div>
                  <div className="mastery-level level-1" 
                       style={{width: `${(reviewProgress.masteryDistribution.level1 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}>
                    <span className="level-label">1일차</span>
                    <span className="level-count">{reviewProgress.masteryDistribution.level1}</span>
                  </div>
                  <div className="mastery-level level-2" 
                       style={{width: `${(reviewProgress.masteryDistribution.level2 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}>
                    <span className="level-label">3일차</span>
                    <span className="level-count">{reviewProgress.masteryDistribution.level2}</span>
                  </div>
                  <div className="mastery-level level-3" 
                       style={{width: `${(reviewProgress.masteryDistribution.level3 / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}>
                    <span className="level-label">7일차</span>
                    <span className="level-count">{reviewProgress.masteryDistribution.level3}</span>
                  </div>
                  <div className="mastery-level completed" 
                       style={{width: `${(reviewProgress.masteryDistribution.completed / Math.max(reviewProgress.todayTotal, 1)) * 100}%`}}>
                    <span className="level-label">완료</span>
                    <span className="level-count">{reviewProgress.masteryDistribution.completed}</span>
                  </div>
                </div>
              </div>
              <div className="mastery-legend">
                <div className="legend-item">
                  <span className="legend-color level-0"></span>
                  <span>처음 학습</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color level-1"></span>
                  <span>1일 복습</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color level-2"></span>
                  <span>3일 복습</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color level-3"></span>
                  <span>7일 복습</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color completed"></span>
                  <span>학습 완료</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 오늘의 복습 목록 */}
        <div className="today-reviews">
          <h2>오늘의 복습</h2>
          {todayReviews.length > 0 ? (
            <div className="review-list">
              {todayReviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-content">
                    <h4>{review.problem?.title || '문제 제목 없음'}</h4>
                    <p className="review-subject">{review.problem?.subject}</p>
                    <div className="review-meta">
                      <span className={`mastery-badge level-${review.mastery_level}`}>
                        레벨 {review.mastery_level}
                      </span>
                      <span className="difficulty-badge">
                        {review.problem?.difficulty || '보통'}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="review-btn"
                    onClick={() => window.location.href = `/problems/solve/${review.problem_id}`}
                  >
                    복습하기
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <p>🎉 오늘 복습할 문제가 없습니다!</p>
              <p>새로운 문제를 풀어보세요.</p>
            </div>
          )}
        </div>

        {/* 내 문제집 목록 */}
        <div className="my-workbooks">
          <h2>내 문제집</h2>
          {recentWorkbooks.length > 0 ? (
            <div className="workbook-list">
              {recentWorkbooks.slice(0, 5).map((workbook) => (
                <div key={workbook.id} className="workbook-item">
                  <div className="workbook-content">
                    <h4>{workbook.title}</h4>
                    <p className="workbook-description">{workbook.description}</p>
                    <div className="workbook-meta">
                      <span className="subject-badge">{workbook.subject}</span>
                      <span className="grade-badge">
                        {workbook.grade_level ? `${workbook.grade_level}학년` : '전체'}
                      </span>
                      <span className="time-badge">
                        {workbook.estimated_time ? `${workbook.estimated_time}분` : '시간 미정'}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="workbook-btn"
                    onClick={() => window.location.href = `/workbooks/${workbook.id}`}
                  >
                    풀기
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-workbooks">
              <p>📝 아직 문제집이 없습니다.</p>
              <p>문제집을 만들어 학습을 시작하세요!</p>
            </div>
          )}
        </div>

        {/* 최근 활동 */}
        {dailyStats && (
          <div className="recent-activities">
            <h2>오늘의 학습 활동</h2>
            <div className="activity-summary">
              <div className="activity-stat">
                <span className="activity-label">완료한 복습</span>
                <span className="activity-value">{dailyStats.totalReviewsCompleted}개</span>
              </div>
              <div className="activity-stat">
                <span className="activity-label">정답</span>
                <span className="activity-value success">{dailyStats.correctAnswers}개</span>
              </div>
              <div className="activity-stat">
                <span className="activity-label">오답</span>
                <span className="activity-value error">{dailyStats.incorrectAnswers}개</span>
              </div>
              {dailyStats.averageTimeSpent > 0 && (
                <div className="activity-stat">
                  <span className="activity-label">평균 소요시간</span>
                  <span className="activity-value">{Math.round(dailyStats.averageTimeSpent)}초</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;