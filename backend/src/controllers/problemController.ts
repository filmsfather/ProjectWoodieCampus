import { Request, Response } from 'express';
import { ApiResponse, AuthRequest } from '../types';
import { DatabaseService } from '../services/databaseService';

export class ProblemController {
  // GET /api/problems
  static async getProblems(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, subject, difficulty, topic } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        subject: subject as string,
        difficulty: difficulty as string,
        topic: topic as string,
      };

      const result = await DatabaseService.getProblems(filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (error) {
      console.error('Get problems error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제 목록을 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // GET /api/problems/:id
  static async getProblemById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const problem = await DatabaseService.getProblemById(id);

      if (!problem) {
        const response: ApiResponse = {
          success: false,
          message: '문제를 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: { problem },
      };
      res.json(response);
    } catch (error) {
      console.error('Get problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제를 가져올 수 없습니다',
      };
      res.status(500).json(response);
    }
  }

  // POST /api/problems
  static async createProblem(req: AuthRequest, res: Response) {
    try {
      const { 
        title, 
        content, 
        answer, 
        explanation, 
        imageUrl, 
        difficulty, 
        subject, 
        topic, 
        problemType, 
        points 
      } = req.body;

      if (!title || !content || !difficulty || !subject) {
        const response: ApiResponse = {
          success: false,
          message: '필수 필드(title, content, difficulty, subject)가 누락되었습니다',
        };
        return res.status(400).json(response);
      }

      if (!req.user?.userId) {
        const response: ApiResponse = {
          success: false,
          message: '인증된 사용자가 아닙니다',
        };
        return res.status(401).json(response);
      }

      const problemData = {
        title,
        content,
        answer,
        explanation,
        imageUrl,
        difficulty,
        subject,
        topic,
        problemType,
        points,
        createdBy: req.user.userId,
      };

      const newProblem = await DatabaseService.createProblem(problemData);

      const response: ApiResponse = {
        success: true,
        data: { problem: newProblem },
        message: '문제가 성공적으로 생성되었습니다',
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제 생성 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/problems/:id
  static async updateProblem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { 
        title, 
        content, 
        answer, 
        explanation, 
        imageUrl, 
        difficulty, 
        subject, 
        topic, 
        problemType, 
        points 
      } = req.body;

      const updates = {
        title,
        content,
        answer,
        explanation,
        imageUrl,
        difficulty,
        subject,
        topic,
        problemType,
        points,
      };

      const updatedProblem = await DatabaseService.updateProblem(id, updates);

      const response: ApiResponse = {
        success: true,
        data: { problem: updatedProblem },
        message: '문제가 성공적으로 수정되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Update problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제 수정 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/problems/:id
  static async deleteProblem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await DatabaseService.deleteProblem(id);

      const response: ApiResponse = {
        success: true,
        message: '문제가 성공적으로 삭제되었습니다',
      };
      res.json(response);
    } catch (error) {
      console.error('Delete problem error:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '문제 삭제 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}