import { Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { AuthRequest } from '../types';

export class WorkbookController {
  // 문제집 목록 조회
  static async getWorkbooks(req: AuthRequest, res: Response) {
    try {
      const { 
        page = '1', 
        limit = '10', 
        status,
        search 
      } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
        createdBy: req.user?.role === 'teacher' ? req.user.userId : undefined,
      };

      const result = await DatabaseService.getWorkbooks(filters);

      res.json({
        success: true,
        data: result,
        message: '문제집 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('문제집 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 목록을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 상세 조회
  static async getWorkbook(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID를 입력해주세요.',
        });
      }

      const workbook = await DatabaseService.getWorkbook(id);

      if (!workbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      res.json({
        success: true,
        data: { workbook },
        message: '문제집을 조회했습니다.',
      });
    } catch (error) {
      console.error('문제집 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집과 문제들 함께 조회
  static async getWorkbookWithProblems(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID를 입력해주세요.',
        });
      }

      const workbook = await DatabaseService.getWorkbookWithProblems(id);

      if (!workbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      res.json({
        success: true,
        data: { workbook },
        message: '문제집과 문제 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('문제집 상세 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 상세 정보를 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 생성
  static async createWorkbook(req: AuthRequest, res: Response) {
    try {
      const { title, description, status } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          success: false,
          message: '문제집 제목을 입력해주세요.',
        });
      }

      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.',
        });
      }

      const workbookData = {
        title: title.trim(),
        description: description?.trim(),
        status: status || 'draft',
        createdBy: req.user.userId,
      };

      const workbook = await DatabaseService.createWorkbook(workbookData);

      res.status(201).json({
        success: true,
        data: { workbook },
        message: '문제집이 생성되었습니다.',
      });
    } catch (error) {
      console.error('문제집 생성 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 수정
  static async updateWorkbook(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, status } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID를 입력해주세요.',
        });
      }

      // 기존 문제집 확인
      const existingWorkbook = await DatabaseService.getWorkbook(id);
      if (!existingWorkbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      // 권한 확인 (관리자이거나 작성자인 경우만 수정 가능)
      if (req.user?.role !== 'admin' && req.user?.userId !== existingWorkbook.created_by) {
        return res.status(403).json({
          success: false,
          message: '문제집을 수정할 권한이 없습니다.',
        });
      }

      const updates = {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(status && { status }),
      };

      const workbook = await DatabaseService.updateWorkbook(id, updates);

      res.json({
        success: true,
        data: { workbook },
        message: '문제집이 수정되었습니다.',
      });
    } catch (error) {
      console.error('문제집 수정 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 수정에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 삭제
  static async deleteWorkbook(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID를 입력해주세요.',
        });
      }

      // 기존 문제집 확인
      const existingWorkbook = await DatabaseService.getWorkbook(id);
      if (!existingWorkbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      // 권한 확인 (관리자이거나 작성자인 경우만 삭제 가능)
      if (req.user?.role !== 'admin' && req.user?.userId !== existingWorkbook.created_by) {
        return res.status(403).json({
          success: false,
          message: '문제집을 삭제할 권한이 없습니다.',
        });
      }

      await DatabaseService.deleteWorkbook(id);

      res.json({
        success: true,
        message: '문제집이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('문제집 삭제 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 삭제에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집에 문제 추가
  static async addProblemToWorkbook(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { problemId, order } = req.body;

      if (!id || !problemId) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID와 문제 ID를 입력해주세요.',
        });
      }

      // 문제집 존재 확인
      const workbook = await DatabaseService.getWorkbook(id);
      if (!workbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      // 권한 확인
      if (req.user?.role !== 'admin' && req.user?.userId !== workbook.created_by) {
        return res.status(403).json({
          success: false,
          message: '문제집을 수정할 권한이 없습니다.',
        });
      }

      const workbookProblem = await DatabaseService.addProblemToWorkbook(id, problemId, order);

      res.status(201).json({
        success: true,
        data: { workbookProblem },
        message: '문제가 문제집에 추가되었습니다.',
      });
    } catch (error) {
      console.error('문제집에 문제 추가 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집에 문제를 추가할 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집에서 문제 제거
  static async removeProblemFromWorkbook(req: AuthRequest, res: Response) {
    try {
      const { id, problemId } = req.params;

      if (!id || !problemId) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID와 문제 ID를 입력해주세요.',
        });
      }

      // 문제집 존재 확인
      const workbook = await DatabaseService.getWorkbook(id);
      if (!workbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      // 권한 확인
      if (req.user?.role !== 'admin' && req.user?.userId !== workbook.created_by) {
        return res.status(403).json({
          success: false,
          message: '문제집을 수정할 권한이 없습니다.',
        });
      }

      await DatabaseService.removeProblemFromWorkbook(id, problemId);

      res.json({
        success: true,
        message: '문제가 문제집에서 제거되었습니다.',
      });
    } catch (error) {
      console.error('문제집에서 문제 제거 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집에서 문제를 제거할 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 내 문제 순서 변경
  static async reorderWorkbookProblems(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { problemOrders } = req.body;

      if (!id || !Array.isArray(problemOrders)) {
        return res.status(400).json({
          success: false,
          message: '문제집 ID와 문제 순서 배열을 입력해주세요.',
        });
      }

      // 문제집 존재 확인
      const workbook = await DatabaseService.getWorkbook(id);
      if (!workbook) {
        return res.status(404).json({
          success: false,
          message: '문제집을 찾을 수 없습니다.',
        });
      }

      // 권한 확인
      if (req.user?.role !== 'admin' && req.user?.userId !== workbook.created_by) {
        return res.status(403).json({
          success: false,
          message: '문제집을 수정할 권한이 없습니다.',
        });
      }

      await DatabaseService.reorderWorkbookProblems(id, problemOrders);

      res.json({
        success: true,
        message: '문제 순서가 변경되었습니다.',
      });
    } catch (error) {
      console.error('문제 순서 변경 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제 순서를 변경할 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 배포 (미들웨어에서 권한 검증 완료)
  static async assignWorkbook(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { 
        targetType, 
        targetIds, 
        scheduledFor, 
        dueDate,
        allowLateSubmission = true,
        showCorrectAnswers = false,
        maxAttempts 
      } = req.body;

      // 문제집 정보는 미들웨어에서 이미 검증 및 설정됨
      const workbook = (req as any).workbook || await DatabaseService.getWorkbook(id);

      const assignmentData = {
        workbookId: id,
        assignedBy: req.user?.userId!,
        targetType,
        targetIds: JSON.stringify(targetIds),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        allowLateSubmission,
        showCorrectAnswers,
        maxAttempts,
      };

      const assignment = await DatabaseService.createWorkbookAssignment(assignmentData);

      // 성공 로그
      console.log(`[SUCCESS] 문제집 배포 성공:`, {
        userId: req.user?.userId,
        workbookId: id,
        targetType,
        targetCount: targetIds.length,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        data: { assignment },
        message: '문제집이 성공적으로 배포되었습니다.',
      });
    } catch (error) {
      console.error('문제집 배포 실패:', error);
      
      // 에러 로그
      console.log(`[ERROR] 문제집 배포 실패:`, {
        userId: req.user?.userId,
        workbookId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: '문제집 배포에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 배포 목록 조회
  static async getWorkbookAssignments(req: AuthRequest, res: Response) {
    try {
      const { 
        page = '1',
        limit = '10',
        status,
        targetType 
      } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        targetType: targetType as string,
        assignedBy: req.user?.role === 'teacher' ? req.user.userId : undefined,
      };

      const result = await DatabaseService.getWorkbookAssignments(filters);

      res.json({
        success: true,
        data: result,
        message: '문제집 배포 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('문제집 배포 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 배포 목록을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 특정 문제집 배포 상세 조회
  static async getWorkbookAssignment(req: AuthRequest, res: Response) {
    try {
      const { assignmentId } = req.params;

      if (!assignmentId) {
        return res.status(400).json({
          success: false,
          message: '배포 ID를 입력해주세요.',
        });
      }

      const assignment = await DatabaseService.getWorkbookAssignment(assignmentId);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: '배포 정보를 찾을 수 없습니다.',
        });
      }

      // 권한 확인
      if (req.user?.role === 'teacher' && req.user?.userId !== assignment.assigned_by) {
        return res.status(403).json({
          success: false,
          message: '배포 정보를 조회할 권한이 없습니다.',
        });
      }

      res.json({
        success: true,
        data: { assignment },
        message: '문제집 배포 정보를 조회했습니다.',
      });
    } catch (error) {
      console.error('문제집 배포 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '문제집 배포 정보를 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 학생별 문제집 배포 상태 조회
  static async getStudentAssignments(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        status
      } = req.query;

      const studentId = req.user?.role === 'student' ? req.user.userId : req.query.studentId;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: '학생 ID를 입력해주세요.',
        });
      }

      // 권한 확인
      if (req.user?.role === 'student' && req.user?.userId !== studentId) {
        return res.status(403).json({
          success: false,
          message: '다른 학생의 배정 정보를 조회할 권한이 없습니다.',
        });
      }

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        studentId: studentId as string,
      };

      const result = await DatabaseService.getStudentWorkbookAssignments(filters);

      res.json({
        success: true,
        data: result,
        message: '학생 문제집 배정 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('학생 배정 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '학생 배정 목록을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 문제집 배포 취소/수정
  static async updateWorkbookAssignment(req: AuthRequest, res: Response) {
    try {
      const { assignmentId } = req.params;
      const updates = req.body;

      if (!assignmentId) {
        return res.status(400).json({
          success: false,
          message: '배포 ID를 입력해주세요.',
        });
      }

      // 기존 배포 정보 확인
      const existingAssignment = await DatabaseService.getWorkbookAssignment(assignmentId);
      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: '배포 정보를 찾을 수 없습니다.',
        });
      }

      // 권한 확인
      if (req.user?.role !== 'admin' && req.user?.userId !== existingAssignment.assigned_by) {
        return res.status(403).json({
          success: false,
          message: '배포 정보를 수정할 권한이 없습니다.',
        });
      }

      const assignment = await DatabaseService.updateWorkbookAssignment(assignmentId, updates);

      res.json({
        success: true,
        data: { assignment },
        message: '배포 정보가 수정되었습니다.',
      });
    } catch (error) {
      console.error('배포 정보 수정 실패:', error);
      res.status(500).json({
        success: false,
        message: '배포 정보 수정에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}