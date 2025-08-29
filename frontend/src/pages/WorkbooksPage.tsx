import React, { useState } from 'react';
import { WorkbookList } from '../components/WorkbookList';
import { WorkbookForm } from '../components/WorkbookForm';
import { type Workbook } from '../services/workbookApi';

const WorkbooksPage: React.FC = () => {
  const [editingWorkbook, setEditingWorkbook] = useState<Workbook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleEdit = (workbook: Workbook) => {
    setEditingWorkbook(workbook);
    setIsCreating(false);
  };

  const handleDelete = (workbook: Workbook) => {
    setNotification({
      type: 'success',
      message: `"${workbook.title}" 문제집이 삭제되었습니다.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingWorkbook(null);
  };

  const handleFormSubmit = (workbook: Workbook) => {
    if (isCreating) {
      setNotification({
        type: 'success',
        message: `"${workbook.title}" 문제집이 생성되었습니다.`,
      });
    } else {
      setNotification({
        type: 'success',
        message: `"${workbook.title}" 문제집이 수정되었습니다.`,
      });
    }
    
    setIsCreating(false);
    setEditingWorkbook(null);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setEditingWorkbook(null);
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
              background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.05) 0%, rgba(255,255,255,0.95) 100%)',
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
                문제집 관리
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                문제집을 생성하고 관리하세요
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

        {/* 인라인 문제집 편집 폼 */}
        {(editingWorkbook || isCreating) && (
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
                {isCreating ? '새 문제집 만들기' : '문제집 수정'}
              </h2>
              <WorkbookForm
                initialData={editingWorkbook || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isEditing={!isCreating}
              />
            </div>
          </div>
        )}

        {/* 문제집 목록 */}
        <WorkbookList 
          onEdit={handleEdit}
          onDelete={handleDelete}
          className={editingWorkbook || isCreating ? 'opacity-75 pointer-events-none' : ''}
        />

        {/* 플로팅 생성 버튼 */}
        {!editingWorkbook && !isCreating && (
          <button
            onClick={handleCreateNew}
            className="fixed bottom-6 right-6 transition-all duration-300 hover:scale-110 focus:scale-105 group"
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
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

export default WorkbooksPage;