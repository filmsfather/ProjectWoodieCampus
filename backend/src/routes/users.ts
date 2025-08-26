import express from 'express';
import { UserController } from '../controllers/userController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/users (관리자 전용)
router.get('/', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, UserController.getUsers);

// GET /api/users/profile (로그인한 사용자 프로필)
router.get('/profile', AuthMiddleware.authenticateToken, UserController.getUserProfile);

// POST /api/users (관리자 전용 - 새 사용자 생성)
router.post('/', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, UserController.createUser);

// PUT /api/users/:id (관리자/본인만)
router.put('/:id', AuthMiddleware.authenticateToken, AuthMiddleware.requireOwnerOrAdmin('id'), UserController.updateUser);

// DELETE /api/users/:id (관리자 전용)
router.delete('/:id', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, UserController.deleteUser);

export default router;