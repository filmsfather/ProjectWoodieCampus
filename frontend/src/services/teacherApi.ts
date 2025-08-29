import { config } from '../config';

// 타입 정의
export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  grade_level?: number;
  subject?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  teacher?: {
    id: string;
    username: string;
    full_name: string;
  };
  teachers?: {
    id: string;
    username: string;
    full_name: string;
  }[];
  student_count?: number;
}

export interface ClassStats {
  total_students: number;
  active_assignments: number;
  average_progress: number;
  completed_assignments: number;
}

export interface Student {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  class_id?: string;
  created_at: string;
}

export interface CreateClassData {
  name: string;
  grade_level?: number;
  subject?: string;
  description?: string;
}

export interface UpdateClassData {
  name?: string;
  grade_level?: number;
  subject?: string;
  description?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class TeacherApi {
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
      console.error('API Request Error:', error);
      throw error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다');
    }
  }

  // 현재 교사의 담당 반 목록 조회
  static async getMyClasses(): Promise<Class[]> {
    const response = await this.request<Class[]>('/teachers/classes');
    return response.data || [];
  }

  // 특정 교사의 담당 반 목록 조회 (관리자 전용)
  static async getTeacherClassesById(teacherId: string): Promise<Class[]> {
    const response = await this.request<Class[]>(`/teachers/${teacherId}/classes`);
    return response.data || [];
  }

  // 새 반 생성
  static async createClass(classData: CreateClassData): Promise<Class> {
    const response = await this.request<Class>('/teachers/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
    return response.data!;
  }

  // 반 정보 수정
  static async updateClass(classId: string, classData: UpdateClassData): Promise<Class> {
    const response = await this.request<Class>(`/teachers/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
    return response.data!;
  }

  // 반 삭제 (소프트 삭제)
  static async deleteClass(classId: string): Promise<void> {
    await this.request(`/teachers/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  // 교사를 반에 배정 (관리자 전용)
  static async assignTeacherToClass(teacherId: string, classId: string): Promise<any> {
    const response = await this.request(`/teachers/${teacherId}/classes/${classId}`, {
      method: 'POST',
    });
    return response.data;
  }

  // 교사를 반에서 제거 (관리자 전용)
  static async removeTeacherFromClass(teacherId: string, classId: string): Promise<void> {
    await this.request(`/teachers/${teacherId}/classes/${classId}`, {
      method: 'DELETE',
    });
  }
}

export class ClassApi {
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
      console.error('API Request Error:', error);
      throw error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다');
    }
  }

  // 모든 반 목록 조회 (관리자 전용)
  static async getAllClasses(): Promise<Class[]> {
    const response = await this.request<Class[]>('/classes');
    return response.data || [];
  }

  // 특정 반 정보 조회
  static async getClassById(classId: string): Promise<Class> {
    const response = await this.request<Class>(`/classes/${classId}`);
    return response.data!;
  }

  // 반의 학생 목록 조회
  static async getClassStudents(classId: string): Promise<Student[]> {
    const response = await this.request<Student[]>(`/classes/${classId}/students`);
    return response.data || [];
  }

  // 학생을 반에 추가
  static async addStudentToClass(classId: string, studentId: string): Promise<any> {
    const response = await this.request(`/classes/${classId}/students/${studentId}`, {
      method: 'POST',
    });
    return response.data;
  }

  // 학생을 반에서 제거 (관리자 전용)
  static async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    await this.request(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // 학생을 다른 반으로 이동 (관리자 전용)
  static async moveStudentToClass(classId: string, studentId: string): Promise<any> {
    const response = await this.request(`/classes/${classId}/students/${studentId}`, {
      method: 'PUT',
    });
    return response.data;
  }

  // 반 통계 조회
  static async getClassStats(classId: string): Promise<ClassStats> {
    const response = await this.request<ClassStats>(`/classes/${classId}/stats`);
    return response.data!;
  }
}

// 타입들은 이미 각각 export interface로 선언됨

// 기존 방식과의 호환성을 위한 export
export const teacherApi = TeacherApi;
export const classApi = ClassApi;