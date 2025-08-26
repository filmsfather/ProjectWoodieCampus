import { Request, Response } from 'express';
import { ApiResponse, AuthRequest } from '../types';

export class ProblemController {
  // GET /api/problems
  static async getProblems(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, subject, difficulty } = req.query;

      // TODO: 실제 데이터베이스 조회
      const mockProblems = [
        {
          id: '1',
          title: '삼차방정식의 해',
          content: '다음 삼차방정식을 풀어보세요: x³ - 6x² + 11x - 6 = 0',
          difficulty: 'medium',
          subject: '수학',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '2',
          title: '영어 문법 - 관계대명사',
          content: '다음 문장에서 적절한 관계대명사를 선택하세요.',
          difficulty: 'easy',
          subject: '영어',
          createdAt: '2025-01-02',
          updatedAt: '2025-01-02',
        },
      ];

      const response: ApiResponse = {
        success: true,
        data: {
          problems: mockProblems,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: mockProblems.length,
            totalPages: Math.ceil(mockProblems.length / Number(limit)),
          },
        },
      };
      res.json(response);
    } catch (error) {
      console.error('Get problems error:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제 목록을 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/problems/:id
  static async getProblemById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // TODO: 실제 데이터베이스 조회
      const mockProblem = {
        id,
        title: '삼차방정식의 해',
        content: '다음 삼차방정식을 풀어보세요: x³ - 6x² + 11x - 6 = 0',
        difficulty: 'medium',
        subject: '수학',
        imageUrl: null,
        createdBy: 'teacher1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const response: ApiResponse = {
        success: true,
        data: { problem: mockProblem },
      };
      res.json(response);
    } catch (error) {
      console.error('Get problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제를 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/problems
  static async createProblem(req: AuthRequest, res: Response) {
    try {
      const { title, content, difficulty, subject, imageUrl } = req.body;

      if (!title || !content || !difficulty || !subject) {
        const response: ApiResponse = {
          success: false,
          message: '필수 필드가 누락되었습니다',
        };
        return res.status(400).json(response);
      }

      // TODO: 실제 데이터베이스 저장
      const newProblem = {
        id: `problem_${Date.now()}`,
        title,
        content,
        difficulty,
        subject,
        imageUrl: imageUrl || null,
        createdBy: req.user?.userId || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response: ApiResponse = {
        success: true,
        data: { problem: newProblem },
        message: '문제가 생성되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제 생성 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/problems/:id
  static async updateProblem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, difficulty, subject, imageUrl } = req.body;

      // TODO: 실제 데이터베이스 업데이트
      const updatedProblem = {
        id,
        title,
        content,
        difficulty,
        subject,
        imageUrl,
        updatedAt: new Date().toISOString(),
      };

      const response: ApiResponse = {
        success: true,
        data: { problem: updatedProblem },
        message: '문제가 수정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Update problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제 수정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/problems/:id
  static async deleteProblem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // TODO: 실제 데이터베이스 삭제
      const response: ApiResponse = {
        success: true,
        message: '문제가 삭제되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Delete problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}