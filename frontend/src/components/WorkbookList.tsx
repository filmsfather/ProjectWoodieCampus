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
      <div className="mb-6">
        <div 
          className="transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: 'var(--color-text-primary)'
              }}
            >
              문제집 목록
            </h2>
            <Link
              to="/workbooks/create"
              className="transition-all duration-200 hover:scale-105"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
                color: 'white',
                fontWeight: '500',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              + 새 문제집 만들기
            </Link>
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label 
                htmlFor="status-filter" 
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}
              >
                상태
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full transition-all duration-200 focus:scale-[1.02]"
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  outline: 'none'
                }}
              >
                <option value="">전체</option>
                <option value="draft">임시 저장</option>
                <option value="published">배포됨</option>
                <option value="archived">보관됨</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label 
                htmlFor="search" 
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}
              >
                검색
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full transition-all duration-200 focus:scale-[1.02]"
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  outline: 'none'
                }}
                placeholder="문제집 제목 또는 설명 검색"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6">
          <div 
            className="transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255,255,255,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              color: '#dc2626',
              fontWeight: '500'
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div 
          className="text-center"
          style={{ padding: 'var(--space-8)' }}
        >
          <div 
            className="animate-spin rounded-full mx-auto mb-4"
            style={{
              height: '48px',
              width: '48px',
              border: '2px solid var(--color-neutral-200)',
              borderBottom: '2px solid #8b4513'
            }}
          ></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>
            문제집 목록을 불러오는 중...
          </p>
        </div>
      )}

      {/* 문제집 목록 */}
      {!loading && workbooks.length === 0 ? (
        <div 
          className="text-center"
          style={{ padding: 'var(--space-8)' }}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📚</div>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: 'var(--font-size-lg)',
              marginBottom: 'var(--space-6)'
            }}>
              등록된 문제집이 없습니다.
            </p>
            <Link
              to="/workbooks/create"
              className="transition-all duration-200 hover:scale-105"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
                color: 'white',
                fontWeight: '500',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              첫 번째 문제집 만들기
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {workbooks.map((workbook) => (
            <div 
              key={workbook.id} 
              className="group transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)'
                    }}>
                      {workbook.title}
                    </h3>
                    <span 
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        backgroundColor: workbook.status === 'published' ? 'rgba(34, 197, 94, 0.1)' :
                                         workbook.status === 'draft' ? 'rgba(245, 158, 11, 0.1)' :
                                         'rgba(107, 114, 128, 0.1)',
                        color: workbook.status === 'published' ? '#059669' :
                               workbook.status === 'draft' ? '#d97706' :
                               '#6b7280',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '500',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {WorkbookApi.getStatusName(workbook.status)}
                    </span>
                  </div>

                  {workbook.description && (
                    <p className="line-clamp-2 mb-3" style={{ 
                      color: 'var(--color-text-primary)', 
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: '1.5'
                    }}>
                      {workbook.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mb-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
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
                        <div style={{ marginTop: 'var(--space-3)' }}>
                          <div className="flex justify-between items-center mb-1" style={{
                            fontSize: 'var(--font-size-sm)'
                          }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>진도율</span>
                            <span style={{ 
                              color: 'var(--color-text-primary)', 
                              fontWeight: '500'
                            }}>
                              {progress.solvedProblems}/{progress.totalProblems} ({progress.progressPercentage}%)
                            </span>
                          </div>
                          <div 
                            className="w-full rounded-full"
                            style={{
                              height: '8px',
                              backgroundColor: 'var(--color-neutral-200)'
                            }}
                          >
                            <div
                              className="rounded-full transition-all duration-300"
                              style={{
                                height: '8px',
                                width: `${Math.min(progress.progressPercentage, 100)}%`,
                                background: progress.progressPercentage >= 100
                                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                  : progress.progressPercentage >= 50
                                  ? 'linear-gradient(135deg, #8b4513 0%, #654321 100%)'
                                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex items-center gap-2" style={{ marginLeft: 'var(--space-4)' }}>
                  <Link
                    to={`/workbooks/${workbook.id}`}
                    className="transition-all duration-200 hover:scale-105"
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      backgroundColor: 'rgba(139, 69, 19, 0.1)',
                      color: '#8b4513',
                      fontWeight: '500',
                      fontSize: 'var(--font-size-sm)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      border: '1px solid rgba(139, 69, 19, 0.2)'
                    }}
                  >
                    상세보기
                  </Link>
                  
                  {onEdit && (
                    <button
                      onClick={() => onEdit(workbook)}
                      className="transition-all duration-200 hover:scale-105"
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: '#059669',
                        fontWeight: '500',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        cursor: 'pointer'
                      }}
                    >
                      수정
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(workbook)}
                      className="transition-all duration-200 hover:scale-105"
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626',
                        fontWeight: '500',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        cursor: 'pointer'
                      }}
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
        <div 
          className="flex items-center justify-between"
          style={{ marginTop: 'var(--space-6)' }}
        >
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            전체 {totalCount}개 문제집 중 {(filters.page - 1) * filters.limit + 1}-{Math.min(filters.page * filters.limit, totalCount)}개 표시
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              className="transition-all duration-200"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
                opacity: filters.page <= 1 ? 0.5 : 1
              }}
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
                  className="transition-all duration-200"
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: page === filters.page 
                      ? '#8b4513' 
                      : 'rgba(255,255,255,0.8)',
                    color: page === filters.page 
                      ? 'white' 
                      : 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    border: page === filters.page 
                      ? '1px solid #8b4513' 
                      : '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    minWidth: '40px'
                  }}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="transition-all duration-200"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: filters.page >= totalPages ? 0.5 : 1
              }}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};