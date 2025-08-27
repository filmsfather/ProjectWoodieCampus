import { Router } from 'express';
import { SolutionController } from '../controllers/solutionController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(AuthMiddleware.authenticateToken);

// 답안 제출
router.post('/', SolutionController.submitSolution);

// 사용자별 풀이 기록 조회
router.get('/', SolutionController.getUserSolutions);

// 특정 문제의 사용자 풀이 상태 확인
router.get('/status/:problemId', SolutionController.getUserProblemStatus);

// 문제집 진도 조회
router.get('/workbook/:workbookId/progress', SolutionController.getWorkbookProgress);

// 모든 문제집 진도 요약 조회
router.get('/workbooks/progress', SolutionController.getAllWorkbooksProgress);

export default router;