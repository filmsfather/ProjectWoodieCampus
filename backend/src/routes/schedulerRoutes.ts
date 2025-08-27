import { Router } from 'express';
import { SchedulerController } from '../controllers/schedulerController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 스케줄러 상태 조회 (관리자만)
router.get('/status', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, SchedulerController.getStatus);

// 수동 작업 실행 (관리자만)
router.post('/run/:taskName', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, SchedulerController.runTask);

// 시스템 메트릭 조회 (관리자만)
router.get('/metrics', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, SchedulerController.getSystemMetrics);

export default router;