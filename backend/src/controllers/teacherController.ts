import { Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ApiResponse, AuthRequest } from '../types';

export class TeacherController {
  // GET /api/teachers/classes - Get classes assigned to current teacher
  static async getTeacherClasses(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 교사 또는 관리자 권한 확인
      if (!['teacher', 'admin'].includes(userRole || '')) {
        const response: ApiResponse = {
          success: false,
          message: '교사 또는 관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      const classes = await DatabaseService.getClassesByTeacher(userId);

      const response: ApiResponse = {
        success: true,
        data: classes,
        message: '담당 반 목록을 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get teacher classes error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '담당 반 목록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/teachers/:id/classes - Get classes assigned to specific teacher (admin only)
  static async getTeacherClassesById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;

      // 관리자 권한 확인
      if (userRole !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      const classes = await DatabaseService.getClassesByTeacher(id);

      const response: ApiResponse = {
        success: true,
        data: classes,
        message: '교사의 담당 반 목록을 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get teacher classes by id error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교사 담당 반 목록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/teachers/classes - Create new class
  static async createClass(req: AuthRequest, res: Response) {
    try {
      const { name, grade_level, subject, description } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 교사 또는 관리자 권한 확인
      if (!['teacher', 'admin'].includes(userRole || '')) {
        const response: ApiResponse = {
          success: false,
          message: '교사 또는 관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      // 입력 검증
      if (!name) {
        const response: ApiResponse = {
          success: false,
          message: '반 이름은 필수 입력 항목입니다',
        };
        return res.status(400).json(response);
      }

      const newClass = await DatabaseService.createClass({
        name,
        teacher_id: userId,
        grade_level,
        subject,
        description,
      });

      // 생성한 반에 교사 할당 (teacher_classes 테이블에 추가)
      await DatabaseService.assignTeacherToClass(userId, newClass.id);

      const response: ApiResponse = {
        success: true,
        data: newClass,
        message: '새 반이 성공적으로 생성되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 생성 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/teachers/classes/:id - Update class information
  static async updateClass(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, grade_level, subject, description } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 교사 또는 관리자 권한 확인
      if (!['teacher', 'admin'].includes(userRole || '')) {
        const response: ApiResponse = {
          success: false,
          message: '교사 또는 관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      // 업데이트할 데이터 준비
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (grade_level !== undefined) updateData.grade_level = grade_level;
      if (subject !== undefined) updateData.subject = subject;
      if (description !== undefined) updateData.description = description;

      if (Object.keys(updateData).length === 0) {
        const response: ApiResponse = {
          success: false,
          message: '수정할 데이터가 없습니다',
        };
        return res.status(400).json(response);
      }

      // 반 정보 업데이트 (Supabase에서 직접 처리)
      const { data, error } = await DatabaseService.supabase
        .from('classes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const response: ApiResponse = {
        success: true,
        data: data,
        message: '반 정보가 성공적으로 수정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Update class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 정보 수정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/teachers/classes/:id - Delete class
  static async deleteClass(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 교사 또는 관리자 권한 확인
      if (!['teacher', 'admin'].includes(userRole || '')) {
        const response: ApiResponse = {
          success: false,
          message: '교사 또는 관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      // 반 삭제 (소프트 삭제)
      const { error } = await DatabaseService.supabase
        .from('classes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      const response: ApiResponse = {
        success: true,
        message: '반이 성공적으로 삭제되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Delete class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/teachers/:teacherId/classes/:classId - Assign teacher to class (admin only)
  static async assignTeacherToClass(req: AuthRequest, res: Response) {
    try {
      const { teacherId, classId } = req.params;
      const userRole = req.user?.role;

      // 관리자 권한 확인
      if (userRole !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      const assignment = await DatabaseService.assignTeacherToClass(teacherId, classId);

      const response: ApiResponse = {
        success: true,
        data: assignment,
        message: '교사가 반에 성공적으로 배정되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Assign teacher to class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교사 반 배정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/teachers/:teacherId/classes/:classId - Remove teacher from class (admin only)
  static async removeTeacherFromClass(req: AuthRequest, res: Response) {
    try {
      const { teacherId, classId } = req.params;
      const userRole = req.user?.role;

      // 관리자 권한 확인
      if (userRole !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      await DatabaseService.removeTeacherFromClass(teacherId, classId);

      const response: ApiResponse = {
        success: true,
        message: '교사가 반에서 성공적으로 제거되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Remove teacher from class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교사 반 제거 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}