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

// 문제 타입
export interface Problem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 문제집 타입
export interface Workbook {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 문제집-문제 매핑 타입
export interface WorkbookProblem {
  id: string;
  workbookId: string;
  problemId: string;
  order: number;
  createdAt: Date;
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