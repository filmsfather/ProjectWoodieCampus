import React, { useState } from 'react';
import { ProblemPreview } from './ProblemPreview';
import { type Problem } from '../services/problemApi';

interface ProblemPreviewModalProps {
  problem: Partial<Problem>;
  isOpen: boolean;
  onClose: () => void;
}

export const ProblemPreviewModal: React.FC<ProblemPreviewModalProps> = ({
  problem,
  isOpen,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">문제 미리보기</h2>
              
              {/* 뷰 모드 전환 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🖥️ 데스크톱
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📱 모바일
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 모달 본문 */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {viewMode === 'desktop' ? (
              <div className="p-6">
                <ProblemPreview problem={problem} />
              </div>
            ) : (
              <div className="bg-gray-100 p-4">
                {/* 모바일 시뮬레이션 컨테이너 */}
                <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-lg overflow-hidden" style={{ aspectRatio: '9/16' }}>
                  {/* 모바일 상단바 시뮬레이션 */}
                  <div className="bg-gray-900 text-white p-3 text-center text-sm font-medium">
                    📚 Woodie Campus - 문제 풀이
                  </div>
                  
                  {/* 모바일 미리보기 내용 */}
                  <div className="p-4 h-full overflow-y-auto text-sm">
                    <ProblemPreview 
                      problem={problem} 
                      className="border-0 p-0 text-sm" 
                    />
                  </div>
                </div>
                
                <div className="text-center mt-4 text-sm text-gray-600">
                  📱 모바일 화면에서의 표시 상태
                </div>
              </div>
            )}
          </div>
          
          {/* 모달 푸터 */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              💡 실제 출제 화면과 동일하게 표시됩니다
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};