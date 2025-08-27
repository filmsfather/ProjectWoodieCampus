import { Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase';
import { ApiResponse, AuthRequest } from '../types';
import { ImageService } from '../services/imageService';
import path from 'path';

// Multer 설정 (메모리 저장)
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 허용된 이미지 형식
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP만 업로드 가능합니다.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
});

export class UploadController {
  // 단일 이미지 업로드 미들웨어
  static uploadSingle = upload.single('image');

  // 다중 이미지 업로드 미들웨어 (최대 5개)
  static uploadMultiple = upload.array('images', 5);

  // POST /api/upload/image - 단일 이미지 업로드 (최적화 포함)
  static async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        const response: ApiResponse = {
          success: false,
          message: '업로드할 이미지 파일이 없습니다',
        };
        return res.status(400).json(response);
      }

      const file = req.file;
      const { optimize = 'true', quality = '85', maxWidth = '1920', maxHeight = '1080' } = req.query;

      if (optimize === 'true') {
        // 최적화된 업로드 사용
        const processedImage = await ImageService.processAndUploadImage(file, {
          maxWidth: parseInt(maxWidth as string),
          maxHeight: parseInt(maxHeight as string),
          quality: parseInt(quality as string),
          format: 'webp',
          createThumbnail: true,
        });

        const response: ApiResponse = {
          success: true,
          data: {
            ...processedImage,
            originalMimeType: file.mimetype,
            originalSize: file.size,
          },
          message: '이미지가 성공적으로 업로드되고 최적화되었습니다',
        };

        res.json(response);
      } else {
        // 기존 방식으로 원본만 업로드
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
        const filePath = `problem-images/${fileName}`;

        const { data, error } = await supabase.storage
          .from('woodie-campus')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw new Error(`업로드 실패: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('woodie-campus')
          .getPublicUrl(filePath);

        const response: ApiResponse = {
          success: true,
          data: {
            fileName,
            filePath,
            publicUrl,
            size: file.size,
            mimeType: file.mimetype,
          },
          message: '이미지가 성공적으로 업로드되었습니다',
        };

        res.json(response);
      }
    } catch (error) {
      console.error('Upload image error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/upload/images - 다중 이미지 업로드 (최적화 포함)
  static async uploadImages(req: AuthRequest, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: '업로드할 이미지 파일이 없습니다',
        };
        return res.status(400).json(response);
      }

      const { optimize = 'true', quality = '85', maxWidth = '1920', maxHeight = '1080' } = req.query;

      if (optimize === 'true') {
        // 최적화된 다중 업로드 사용
        const processedImages = await ImageService.processMultipleImages(files, {
          maxWidth: parseInt(maxWidth as string),
          maxHeight: parseInt(maxHeight as string),
          quality: parseInt(quality as string),
          format: 'webp',
          createThumbnail: true,
        });

        const response: ApiResponse = {
          success: true,
          data: {
            images: processedImages,
            count: processedImages.length,
          },
          message: `${processedImages.length}개의 이미지가 성공적으로 업로드되고 최적화되었습니다`,
        };

        res.json(response);
      } else {
        // 기존 방식으로 원본만 업로드
        const uploadPromises = files.map(async (file) => {
          const fileExt = path.extname(file.originalname);
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
          const filePath = `problem-images/${fileName}`;

          const { data, error } = await supabase.storage
            .from('woodie-campus')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            throw new Error(`파일 ${file.originalname} 업로드 실패: ${error.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('woodie-campus')
            .getPublicUrl(filePath);

          return {
            fileName,
            originalName: file.originalname,
            filePath,
            publicUrl,
            size: file.size,
            mimeType: file.mimetype,
          };
        });

        const uploadResults = await Promise.all(uploadPromises);

        const response: ApiResponse = {
          success: true,
          data: {
            images: uploadResults,
            count: uploadResults.length,
          },
          message: `${uploadResults.length}개의 이미지가 성공적으로 업로드되었습니다`,
        };

        res.json(response);
      }
    } catch (error) {
      console.error('Upload images error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/upload/:fileName - 이미지 삭제
  static async deleteImage(req: AuthRequest, res: Response) {
    try {
      const { fileName } = req.params;
      const filePath = `problem-images/${fileName}`;

      const { error } = await supabase.storage
        .from('woodie-campus')
        .remove([filePath]);

      if (error) {
        console.error('Supabase storage delete error:', error);
        const response: ApiResponse = {
          success: false,
          message: '이미지 삭제 중 오류가 발생했습니다',
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse = {
        success: true,
        message: '이미지가 성공적으로 삭제되었습니다',
      };

      res.json(response);
    } catch (error) {
      console.error('Delete image error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '이미지 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}