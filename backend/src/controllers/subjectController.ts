import { Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ApiResponse, AuthRequest } from '../types';

export class SubjectController {
  // GET /api/subjects - Get all subjects
  static async getSubjects(req: AuthRequest, res: Response) {
    try {
      const subjects = await DatabaseService.getSubjects();

      const response: ApiResponse = {
        success: true,
        data: subjects,
        message: '교과목 목록을 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get subjects error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교과목 목록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/subjects - Create new subject (admin only)
  static async createSubject(req: AuthRequest, res: Response) {
    try {
      const { name, description, grade_level } = req.body;
      const userId = req.user?.userId;

      // 관리자 권한 확인
      if (req.user?.role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '교과목 생성은 관리자만 가능합니다',
        };
        return res.status(403).json(response);
      }

      // 입력 검증
      if (!name) {
        const response: ApiResponse = {
          success: false,
          message: '교과목명은 필수 입력 항목입니다',
        };
        return res.status(400).json(response);
      }

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      const newSubject = await DatabaseService.createSubject({
        name,
        description,
        grade_level,
        created_by: userId,
      });

      const response: ApiResponse = {
        success: true,
        data: newSubject,
        message: '교과목이 성공적으로 생성되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create subject error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교과목 생성 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/subjects/:id - Update subject (admin only)
  static async updateSubject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, grade_level } = req.body;

      // 관리자 권한 확인
      if (req.user?.role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '교과목 수정은 관리자만 가능합니다',
        };
        return res.status(403).json(response);
      }

      // 업데이트할 데이터 검증
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (grade_level !== undefined) updateData.grade_level = grade_level;

      if (Object.keys(updateData).length === 0) {
        const response: ApiResponse = {
          success: false,
          message: '수정할 데이터가 없습니다',
        };
        return res.status(400).json(response);
      }

      const updatedSubject = await DatabaseService.updateSubject(id, updateData);

      const response: ApiResponse = {
        success: true,
        data: updatedSubject,
        message: '교과목이 성공적으로 수정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Update subject error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교과목 수정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/subjects/:id - Delete subject (admin only)
  static async deleteSubject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // 관리자 권한 확인
      if (req.user?.role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '교과목 삭제는 관리자만 가능합니다',
        };
        return res.status(403).json(response);
      }

      await DatabaseService.deleteSubject(id);

      const response: ApiResponse = {
        success: true,
        message: '교과목이 성공적으로 삭제되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Delete subject error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교과목 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/subjects/:id/workbooks - Get workbooks associated with subject
  static async getSubjectWorkbooks(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await DatabaseService.supabase
        .from('subject_workbooks')
        .select(`
          subject_id,
          workbook:problem_sets(
            id,
            title,
            description,
            subject,
            grade_level,
            estimated_time,
            status,
            created_at,
            created_by:users(id, username, full_name)
          )
        `)
        .eq('subject_id', id);

      if (error) throw error;

      const workbooks = data?.map(item => item.workbook).filter(Boolean) || [];

      const response: ApiResponse = {
        success: true,
        data: workbooks,
        message: '교과목 연결 문제집 목록을 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get subject workbooks error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교과목 문제집 목록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/subjects/:id/workbooks - Associate workbook with subject
  static async addWorkbookToSubject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { workbook_id } = req.body;

      // 교사 또는 관리자 권한 확인
      if (!['teacher', 'admin'].includes(req.user?.role || '')) {
        const response: ApiResponse = {
          success: false,
          message: '문제집 연결은 교사 또는 관리자만 가능합니다',
        };
        return res.status(403).json(response);
      }

      if (!workbook_id) {
        const response: ApiResponse = {
          success: false,
          message: '문제집 ID가 필요합니다',
        };
        return res.status(400).json(response);
      }

      // 중복 연결 확인
      const { data: existing } = await DatabaseService.supabase
        .from('subject_workbooks')
        .select('id')
        .eq('subject_id', id)
        .eq('workbook_id', workbook_id)
        .single();

      if (existing) {
        const response: ApiResponse = {
          success: false,
          message: '이미 연결된 문제집입니다',
        };
        return res.status(400).json(response);
      }

      const { data, error } = await DatabaseService.supabase
        .from('subject_workbooks')
        .insert([{
          subject_id: id,
          workbook_id: workbook_id,
        }])
        .select()
        .single();

      if (error) throw error;

      const response: ApiResponse = {
        success: true,
        data: data,
        message: '문제집이 교과목에 성공적으로 연결되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Add workbook to subject error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제집 연결 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/subjects/:id/workbooks/:workbookId - Remove workbook from subject
  static async removeWorkbookFromSubject(req: AuthRequest, res: Response) {
    try {
      const { id, workbookId } = req.params;

      // 교사 또는 관리자 권한 확인
      if (!['teacher', 'admin'].includes(req.user?.role || '')) {
        const response: ApiResponse = {
          success: false,
          message: '문제집 연결 해제는 교사 또는 관리자만 가능합니다',
        };
        return res.status(403).json(response);
      }

      const { error } = await DatabaseService.supabase
        .from('subject_workbooks')
        .delete()
        .eq('subject_id', id)
        .eq('workbook_id', workbookId);

      if (error) throw error;

      const response: ApiResponse = {
        success: true,
        message: '문제집 연결이 성공적으로 해제되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Remove workbook from subject error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제집 연결 해제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}