import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <p>오늘의 학습 현황을 확인하세요</p>
      </div>
      
      <div className="dashboard-content">
        <div className="stats-section">
          <div className="stat-card">
            <h3>오늘의 복습</h3>
            <p className="stat-number">5</p>
            <p className="stat-label">문제</p>
          </div>
          
          <div className="stat-card">
            <h3>학습 진도</h3>
            <p className="stat-number">75%</p>
            <p className="stat-label">완료</p>
          </div>
          
          <div className="stat-card">
            <h3>연속 학습</h3>
            <p className="stat-number">7</p>
            <p className="stat-label">일</p>
          </div>
        </div>
        
        <div className="recent-activities">
          <h2>최근 활동</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">10:30</span>
              <span className="activity-desc">수학 문제집 완료</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">09:15</span>
              <span className="activity-desc">영어 단어 복습</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">08:45</span>
              <span className="activity-desc">과학 개념 정리</span>
            </div>
          </div>
        </div>
        
        <div className="upcoming-reviews">
          <h2>예정된 복습</h2>
          <div className="review-list">
            <div className="review-item">
              <span className="review-subject">수학</span>
              <span className="review-time">내일 오전 9시</span>
            </div>
            <div className="review-item">
              <span className="review-subject">영어</span>
              <span className="review-time">3일 후</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;