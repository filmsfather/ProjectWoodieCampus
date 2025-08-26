import { config } from '../config';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      fullName?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 토큰을 로컬스토리지에 저장
        console.log('🔍 AuthService - 받은 데이터:', data);
        console.log('🔍 AuthService - 사용자 정보:', data.data?.user);
        console.log('🔍 AuthService - 토큰 정보:', data.data?.tokens);
        
        if (data.data?.tokens?.accessToken) {
          localStorage.setItem('accessToken', data.data.tokens.accessToken);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          console.log('🔍 AuthService - localStorage 저장 완료');
        } else {
          console.log('🔍 AuthService - 토큰을 찾을 수 없음');
        }
        return data;
      } else {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  static getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}