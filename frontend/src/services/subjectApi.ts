import { config } from '../config';

// 타입 정의
export interface Subject {
  id: string;
  name: string;
  description?: string;
  grade_level?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  creator?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

export interface CreateSubjectRequest {
  name: string;
  description?: string;
  grade_level?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  description?: string;
  grade_level?: string;
}

export interface Workbook {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade_level?: string;
  estimated_time?: number;
  status: string;
  created_at: string;
  created_by?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

// Export all interfaces
export type { Subject, CreateSubjectRequest, UpdateSubjectRequest, Workbook };

export class SubjectApi {
  private static baseUrl = config.api.baseUrl;

  // 인증 헤더 생성
  private static getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // API 요청 처리
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '요청 처리 중 오류가 발생했습니다');
    }

    return data;
  }

  // 모든 교과목 조회
  static async getSubjects(): Promise<Subject[]> {
    const response = await this.request('/subjects');
    return response.data;
  }

  // 교과목 생성 (관리자 전용)
  static async createSubject(subjectData: CreateSubjectRequest): Promise<Subject> {
    const response = await this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
    return response.data;
  }

  // 교과목 수정 (관리자 전용)
  static async updateSubject(id: string, updateData: UpdateSubjectRequest): Promise<Subject> {
    const response = await this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  // 교과목 삭제 (관리자 전용)
  static async deleteSubject(id: string): Promise<void> {
    await this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // 교과목에 연결된 문제집 조회
  static async getSubjectWorkbooks(subjectId: string): Promise<Workbook[]> {
    const response = await this.request(`/subjects/${subjectId}/workbooks`);
    return response.data;
  }

  // 교과목에 문제집 연결
  static async addWorkbookToSubject(subjectId: string, workbookId: string): Promise<any> {
    const response = await this.request(`/subjects/${subjectId}/workbooks`, {
      method: 'POST',
      body: JSON.stringify({ workbook_id: workbookId }),
    });
    return response.data;
  }

  // 교과목에서 문제집 연결 해제
  static async removeWorkbookFromSubject(subjectId: string, workbookId: string): Promise<void> {
    await this.request(`/subjects/${subjectId}/workbooks/${workbookId}`, {
      method: 'DELETE',
    });
  }
}