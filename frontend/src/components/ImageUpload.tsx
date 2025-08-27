import React, { useState, useRef, useCallback } from 'react';
import { UploadApi, type ProcessedImage } from '../services/uploadApi';

interface ImageUploadProps {
  onUpload?: (images: ProcessedImage[]) => void;
  onError?: (error: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onError,
  multiple = false,
  maxFiles = 5,
  className = '',
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    handleFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // 파일 개수 제한 확인
    const totalFiles = uploadedImages.length + files.length;
    if (totalFiles > maxFiles) {
      onError?.(files.length > 1 
        ? `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`
        : `이미 ${uploadedImages.length}개의 파일이 업로드되어 있습니다`
      );
      return;
    }

    // 단일 업로드 모드에서 여러 파일 선택 방지
    if (!multiple && files.length > 1) {
      onError?.('한 번에 하나의 파일만 업로드할 수 있습니다');
      return;
    }

    // 파일 검증
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = UploadApi.validateFile(file);
      if (!validation.valid) {
        onError?.(validation.error || '유효하지 않은 파일입니다');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // 업로드 진행 상태 초기화
    const initialProgress = validFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadProgress(prev => [...prev, ...initialProgress]);

    // 파일별로 업로드 진행
    const uploadPromises = validFiles.map(async (file) => {
      try {
        // 업로드 시작
        setUploadProgress(prev => 
          prev.map(p => 
            p.fileName === file.name 
              ? { ...p, progress: 10, status: 'uploading' }
              : p
          )
        );

        const result = await UploadApi.uploadImage(file, {
          optimize: true,
          quality: 85,
          maxWidth: 1920,
          maxHeight: 1080,
        });

        // 업로드 완료
        setUploadProgress(prev => 
          prev.map(p => 
            p.fileName === file.name 
              ? { ...p, progress: 100, status: 'completed' }
              : p
          )
        );

        return result;
      } catch (error) {
        // 업로드 실패
        const errorMessage = error instanceof Error ? error.message : '업로드 실패';
        setUploadProgress(prev => 
          prev.map(p => 
            p.fileName === file.name 
              ? { ...p, progress: 0, status: 'error', error: errorMessage }
              : p
          )
        );
        onError?.(errorMessage);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result): result is ProcessedImage => 
        result !== null
      );

      if (successfulUploads.length > 0) {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
        onUpload?.(successfulUploads);
      }

      // 진행 상태 정리 (3초 후)
      setTimeout(() => {
        setUploadProgress(prev => 
          prev.filter(p => validFiles.every(f => f.name !== p.fileName))
        );
      }, 3000);

    } catch (error) {
      onError?.(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다');
    }
  }, [uploadedImages.length, maxFiles, multiple, onUpload, onError]);

  const handleRemoveImage = useCallback(async (image: ProcessedImage, index: number) => {
    try {
      await UploadApi.deleteImage(image.optimized.fileName);
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '이미지 삭제에 실패했습니다');
    }
  }, [onError]);

  const handleClickUpload = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={`image-upload ${className}`}>
      {/* 드롭 영역 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragOver ? '파일을 놓아주세요' : '이미지 파일을 드래그하거나 클릭해서 업로드'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              JPG, PNG, GIF, WebP (최대 10MB)
              {multiple && ` • 최대 ${maxFiles}개 파일`}
            </p>
          </div>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* 업로드 진행 상태 */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadProgress.map((progress) => (
            <div key={progress.fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {progress.fileName}
                </span>
                <span className="text-sm text-gray-500">
                  {progress.status === 'uploading' && `${progress.progress}%`}
                  {progress.status === 'completed' && '완료'}
                  {progress.status === 'error' && '실패'}
                </span>
              </div>
              
              {progress.status !== 'error' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}
              
              {progress.status === 'error' && progress.error && (
                <p className="text-sm text-red-600 mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 이미지 미리보기 */}
      {uploadedImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">업로드된 이미지</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={image.optimized.fileName} className="relative group">
                <img
                  src={image.thumbnail?.publicUrl || image.optimized.publicUrl}
                  alt={`업로드된 이미지 ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(image, index);
                  }}
                  className="
                    absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 
                    flex items-center justify-center text-xs opacity-0 group-hover:opacity-100
                    transition-opacity hover:bg-red-600
                  "
                  title="이미지 삭제"
                >
                  ×
                </button>
                
                {/* 파일 크기 정보 */}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {UploadApi.formatFileSize(image.optimized.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};