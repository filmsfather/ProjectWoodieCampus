import { Request, Response } from 'express';
import { ApiResponse, AuthRequest } from '../types';

export class UserController {
  // GET /api/users (관리자 전용)
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, role } = req.query;

      // TODO: 관리자 권한 확인
      if (req.user?.role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      // TODO: 실제 데이터베이스 조회
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@woodie.com',
          role: 'admin',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '2',
          username: 'teacher1',
          email: 'teacher@woodie.com',
          role: 'teacher',
          createdAt: '2025-01-02',
          updatedAt: '2025-01-02',
        },
        {
          id: '3',
          username: 'student1',
          email: 'student@woodie.com',
          role: 'student',
          createdAt: '2025-01-03',
          updatedAt: '2025-01-03',
        },
      ];

      const filteredUsers = role 
        ? mockUsers.filter(user => user.role === role)
        : mockUsers;

      const response: ApiResponse = {
        success: true,
        data: {
          users: filteredUsers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filteredUsers.length,
            totalPages: Math.ceil(filteredUsers.length / Number(limit)),
          },
        },
      };
      res.json(response);
    } catch (error) {
      console.error('Get users error:', error);
      const response: ApiResponse = {
        success: false,
        message: '사용자 목록을 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/users/profile
  static async getUserProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      // TODO: 실제 사용자 정보 조회
      const userProfile = {
        id: req.user.userId,
        username: req.user.username,
        email: `${req.user.username}@woodie.com`,
        role: req.user.role,
        stats: {
          totalProblems: 150,
          solvedProblems: 89,
          accuracy: 78.5,
          streak: 7,
        },
        preferences: {
          language: 'ko',
          theme: 'light',
          notifications: true,
        },
      };

      const response: ApiResponse = {
        success: true,
        data: { profile: userProfile },
      };
      res.json(response);
    } catch (error) {
      console.error('Get user profile error:', error);
      const response: ApiResponse = {
        success: false,
        message: '프로필 정보를 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/users/:id
  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { username, email, role } = req.body;

      // 권한 확인: 관리자이거나 본인 계정인 경우만 수정 가능
      if (req.user?.role !== 'admin' && req.user?.userId !== id) {
        const response: ApiResponse = {
          success: false,
          message: '수정 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      // TODO: 실제 데이터베이스 업데이트
      const updatedUser = {
        id,
        username,
        email,
        role,
        updatedAt: new Date().toISOString(),
      };

      const response: ApiResponse = {
        success: true,
        data: { user: updatedUser },
        message: '사용자 정보가 수정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Update user error:', error);
      const response: ApiResponse = {
        success: false,
        message: '사용자 정보 수정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/users/:id
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // 관리자만 사용자 삭제 가능
      if (req.user?.role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '삭제 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      // 자신의 계정은 삭제할 수 없음
      if (req.user?.userId === id) {
        const response: ApiResponse = {
          success: false,
          message: '자신의 계정은 삭제할 수 없습니다',
        };
        return res.status(400).json(response);
      }

      // TODO: 실제 데이터베이스 삭제
      const response: ApiResponse = {
        success: true,
        message: '사용자가 삭제되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Delete user error:', error);
      const response: ApiResponse = {
        success: false,
        message: '사용자 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/users (관리자 전용 - 새 사용자 생성)
  static async createUser(req: AuthRequest, res: Response) {
    try {
      const { username, email, password, role } = req.body;

      // 관리자 권한 확인
      if (req.user?.role !== 'admin') {
        const response: ApiResponse = {
          success: false,
          message: '접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      if (!username || !email || !password) {
        const response: ApiResponse = {
          success: false,
          message: '필수 필드가 누락되었습니다',
        };
        return res.status(400).json(response);
      }

      // TODO: 실제 사용자 생성 로직
      const newUser = {
        id: `user_${Date.now()}`,
        username,
        email,
        role: role || 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response: ApiResponse = {
        success: true,
        data: { user: newUser },
        message: '사용자가 생성되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create user error:', error);
      const response: ApiResponse = {
        success: false,
        message: '사용자 생성 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}