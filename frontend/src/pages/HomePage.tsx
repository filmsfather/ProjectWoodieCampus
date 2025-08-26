import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Woodie Campus</h1>
        <p>에빙하우스 망각곡선 기반 학습 플랫폼</p>
        <div className="hero-buttons">
          <button className="btn-primary">학습 시작하기</button>
          <button className="btn-secondary">더 알아보기</button>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2>주요 기능</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>스마트 복습 시스템</h3>
              <p>에빙하우스 망각곡선을 기반으로 한 최적의 복습 스케줄링</p>
            </div>
            <div className="feature-card">
              <h3>개인화된 학습</h3>
              <p>개별 학습자의 성취도에 따른 맞춤형 문제 제공</p>
            </div>
            <div className="feature-card">
              <h3>진도 관리</h3>
              <p>실시간 학습 진도 추적 및 성과 분석</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;