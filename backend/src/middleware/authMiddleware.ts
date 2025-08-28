import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, ApiResponse } from '../types';
import { config } from '../config';

export class AuthMiddleware {
  // JWT 토큰 검증 미들웨어
  static authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: '인증 토큰이 필요합니다',
      };
      return res.status(401).json(response);
    }

    try {
      const decoded = (jwt as any).verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      const response: ApiResponse = {
        success: false,
        message: '유효하지 않은 토큰입니다',
      };
      return res.status(403).json(response);
    }
  }

  // 역할 기반 접근 제어 미들웨어
  static requireRole(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      if (!allowedRoles.includes(req.user.role)) {
        const response: ApiResponse = {
          success: false,
          message: '접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      next();
    };
  }

  // 관리자 전용 미들웨어
  static requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    return AuthMiddleware.requireRole('admin')(req, res, next);
  }

  // 교사 이상 권한 미들웨어 (관리자, 교사)
  static requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
    return AuthMiddleware.requireRole('admin', 'teacher')(req, res, next);
  }

  // 본인 또는 관리자만 접근 가능
  static requireOwnerOrAdmin(userIdParam: string = 'id') {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const targetUserId = req.params[userIdParam];
      const isOwner = req.user.userId === targetUserId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        const response: ApiResponse = {
          success: false,
          message: '본인 또는 관리자만 접근 가능합니다',
        };
        return res.status(403).json(response);
      }

      next();
    };
  }

  // 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
  static optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // 토큰이 없어도 계속 진행
    }

    try {
      const decoded = (jwt as any).verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    } catch (error) {
      // 토큰이 유효하지 않아도 계속 진행 (req.user는 undefined 상태)
      console.warn('Invalid token provided:', error);
    }

    next();
  }
}

// 기본 인증 미들웨어를 기본 export로 제공
export const authMiddleware = AuthMiddleware.authenticateToken;