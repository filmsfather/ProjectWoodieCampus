import express from 'express';
import { ProblemController } from '../controllers/problemController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/problems (모든 인증된 사용자)
router.get('/', AuthMiddleware.authenticateToken, ProblemController.getProblems);

// GET /api/problems/:id (모든 인증된 사용자)
router.get('/:id', AuthMiddleware.authenticateToken, ProblemController.getProblemById);

// POST /api/problems (교사, 관리자만)
router.post('/', AuthMiddleware.authenticateToken, AuthMiddleware.requireTeacher, ProblemController.createProblem);

// PUT /api/problems/:id (교사, 관리자만)
router.put('/:id', AuthMiddleware.authenticateToken, AuthMiddleware.requireTeacher, ProblemController.updateProblem);

// DELETE /api/problems/:id (관리자만)
router.delete('/:id', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, ProblemController.deleteProblem);

export default router;