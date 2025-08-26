import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, AuthRequest } from '../types';

export class AuthController {
  // POST /api/auth/login
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        const response: ApiResponse = {
          success: false,
          message: '사용자명과 비밀번호를 입력하세요',
        };
        return res.status(400).json(response);
      }

      const loginResult = await AuthService.login(username, password);

      const response: ApiResponse = {
        success: true,
        data: loginResult,
        message: '로그인 성공',
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다',
      };
      res.status(401).json(response);
    }
  }

  // POST /api/auth/register
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password, role, fullName } = req.body;

      if (!username || !email || !password) {
        const response: ApiResponse = {
          success: false,
          message: '필수 필드가 누락되었습니다',
        };
        return res.status(400).json(response);
      }

      const registrationResult = await AuthService.register({
        username,
        email,
        password,
        role: role || 'student',
        fullName,
      });

      const response: ApiResponse = {
        success: true,
        data: registrationResult,
        message: '회원가입이 완료되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다',
      };
      res.status(400).json(response);
    }
  }

  // POST /api/auth/logout
  static async logout(req: AuthRequest, res: Response) {
    try {
      // 클라이언트에서 토큰을 제거하도록 안내
      // 실제 토큰 블랙리스트는 Redis 등을 사용해 구현 가능
      const response: ApiResponse = {
        success: true,
        message: '로그아웃되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Logout error:', error);
      const response: ApiResponse = {
        success: false,
        message: '로그아웃 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/auth/me
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const user = await AuthService.getCurrentUser(req.user.userId);

      const response: ApiResponse = {
        success: true,
        data: { user },
      };
      res.json(response);
    } catch (error) {
      console.error('Get current user error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '사용자 정보를 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/auth/refresh
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          message: '리프레시 토큰이 필요합니다',
        };
        return res.status(400).json(response);
      }

      const tokenResult = await AuthService.refreshToken(refreshToken);

      const response: ApiResponse = {
        success: true,
        data: tokenResult,
        message: '토큰이 갱신되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Refresh token error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '토큰 갱신 중 오류가 발생했습니다',
      };
      res.status(401).json(response);
    }
  }

  // POST /api/auth/change-password
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        const response: ApiResponse = {
          success: false,
          message: '현재 비밀번호와 새 비밀번호를 입력하세요',
        };
        return res.status(400).json(response);
      }

      await AuthService.changePassword(req.user.userId, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        message: '비밀번호가 변경되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Change password error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다',
      };
      res.status(400).json(response);
    }
  }
}