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
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">문제 목록</h2>
          <Link
            to="/problems/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            + 새 문제 만들기
          </Link>
        </div>

        {/* 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 mb-1">
              과목
            </label>
            <select
              id="subject-filter"
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-1">
              난이도
            </label>
            <select
              id="difficulty-filter"
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="easy">쉬움</option>
              <option value="medium">보통</option>
              <option value="hard">어려움</option>
            </select>
          </div>

          <div>
            <label htmlFor="topic-filter" className="block text-sm font-medium text-gray-700 mb-1">
              주제
            </label>
            <input
              type="text"
              id="topic-filter"
              value={filters.topic}
              onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="주제 검색"
            />
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="제목 또는 내용 검색"
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
          <p className="text-gray-600">문제 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 문제 목록 */}
      {!loading && problems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">등록된 문제가 없습니다.</p>
          <Link
            to="/problems/create"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            첫 번째 문제 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => (
            <div key={problem.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{problem.title}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {ProblemApi.getProblemTypeName(problem.problemType)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ProblemApi.getDifficultyName(problem.difficulty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>과목: {problem.subject}</span>
                    {problem.topic && <span>주제: {problem.topic}</span>}
                    <span>배점: {problem.points}점</span>
                  </div>

                  <p className="text-gray-700 line-clamp-2">{problem.content}</p>

                  {problem.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={problem.imageUrl}
                        alt="문제 이미지"
                        className="w-32 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(problem)}
                      className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300"
                    >
                      수정
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(problem)}
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
            전체 {totalCount}개 문제 중 {(filters.page - 1) * filters.limit + 1}-{Math.min(filters.page * filters.limit, totalCount)}개 표시
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