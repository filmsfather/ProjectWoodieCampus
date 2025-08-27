import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(AuthMiddleware.authenticateToken);

// 오늘의 복습 대상 조회
router.get('/today', ReviewController.getTodayReviewTargets);

// 우선순위 기반 복습 대상 조회
router.get('/priority', ReviewController.getReviewTargetsByPriority);

// 복습 진행률 조회
router.get('/progress', ReviewController.getReviewProgress);

// 일일 복습 통계 조회
router.get('/stats/daily', ReviewController.getDailyStats);

// 복습 효율성 분석
router.get('/efficiency', ReviewController.getEfficiencyAnalysis);

// 문제집 복습 대상 조회
router.get('/workbooks', ReviewController.getWorkbookReviewTargets);

// 복습 완료 처리
router.post('/complete/:recordId', ReviewController.completeReview);

// 문제집 복습 완료 처리
router.post('/workbooks/complete/:scheduleId', ReviewController.completeWorkbookReview);

export default router;