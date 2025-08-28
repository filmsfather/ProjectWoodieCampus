import { config } from '../config';
import type { Class, CreateClassData, UpdateClassData, Student } from './teacherApi';

// 타입 정의
export interface User {
  id: string;
  username: string;
  email?: string | null;
  role: 'admin' | 'teacher' | 'student';
  fullName?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password: string;
  role?: 'admin' | 'teacher' | 'student';
  fullName?: string;
}

export interface UpdateUserRoleRequest {
  role: 'admin' | 'teacher' | 'student';
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

// API 클래스
export class AdminApi {
  private static baseUrl = config.api.baseUrl;

  // 인증 토큰 가져오기
  private static getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // 공통 헤더 설정
  private static getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // API 요청 래퍼
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 사용자 목록 조회
  static async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  } = {}): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.search) queryParams.append('search', params.search);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.request<UsersResponse>(endpoint);
    return response.data!;
  }

  // 새 사용자 생성
  static async createUser(userData: CreateUserRequest): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data!;
  }

  // 사용자 역할 변경
  static async updateUserRole(userId: string, roleData: UpdateUserRoleRequest): Promise<void> {
    await this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  // 사용자 계정 삭제 (비활성화)
  static async deleteUser(userId: string): Promise<void> {
    await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // 사용자 계정 활성화
  static async activateUser(userId: string): Promise<void> {
    await this.request(`/admin/users/${userId}/activate`, {
      method: 'PUT',
    });
  }

  // 사용자 비밀번호 재설정
  static async resetUserPassword(userId: string, passwordData: ResetPasswordRequest): Promise<void> {
    await this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // =================== 반 관리 (관리자 전용) ===================

  // 모든 반 목록 조회
  static async getAllClasses(): Promise<Class[]> {
    const response = await this.request<Class[]>('/admin/classes');
    return response.data || [];
  }

  // 새 반 생성
  static async createClass(classData: CreateClassData): Promise<Class> {
    const response = await this.request<Class>('/admin/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
    return response.data!;
  }

  // 반 정보 수정
  static async updateClass(classId: string, classData: UpdateClassData): Promise<Class> {
    const response = await this.request<Class>(`/admin/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
    return response.data!;
  }

  // 반 삭제 (소프트 삭제)
  static async deleteClass(classId: string): Promise<void> {
    await this.request(`/admin/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  // =================== 선생님-반 배정 (관리자 전용) ===================

  // 교사를 반에 배정
  static async assignTeacherToClass(teacherId: string, classId: string): Promise<any> {
    const response = await this.request(`/admin/teachers/${teacherId}/classes/${classId}`, {
      method: 'POST',
    });
    return response.data;
  }

  // 교사를 반에서 제거
  static async removeTeacherFromClass(teacherId: string, classId: string): Promise<void> {
    await this.request(`/admin/teachers/${teacherId}/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  // =================== 학생-반 배정 (관리자 전용) ===================

  // 학생을 반에 배정
  static async assignStudentToClass(classId: string, studentId: string): Promise<any> {
    const response = await this.request(`/admin/classes/${classId}/students/${studentId}`, {
      method: 'POST',
    });
    return response.data;
  }

  // 학생을 반에서 제거
  static async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    await this.request(`/admin/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }
}

// 유틸리티 함수들
export const formatRole = (role: string): string => {
  const roleMap = {
    admin: '관리자',
    teacher: '교사',
    student: '학생',
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateRandomPassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};