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

// =================== 반 관리 API (관리자 전용) ===================

// 반 관리 API
// GET /api/admin/classes - 모든 반 목록 조회
router.get('/classes', AdminController.getAllClasses);

// POST /api/admin/classes - 새 반 생성
router.post('/classes', AdminController.createClass);

// PUT /api/admin/classes/:id - 반 정보 수정
router.put('/classes/:id', AdminController.updateClass);

// DELETE /api/admin/classes/:id - 반 삭제
router.delete('/classes/:id', AdminController.deleteClass);

// 선생님-반 배정 관리 API
// GET /api/admin/classes/:classId/teachers - 반에 배정된 선생님 목록 조회
router.get('/classes/:classId/teachers', AdminController.getClassTeachers);

// POST /api/admin/teachers/:teacherId/classes/:classId - 선생님을 반에 배정
router.post('/teachers/:teacherId/classes/:classId', AdminController.assignTeacherToClass);

// DELETE /api/admin/teachers/:teacherId/classes/:classId - 선생님을 반에서 제거
router.delete('/teachers/:teacherId/classes/:classId', AdminController.removeTeacherFromClass);

// 학생-반 배정 관리 API
// POST /api/admin/classes/:classId/students/:studentId - 학생을 반에 배정
router.post('/classes/:classId/students/:studentId', AdminController.assignStudentToClass);

// DELETE /api/admin/classes/:classId/students/:studentId - 학생을 반에서 제거
router.delete('/classes/:classId/students/:studentId', AdminController.removeStudentFromClass);

export default router;