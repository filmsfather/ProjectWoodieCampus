import { Response } from 'express';
import { AuthService } from '../services/authService';
import { DatabaseService } from '../services/databaseService';
import { ApiResponse, AuthRequest } from '../types';

export class AdminController {
  // POST /api/admin/users - 새 사용자 계정 생성
  static async createUser(req: AuthRequest, res: Response) {
    try {
      const { username, email, password, role, fullName } = req.body;

      // 입력 검증
      if (!username || !email || !password) {
        const response: ApiResponse = {
          success: false,
          message: '사용자명, 이메일, 비밀번호는 필수 입력 항목입니다',
        };
        return res.status(400).json(response);
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse = {
          success: false,
          message: '유효하지 않은 이메일 형식입니다',
        };
        return res.status(400).json(response);
      }

      // 비밀번호 강도 검증
      if (password.length < 8) {
        const response: ApiResponse = {
          success: false,
          message: '비밀번호는 최소 8자 이상이어야 합니다',
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

      if (newPassword.length < 8) {
        const response: ApiResponse = {
          success: false,
          message: '비밀번호는 최소 8자 이상이어야 합니다',
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
}