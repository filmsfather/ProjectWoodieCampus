import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { WorkbookApi, type Workbook, type CreateWorkbookRequest } from '../services/workbookApi';
import { SolutionApi, type WorkbookProgress } from '../services/solutionApi';
import { WorkbookEditor } from '../components/WorkbookEditor';
import { WorkbookForm } from '../components/WorkbookForm';

const WorkbookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [progress, setProgress] = useState<WorkbookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 문제집 정보 로드
  const loadWorkbook = async () => {
    if (!id || id === 'create') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 문제집 정보와 진도 정보 동시 로딩
      const [workbookData, progressData] = await Promise.all([
        WorkbookApi.getWorkbook(id),
        SolutionApi.getWorkbookProgress(id).catch(() => null), // 진도 로딩 실패해도 문제집은 표시
      ]);
      
      setWorkbook(workbookData);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제집을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id === 'create') {
      setEditMode(true);
      setLoading(false);
    } else {
      loadWorkbook();
    }
  }, [id]);

  // 문제집 생성 완료
  const handleCreateWorkbook = async (workbookData: Partial<Workbook>) => {
    try {
      const newWorkbook = await WorkbookApi.createWorkbook(workbookData as CreateWorkbookRequest);
      setNotification({
        type: 'success',
        message: '문제집이 생성되었습니다.',
      });
      setTimeout(() => {
        setNotification(null);
        navigate(`/workbooks/${newWorkbook.id}`);
      }, 2000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : '문제집 생성에 실패했습니다.',
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // 문제집 수정 완료
  const handleUpdateWorkbook = (updatedWorkbook: Workbook) => {
    setWorkbook(updatedWorkbook);
    setEditMode(false);
    setNotification({
      type: 'success',
      message: '문제집이 수정되었습니다.',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // 문제집 삭제
  const handleDeleteWorkbook = async () => {
    if (!workbook?.id) return;

    const confirmed = window.confirm(`"${workbook.title}" 문제집을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await WorkbookApi.deleteWorkbook(workbook.id);
      navigate('/workbooks');
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제집을 삭제할 수 없습니다');
    }
  };

  // 상태 변경 (발행/보관 등)
  const handleStatusChange = async (newStatus: Workbook['status']) => {
    if (!workbook?.id) return;

    try {
      const updatedWorkbook = await WorkbookApi.updateWorkbook(workbook.id, { status: newStatus });
      setWorkbook(updatedWorkbook);
      setNotification({
        type: 'success',
        message: `문제집이 ${WorkbookApi.getStatusName(newStatus)} 상태로 변경되었습니다.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태를 변경할 수 없습니다');
    }
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">문제집을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <div className="mt-4">
          <Link
            to="/workbooks"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← 문제집 목록으로
          </Link>
        </div>
      </div>
    );
  }

  // 새 문제집 생성 모드
  if (id === 'create') {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link
              to="/workbooks"
              className="text-blue-600 hover:text-blue-800"
            >
              ← 문제집 목록
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 문제집 만들기</h1>
          <WorkbookForm onSubmit={handleCreateWorkbook} />
        </div>
      </div>
    );
  }

  if (!workbook) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">문제집을 찾을 수 없습니다.</p>
          <Link
            to="/workbooks"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← 문제집 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
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

      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/workbooks"
                className="text-blue-600 hover:text-blue-800"
              >
                ← 문제집 목록
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-gray-900">{workbook.title}</h1>
              <span className={`px-3 py-1 text-sm rounded-full ${WorkbookApi.getStatusColor(workbook.status)}`}>
                {WorkbookApi.getStatusName(workbook.status)}
              </span>
            </div>

            {workbook.description && (
              <p className="text-gray-700 mb-4">{workbook.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600">
              {workbook.created_by_user && (
                <span>작성자: {workbook.created_by_user.full_name || workbook.created_by_user.username}</span>
              )}
              {workbook.createdAt && (
                <span>생성일: {new Date(workbook.createdAt).toLocaleDateString()}</span>
              )}
              {workbook.updatedAt && (
                <span>수정일: {new Date(workbook.updatedAt).toLocaleDateString()}</span>
              )}
            </div>

            {/* 진도율 표시 */}
            {progress && progress.totalProblems > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600 font-medium">학습 진도</span>
                  <span className="text-gray-800 font-semibold">
                    {progress.solvedProblems}/{progress.totalProblems} 문제 완료 ({progress.progressPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      progress.progressPercentage >= 100
                        ? 'bg-green-500'
                        : progress.progressPercentage >= 75
                        ? 'bg-blue-500'
                        : progress.progressPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                  ></div>
                </div>
                {progress.progressPercentage >= 100 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                    <span>🎉</span>
                    <span className="font-medium">모든 문제를 완료했습니다!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-3 ml-6">
            {/* 상태 변경 버튼 */}
            {workbook.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                배포하기
              </button>
            )}
            
            {workbook.status === 'published' && (
              <button
                onClick={() => handleStatusChange('archived')}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                보관하기
              </button>
            )}
            
            {workbook.status === 'archived' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                다시 배포
              </button>
            )}

            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300"
            >
              정보 수정
            </button>

            <button
              onClick={handleDeleteWorkbook}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* 문제집 정보 수정 모드 */}
      {editMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">문제집 정보 수정</h2>
          <WorkbookForm
            initialData={workbook}
            onSubmit={handleUpdateWorkbook}
            onCancel={() => setEditMode(false)}
            isEditing={true}
          />
        </div>
      )}

      {/* 문제집 에디터 */}
      {!editMode && (
        <WorkbookEditor
          workbook={workbook}
          onUpdate={loadWorkbook}
        />
      )}
    </div>
  );
};

export default WorkbookDetailPage;