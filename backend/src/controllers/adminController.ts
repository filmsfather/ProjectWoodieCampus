import { Response } from 'express';
import { AuthService } from '../services/authService';
import { DatabaseService } from '../services/databaseService';
import { ApiResponse, AuthRequest } from '../types';

export class AdminController {
  // POST /api/admin/users - 새 사용자 계정 생성
  static async createUser(req: AuthRequest, res: Response) {
    try {
      const { username, email, password, role, fullName } = req.body;

      // 입력 검증 - 이메일은 선택사항으로 변경
      if (!username || !password) {
        const response: ApiResponse = {
          success: false,
          message: '사용자명, 비밀번호는 필수 입력 항목입니다',
        };
        return res.status(400).json(response);
      }

      // 이메일 형식 검증 (이메일이 제공된 경우에만)
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          const response: ApiResponse = {
            success: false,
            message: '유효하지 않은 이메일 형식입니다',
          };
          return res.status(400).json(response);
        }
      }

      // 비밀번호 강도 검증
      if (password.length < 4) {
        const response: ApiResponse = {
          success: false,
          message: '비밀번호는 최소 4자 이상이어야 합니다',
        };
        return res.status(400).json(response);
      }

      // 역할 검증
      const allowedRoles = ['admin', 'teacher', 'student'];
      const userRole = role || 'student';
      if (!allowedRoles.includes(userRole)) {
        const response: ApiResponse = {
          success: false,
          message: '유효하지 않은 역할입니다. (admin, teacher, student 중 선택)',
        };
        return res.status(400).json(response);
      }

      // 사용자 생성
      const newUser = await AuthService.register({
        username,
        email,
        password,
        role: userRole,
        fullName,
      });

      const response: ApiResponse = {
        success: true,
        data: newUser,
        message: '사용자 계정이 성공적으로 생성되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create user error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '사용자 생성 중 오류가 발생했습니다',
      };
      res.status(400).json(response);
    }
  }

  // GET /api/admin/users - 사용자 목록 조회 (페이징, 필터링)
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        role,
        search,
        isActive
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // 필터 조건 구성
      const filters: any = {};
      if (role) filters.role = role;
      if (isActive !== undefined) filters.is_active = isActive === 'true';
      if (search) {
        // username, email, full_name에서 검색
        filters.search = search;
      }

      const users = await DatabaseService.getUsersWithFilters(filters, limitNum, offset);
      const totalCount = await DatabaseService.getUsersCount(filters);

      const response: ApiResponse = {
        success: true,
        data: {
          users: users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            isActive: user.is_active,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            class_id: user.class_id,
          })),
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalCount,
            limit: limitNum,
          },
        },
      };
      res.json(response);
    } catch (error) {
      console.error('Get users error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '사용자 목록을 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/admin/users/:id/role - 사용자 역할 변경
  static async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        const response: ApiResponse = {
          success: false,
          message: '새로운 역할이 필요합니다',
        };
        return res.status(400).json(response);
      }

      const allowedRoles = ['admin', 'teacher', 'student'];
      if (!allowedRoles.includes(role)) {
        const response: ApiResponse = {
          success: false,
          message: '유효하지 않은 역할입니다. (admin, teacher, student 중 선택)',
        };
        return res.status(400).json(response);
      }

      // 자기 자신의 역할 변경 방지
      if (req.user?.userId === id && req.user.role === 'admin' && role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '자신의 관리자 권한을 제거할 수 없습니다',
        };
        return res.status(403).json(response);
      }

      await DatabaseService.updateUser(id, { role });

      const response: ApiResponse = {
        success: true,
        message: '사용자 역할이 성공적으로 변경되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Update user role error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '역할 변경 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/admin/users/:id - 사용자 계정 삭제 (soft delete)
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // 자기 자신 삭제 방지
      if (req.user?.userId === id) {
        const response: ApiResponse = {
          success: false,
          message: '자신의 계정을 삭제할 수 없습니다',
        };
        return res.status(403).json(response);
      }

      // 사용자 존재 확인
      const user = await DatabaseService.getUserById(id);
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: '사용자를 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      // Soft delete (is_active = false)
      await DatabaseService.updateUser(id, { is_active: false });

      const response: ApiResponse = {
        success: true,
        message: '사용자 계정이 비활성화되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Delete user error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '사용자 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/admin/users/:id/activate - 사용자 계정 활성화
  static async activateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // 사용자 존재 확인
      const user = await DatabaseService.getUserById(id);
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: '사용자를 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      await DatabaseService.updateUser(id, { is_active: true });

      const response: ApiResponse = {
        success: true,
        message: '사용자 계정이 활성화되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Activate user error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '사용자 활성화 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/admin/users/:id/reset-password - 비밀번호 재설정 (관리자용)
  static async resetUserPassword(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        const response: ApiResponse = {
          success: false,
          message: '새 비밀번호가 필요합니다',
        };
        return res.status(400).json(response);
      }

      if (newPassword.length < 4) {
        const response: ApiResponse = {
          success: false,
          message: '비밀번호는 최소 4자 이상이어야 합니다',
        };
        return res.status(400).json(response);
      }

      await AuthService.resetPassword(id, newPassword);

      const response: ApiResponse = {
        success: true,
        message: '사용자 비밀번호가 재설정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Reset user password error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '비밀번호 재설정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // =================== 반 관리 기능 (관리자 전용) ===================

  // POST /api/admin/classes - 새 반 생성 (관리자 전용)
  static async createClass(req: AuthRequest, res: Response) {
    try {
      const { name, teacher_id, grade_level, subject, description } = req.body;

      // 입력 검증
      if (!name) {
        const response: ApiResponse = {
          success: false,
          message: '반 이름은 필수 입력 항목입니다',
        };
        return res.status(400).json(response);
      }

      // teacher_id가 제공된 경우 해당 교사 존재 확인
      if (teacher_id) {
        const teacher = await DatabaseService.getUserById(teacher_id);
        if (!teacher || teacher.role !== 'teacher') {
          const response: ApiResponse = {
            success: false,
            message: '유효하지 않은 교사 ID입니다',
          };
          return res.status(400).json(response);
        }
      }

      const newClass = await DatabaseService.createClass({
        name,
        teacher_id: teacher_id || null,
        grade_level,
        subject,
        description,
      });

      // 교사가 지정된 경우 교사-반 매핑 테이블에도 추가
      if (teacher_id) {
        await DatabaseService.assignTeacherToClass(teacher_id, newClass.id);
      }

      const response: ApiResponse = {
        success: true,
        data: newClass,
        message: '반이 성공적으로 생성되었습니다',
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

  // PUT /api/admin/classes/:id - 반 정보 수정 (관리자 전용)
  static async updateClass(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, grade_level, subject, description } = req.body;

      // 반 존재 확인 - 임시로 주석 처리 (해당 메소드가 없음)
      // const existingClass = await DatabaseService.getClassById(id);
      // if (!existingClass) {
      //   const response: ApiResponse = {
      //     success: false,
      //     message: '반을 찾을 수 없습니다',
      //   };
      //   return res.status(404).json(response);
      // }

      // 반 수정 - 임시로 주석 처리 (해당 메소드가 없음)
      // const updatedClass = await DatabaseService.updateClass(id, {
      //   name,
      //   grade_level,
      //   subject,
      //   description,
      // });

      const response: ApiResponse = {
        success: true,
        message: '반 정보 수정 기능은 추후 구현 예정입니다',
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

  // DELETE /api/admin/classes/:id - 반 삭제 (관리자 전용)
  static async deleteClass(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // 반 삭제 (소프트 삭제)
      await DatabaseService.deleteClass(id);

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

  // GET /api/admin/classes - 모든 반 목록 조회 (관리자 전용)
  static async getAllClasses(req: AuthRequest, res: Response) {
    try {
      const classes = await DatabaseService.getClasses();

      const response: ApiResponse = {
        success: true,
        data: classes,
      };
      res.json(response);
    } catch (error) {
      console.error('Get all classes error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 목록을 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }


  // POST /api/admin/classes/:classId/students/:studentId - 학생을 반에 배정
  static async assignStudentToClass(req: AuthRequest, res: Response) {
    try {
      const { classId, studentId } = req.params;

      // 학생 존재 확인
      const student = await DatabaseService.getUserById(studentId);
      if (!student || student.role !== 'student') {
        const response: ApiResponse = {
          success: false,
          message: '유효하지 않은 학생 ID입니다',
        };
        return res.status(400).json(response);
      }

      // 반 존재 확인
      const { data: classInfo, error: classError } = await DatabaseService.supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .single();
      
      if (classError || !classInfo) {
        const response: ApiResponse = {
          success: false,
          message: '반을 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      await DatabaseService.assignStudentToClass(studentId, classId);

      const response: ApiResponse = {
        success: true,
        message: '학생이 반에 성공적으로 배정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Assign student to class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '학생 배정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/admin/classes/:classId/students/:studentId - 학생을 반에서 제거
  static async removeStudentFromClass(req: AuthRequest, res: Response) {
    try {
      const { classId, studentId } = req.params;

      // 학생을 반에서 제거 (class_id를 null로 설정)
      const { error: removeError } = await DatabaseService.supabase
        .from('users')
        .update({ class_id: null })
        .eq('id', studentId)
        .eq('role', 'student');
      
      if (removeError) throw removeError;

      const response: ApiResponse = {
        success: true,
        message: '학생이 반에서 성공적으로 제거되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Remove student from class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '학생 제거 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // =================== 선생님-반 배정 관리 ===================
  
  // GET /api/admin/classes/:classId/teachers - 반에 배정된 선생님 목록 조회
  static async getClassTeachers(req: AuthRequest, res: Response) {
    try {
      const { classId } = req.params;

      // 반에 배정된 선생님들 조회
      const { data: assignments, error: assignError } = await DatabaseService.supabase
        .from('teacher_classes')
        .select(`
          teacher_id,
          created_at,
          users:teacher_id (
            id,
            username,
            full_name,
            email,
            role,
            is_active,
            created_at
          )
        `)
        .eq('class_id', classId);

      if (assignError) throw assignError;

      // 선생님 정보 추출 및 프론트엔드 형식으로 변환
      const teachers = assignments?.map(assignment => {
        if (assignment.users) {
          const user = assignment.users as any; // 타입 단언으로 해결
          return {
            ...user,
            fullName: user.full_name, // camelCase로 변환
          };
        }
        return null;
      }).filter(Boolean) || [];

      const response: ApiResponse = {
        success: true,
        data: teachers,
      };
      res.json(response);
    } catch (error) {
      console.error('Get class teachers error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '반 선생님 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/admin/teachers/:teacherId/classes/:classId - 선생님을 반에 배정
  static async assignTeacherToClass(req: AuthRequest, res: Response) {
    try {
      const { teacherId, classId } = req.params;

      // 선생님 존재 확인
      const { data: teacher, error: teacherError } = await DatabaseService.supabase
        .from('users')
        .select('*')
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .eq('is_active', true)
        .single();

      if (teacherError || !teacher) {
        const response: ApiResponse = {
          success: false,
          message: '선생님을 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      // 반 존재 확인
      const { data: classExists, error: classError } = await DatabaseService.supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .single();

      if (classError || !classExists) {
        const response: ApiResponse = {
          success: false,
          message: '반을 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      // 이미 배정되어 있는지 확인
      const { data: existingAssignment } = await DatabaseService.supabase
        .from('teacher_classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('class_id', classId)
        .single();

      if (existingAssignment) {
        const response: ApiResponse = {
          success: false,
          message: '해당 선생님은 이미 이 반에 배정되어 있습니다',
        };
        return res.status(400).json(response);
      }

      // 선생님-반 배정
      const { error: assignError } = await DatabaseService.supabase
        .from('teacher_classes')
        .insert({
          teacher_id: teacherId,
          class_id: classId,
          created_at: new Date().toISOString()
        });

      if (assignError) throw assignError;

      const response: ApiResponse = {
        success: true,
        message: '선생님이 반에 성공적으로 배정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Assign teacher to class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교사 배정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/admin/teachers/:teacherId/classes/:classId - 선생님을 반에서 제거
  static async removeTeacherFromClass(req: AuthRequest, res: Response) {
    try {
      const { teacherId, classId } = req.params;

      // 배정 관계 확인
      const { data: existingAssignment, error: checkError } = await DatabaseService.supabase
        .from('teacher_classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('class_id', classId)
        .single();

      if (checkError || !existingAssignment) {
        const response: ApiResponse = {
          success: false,
          message: '해당 선생님은 이 반에 배정되어 있지 않습니다',
        };
        return res.status(404).json(response);
      }

      // 선생님-반 배정 제거
      const { error: removeError } = await DatabaseService.supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('class_id', classId);

      if (removeError) throw removeError;

      const response: ApiResponse = {
        success: true,
        message: '선생님이 반에서 성공적으로 제거되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Remove teacher from class error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '교사 제거 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}