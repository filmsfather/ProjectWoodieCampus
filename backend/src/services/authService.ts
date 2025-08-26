import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { DatabaseService } from './databaseService';
import { config } from '../config';
import { JwtPayload } from '../types';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  // 비밀번호 해시 생성
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // 비밀번호 검증
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT 토큰 생성
  static generateToken(payload: JwtPayload): string {
    return (jwt as any).sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  // JWT 토큰 검증
  static verifyToken(token: string): JwtPayload {
    return (jwt as any).verify(token, config.jwt.secret) as JwtPayload;
  }

  // 토큰 갱신 (refresh)
  static generateRefreshToken(payload: JwtPayload): string {
    return (jwt as any).sign(payload, config.jwt.secret, {
      expiresIn: '7d',
    });
  }

  // 사용자 로그인
  static async login(username: string, password: string) {
    try {
      // 사용자 조회 (username 또는 email로 검색)
      let user;
      try {
        user = await DatabaseService.getUserByUsername(username);
      } catch (usernameError) {
        // username으로 찾지 못했으면 email로 시도
        try {
          user = await DatabaseService.getUserByEmail(username);
        } catch (emailError) {
          throw new Error('사용자를 찾을 수 없습니다');
        }
      }

      if (!user || !user.is_active) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 비밀번호 검증
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('비밀번호가 올바르지 않습니다');
      }

      // JWT 페이로드 생성
      const payload: JwtPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      // 토큰 생성
      const accessToken = this.generateToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // 최근 로그인 시간 업데이트
      await DatabaseService.updateUserLastLogin(user.id);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 사용자 등록 (관리자가 생성)
  static async register(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    fullName?: string;
  }) {
    try {
      // 중복 사용자 확인
      try {
        await DatabaseService.getUserByUsername(userData.username);
        throw new Error('이미 존재하는 사용자명입니다');
      } catch (error) {
        // 사용자를 찾지 못한 경우가 정상 (중복이 아님)
        if (error instanceof Error && !error.message.includes('사용자를 찾을 수 없습니다')) {
          throw error;
        }
      }

      try {
        await DatabaseService.getUserByEmail(userData.email);
        throw new Error('이미 존재하는 이메일입니다');
      } catch (error) {
        // 사용자를 찾지 못한 경우가 정상 (중복이 아님)
        if (error instanceof Error && !error.message.includes('사용자를 찾을 수 없습니다')) {
          throw error;
        }
      }

      // 비밀번호 해시
      const passwordHash = await this.hashPassword(userData.password);

      // 사용자 생성
      const newUser = await DatabaseService.createUser({
        username: userData.username,
        email: userData.email,
        passwordHash,
        role: userData.role || 'student',
        fullName: userData.fullName,
      });

      return {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.full_name,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 토큰 갱신
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = this.verifyToken(refreshToken) as JwtPayload;
      
      // 사용자가 여전히 활성 상태인지 확인
      const user = await DatabaseService.getUserById(decoded.userId);
      if (!user || !user.is_active) {
        throw new Error('사용자가 비활성화되었습니다');
      }

      // 새 토큰 생성
      const payload: JwtPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      const newAccessToken = this.generateToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      throw new Error('토큰 갱신에 실패했습니다');
    }
  }

  // 비밀번호 변경
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 현재 비밀번호 확인
      const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('현재 비밀번호가 올바르지 않습니다');
      }

      // 새 비밀번호 해시
      const newPasswordHash = await this.hashPassword(newPassword);

      // 비밀번호 업데이트
      await DatabaseService.updateUser(userId, {
        password_hash: newPasswordHash,
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 비밀번호 재설정 (관리자용)
  static async resetPassword(userId: string, newPassword: string) {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 새 비밀번호 해시
      const newPasswordHash = await this.hashPassword(newPassword);

      // 비밀번호 업데이트
      await DatabaseService.updateUser(userId, {
        password_hash: newPasswordHash,
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 현재 사용자 정보 조회
  static async getCurrentUser(userId: string) {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (!user || !user.is_active) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      };
    } catch (error) {
      throw error;
    }
  }

  // 계정 비활성화
  static async deactivateUser(userId: string) {
    try {
      await DatabaseService.updateUser(userId, {
        is_active: false,
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}