import { Router } from 'express';
import { SubjectController } from '../controllers/subjectController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All subject routes require authentication
router.use(authMiddleware);

// GET /api/subjects - Get all subjects
router.get('/', SubjectController.getSubjects);

// POST /api/subjects - Create new subject (admin only)
router.post('/', SubjectController.createSubject);

// PUT /api/subjects/:id - Update subject (admin only)
router.put('/:id', SubjectController.updateSubject);

// DELETE /api/subjects/:id - Delete subject (admin only)
router.delete('/:id', SubjectController.deleteSubject);

// GET /api/subjects/:id/workbooks - Get workbooks associated with subject
router.get('/:id/workbooks', SubjectController.getSubjectWorkbooks);

// POST /api/subjects/:id/workbooks - Associate workbook with subject (teachers and admins)
router.post('/:id/workbooks', SubjectController.addWorkbookToSubject);

// DELETE /api/subjects/:id/workbooks/:workbookId - Remove workbook from subject
router.delete('/:id/workbooks/:workbookId', SubjectController.removeWorkbookFromSubject);

export default router;