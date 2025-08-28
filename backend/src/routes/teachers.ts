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

// POST /api/teachers/classes - Create new class (teachers and admins)
router.post('/classes', TeacherController.createClass);

// PUT /api/teachers/classes/:id - Update class information (teachers and admins)
router.put('/classes/:id', TeacherController.updateClass);

// DELETE /api/teachers/classes/:id - Delete class (teachers and admins)
router.delete('/classes/:id', TeacherController.deleteClass);

// POST /api/teachers/:teacherId/classes/:classId - Assign teacher to class (admin only)
router.post('/:teacherId/classes/:classId', TeacherController.assignTeacherToClass);

// DELETE /api/teachers/:teacherId/classes/:classId - Remove teacher from class (admin only)
router.delete('/:teacherId/classes/:classId', TeacherController.removeTeacherFromClass);

export default router;