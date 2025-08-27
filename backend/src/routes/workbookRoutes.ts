import { Router } from 'express';
import { WorkbookController } from '../controllers/workbookController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 문제집 목록 조회 (모든 인증된 사용자)
router.get('/', WorkbookController.getWorkbooks);

// 문제집 상세 조회 (모든 인증된 사용자)
router.get('/:id', WorkbookController.getWorkbook);

// 문제집과 문제들 함께 조회 (모든 인증된 사용자)
router.get('/:id/problems', WorkbookController.getWorkbookWithProblems);

// 문제집 생성 (관리자, 교사만 가능)
router.post('/', requireRole(['admin', 'teacher']), WorkbookController.createWorkbook);

// 문제집 수정 (관리자, 교사만 가능 - 본인 문제집만)
router.put('/:id', requireRole(['admin', 'teacher']), WorkbookController.updateWorkbook);

// 문제집 삭제 (관리자, 교사만 가능 - 본인 문제집만)
router.delete('/:id', requireRole(['admin', 'teacher']), WorkbookController.deleteWorkbook);

// 문제집에 문제 추가 (관리자, 교사만 가능 - 본인 문제집만)
router.post('/:id/problems', requireRole(['admin', 'teacher']), WorkbookController.addProblemToWorkbook);

// 문제집에서 문제 제거 (관리자, 교사만 가능 - 본인 문제집만)
router.delete('/:id/problems/:problemId', requireRole(['admin', 'teacher']), WorkbookController.removeProblemFromWorkbook);

// 문제집 내 문제 순서 변경 (관리자, 교사만 가능 - 본인 문제집만)
router.patch('/:id/reorder', requireRole(['admin', 'teacher']), WorkbookController.reorderWorkbookProblems);

export default router;