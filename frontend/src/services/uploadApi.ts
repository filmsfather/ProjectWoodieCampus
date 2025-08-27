import { config } from '../config';

export interface UploadResponse {
  success: boolean;
  data?: any;
  message: string;
}

export interface ProcessedImage {
  original: {
    fileName: string;
    filePath: string;
    publicUrl: string;
    size: number;
  };
  optimized: {
    fileName: string;
    filePath: string;
    publicUrl: string;
    size: number;
  };
  thumbnail?: {
    fileName: string;
    filePath: string;
    publicUrl: string;
    size: number;
  };
}

export class UploadApi {
  private static baseUrl = config.api.baseUrl;

  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // 단일 이미지 업로드
  static async uploadImage(
    file: File,
    options: {
      optimize?: boolean;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<ProcessedImage> {
    const {
      optimize = true,
      quality = 85,
      maxWidth = 1920,
      maxHeight = 1080,
    } = options;

    const formData = new FormData();
    formData.append('image', file);

    const queryParams = new URLSearchParams({
      optimize: optimize.toString(),
      quality: quality.toString(),
      maxWidth: maxWidth.toString(),
      maxHeight: maxHeight.toString(),
    });

    const response = await fetch(
      `${this.baseUrl}/upload/image?${queryParams}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData,
      }
    );

    const result: UploadResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '이미지 업로드에 실패했습니다');
    }

    return result.data;
  }

  // 다중 이미지 업로드
  static async uploadImages(
    files: File[],
    options: {
      optimize?: boolean;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<ProcessedImage[]> {
    const {
      optimize = true,
      quality = 85,
      maxWidth = 1920,
      maxHeight = 1080,
    } = options;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const queryParams = new URLSearchParams({
      optimize: optimize.toString(),
      quality: quality.toString(),
      maxWidth: maxWidth.toString(),
      maxHeight: maxHeight.toString(),
    });

    const response = await fetch(
      `${this.baseUrl}/upload/images?${queryParams}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData,
      }
    );

    const result: UploadResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '이미지 업로드에 실패했습니다');
    }

    return result.data.images;
  }

  // 이미지 삭제
  static async deleteImage(fileName: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/upload/${fileName}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    const result: UploadResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '이미지 삭제에 실패했습니다');
    }
  }

  // 파일 검증
  static validateFile(file: File): { valid: boolean; error?: string } {
    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: '파일 크기가 10MB를 초과합니다' };
    }

    // 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'JPG, PNG, GIF, WebP 형식만 업로드 가능합니다' };
    }

    return { valid: true };
  }

  // 파일 크기를 사람이 읽을 수 있는 형식으로 변환
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}