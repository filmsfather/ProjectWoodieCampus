import express from 'express';
import { UploadController } from '../controllers/uploadController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 모든 업로드 기능은 교사 이상 권한 필요
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.requireTeacher);

// POST /api/upload/image - 단일 이미지 업로드
router.post('/image', UploadController.uploadSingle, UploadController.uploadImage);

// POST /api/upload/images - 다중 이미지 업로드
router.post('/images', UploadController.uploadMultiple, UploadController.uploadImages);

// DELETE /api/upload/:fileName - 이미지 삭제
router.delete('/:fileName', UploadController.deleteImage);

export default router;