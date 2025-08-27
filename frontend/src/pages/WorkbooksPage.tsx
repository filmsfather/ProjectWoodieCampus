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
    <div className="workbooks-page max-w-7xl mx-auto p-6">
      {/* 알림 */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={dismissNotification}
              className="text-current hover:opacity-70 ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 인라인 문제집 편집 폼 */}
      {(editingWorkbook || isCreating) && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isCreating ? '새 문제집 만들기' : '문제집 수정'}
          </h2>
          <WorkbookForm
            initialData={editingWorkbook || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isEditing={!isCreating}
          />
        </div>
      )}

      {/* 문제집 목록 */}
      <WorkbookList 
        onEdit={handleEdit}
        onDelete={handleDelete}
        className={editingWorkbook || isCreating ? 'opacity-75' : ''}
      />

      {/* 플로팅 생성 버튼 */}
      {!editingWorkbook && !isCreating && (
        <button
          onClick={handleCreateNew}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors flex items-center justify-center text-2xl"
        >
          +
        </button>
      )}
    </div>
  );
};

export default WorkbooksPage;