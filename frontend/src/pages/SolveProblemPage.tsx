import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProblemApi } from '../services/problemApi';
import { SolutionApi, type SolutionResult } from '../services/solutionApi';

interface Problem {
  id: string;
  title: string;
  content: string;
  answer?: string;
  explanation?: string;
  image_url?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic?: string;
  problem_type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  points: number;
  problem_set_id?: string;
}

const SolveProblemPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SolutionResult | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 타이머 업데이트
  useEffect(() => {
    if (!isSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeSpent(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime, isSubmitted]);

  // 문제 로드
  useEffect(() => {
    const loadProblem = async () => {
      if (!problemId) return;

      try {
        setLoading(true);
        const problemData = await ProblemApi.getProblem(problemId);
        // Convert API problem format to local interface
        const problem: Problem = {
          id: problemData.id || problemId,
          title: problemData.title,
          content: problemData.content,
          answer: problemData.answer,
          explanation: problemData.explanation,
          image_url: problemData.imageUrl,
          difficulty: problemData.difficulty,
          subject: problemData.subject,
          topic: problemData.topic,
          problem_type: problemData.problemType === 'fill_blank' ? 'short_answer' : problemData.problemType,
          points: problemData.points || 10,
          problem_set_id: undefined, // Will be set if needed
        };
        setProblem(problem);
        setStartTime(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : '문제를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [problemId]);

  // 시간 포맷팅 (초를 mm:ss 형태로)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 난이도 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 답안 제출
  const handleSubmit = async () => {
    if (!problem || !userAnswer.trim()) {
      alert('답안을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await SolutionApi.submitSolution({
        problemId: problem.id,
        userAnswer: userAnswer.trim(),
        timeSpent,
        problemSetId: problem.problem_set_id || undefined,
      });

      setSubmissionResult(result);
      setIsSubmitted(true);
      
      // 타이머 정지
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('답안 제출 실패:', error);
      alert(error instanceof Error ? error.message : '답안 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">문제를 불러올 수 없습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              to="/problems"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              문제 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">문제를 찾을 수 없습니다</p>
          <Link
            to="/problems"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            문제 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/problems"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← 문제 목록
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">소요 시간:</span>
                <span className="text-lg font-mono font-semibold text-blue-600">
                  {formatTime(timeSpent)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty === 'easy' ? '쉬움' : problem.difficulty === 'medium' ? '보통' : '어려움'}
              </span>
            </div>
          </div>
        </div>

        {/* 문제 내용 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{problem.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded">{problem.subject}</span>
              {problem.topic && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{problem.topic}</span>
              )}
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{problem.points}점</span>
            </div>
          </div>

          {/* 문제 이미지 */}
          {problem.image_url && (
            <div className="mb-6">
              <img
                src={problem.image_url}
                alt="문제 이미지"
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          {/* 문제 내용 */}
          <div className="prose max-w-none mb-6">
            <div
              className="text-gray-800 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: problem.content }}
            />
          </div>
        </div>

        {/* 답안 입력 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">답안 작성</h2>
          
          {problem.problem_type === 'multiple_choice' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">정답을 선택하세요:</p>
              {/* TODO: 객관식 선택지 구현 (임시로 텍스트 입력) */}
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="답안을 입력하세요..."
                disabled={isSubmitted}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={problem.problem_type === 'essay' ? 8 : 4}
                placeholder={
                  problem.problem_type === 'short_answer'
                    ? "간단한 답안을 입력하세요..."
                    : problem.problem_type === 'essay'
                    ? "자세한 답안을 작성하세요..."
                    : "답안을 입력하세요..."
                }
                disabled={isSubmitted}
              />
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || isSubmitted || isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '제출 중...' : isSubmitted ? '제출 완료' : '답안 제출'}
            </button>
            
            {!isSubmitted && (
              <button
                onClick={() => setUserAnswer('')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                답안 지우기
              </button>
            )}
          </div>

          {isSubmitted && submissionResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              submissionResult.isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {submissionResult.isCorrect ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${
                    submissionResult.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {submissionResult.feedback}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className={submissionResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                      소요 시간: {SolutionApi.formatTime(submissionResult.timeSpent)}
                    </p>
                    <p className={submissionResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                      시도 횟수: {submissionResult.attemptNumber}회
                    </p>
                    {submissionResult.masteryLevel > 0 && (
                      <p className={submissionResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                        숙련도: {submissionResult.masteryLevel}/10
                      </p>
                    )}
                  </div>
                  
                  {!submissionResult.isCorrect && submissionResult.correctAnswer && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 font-medium text-sm mb-1">정답:</p>
                      <p className="text-blue-700 text-sm">{submissionResult.correctAnswer}</p>
                    </div>
                  )}
                  
                  {submissionResult.explanation && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-gray-800 font-medium text-sm mb-1">해설:</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{submissionResult.explanation}</p>
                    </div>
                  )}
                  
                  {/* 추가 액션 버튼 */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to="/problems"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      문제 목록으로
                    </Link>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      다시 풀기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolveProblemPage;