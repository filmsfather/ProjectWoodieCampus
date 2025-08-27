import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemForm } from '../components/ProblemForm';
import { type Problem } from '../services/problemApi';

export const CreateProblemPage: React.FC = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSuccess = (problem: Problem) => {
    setNotification({
      type: 'success',
      message: `문제 "${problem.title}"가 성공적으로 생성되었습니다!`,
    });

    // 3초 후 문제 목록으로 이동
    setTimeout(() => {
      navigate('/problems');
    }, 3000);
  };

  const handleCancel = () => {
    navigate('/problems');
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">새 문제 만들기</h1>
            <p className="text-gray-600 mt-2">
              다양한 유형의 문제를 생성하고 관리할 수 있습니다.
            </p>
          </div>
          
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 문제 목록으로
          </button>
        </div>
      </div>

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
          
          {notification.type === 'success' && (
            <div className="mt-2 text-sm text-green-600">
              잠시 후 문제 목록 페이지로 이동합니다...
            </div>
          )}
        </div>
      )}

      {/* 문제 생성 폼 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProblemForm
          onSubmit={handleSuccess}
          onCancel={handleCancel}
          isEditing={false}
        />
      </div>

      {/* 도움말 */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">문제 생성 도움말</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">문제 유형별 특징:</h4>
            <ul className="space-y-1">
              <li>• <strong>객관식:</strong> 2개 이상의 선택지 필요</li>
              <li>• <strong>단답형:</strong> 간단한 텍스트 정답</li>
              <li>• <strong>참/거짓:</strong> 참 또는 거짓 중 선택</li>
              <li>• <strong>빈칸 채우기:</strong> 핵심 단어나 구문</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">작성 팁:</h4>
            <ul className="space-y-1">
              <li>• 명확하고 간결한 문제 제목 작성</li>
              <li>• 적절한 난이도와 배점 설정</li>
              <li>• 상세한 해설로 학습 효과 증대</li>
              <li>• 이미지 활용으로 이해도 향상</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};