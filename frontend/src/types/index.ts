// 사용자 타입
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  createdAt: string;
  updatedAt: string;
}

// 문제 타입
export interface Problem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 문제집 타입
export interface ProblemSet {
  id: string;
  title: string;
  description: string;
  problems: Problem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 풀이 기록 타입
export interface SolutionRecord {
  id: string;
  userId: string;
  problemId: string;
  isCorrect: boolean;
  submittedAt: string;
  nextReviewDate: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}