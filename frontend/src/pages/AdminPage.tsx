import React, { useState } from 'react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'problems' | 'settings'>('users');

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>관리자 패널</h1>
        <p>시스템 관리 및 설정</p>
      </div>
      
      <div className="admin-navigation">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          사용자 관리
        </button>
        <button 
          className={activeTab === 'problems' ? 'active' : ''}
          onClick={() => setActiveTab('problems')}
        >
          문제 관리
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          시스템 설정
        </button>
      </div>
      
      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-management">
            <h2>사용자 관리</h2>
            <div className="management-actions">
              <button className="btn-primary">새 사용자 추가</button>
              <button className="btn-secondary">사용자 가져오기</button>
            </div>
            
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>사용자명</th>
                    <th>이메일</th>
                    <th>역할</th>
                    <th>가입일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>admin</td>
                    <td>admin@woodie.com</td>
                    <td>관리자</td>
                    <td>2025-01-01</td>
                    <td>
                      <button className="btn-edit">편집</button>
                      <button className="btn-delete">삭제</button>
                    </td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>teacher1</td>
                    <td>teacher@woodie.com</td>
                    <td>교사</td>
                    <td>2025-01-02</td>
                    <td>
                      <button className="btn-edit">편집</button>
                      <button className="btn-delete">삭제</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'problems' && (
          <div className="problems-management">
            <h2>문제 관리</h2>
            <div className="management-actions">
              <button className="btn-primary">새 문제 추가</button>
              <button className="btn-secondary">문제집 관리</button>
            </div>
            
            <div className="problems-stats">
              <div className="stat-card">
                <h3>총 문제 수</h3>
                <p className="stat-number">152</p>
              </div>
              <div className="stat-card">
                <h3>문제집 수</h3>
                <p className="stat-number">12</p>
              </div>
              <div className="stat-card">
                <h3>평균 정답률</h3>
                <p className="stat-number">73%</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="settings-management">
            <h2>시스템 설정</h2>
            
            <div className="settings-section">
              <h3>복습 스케줄 설정</h3>
              <div className="setting-item">
                <label>첫 번째 복습 간격 (일)</label>
                <input type="number" defaultValue={1} min={1} max={7} />
              </div>
              <div className="setting-item">
                <label>두 번째 복습 간격 (일)</label>
                <input type="number" defaultValue={3} min={2} max={14} />
              </div>
              <div className="setting-item">
                <label>세 번째 복습 간격 (일)</label>
                <input type="number" defaultValue={7} min={5} max={21} />
              </div>
              <div className="setting-item">
                <label>네 번째 복습 간격 (일)</label>
                <input type="number" defaultValue={14} min={10} max={30} />
              </div>
            </div>
            
            <div className="settings-section">
              <h3>시스템 정보</h3>
              <div className="system-info">
                <p><strong>버전:</strong> 1.0.0</p>
                <p><strong>데이터베이스:</strong> Supabase</p>
                <p><strong>서버 상태:</strong> 정상</p>
                <p><strong>마지막 백업:</strong> 2025-08-26</p>
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="btn-primary">설정 저장</button>
              <button className="btn-secondary">기본값 복원</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;