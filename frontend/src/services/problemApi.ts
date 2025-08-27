import { config } from '../config';

export interface Problem {
  id?: string;
  title: string;
  content: string;
  answer?: string;
  explanation?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic?: string;
  problemType: 'multiple_choice' | 'short_answer' | 'true_false' | 'fill_blank';
  points?: number;
  choices?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProblemRequest {
  title: string;
  content: string;
  answer?: string;
  explanation?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic?: string;
  problemType: 'multiple_choice' | 'short_answer' | 'true_false' | 'fill_blank';
  points?: number;
  choices?: string[];
}

export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: string;
}

export interface ProblemsResponse {
  data: Problem[];
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

export class ProblemApi {
  private static baseUrl = config.api.baseUrl;

  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // 문제 목록 조회
  static async getProblems(params: {
    page?: number;
    limit?: number;
    subject?: string;
    difficulty?: string;
    topic?: string;
  } = {}): Promise<ProblemsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.subject) queryParams.append('subject', params.subject);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.topic) queryParams.append('topic', params.topic);

    const endpoint = `/problems${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
    });

    const result: ApiResponse<ProblemsResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제 목록을 가져올 수 없습니다');
    }

    return result.data!;
  }

  // 문제 상세 조회
  static async getProblem(id: string): Promise<Problem> {
    const response = await fetch(`${this.baseUrl}/problems/${id}`, {
      headers: this.getHeaders(),
    });

    const result: ApiResponse<{ problem: Problem }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제를 가져올 수 없습니다');
    }

    return result.data!.problem;
  }

  // 문제 생성
  static async createProblem(problemData: CreateProblemRequest): Promise<Problem> {
    const response = await fetch(`${this.baseUrl}/problems`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(problemData),
    });

    const result: ApiResponse<{ problem: Problem }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제 생성에 실패했습니다');
    }

    return result.data!.problem;
  }

  // 문제 수정
  static async updateProblem(id: string, updates: Partial<CreateProblemRequest>): Promise<Problem> {
    const response = await fetch(`${this.baseUrl}/problems/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const result: ApiResponse<{ problem: Problem }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제 수정에 실패했습니다');
    }

    return result.data!.problem;
  }

  // 문제 삭제
  static async deleteProblem(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/problems/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '문제 삭제에 실패했습니다');
    }
  }

  // 문제 유형별 기본값
  static getDefaultProblem(type: Problem['problemType']): Partial<CreateProblemRequest> {
    const defaults: Record<Problem['problemType'], Partial<CreateProblemRequest>> = {
      multiple_choice: {
        problemType: 'multiple_choice',
        choices: ['', '', '', ''],
        points: 1,
      },
      short_answer: {
        problemType: 'short_answer',
        points: 2,
      },
      true_false: {
        problemType: 'true_false',
        choices: ['참', '거짓'],
        points: 1,
      },
      fill_blank: {
        problemType: 'fill_blank',
        points: 1,
      },
    };

    return defaults[type] || {};
  }

  // 문제 유형 한국어 이름
  static getProblemTypeName(type: Problem['problemType']): string {
    const names: Record<Problem['problemType'], string> = {
      multiple_choice: '객관식',
      short_answer: '단답형',
      true_false: '참/거짓',
      fill_blank: '빈칸 채우기',
    };

    return names[type] || type;
  }

  // 난이도 한국어 이름
  static getDifficultyName(difficulty: Problem['difficulty']): string {
    const names: Record<Problem['difficulty'], string> = {
      easy: '쉬움',
      medium: '보통',
      hard: '어려움',
    };

    return names[difficulty] || difficulty;
  }
}