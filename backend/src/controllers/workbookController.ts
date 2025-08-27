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
}