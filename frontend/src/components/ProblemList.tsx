import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProblemApi, type Problem } from '../services/problemApi';

interface ProblemListProps {
  onEdit?: (problem: Problem) => void;
  onDelete?: (problem: Problem) => void;
  className?: string;
}

interface FilterState {
  subject: string;
  difficulty: string;
  topic: string;
  search: string;
  page: number;
  limit: number;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  onEdit,
  onDelete,
  className = '',
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    subject: '',
    difficulty: '',
    topic: '',
    search: '',
    page: 1,
    limit: 10,
  });

  // 문제 목록 조회
  const loadProblems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ProblemApi.getProblems({
        page: filters.page,
        limit: filters.limit,
        subject: filters.subject || undefined,
        difficulty: filters.difficulty || undefined,
        topic: filters.topic || undefined,
      });

      setProblems(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, [filters.subject, filters.difficulty, filters.topic, filters.search]);

  // 문제 목록 로드
  useEffect(() => {
    loadProblems();
  }, [filters.page, filters.limit, filters.subject, filters.difficulty, filters.topic]);

  // 검색 (debounce 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.trim()) {
        // TODO: 검색 기능 구현 (백엔드 API 확장 필요)
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // 문제 삭제
  const handleDelete = async (problem: Problem) => {
    if (!problem.id) return;
    
    const confirmed = window.confirm(`"${problem.title}" 문제를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await ProblemApi.deleteProblem(problem.id);
      await loadProblems(); // 목록 새로고침
      onDelete?.(problem);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제 삭제에 실패했습니다');
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className={`problem-list ${className}`}>
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
              문제 목록
            </h2>
            <Link
              to="/problems/create"
              className="transition-all duration-200 hover:scale-105"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
              + 새 문제 만들기
            </Link>
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label 
                htmlFor="subject-filter" 
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}
              >
                과목
              </label>
              <select
                id="subject-filter"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
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
                <option value="수학">수학</option>
                <option value="영어">영어</option>
                <option value="국어">국어</option>
                <option value="과학">과학</option>
                <option value="사회">사회</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="difficulty-filter" 
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}
              >
                난이도
              </label>
              <select
                id="difficulty-filter"
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
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
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="topic-filter" 
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}
              >
                주제
              </label>
              <input
                type="text"
                id="topic-filter"
                value={filters.topic}
                onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
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
                placeholder="주제 검색"
              />
            </div>

            <div>
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
                placeholder="제목 또는 내용 검색"
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
              borderBottom: '2px solid #3b82f6'
            }}
          ></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>
            문제 목록을 불러오는 중...
          </p>
        </div>
      )}

      {/* 문제 목록 */}
      {!loading && problems.length === 0 ? (
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
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📝</div>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: 'var(--font-size-lg)',
              marginBottom: 'var(--space-6)'
            }}>
              등록된 문제가 없습니다.
            </p>
            <Link
              to="/problems/create"
              className="transition-all duration-200 hover:scale-105"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                fontWeight: '500',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              첫 번째 문제 만들기
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {problems.map((problem) => (
            <div 
              key={problem.id} 
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
                      {problem.title}
                    </h3>
                    <span 
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#1d4ed8',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '500',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {ProblemApi.getProblemTypeName(problem.problemType)}
                    </span>
                    <span 
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        backgroundColor: problem.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.1)' :
                                         problem.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.1)' :
                                         'rgba(239, 68, 68, 0.1)',
                        color: problem.difficulty === 'easy' ? '#059669' :
                               problem.difficulty === 'medium' ? '#d97706' :
                               '#dc2626',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '500',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {ProblemApi.getDifficultyName(problem.difficulty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <span>과목: {problem.subject}</span>
                    {problem.topic && <span>주제: {problem.topic}</span>}
                    <span>배점: {problem.points}점</span>
                  </div>

                  <p className="line-clamp-2" style={{ 
                    color: 'var(--color-text-primary)', 
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: '1.5'
                  }}>
                    {problem.content}
                  </p>

                  {problem.imageUrl && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <img
                        src={problem.imageUrl}
                        alt="문제 이미지"
                        style={{
                          width: '128px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-light)'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2" style={{ marginLeft: 'var(--space-4)' }}>
                  <Link
                    to={`/problems/solve/${problem.id}`}
                    className="transition-all duration-200 hover:scale-105"
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      fontWeight: '500',
                      fontSize: 'var(--font-size-sm)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      display: 'inline-block',
                      border: 'none'
                    }}
                  >
                    문제 풀기
                  </Link>
                  
                  {onEdit && (
                    <button
                      onClick={() => onEdit(problem)}
                      className="transition-all duration-200 hover:scale-105"
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#2563eb',
                        fontWeight: '500',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        cursor: 'pointer'
                      }}
                    >
                      수정
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(problem)}
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
            전체 {totalCount}개 문제 중 {(filters.page - 1) * filters.limit + 1}-{Math.min(filters.page * filters.limit, totalCount)}개 표시
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
                      ? '#3b82f6' 
                      : 'rgba(255,255,255,0.8)',
                    color: page === filters.page 
                      ? 'white' 
                      : 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    border: page === filters.page 
                      ? '1px solid #3b82f6' 
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