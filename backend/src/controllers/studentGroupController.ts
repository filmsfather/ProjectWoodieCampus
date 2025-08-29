import { Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { AuthRequest } from '../types';

export class StudentGroupController {
  // GET /api/groups/student - 교사가 생성한 학생 그룹 목록 조회
  static async getStudentGroups(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '교사 권한이 필요합니다.',
        });
      }

      const groups = await DatabaseService.getStudentGroupsByTeacher(userId);

      res.json({
        success: true,
        data: groups,
        message: '학생 그룹 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('학생 그룹 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '학생 그룹 목록을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/groups/student - 새 학생 그룹 생성
  static async createStudentGroup(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '교사 권한이 필요합니다.',
        });
      }

      const { name, description, studentIds } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: '그룹명을 입력해주세요.',
        });
      }

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '그룹에 포함할 학생을 선택해주세요.',
        });
      }

      // 학생 ID 유효성 검증
      const validStudents = await DatabaseService.validateStudentIds(studentIds);
      if (validStudents.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 학생 ID가 포함되어 있습니다.',
        });
      }

      const group = await DatabaseService.createStudentGroup({
        name: name.trim(),
        description: description?.trim(),
        createdBy: userId,
        studentIds,
      });

      res.status(201).json({
        success: true,
        data: { group },
        message: '학생 그룹이 생성되었습니다.',
      });
    } catch (error) {
      console.error('학생 그룹 생성 실패:', error);
      res.status(500).json({
        success: false,
        message: '학생 그룹 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/groups/student/:id - 특정 학생 그룹 상세 조회
  static async getStudentGroup(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId || userRole !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '교사 권한이 필요합니다.',
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '그룹 ID를 입력해주세요.',
        });
      }

      const group = await DatabaseService.getStudentGroupById(id, userId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: '그룹을 찾을 수 없습니다.',
        });
      }

      res.json({
        success: true,
        data: { group },
        message: '학생 그룹 정보를 조회했습니다.',
      });
    } catch (error) {
      console.error('학생 그룹 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '학생 그룹을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /api/groups/student/:id - 학생 그룹 수정
  static async updateStudentGroup(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { id } = req.params;
      const { name, description, studentIds } = req.body;

      if (!userId || userRole !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '교사 권한이 필요합니다.',
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '그룹 ID를 입력해주세요.',
        });
      }

      // 그룹 소유권 확인
      const existingGroup = await DatabaseService.getStudentGroupById(id, userId);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: '그룹을 찾을 수 없거나 수정 권한이 없습니다.',
        });
      }

      if (name?.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '그룹명을 입력해주세요.',
        });
      }

      if (studentIds && (!Array.isArray(studentIds) || studentIds.length === 0)) {
        return res.status(400).json({
          success: false,
          message: '그룹에 포함할 학생을 선택해주세요.',
        });
      }

      const updates = {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(studentIds && { studentIds }),
      };

      const group = await DatabaseService.updateStudentGroup(id, updates);

      res.json({
        success: true,
        data: { group },
        message: '학생 그룹이 수정되었습니다.',
      });
    } catch (error) {
      console.error('학생 그룹 수정 실패:', error);
      res.status(500).json({
        success: false,
        message: '학생 그룹 수정에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /api/groups/student/:id - 학생 그룹 삭제
  static async deleteStudentGroup(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId || userRole !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '교사 권한이 필요합니다.',
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '그룹 ID를 입력해주세요.',
        });
      }

      // 그룹 소유권 확인
      const existingGroup = await DatabaseService.getStudentGroupById(id, userId);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: '그룹을 찾을 수 없거나 삭제 권한이 없습니다.',
        });
      }

      await DatabaseService.deleteStudentGroup(id);

      res.json({
        success: true,
        message: '학생 그룹이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('학생 그룹 삭제 실패:', error);
      res.status(500).json({
        success: false,
        message: '학생 그룹 삭제에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}