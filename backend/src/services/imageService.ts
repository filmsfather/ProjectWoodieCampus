import sharp from 'sharp';
import { supabase } from '../config/supabase';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  createThumbnail?: boolean;
  thumbnailSize?: number;
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

export class ImageService {
  static async processAndUploadImage(
    file: Express.Multer.File,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'webp',
      createThumbnail = true,
      thumbnailSize = 300,
    } = options;

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const baseFileName = `${timestamp}-${randomString}`;

    // 1. 원본 파일 업로드
    const originalFileName = `${baseFileName}-original.${this.getFileExtension(file.originalname)}`;
    const originalFilePath = `problem-images/${originalFileName}`;

    const { error: originalUploadError } = await supabase.storage
      .from('woodie-campus')
      .upload(originalFilePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (originalUploadError) {
      throw new Error(`원본 이미지 업로드 실패: ${originalUploadError.message}`);
    }

    // 2. 최적화된 이미지 생성 및 업로드
    const optimizedBuffer = await sharp(file.buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();

    const optimizedFileName = `${baseFileName}-optimized.${format}`;
    const optimizedFilePath = `problem-images/${optimizedFileName}`;
    
    const { error: optimizedUploadError } = await supabase.storage
      .from('woodie-campus')
      .upload(optimizedFilePath, optimizedBuffer, {
        contentType: `image/${format}`,
        cacheControl: '3600',
      });

    if (optimizedUploadError) {
      throw new Error(`최적화된 이미지 업로드 실패: ${optimizedUploadError.message}`);
    }

    // 3. 썸네일 생성 및 업로드 (선택적)
    let thumbnail;
    if (createThumbnail) {
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat(format, { quality: 70 })
        .toBuffer();

      const thumbnailFileName = `${baseFileName}-thumbnail.${format}`;
      const thumbnailFilePath = `problem-images/${thumbnailFileName}`;

      const { error: thumbnailUploadError } = await supabase.storage
        .from('woodie-campus')
        .upload(thumbnailFilePath, thumbnailBuffer, {
          contentType: `image/${format}`,
          cacheControl: '3600',
        });

      if (thumbnailUploadError) {
        console.warn('썸네일 업로드 실패:', thumbnailUploadError.message);
      } else {
        const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
          .from('woodie-campus')
          .getPublicUrl(thumbnailFilePath);

        thumbnail = {
          fileName: thumbnailFileName,
          filePath: thumbnailFilePath,
          publicUrl: thumbnailPublicUrl,
          size: thumbnailBuffer.length,
        };
      }
    }

    // 공개 URL 생성
    const { data: { publicUrl: originalPublicUrl } } = supabase.storage
      .from('woodie-campus')
      .getPublicUrl(originalFilePath);

    const { data: { publicUrl: optimizedPublicUrl } } = supabase.storage
      .from('woodie-campus')
      .getPublicUrl(optimizedFilePath);

    return {
      original: {
        fileName: originalFileName,
        filePath: originalFilePath,
        publicUrl: originalPublicUrl,
        size: file.size,
      },
      optimized: {
        fileName: optimizedFileName,
        filePath: optimizedFilePath,
        publicUrl: optimizedPublicUrl,
        size: optimizedBuffer.length,
      },
      thumbnail,
    };
  }

  static async processMultipleImages(
    files: Express.Multer.File[],
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const processPromises = files.map(file => this.processAndUploadImage(file, options));
    return Promise.all(processPromises);
  }

  static async deleteProcessedImage(processedImage: ProcessedImage): Promise<void> {
    const filesToDelete = [
      processedImage.original.filePath,
      processedImage.optimized.filePath,
    ];

    if (processedImage.thumbnail) {
      filesToDelete.push(processedImage.thumbnail.filePath);
    }

    const { error } = await supabase.storage
      .from('woodie-campus')
      .remove(filesToDelete);

    if (error) {
      throw new Error(`이미지 삭제 실패: ${error.message}`);
    }
  }

  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  // 이미지 정보 분석
  static async getImageInfo(buffer: Buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
      };
    } catch (error) {
      throw new Error(`이미지 정보 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 이미지 형식 변환
  static async convertImageFormat(
    buffer: Buffer, 
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 85
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .toFormat(targetFormat, { quality })
        .toBuffer();
    } catch (error) {
      throw new Error(`이미지 형식 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
}