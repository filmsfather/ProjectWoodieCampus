const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface SolutionSubmission {
  problemId: string;
  userAnswer: string;
  timeSpent?: number;
  problemSetId?: string;
}

export interface SolutionResult {
  id: string;
  isCorrect: boolean;
  attemptNumber: number;
  timeSpent: number;
  feedback: string;
  correctAnswer?: string;
  explanation?: string;
  nextReviewDate?: string;
  masteryLevel: number;
}

export interface SolutionRecord {
  id: string;
  problem_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent: number | null;
  attempt_number: number;
  submitted_at: string;
  problem?: {
    title: string;
    subject: string;
    difficulty: string;
  };
  problem_set?: {
    title: string;
  };
}

export interface ProblemStatus {
  isSolved: boolean;
  totalAttempts: number;
  correctAttempts: number;
  latestRecord: SolutionRecord | null;
  bestTime: number | null;
}

export interface WorkbookProgress {
  workbookId: string;
  title?: string;
  description?: string;
  totalProblems: number;
  solvedProblems: number;
  progressPercentage: number;
  problems?: any[];
  createdAt?: string;
}

export class SolutionApi {
  // 답안 제출
  static async submitSolution(submission: SolutionSubmission): Promise<SolutionResult> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/solutions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(submission),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '답안 제출에 실패했습니다');
    }

    return data.data;
  }

  // 사용자 풀이 기록 조회
  static async getUserSolutions(params: {
    page?: number;
    limit?: number;
    problemSetId?: string;
  } = {}): Promise<{
    data: SolutionRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const token = localStorage.getItem('accessToken');
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.problemSetId) searchParams.append('problemSetId', params.problemSetId);

    const response = await fetch(`${API_BASE_URL}/solutions?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '풀이 기록 조회에 실패했습니다');
    }

    return data.data;
  }

  // 특정 문제의 사용자 풀이 상태 확인
  static async getProblemStatus(problemId: string): Promise<ProblemStatus> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/solutions/status/${problemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '문제 풀이 상태 조회에 실패했습니다');
    }

    return data.data;
  }

  // 난이도별 색상 반환
  static getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // 난이도명 한국어 변환
  static getDifficultyName(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  }

  // 시간 포맷팅 (초를 mm:ss 형태로)
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 정확도 계산
  static calculateAccuracy(correctAttempts: number, totalAttempts: number): number {
    if (totalAttempts === 0) return 0;
    return Math.round((correctAttempts / totalAttempts) * 100);
  }

  // 문제집 진도 조회
  static async getWorkbookProgress(workbookId: string): Promise<WorkbookProgress> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/solutions/workbook/${workbookId}/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '문제집 진도 조회에 실패했습니다');
    }

    return data.data;
  }

  // 모든 문제집 진도 요약 조회
  static async getAllWorkbooksProgress(): Promise<WorkbookProgress[]> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/solutions/workbooks/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '전체 문제집 진도 조회에 실패했습니다');
    }

    return data.data;
  }
}

export default SolutionApi;