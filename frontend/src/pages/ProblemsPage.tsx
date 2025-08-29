import React, { useState } from 'react';
import { ProblemList } from '../components/ProblemList';
import { ProblemForm } from '../components/ProblemForm';
import { type Problem } from '../services/problemApi';

const ProblemsPage: React.FC = () => {
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setIsCreating(false);
  };

  const handleDelete = (problem: Problem) => {
    setNotification({
      type: 'success',
      message: `"${problem.title}" 문제가 삭제되었습니다.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingProblem(null);
  };

  const handleFormSubmit = (problem: Problem) => {
    if (isCreating) {
      setNotification({
        type: 'success',
        message: `"${problem.title}" 문제가 생성되었습니다.`,
      });
    } else {
      setNotification({
        type: 'success',
        message: `"${problem.title}" 문제가 수정되었습니다.`,
      });
    }
    
    setIsCreating(false);
    setEditingProblem(null);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setEditingProblem(null);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
      <div className="container max-w-7xl mx-auto" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div 
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
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
              <div style={{ fontSize: '120px' }}>📝</div>
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
                문제 관리
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                문제를 생성하고 관리하세요
              </p>
            </div>
          </div>
        </div>

        {/* 알림 */}
        {notification && (
          <div className="mb-6">
            <div 
              className="transition-all duration-300"
              style={{
                background: notification.type === 'success' 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(255,255,255,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: notification.type === 'success' 
                  ? '1px solid rgba(34, 197, 94, 0.2)'
                  : '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ 
                  color: notification.type === 'success' ? '#059669' : '#dc2626',
                  fontWeight: '500'
                }}>
                  {notification.message}
                </span>
                <button
                  onClick={dismissNotification}
                  className="transition-all duration-200 hover:opacity-70 ml-4"
                  style={{
                    color: notification.type === 'success' ? '#059669' : '#dc2626',
                    fontSize: 'var(--font-size-xl)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 인라인 문제 편집 폼 */}
        {(editingProblem || isCreating) && (
          <div className="mb-8">
            <div 
              className="transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)'
              }}
            >
              <h2 
                className="mb-4"
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: '600',
                  color: 'var(--color-text-primary)'
                }}
              >
                {isCreating ? '새 문제 만들기' : '문제 수정'}
              </h2>
              <ProblemForm
                initialData={editingProblem || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isEditing={!isCreating}
              />
            </div>
          </div>
        )}

        {/* 문제 목록 */}
        <ProblemList 
          onEdit={handleEdit}
          onDelete={handleDelete}
          className={editingProblem || isCreating ? 'opacity-75 pointer-events-none' : ''}
        />

        {/* 플로팅 생성 버튼 */}
        {!editingProblem && !isCreating && (
          <button
            onClick={handleCreateNew}
            className="fixed bottom-6 right-6 transition-all duration-300 hover:scale-110 focus:scale-105 group"
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-lg)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '300'
            }}
          >
            <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProblemsPage;