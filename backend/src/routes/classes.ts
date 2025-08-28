import { Router } from 'express';
import { ClassController } from '../controllers/classController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All class routes require authentication
router.use(authMiddleware);

// GET /api/classes - Get all classes (admin only)
router.get('/', ClassController.getAllClasses);

// GET /api/classes/:id - Get specific class information
router.get('/:id', ClassController.getClassById);

// GET /api/classes/:id/students - Get students in a specific class
router.get('/:id/students', ClassController.getClassStudents);

// POST /api/classes/:id/students/:studentId - Add student to class
router.post('/:id/students/:studentId', ClassController.addStudentToClass);

// DELETE /api/classes/:id/students/:studentId - Remove student from class
router.delete('/:id/students/:studentId', ClassController.removeStudentFromClass);

// PUT /api/classes/:id/students/:studentId - Move student to different class
router.put('/:id/students/:studentId', ClassController.moveStudentToClass);

// GET /api/classes/:id/stats - Get class statistics
router.get('/:id/stats', ClassController.getClassStats);

export default router;