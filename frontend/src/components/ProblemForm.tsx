import React, { useState, useEffect } from 'react';
import { ImageUpload } from './ImageUpload';
import { ProblemPreview } from './ProblemPreview';
import { ProblemPreviewModal } from './ProblemPreviewModal';
import { ProblemApi, type Problem, type CreateProblemRequest } from '../services/problemApi';
import { type ProcessedImage } from '../services/uploadApi';

interface ProblemFormProps {
  initialData?: Problem;
  onSubmit?: (problem: Problem) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  className?: string;
}

interface FormData extends Omit<CreateProblemRequest, 'choices'> {
  choices: string[];
}

const SUBJECTS = [
  '수학', '영어', '국어', '과학', '사회', '역사', '지리', '물리', '화학', '생물',
  '한국사', '세계사', '정치', '경제', '법학', '철학', '심리학', '컴퓨터과학', '기타'
];

const DIFFICULTIES: Array<{ value: Problem['difficulty']; label: string }> = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
];

const PROBLEM_TYPES: Array<{ value: Problem['problemType']; label: string }> = [
  { value: 'multiple_choice', label: '객관식' },
  { value: 'short_answer', label: '단답형' },
  { value: 'true_false', label: '참/거짓' },
  { value: 'fill_blank', label: '빈칸 채우기' },
];

export const ProblemForm: React.FC<ProblemFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  className = '',
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    answer: '',
    explanation: '',
    imageUrl: '',
    difficulty: 'medium',
    subject: '',
    topic: '',
    problemType: 'multiple_choice',
    points: 1,
    choices: ['', '', '', ''],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        answer: initialData.answer || '',
        explanation: initialData.explanation || '',
        imageUrl: initialData.imageUrl || '',
        difficulty: initialData.difficulty || 'medium',
        subject: initialData.subject || '',
        topic: initialData.topic || '',
        problemType: initialData.problemType || 'multiple_choice',
        points: initialData.points || 1,
        choices: initialData.choices || ['', '', '', ''],
      });
    }
  }, [initialData]);

  // 문제 유형 변경 시 기본값 설정
  const handleProblemTypeChange = (type: Problem['problemType']) => {
    const defaults = ProblemApi.getDefaultProblem(type);
    setFormData(prev => ({
      ...prev,
      problemType: type,
      choices: defaults.choices || [],
      points: defaults.points || prev.points,
    }));
  };

  // 선택지 변경
  const handleChoiceChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => i === index ? value : choice),
    }));
  };

  // 선택지 추가/삭제
  const addChoice = () => {
    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, ''],
    }));
  };

  const removeChoice = (index: number) => {
    if (formData.choices.length > 2) {
      setFormData(prev => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index),
      }));
    }
  };

  // 이미지 업로드 완료
  const handleImageUpload = (images: ProcessedImage[]) => {
    setUploadedImages(images);
    if (images.length > 0) {
      setFormData(prev => ({
        ...prev,
        imageUrl: images[0].optimized.publicUrl,
      }));
    }
  };

  // 폼 검증
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return '제목을 입력해주세요';
    if (!formData.content.trim()) return '문제 내용을 입력해주세요';
    if (!formData.subject.trim()) return '과목을 선택해주세요';
    
    if (formData.problemType === 'multiple_choice') {
      const validChoices = formData.choices.filter(choice => choice.trim());
      if (validChoices.length < 2) return '객관식은 최소 2개의 선택지가 필요합니다';
      if (!formData.answer?.trim()) return '정답을 입력해주세요';
    }
    
    if (formData.problemType === 'short_answer' || formData.problemType === 'fill_blank') {
      if (!formData.answer?.trim()) return '정답을 입력해주세요';
    }
    
    if (formData.problemType === 'true_false') {
      if (!formData.answer?.trim() || !['참', '거짓', 'true', 'false', 'True', 'False'].includes(formData.answer)) {
        return '참/거짓 문제는 정답을 "참" 또는 "거짓"으로 입력해주세요';
      }
    }

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
      const submitData: CreateProblemRequest = {
        ...formData,
        choices: formData.problemType === 'multiple_choice' || formData.problemType === 'true_false' 
          ? formData.choices.filter(choice => choice.trim()) 
          : undefined,
      };

      let result: Problem;
      if (isEditing && initialData?.id) {
        result = await ProblemApi.updateProblem(initialData.id, submitData);
      } else {
        result = await ProblemApi.createProblem(submitData);
      }

      onSubmit?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제 저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`problem-form ${className}`}>
      {/* 탭 헤더 */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            !showPreview 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          📝 문제 작성
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            showPreview 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          👁️ 미리보기
        </button>
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="px-4 py-2 font-medium text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          🔍 전체화면 미리보기
        </button>
      </div>

      {/* 미리보기 모드 */}
      {showPreview && (
        <div>
          <ProblemPreview 
            problem={{
              ...formData,
              choices: formData.problemType === 'multiple_choice' || formData.problemType === 'true_false' 
                ? formData.choices 
                : undefined,
            }} 
          />
          
          {/* 미리보기에서 저장 버튼 */}
          <div className="mt-6 flex justify-end gap-3">
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
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '저장 중...' : (isEditing ? '수정' : '생성')}
            </button>
          </div>
        </div>
      )}

      {/* 폼 작성 모드 */}
      {!showPreview && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="문제 제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              과목 *
            </label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">과목을 선택하세요</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              주제
            </label>
            <input
              type="text"
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="주제 또는 단원명"
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              난이도 *
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as Problem['difficulty'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {DIFFICULTIES.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="problemType" className="block text-sm font-medium text-gray-700 mb-1">
              문제 유형 *
            </label>
            <select
              id="problemType"
              value={formData.problemType}
              onChange={(e) => handleProblemTypeChange(e.target.value as Problem['problemType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {PROBLEM_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
              배점
            </label>
            <input
              type="number"
              id="points"
              value={formData.points}
              onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="10"
            />
          </div>
        </div>

        {/* 문제 내용 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            문제 내용 *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="문제 내용을 입력하세요"
            required
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            문제 이미지
          </label>
          <ImageUpload
            multiple={false}
            onUpload={handleImageUpload}
            onError={(error) => setError(error)}
            className="border rounded-lg p-4"
          />
        </div>

        {/* 문제 유형별 추가 입력 */}
        {(formData.problemType === 'multiple_choice' || formData.problemType === 'true_false') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                선택지 *
              </label>
              {formData.problemType === 'multiple_choice' && (
                <button
                  type="button"
                  onClick={addChoice}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + 선택지 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {formData.choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`선택지 ${index + 1}`}
                    disabled={formData.problemType === 'true_false'}
                  />
                  {formData.problemType === 'multiple_choice' && formData.choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 정답 */}
        <div>
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
            정답 *
          </label>
          {formData.problemType === 'multiple_choice' ? (
            <select
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">정답을 선택하세요</option>
              {formData.choices.map((choice, index) => (
                choice.trim() && (
                  <option key={index} value={choice}>
                    {String.fromCharCode(65 + index)}. {choice}
                  </option>
                )
              ))}
            </select>
          ) : formData.problemType === 'true_false' ? (
            <select
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">정답을 선택하세요</option>
              <option value="참">참</option>
              <option value="거짓">거짓</option>
            </select>
          ) : (
            <input
              type="text"
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="정답을 입력하세요"
              required
            />
          )}
        </div>

        {/* 해설 */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-1">
            해설
          </label>
          <textarea
            id="explanation"
            value={formData.explanation}
            onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="문제 해설을 입력하세요"
          />
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
      )}
      
      {/* 미리보기 모달 */}
      <ProblemPreviewModal
        problem={{
          ...formData,
          choices: formData.problemType === 'multiple_choice' || formData.problemType === 'true_false' 
            ? formData.choices 
            : undefined,
        }}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
};