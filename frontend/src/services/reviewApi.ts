import { config } from '../config';

export interface ReviewTarget {
  id: string;
  user_id: string;
  problem_id: string;
  problem_set_id: string;
  mastery_level: number;
  scheduled_date: string;
  created_at: string;
  updated_at: string;
  problem?: {
    id: string;
    title: string;
    subject: string;
    difficulty: string;
    content: string;
    problem_type: string;
    answer: any;
  };
}

export interface ReviewProgress {
  todayTotal: number;
  masteryDistribution: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    completed: number;
  };
  reviewDate: string;
}

export interface DailyStats {
  date: string;
  totalReviewsCompleted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTimeSpent: number;
  masteryLevelChanges: {
    increased: number;
    decreased: number;
    unchanged: number;
  };
}

export interface WorkbookReviewTarget {
  id: string;
  user_id: string;
  problem_set_id: string;
  review_stage: number;
  next_review_date: string;
  created_at: string;
  updated_at: string;
  problem_set?: {
    id: string;
    title: string;
    description: string;
    subject: string;
    grade_level: number;
    estimated_time: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ReviewApi {
  private static getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // 오늘의 복습 대상 조회
  static async getTodayReviewTargets(page: number = 1, limit: number = 20): Promise<ApiResponse<ReviewTarget[]>> {
    try {
      const response = await fetch(`${config.api.baseUrl}/review/today?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '복습 대상 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('오늘의 복습 대상 조회 실패:', error);
      throw error;
    }
  }

  // 복습 진행률 조회
  static async getReviewProgress(): Promise<ApiResponse<ReviewProgress>> {
    try {
      const response = await fetch(`${config.api.baseUrl}/review/progress`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '복습 진행률 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('복습 진행률 조회 실패:', error);
      throw error;
    }
  }

  // 우선순위 기반 복습 대상 조회
  static async getReviewTargetsByPriority(page: number = 1, limit: number = 20, maxOverdueDays?: number): Promise<ApiResponse<ReviewTarget[]>> {
    try {
      let url = `${config.api.baseUrl}/review/priority?page=${page}&limit=${limit}`;
      if (maxOverdueDays) {
        url += `&maxOverdueDays=${maxOverdueDays}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '우선순위 복습 대상 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('우선순위 복습 대상 조회 실패:', error);
      throw error;
    }
  }

  // 일일 복습 통계 조회
  static async getDailyStats(date?: string): Promise<ApiResponse<DailyStats>> {
    try {
      let url = `${config.api.baseUrl}/review/stats/daily`;
      if (date) {
        url += `?date=${date}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '일일 복습 통계 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('일일 복습 통계 조회 실패:', error);
      throw error;
    }
  }

  // 복습 효율성 분석
  static async getEfficiencyAnalysis(startDate: string, endDate: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/review/efficiency?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '복습 효율성 분석에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('복습 효율성 분석 실패:', error);
      throw error;
    }
  }

  // 문제집 복습 대상 조회
  static async getWorkbookReviewTargets(page: number = 1, limit: number = 20): Promise<ApiResponse<WorkbookReviewTarget[]>> {
    try {
      const response = await fetch(`${config.api.baseUrl}/review/workbooks?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '문제집 복습 대상 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('문제집 복습 대상 조회 실패:', error);
      throw error;
    }
  }

  // 복습 완료 처리
  static async completeReview(recordId: string, isCorrect: boolean, timeSpent?: number, confidenceLevel?: number, difficultyPerceived?: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/review/complete/${recordId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          isCorrect,
          timeSpent,
          confidenceLevel,
          difficultyPerceived
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '복습 완료 처리에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('복습 완료 처리 실패:', error);
      throw error;
    }
  }

  // 문제집 복습 완료 처리
  static async completeWorkbookReview(scheduleId: string, success: boolean): Promise<ApiResponse> {
    try {
      const response = await fetch(`${config.api.baseUrl}/review/workbooks/complete/${scheduleId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ success }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '문제집 복습 완료 처리에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('문제집 복습 완료 처리 실패:', error);
      throw error;
    }
  }
}