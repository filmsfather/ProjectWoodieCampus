import React, { useState, useEffect } from 'react';
import { ProblemApi, type Problem } from '../services/problemApi';
import { WorkbookApi, type Workbook } from '../services/workbookApi';

interface WorkbookEditorProps {
  workbook: Workbook;
  onUpdate?: () => void;
}

interface ProblemWithOrder extends Problem {
  order?: number;
  workbookProblemId?: string;
}

export const WorkbookEditor: React.FC<WorkbookEditorProps> = ({
  workbook,
  onUpdate,
}) => {
  const [workbookProblems, setWorkbookProblems] = useState<ProblemWithOrder[]>([]);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 문제집의 문제들 로드
  const loadWorkbookProblems = async () => {
    if (!workbook.id) return;

    try {
      const workbookWithProblems = await WorkbookApi.getWorkbookWithProblems(workbook.id);
      
      if (workbookWithProblems.problems) {
        const problemsWithOrder: ProblemWithOrder[] = workbookWithProblems.problems.map((wp: any) => ({
          ...wp.problem,
          order: wp.order_index,
          workbookProblemId: wp.id,
        }));
        setWorkbookProblems(problemsWithOrder);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제집 정보를 불러올 수 없습니다');
    }
  };

  // 사용 가능한 문제들 로드
  const loadAvailableProblems = async () => {
    try {
      setLoading(true);
      const response = await ProblemApi.getProblems({
        page: 1,
        limit: 50,
        subject: selectedSubject || undefined,
      });

      // 이미 문제집에 포함된 문제들을 제외
      const workbookProblemIds = workbookProblems.map(p => p.id);
      const filtered = response.data.filter(p => !workbookProblemIds.includes(p.id));
      setAvailableProblems(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadWorkbookProblems();
  }, [workbook.id]);

  useEffect(() => {
    loadAvailableProblems();
  }, [workbookProblems, selectedSubject]);

  // 검색 필터링
  const filteredAvailableProblems = availableProblems.filter(problem =>
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    problem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (problem.topic && problem.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 문제를 문제집에 추가
  const handleAddProblem = async (problem: Problem) => {
    if (!workbook.id) return;

    try {
      await WorkbookApi.addProblemToWorkbook(workbook.id, problem.id!);
      await loadWorkbookProblems();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제를 추가할 수 없습니다');
    }
  };

  // 문제를 문제집에서 제거
  const handleRemoveProblem = async (problem: ProblemWithOrder) => {
    if (!workbook.id || !problem.id) return;

    const confirmed = window.confirm(`"${problem.title}" 문제를 문제집에서 제거하시겠습니까?`);
    if (!confirmed) return;

    try {
      await WorkbookApi.removeProblemFromWorkbook(workbook.id, problem.id);
      await loadWorkbookProblems();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제를 제거할 수 없습니다');
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex || !workbook.id) return;

    try {
      const newOrder = [...workbookProblems];
      const draggedItem = newOrder[draggedIndex];
      
      // 배열에서 드래그된 항목 제거
      newOrder.splice(draggedIndex, 1);
      // 새 위치에 삽입
      newOrder.splice(dropIndex, 0, draggedItem);

      // 순서 업데이트
      const problemOrders = newOrder.map((problem, index) => ({
        problemId: problem.id!,
        order: index + 1,
      }));

      await WorkbookApi.reorderWorkbookProblems(workbook.id, problemOrders);
      setWorkbookProblems(newOrder.map((p, i) => ({ ...p, order: i + 1 })));
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제 순서를 변경할 수 없습니다');
    }

    setDraggedIndex(null);
  };

  return (
    <div className="workbook-editor">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 문제집에 포함된 문제들 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            문제집 문제 ({workbookProblems.length}개)
          </h3>

          {workbookProblems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>문제집에 문제가 없습니다.</p>
              <p className="text-sm">오른쪽에서 문제를 선택해서 추가하세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workbookProblems.map((problem, index) => (
                <div
                  key={problem.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-4 border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-600">#{problem.order}</span>
                        <h4 className="font-medium text-gray-900">{problem.title}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>과목: {problem.subject}</span>
                        {problem.topic && <span>주제: {problem.topic}</span>}
                        <span>난이도: {problem.difficulty}</span>
                        <span>배점: {problem.points}점</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-gray-400 cursor-move">⋮⋮</span>
                      <button
                        onClick={() => handleRemoveProblem(problem)}
                        className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 사용 가능한 문제들 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            문제 추가
          </h3>

          {/* 검색 및 필터 */}
          <div className="space-y-4 mb-4">
            <input
              type="text"
              placeholder="문제 제목, 과목, 주제로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체 과목</option>
              <option value="수학">수학</option>
              <option value="영어">영어</option>
              <option value="국어">국어</option>
              <option value="과학">과학</option>
              <option value="사회">사회</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">문제를 불러오는 중...</p>
            </div>
          ) : filteredAvailableProblems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>추가할 수 있는 문제가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAvailableProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{problem.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>과목: {problem.subject}</span>
                        {problem.topic && <span>주제: {problem.topic}</span>}
                        <span>난이도: {problem.difficulty}</span>
                        <span>배점: {problem.points}점</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddProblem(problem)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 도움말 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 문제집 편집 팁</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 문제를 드래그해서 순서를 변경할 수 있습니다</li>
          <li>• 검색과 필터를 사용해 원하는 문제를 빠르게 찾으세요</li>
          <li>• 문제집의 상태가 '배포됨'일 때 학생들이 풀 수 있습니다</li>
          <li>• 문제 순서는 실제 출제 순서와 동일합니다</li>
        </ul>
      </div>
    </div>
  );
};