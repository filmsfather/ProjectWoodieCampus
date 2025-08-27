import React from 'react';
import { type Problem } from '../services/problemApi';

interface ProblemPreviewProps {
  problem: Partial<Problem>;
  className?: string;
}

export const ProblemPreview: React.FC<ProblemPreviewProps> = ({
  problem,
  className = '',
}) => {
  if (!problem.title || !problem.content) {
    return (
      <div className={`problem-preview ${className}`}>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <p>문제 제목과 내용을 입력하면 미리보기가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  const renderChoices = () => {
    if (!problem.choices || problem.choices.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="space-y-3">
          {problem.choices.map((choice, index) => {
            if (!choice.trim()) return null;
            
            const isCorrect = choice === problem.answer;
            const choiceLetter = String.fromCharCode(65 + index);
            
            return (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg border transition-colors ${
                  isCorrect 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium ${
                  isCorrect 
                    ? 'border-green-500 bg-green-100 text-green-700' 
                    : 'border-gray-300 bg-white text-gray-600'
                }`}>
                  {choiceLetter}
                </div>
                <span className={isCorrect ? 'text-green-800 font-medium' : 'text-gray-800'}>
                  {choice}
                </span>
                {isCorrect && (
                  <span className="ml-auto text-green-600 text-sm">✓ 정답</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrueFalse = () => {
    if (problem.problemType !== 'true_false') return null;

    const isTrue = problem.answer === '참' || problem.answer === 'true' || problem.answer === 'True';
    const isFalse = problem.answer === '거짓' || problem.answer === 'false' || problem.answer === 'False';

    return (
      <div className="mt-6">
        <div className="space-y-3">
          <div className={`flex items-center p-3 rounded-lg border transition-colors ${
            isTrue 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium ${
              isTrue 
                ? 'border-green-500 bg-green-100 text-green-700' 
                : 'border-gray-300 bg-white text-gray-600'
            }`}>
              O
            </div>
            <span className={isTrue ? 'text-green-800 font-medium' : 'text-gray-800'}>
              참 (True)
            </span>
            {isTrue && (
              <span className="ml-auto text-green-600 text-sm">✓ 정답</span>
            )}
          </div>

          <div className={`flex items-center p-3 rounded-lg border transition-colors ${
            isFalse 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium ${
              isFalse 
                ? 'border-green-500 bg-green-100 text-green-700' 
                : 'border-gray-300 bg-white text-gray-600'
            }`}>
              X
            </div>
            <span className={isFalse ? 'text-green-800 font-medium' : 'text-gray-800'}>
              거짓 (False)
            </span>
            {isFalse && (
              <span className="ml-auto text-green-600 text-sm">✓ 정답</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShortAnswer = () => {
    if (problem.problemType !== 'short_answer' && problem.problemType !== 'fill_blank') {
      return null;
    }

    return (
      <div className="mt-6">
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">답안 작성란:</div>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            placeholder="여기에 답을 입력하세요..."
            disabled
          />
          {problem.answer && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-600 font-medium mb-1">정답:</div>
              <div className="text-green-800">{problem.answer}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getDifficultyBadge = () => {
    if (!problem.difficulty) return null;

    const difficultyConfig = {
      easy: { label: '쉬움', color: 'bg-green-100 text-green-800' },
      medium: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
      hard: { label: '어려움', color: 'bg-red-100 text-red-800' },
    };

    const config = difficultyConfig[problem.difficulty];
    if (!config) return null;

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getProblemTypeBadge = () => {
    if (!problem.problemType) return null;

    const typeConfig = {
      multiple_choice: '객관식',
      short_answer: '단답형',
      true_false: '참/거짓',
      fill_blank: '빈칸 채우기',
    };

    const label = typeConfig[problem.problemType];
    if (!label) return null;

    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        {label}
      </span>
    );
  };

  return (
    <div className={`problem-preview bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{problem.title}</h3>
            {getProblemTypeBadge()}
            {getDifficultyBadge()}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {problem.subject && <span>과목: {problem.subject}</span>}
            {problem.topic && <span>주제: {problem.topic}</span>}
            {problem.points && <span>배점: {problem.points}점</span>}
          </div>
        </div>
      </div>

      {/* 문제 내용 */}
      <div className="mb-6">
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
          {problem.content}
        </div>
      </div>

      {/* 이미지 */}
      {problem.imageUrl && (
        <div className="mb-6">
          <img
            src={problem.imageUrl}
            alt="문제 이미지"
            className="max-w-full h-auto rounded-lg border border-gray-200"
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}

      {/* 문제 유형별 답안 영역 */}
      {problem.problemType === 'multiple_choice' && renderChoices()}
      {problem.problemType === 'true_false' && renderTrueFalse()}
      {(problem.problemType === 'short_answer' || problem.problemType === 'fill_blank') && renderShortAnswer()}

      {/* 해설 */}
      {problem.explanation && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">💡</span>
            </div>
            <h4 className="font-medium text-gray-900">해설</h4>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed pl-8">
            {problem.explanation}
          </div>
        </div>
      )}

      {/* 미리보기 표시 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          📱 미리보기 모드 - 실제 문제 풀이 화면과 유사합니다
        </div>
      </div>
    </div>
  );
};