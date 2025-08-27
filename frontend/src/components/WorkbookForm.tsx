import React, { useState, useEffect } from 'react';
import { WorkbookApi, type Workbook, type CreateWorkbookRequest } from '../services/workbookApi';

interface WorkbookFormProps {
  initialData?: Workbook;
  onSubmit?: (workbook: Workbook) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  className?: string;
}

export const WorkbookForm: React.FC<WorkbookFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  className = '',
}) => {
  const [formData, setFormData] = useState<CreateWorkbookRequest>({
    title: '',
    description: '',
    status: 'draft',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'draft',
      });
    }
  }, [initialData]);

  // 폼 검증
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return '제목을 입력해주세요';
    if (formData.title.trim().length < 2) return '제목은 최소 2글자 이상 입력해주세요';
    if (formData.title.trim().length > 100) return '제목은 최대 100글자까지 입력 가능합니다';
    if (formData.description && formData.description.length > 500) return '설명은 최대 500글자까지 입력 가능합니다';
    
    return null;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: CreateWorkbookRequest = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        status: formData.status,
      };

      let result: Workbook;
      if (isEditing && initialData?.id) {
        result = await WorkbookApi.updateWorkbook(initialData.id, submitData);
      } else {
        result = await WorkbookApi.createWorkbook(submitData);
      }

      onSubmit?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제집 저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`workbook-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="문제집 제목을 입력하세요"
              maxLength={100}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100자
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              상태 *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Workbook['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="draft">임시 저장</option>
              <option value="published">배포됨</option>
              <option value="archived">보관됨</option>
            </select>
            <div className="mt-1 text-xs text-gray-500">
              • 임시 저장: 작업 중인 문제집
              <br />
              • 배포됨: 학생들이 풀 수 있는 문제집
              <br />
              • 보관됨: 더 이상 사용하지 않는 문제집
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="문제집에 대한 설명을 입력하세요"
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500">
            {(formData.description || '').length}/500자
          </div>
        </div>

        {/* 도움말 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 문제집 생성 팁</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 명확하고 구체적인 제목을 사용하세요</li>
            <li>• 설명에는 문제집의 목적과 대상 학년을 포함하세요</li>
            <li>• 임시 저장으로 시작해서 문제를 추가한 후 배포하세요</li>
            <li>• 문제집 생성 후 문제를 추가하고 순서를 조정할 수 있습니다</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : (isEditing ? '수정' : '생성')}
          </button>
        </div>
      </form>
    </div>
  );
};