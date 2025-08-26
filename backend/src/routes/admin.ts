import express from 'express';
import { AdminController } from '../controllers/adminController';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { SecurityMiddleware } from '../middleware/securityMiddleware';

const router = express.Router();

// 모든 관리자 라우트에 인증 및 관리자 권한 필요
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.requireAdmin);

// 사용자 관리 API
// GET /api/admin/users - 사용자 목록 조회
router.get('/users', AdminController.getUsers);

// POST /api/admin/users - 새 사용자 생성
router.post('/users', SecurityMiddleware.registerRateLimit, AdminController.createUser);

// PUT /api/admin/users/:id/role - 사용자 역할 변경
router.put('/users/:id/role', AdminController.updateUserRole);

// DELETE /api/admin/users/:id - 사용자 계정 삭제 (soft delete)
router.delete('/users/:id', AdminController.deleteUser);

// PUT /api/admin/users/:id/activate - 사용자 계정 활성화
router.put('/users/:id/activate', AdminController.activateUser);

// POST /api/admin/users/:id/reset-password - 사용자 비밀번호 재설정
router.post('/users/:id/reset-password', 
  SecurityMiddleware.passwordChangeRateLimit,
  AdminController.resetUserPassword
);

export default router;