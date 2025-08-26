import express from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/register (관리자만 접근 가능)
router.post('/register', AuthMiddleware.authenticateToken, AuthMiddleware.requireAdmin, AuthController.register);

// POST /api/auth/logout
router.post('/logout', AuthMiddleware.authenticateToken, AuthController.logout);

// GET /api/auth/me
router.get('/me', AuthMiddleware.authenticateToken, AuthController.getCurrentUser);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /api/auth/change-password
router.post('/change-password', AuthMiddleware.authenticateToken, AuthController.changePassword);

export default router;