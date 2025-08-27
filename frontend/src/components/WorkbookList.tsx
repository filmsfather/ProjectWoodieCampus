import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WorkbookApi, type Workbook } from '../services/workbookApi';
import { SolutionApi, type WorkbookProgress } from '../services/solutionApi';

interface WorkbookListProps {
  onEdit?: (workbook: Workbook) => void;
  onDelete?: (workbook: Workbook) => void;
  className?: string;
}

interface FilterState {
  status: string;
  search: string;
  page: number;
  limit: number;
}

export const WorkbookList: React.FC<WorkbookListProps> = ({
  onEdit,
  onDelete,
  className = '',
}) => {
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [progressData, setProgressData] = useState<WorkbookProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    status: '',
    search: '',
    page: 1,
    limit: 10,
  });

  // 문제집 목록 조회
  const loadWorkbooks = async () => {
    setLoading(true);
    setError(null);

    try {
      // 문제집 목록과 진도 데이터 동시 로딩
      const [workbooksResponse, progressResponse] = await Promise.all([
        WorkbookApi.getWorkbooks({
          page: filters.page,
          limit: filters.limit,
          status: filters.status || undefined,
          search: filters.search || undefined,
        }),
        SolutionApi.getAllWorkbooksProgress().catch(() => []), // 진도 로딩 실패해도 문제집은 표시
      ]);

      setWorkbooks(workbooksResponse.data);
      setProgressData(progressResponse);
      setTotalPages(workbooksResponse.pagination.totalPages);
      setTotalCount(workbooksResponse.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제집 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 특정 문제집의 진도 조회
  const getWorkbookProgress = (workbookId: string): WorkbookProgress | undefined => {
    return progressData.find(p => p.workbookId === workbookId);
  };

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, [filters.status, filters.search]);

  // 문제집 목록 로드
  useEffect(() => {
    loadWorkbooks();
  }, [filters.page, filters.limit, filters.status]);

  // 검색 (debounce 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.trim()) {
        loadWorkbooks();
      } else if (filters.search === '') {
        loadWorkbooks();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // 문제집 삭제
  const handleDelete = async (workbook: Workbook) => {
    if (!workbook.id) return;
    
    const confirmed = window.confirm(`"${workbook.title}" 문제집을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await WorkbookApi.deleteWorkbook(workbook.id);
      await loadWorkbooks(); // 목록 새로고침
      onDelete?.(workbook);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제집 삭제에 실패했습니다');
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className={`workbook-list ${className}`}>
      {/* 필터 및 검색 */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">문제집 목록</h2>
          <Link
            to="/workbooks/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            + 새 문제집 만들기
          </Link>
        </div>

        {/* 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="draft">임시 저장</option>
              <option value="published">배포됨</option>
              <option value="archived">보관됨</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="문제집 제목 또는 설명 검색"
            />
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">문제집 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 문제집 목록 */}
      {!loading && workbooks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">등록된 문제집이 없습니다.</p>
          <Link
            to="/workbooks/create"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            첫 번째 문제집 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {workbooks.map((workbook) => (
            <div key={workbook.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{workbook.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${WorkbookApi.getStatusColor(workbook.status)}`}>
                      {WorkbookApi.getStatusName(workbook.status)}
                    </span>
                  </div>

                  {workbook.description && (
                    <p className="text-gray-700 mb-3 line-clamp-2">{workbook.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>문제 수: {workbook.problem_count || 0}개</span>
                    {workbook.created_by_user && (
                      <span>작성자: {workbook.created_by_user.full_name || workbook.created_by_user.username}</span>
                    )}
                    {workbook.createdAt && (
                      <span>생성일: {new Date(workbook.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* 진도율 표시 */}
                  {(() => {
                    const progress = workbook.id ? getWorkbookProgress(workbook.id) : undefined;
                    if (progress && progress.totalProblems > 0) {
                      return (
                        <div className="mt-3">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-gray-600">진도율</span>
                            <span className="text-gray-700 font-medium">
                              {progress.solvedProblems}/{progress.totalProblems} ({progress.progressPercentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                progress.progressPercentage >= 100
                                  ? 'bg-green-500'
                                  : progress.progressPercentage >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/workbooks/${workbook.id}`}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300"
                  >
                    상세보기
                  </Link>
                  
                  {onEdit && (
                    <button
                      onClick={() => onEdit(workbook)}
                      className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-300"
                    >
                      수정
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(workbook)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && !loading && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            전체 {totalCount}개 문제집 중 {(filters.page - 1) * filters.limit + 1}-{Math.min(filters.page * filters.limit, totalCount)}개 표시
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + Math.max(1, filters.page - 2);
              if (page > totalPages) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded-lg ${
                    page === filters.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};