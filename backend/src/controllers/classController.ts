import { Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { ApiResponse, AuthRequest } from '../types';

export class ClassController {
  // GET /api/classes - Get all classes (admin only)
  static async getAllClasses(req: AuthRequest, res: Response) {
    try {
      const userRole = req.user?.role;

      // 관리자 권한 확인
      if (userRole !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      const classes = await DatabaseService.getClasses();

      const response: ApiResponse = {
        success: true,
        data: classes,
        message: '전체 반 목록을 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get all classes error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 목록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/classes/:id - Get specific class information
  static async getClassById(req: AuthRequest, res: Response) {
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

      // 반 정보 조회
      const { data, error } = await DatabaseService.supabase
        .from('classes')
        .select(`
          *,
          teacher:users(id, username, full_name),
          student_count:users(count)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        const response: ApiResponse = {
          success: false,
          message: '해당 반을 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      // 권한 확인 - 관리자, 해당 반의 교사, 해당 반의 학생만 조회 가능
      const hasAccess = userRole === 'admin' ||
        (userRole === 'teacher' && (
          data.teacher_id === userId ||
          // teacher_classes 테이블에서 확인
          await checkTeacherClassAccess(userId, id)
        )) ||
        (userRole === 'student' && await checkStudentClassAccess(userId, id));

      if (!hasAccess) {
        const response: ApiResponse = {
          success: false,
          message: '해당 반에 대한 접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: data,
        message: '반 정보를 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get class by id error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 정보 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/classes/:id/students - Get students in a specific class
  static async getClassStudents(req: AuthRequest, res: Response) {
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

      // 권한 확인 - 관리자 또는 해당 반의 교사만 조회 가능
      const hasAccess = userRole === 'admin' ||
        (userRole === 'teacher' && await checkTeacherClassAccess(userId, id));

      if (!hasAccess) {
        const response: ApiResponse = {
          success: false,
          message: '해당 반의 학생 목록에 대한 접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      const students = await DatabaseService.getStudentsByClass(id);

      const response: ApiResponse = {
        success: true,
        data: students,
        message: '반 학생 목록을 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get class students error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 학생 목록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/classes/:id/students/:studentId - Add student to class
  static async addStudentToClass(req: AuthRequest, res: Response) {
    try {
      const { id, studentId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 권한 확인 - 관리자 또는 해당 반의 교사만 가능
      const hasAccess = userRole === 'admin' ||
        (userRole === 'teacher' && await checkTeacherClassAccess(userId, id));

      if (!hasAccess) {
        const response: ApiResponse = {
          success: false,
          message: '학생을 반에 추가할 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      const result = await DatabaseService.assignStudentToClass(studentId, id);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '학생이 반에 성공적으로 추가되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Add student to class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '학생 반 추가 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/classes/:id/students/:studentId - Remove student from class
  static async removeStudentFromClass(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 권한 확인 - 관리자만 가능 (학생을 반에서 제거하는 것은 신중해야 함)
      if (userRole !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      // 학생을 반에서 제거 (class_id를 null로 설정)
      const { error } = await DatabaseService.supabase
        .from('users')
        .update({ class_id: null })
        .eq('id', studentId)
        .eq('role', 'student');

      if (error) throw error;

      const response: ApiResponse = {
        success: true,
        message: '학생이 반에서 성공적으로 제거되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Remove student from class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '학생 반 제거 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/classes/:id/students/:studentId - Move student to different class
  static async moveStudentToClass(req: AuthRequest, res: Response) {
    try {
      const { id, studentId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증 정보가 없습니다',
        };
        return res.status(401).json(response);
      }

      // 권한 확인 - 관리자만 가능
      if (userRole !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '관리자 권한이 필요합니다',
        };
        return res.status(403).json(response);
      }

      const result = await DatabaseService.assignStudentToClass(studentId, id);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '학생이 다른 반으로 성공적으로 이동되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Move student to class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '학생 반 이동 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/classes/:id/stats - Get class statistics
  static async getClassStats(req: AuthRequest, res: Response) {
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

      // 권한 확인 - 관리자 또는 해당 반의 교사만 조회 가능
      const hasAccess = userRole === 'admin' ||
        (userRole === 'teacher' && await checkTeacherClassAccess(userId, id));

      if (!hasAccess) {
        const response: ApiResponse = {
          success: false,
          message: '해당 반의 통계에 대한 접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      const stats = await DatabaseService.getClassProgressStats(id);

      const response: ApiResponse = {
        success: true,
        data: stats,
        message: '반 통계 정보를 성공적으로 조회했습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Get class stats error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 통계 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/classes/teacher - Get classes assigned to current teacher
  static async getTeacherClasses(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '교사 권한이 필요합니다.',
        });
      }

      const classes = await DatabaseService.getClassesByTeacher(userId);

      res.json({
        success: true,
        data: classes,
        message: '담당 반 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('교사 반 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '담당 반 목록을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/classes/:id/students - Get students in a specific class
  static async getClassStudents(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { id: classId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.',
        });
      }

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: '반 ID를 입력해주세요.',
        });
      }

      // 권한 확인 - 관리자이거나 해당 반을 담당하는 교사만 조회 가능
      let hasAccess = false;
      if (userRole === 'admin') {
        hasAccess = true;
      } else if (userRole === 'teacher') {
        // 교사가 해당 반을 담당하는지 확인
        const teacherClasses = await DatabaseService.getClassesByTeacher(userId);
        hasAccess = teacherClasses.some(cls => cls.id === classId);
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: '해당 반의 학생 목록을 조회할 권한이 없습니다.',
        });
      }

      const students = await DatabaseService.getStudentsByClass(classId);

      res.json({
        success: true,
        data: students,
        message: '반 학생 목록을 조회했습니다.',
      });
    } catch (error) {
      console.error('반 학생 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        message: '반 학생 목록을 가져올 수 없습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// 헬퍼 함수들
async function checkTeacherClassAccess(teacherId: string, classId: string): Promise<boolean> {
  const { data, error } = await DatabaseService.supabase
    .from('teacher_classes')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .single();

  return !error && !!data;
}

async function checkStudentClassAccess(studentId: string, classId: string): Promise<boolean> {
  const { data, error } = await DatabaseService.supabase
    .from('users')
    .select('id')
    .eq('id', studentId)
    .eq('class_id', classId)
    .eq('role', 'student')
    .single();

  return !error && !!data;
}