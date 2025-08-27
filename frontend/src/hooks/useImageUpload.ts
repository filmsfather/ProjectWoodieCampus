import { useState, useCallback } from 'react';
import { UploadApi, type ProcessedImage } from '../services/uploadApi';

interface UseImageUploadOptions {
  multiple?: boolean;
  maxFiles?: number;
  optimize?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  onSuccess?: (images: ProcessedImage[]) => void;
  onError?: (error: string) => void;
}

interface UseImageUploadReturn {
  uploadedImages: ProcessedImage[];
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  uploadFiles: (files: File[]) => Promise<ProcessedImage[]>;
  removeImage: (index: number) => Promise<void>;
  clearImages: () => void;
  error: string | null;
}

export const useImageUpload = (options: UseImageUploadOptions = {}): UseImageUploadReturn => {
  const {
    multiple = false,
    maxFiles = 5,
    optimize = true,
    quality = 85,
    maxWidth = 1920,
    maxHeight = 1080,
    onSuccess,
    onError,
  } = options;

  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: File[]): Promise<ProcessedImage[]> => {
    if (files.length === 0) return [];

    // 파일 개수 제한 확인
    const totalFiles = uploadedImages.length + files.length;
    if (totalFiles > maxFiles) {
      const errorMessage = `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`;
      setError(errorMessage);
      onError?.(errorMessage);
      return [];
    }

    // 단일 업로드 모드에서 여러 파일 선택 방지
    if (!multiple && files.length > 1) {
      const errorMessage = '한 번에 하나의 파일만 업로드할 수 있습니다';
      setError(errorMessage);
      onError?.(errorMessage);
      return [];
    }

    // 파일 검증
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = UploadApi.validateFile(file);
      if (!validation.valid) {
        const errorMessage = validation.error || '유효하지 않은 파일입니다';
        setError(errorMessage);
        onError?.(errorMessage);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return [];

    setIsUploading(true);
    setError(null);

    try {
      let results: ProcessedImage[] = [];

      if (multiple) {
        // 다중 업로드
        results = await UploadApi.uploadImages(validFiles, {
          optimize,
          quality,
          maxWidth,
          maxHeight,
        });
      } else {
        // 단일 업로드
        const result = await UploadApi.uploadImage(validFiles[0], {
          optimize,
          quality,
          maxWidth,
          maxHeight,
        });
        results = [result];
      }

      setUploadedImages(prev => [...prev, ...results]);
      onSuccess?.(results);
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다';
      setError(errorMessage);
      onError?.(errorMessage);
      return [];
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [uploadedImages.length, maxFiles, multiple, optimize, quality, maxWidth, maxHeight, onSuccess, onError]);

  const removeImage = useCallback(async (index: number): Promise<void> => {
    try {
      const image = uploadedImages[index];
      if (!image) return;

      await UploadApi.deleteImage(image.optimized.fileName);
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이미지 삭제에 실패했습니다';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [uploadedImages, onError]);

  const clearImages = useCallback(() => {
    setUploadedImages([]);
    setError(null);
    setUploadProgress({});
  }, []);

  return {
    uploadedImages,
    isUploading,
    uploadProgress,
    uploadFiles,
    removeImage,
    clearImages,
    error,
  };
};