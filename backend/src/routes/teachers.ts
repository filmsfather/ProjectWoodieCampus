import { Router } from 'express';
import { TeacherController } from '../controllers/teacherController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All teacher routes require authentication
router.use(authMiddleware);

// GET /api/teachers/classes - Get classes assigned to current teacher
router.get('/classes', TeacherController.getTeacherClasses);

// GET /api/teachers/:id/classes - Get classes assigned to specific teacher (admin only)
router.get('/:id/classes', TeacherController.getTeacherClassesById);

// 반 생성/수정/삭제는 관리자만 가능 - 해당 기능들을 admin.ts로 이동
// POST /api/teachers/classes - Create new class (REMOVED - admin only)
// router.post('/classes', TeacherController.createClass);

// PUT /api/teachers/classes/:id - Update class information (REMOVED - admin only)
// router.put('/classes/:id', TeacherController.updateClass);

// DELETE /api/teachers/classes/:id - Delete class (REMOVED - admin only)  
// router.delete('/classes/:id', TeacherController.deleteClass);

// POST /api/teachers/:teacherId/classes/:classId - Assign teacher to class (admin only)
router.post('/:teacherId/classes/:classId', TeacherController.assignTeacherToClass);

// DELETE /api/teachers/:teacherId/classes/:classId - Remove teacher from class (admin only)
router.delete('/:teacherId/classes/:classId', TeacherController.removeTeacherFromClass);

export default router;