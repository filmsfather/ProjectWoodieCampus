import { Request } from 'express';

// 사용자 타입 (데이터베이스 직접 매핑)
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  role: 'admin' | 'teacher' | 'student';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

// 문제 타입 (problems 테이블)
export interface Problem {
  id: string;
  title: string;
  content: string;
  answer?: string;
  explanation?: string;
  image_url?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic?: string;
  problem_type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  points: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// 문제집 타입 (problem_sets 테이블)
export interface ProblemSet {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade_level?: string;
  estimated_time?: number;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// 문제집-문제 매핑 타입 (problem_set_problems 테이블)
export interface ProblemSetProblem {
  id: string;
  problem_set_id: string;
  problem_id: string;
  order_index: number;
  created_at: Date;
}

// JWT 페이로드 타입
export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

// 인증된 요청 타입
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}