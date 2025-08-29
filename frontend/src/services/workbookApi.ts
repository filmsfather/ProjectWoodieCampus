import { config } from '../config';

export interface Workbook {
  id?: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  created_by_user?: {
    username: string;
    full_name?: string;
  };
  problem_count?: number;
}

export interface WorkbookProblem {
  id: string;
  workbookId: string;
  problemId: string;
  order: number;
  createdAt: string;
  problem?: {
    id: string;
    title: string;
    content: string;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    topic?: string;
    points?: number;
  };
}

export interface CreateWorkbookRequest {
  title: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateWorkbookRequest extends Partial<CreateWorkbookRequest> {
  id: string;
}

export interface WorkbooksResponse {
  data: Workbook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

export class WorkbookApi {
  private static baseUrl = config.api.baseUrl;

  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // 문제집 목록 조회
  static async getWorkbooks(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<WorkbooksResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const endpoint = `/workbooks${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
    });

    const result: ApiResponse<WorkbooksResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집 목록을 가져올 수 없습니다');
    }

    return result.data!;
  }

  // 문제집 상세 조회
  static async getWorkbook(id: string): Promise<Workbook> {
    const response = await fetch(`${this.baseUrl}/workbooks/${id}`, {
      headers: this.getHeaders(),
    });

    const result: ApiResponse<{ workbook: Workbook }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집을 가져올 수 없습니다');
    }

    return result.data!.workbook;
  }

  // 문제집과 문제들 함께 조회
  static async getWorkbookWithProblems(id: string): Promise<Workbook & { problems?: WorkbookProblem[] }> {
    const response = await fetch(`${this.baseUrl}/workbooks/${id}/problems`, {
      headers: this.getHeaders(),
    });

    const result: ApiResponse<{ workbook: Workbook & { problems?: WorkbookProblem[] } }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집 상세 정보를 가져올 수 없습니다');
    }

    return result.data!.workbook;
  }

  // 문제집 생성
  static async createWorkbook(workbookData: CreateWorkbookRequest): Promise<Workbook> {
    const response = await fetch(`${this.baseUrl}/workbooks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(workbookData),
    });

    const result: ApiResponse<{ workbook: Workbook }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집 생성에 실패했습니다');
    }

    return result.data!.workbook;
  }

  // 문제집 수정
  static async updateWorkbook(id: string, updates: Partial<CreateWorkbookRequest>): Promise<Workbook> {
    const response = await fetch(`${this.baseUrl}/workbooks/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const result: ApiResponse<{ workbook: Workbook }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집 수정에 실패했습니다');
    }

    return result.data!.workbook;
  }

  // 문제집 삭제
  static async deleteWorkbook(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workbooks/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집 삭제에 실패했습니다');
    }
  }

  // 문제집에 문제 추가
  static async addProblemToWorkbook(workbookId: string, problemId: string, order?: number): Promise<WorkbookProblem> {
    const response = await fetch(`${this.baseUrl}/workbooks/${workbookId}/problems`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ problemId, order }),
    });

    const result: ApiResponse<{ workbookProblem: WorkbookProblem }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집에 문제를 추가할 수 없습니다');
    }

    return result.data!.workbookProblem;
  }

  // 문제집에서 문제 제거
  static async removeProblemFromWorkbook(workbookId: string, problemId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workbooks/${workbookId}/problems/${problemId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제집에서 문제를 제거할 수 없습니다');
    }
  }

  // 문제집 내 문제 순서 변경
  static async reorderWorkbookProblems(workbookId: string, problemOrders: { problemId: string; order: number }[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workbooks/${workbookId}/reorder`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ problemOrders }),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제 순서를 변경할 수 없습니다');
    }
  }

  // 상태 한국어 이름
  static getStatusName(status: Workbook['status']): string {
    const names: Record<Workbook['status'], string> = {
      draft: '임시 저장',
      published: '배포됨',
      archived: '보관됨',
    };

    return names[status] || status;
  }

  // 상태 색상 클래스
  static getStatusColor(status: Workbook['status']): string {
    const colors: Record<Workbook['status'], string> = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // 학생 목록 조회
  static async getStudents(search?: string): Promise<Student[]> {
    const searchParams = new URLSearchParams();
    if (search) {
      searchParams.append('search', search);
    }

    const response = await fetch(`${config.apiUrl}/api/users/students?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('학생 목록 조회 실패');
    }

    const result = await response.json();
    return result.data || [];
  }

  // 교사가 담당하는 반 목록 조회
  static async getTeacherClasses(): Promise<TeacherClass[]> {
    const response = await fetch(`${config.apiUrl}/api/classes/teacher`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('반 목록 조회 실패');
    }

    const result = await response.json();
    return result.data || [];
  }

  // 특정 반의 학생 목록 조회
  static async getStudentsByClass(classId: string): Promise<Student[]> {
    const response = await fetch(`${config.apiUrl}/api/classes/${classId}/students`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('반 학생 목록 조회 실패');
    }

    const result = await response.json();
    return result.data || [];
  }

  // 학생 그룹 목록 조회
  static async getStudentGroups(): Promise<StudentGroup[]> {
    const response = await fetch(`${config.apiUrl}/api/groups/student`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('그룹 목록 조회 실패');
    }

    const result = await response.json();
    return result.data || [];
  }

  // 학생 그룹 생성
  static async createStudentGroup(data: { name: string; description?: string; studentIds: string[] }): Promise<StudentGroup> {
    const response = await fetch(`${config.apiUrl}/api/groups/student`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('그룹 생성 실패');
    }

    const result = await response.json();
    return result.data.group;
  }

  // 문제집 배포
  static async assignWorkbook(workbookId: string, data: {
    targetType: 'individual' | 'group' | 'class';
    targetIds: string[];
    scheduledFor?: string;
    dueDate?: string;
    allowLateSubmission?: boolean;
    showCorrectAnswers?: boolean;
    maxAttempts?: number;
  }): Promise<any> {
    const response = await fetch(`${config.apiUrl}/api/workbooks/${workbookId}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '문제집 배포 실패');
    }

    const result = await response.json();
    return result.data;
  }
}

// 추가 타입 정의
export interface Student {
  id: string;
  username: string;
  full_name?: string;
  class_id?: string;
  class_name?: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  description?: string;
  student_count: number;
  created_by?: string;
}

export interface TeacherClass {
  id: string;
  name: string;
  grade_level?: string;
  student_count: number;
}