import { Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { AuthRequest, ApiResponse } from '../types';

export class SolutionController {
  // 답안 제출
  static async submitSolution(req: AuthRequest, res: Response) {
    try {
      const { problemId, userAnswer, timeSpent, problemSetId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      if (!problemId || userAnswer === undefined) {
        const response: ApiResponse = {
          success: false,
          message: '문제 ID와 답안이 필요합니다',
        };
        return res.status(400).json(response);
      }

      // 문제 정보 조회
      const problem = await DatabaseService.getProblemById(problemId);
      if (!problem) {
        const response: ApiResponse = {
          success: false,
          message: '문제를 찾을 수 없습니다',
        };
        return res.status(404).json(response);
      }

      // 답안 검증
      const isCorrect = SolutionController.validateAnswer(
        userAnswer.toString().trim(),
        problem.answer || '',
        problem.problem_type
      );

      // 기존 시도 횟수 확인
      const existingRecords = await DatabaseService.getUserSolutionRecords(userId, {
        problemId,
        limit: 1000, // 모든 기록 조회
      });
      
      const attemptNumber = existingRecords.data.filter(record => 
        record.problem_id === problemId
      ).length + 1;

      // 풀이 기록 저장
      const solutionRecord = await DatabaseService.createSolutionRecord({
        userId,
        problemId,
        problemSetId,
        userAnswer: userAnswer.toString(),
        isCorrect,
        timeSpent: timeSpent || null,
        attemptNumber,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          id: solutionRecord.id,
          isCorrect,
          attemptNumber,
          timeSpent: timeSpent || 0,
          feedback: isCorrect ? '정답입니다!' : '틀렸습니다.',
          correctAnswer: problem.answer,
          explanation: problem.explanation,
          nextReviewDate: solutionRecord.next_review_date,
          masteryLevel: solutionRecord.mastery_level,
        },
        message: isCorrect ? '정답입니다!' : '틀렸습니다. 다시 도전해보세요!',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('답안 제출 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '답안 제출 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // 사용자별 풀이 기록 조회
  static async getUserSolutions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10, problemSetId } = req.query;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const result = await DatabaseService.getUserSolutionRecords(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        problemSetId: problemSetId as string,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      console.error('풀이 기록 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '풀이 기록 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // 특정 문제의 사용자 풀이 상태 확인
  static async getUserProblemStatus(req: AuthRequest, res: Response) {
    try {
      const { problemId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const records = await DatabaseService.getUserSolutionRecords(userId, {
        limit: 1000,
      });

      const problemRecords = records.data.filter(record => record.problem_id === problemId);
      const latestRecord = problemRecords.length > 0 ? problemRecords[0] : null;
      const totalAttempts = problemRecords.length;
      const correctAttempts = problemRecords.filter(record => record.is_correct).length;
      const isSolved = correctAttempts > 0;

      const response: ApiResponse = {
        success: true,
        data: {
          isSolved,
          totalAttempts,
          correctAttempts,
          latestRecord,
          bestTime: problemRecords
            .filter(record => record.is_correct && record.time_spent)
            .sort((a, b) => (a.time_spent || 0) - (b.time_spent || 0))[0]?.time_spent || null,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('문제 풀이 상태 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제 풀이 상태 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // 답안 검증 로직
  private static validateAnswer(userAnswer: string, correctAnswer: string, problemType: string): boolean {
    if (!correctAnswer) {
      // 정답이 설정되지 않은 경우 (주관식 등) 임시로 true 반환
      return true;
    }

    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();

    switch (problemType) {
      case 'multiple_choice':
        // 객관식: 정확히 일치해야 함
        return normalizedUserAnswer === normalizedCorrectAnswer;
      
      case 'true_false':
        // O/X 문제: true/false, 참/거짓, O/X 등 다양한 형태 허용
        const truePatterns = ['true', '참', 'o', 'yes', '맞다', '1'];
        const falsePatterns = ['false', '거짓', 'x', 'no', '틀리다', '0'];
        
        const userIsTrue = truePatterns.includes(normalizedUserAnswer);
        const userIsFalse = falsePatterns.includes(normalizedUserAnswer);
        const correctIsTrue = truePatterns.includes(normalizedCorrectAnswer);
        const correctIsFalse = falsePatterns.includes(normalizedCorrectAnswer);
        
        return (userIsTrue && correctIsTrue) || (userIsFalse && correctIsFalse);
      
      case 'short_answer':
        // 단답형: 공백 제거 후 일치 확인
        return normalizedUserAnswer === normalizedCorrectAnswer;
      
      case 'essay':
        // 서술형: 키워드 포함 여부 또는 수동 채점 필요
        // 임시로 키워드 포함 여부로 판단
        const keywords = normalizedCorrectAnswer.split(/\s+|,|;/);
        return keywords.some(keyword => 
          keyword.trim() && normalizedUserAnswer.includes(keyword.trim())
        );
      
      default:
        // 기본적으로 정확히 일치하는지 확인
        return normalizedUserAnswer === normalizedCorrectAnswer;
    }
  }

  // 문제집 진도 계산
  static async getWorkbookProgress(req: AuthRequest, res: Response) {
    try {
      const { workbookId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      // 문제집의 총 문제 수 조회
      const totalProblems = await DatabaseService.getWorkbookProblemCount(workbookId);
      
      if (totalProblems === 0) {
        const response: ApiResponse = {
          success: true,
          data: {
            workbookId,
            totalProblems: 0,
            solvedProblems: 0,
            progressPercentage: 0,
            problems: []
          },
        };
        return res.json(response);
      }

      // 사용자가 푼 문제들 조회
      const solvedProblems = await DatabaseService.getWorkbookSolvedProblems(userId, workbookId);
      const progressPercentage = Math.round((solvedProblems.length / totalProblems) * 100);

      const response: ApiResponse = {
        success: true,
        data: {
          workbookId,
          totalProblems,
          solvedProblems: solvedProblems.length,
          progressPercentage,
          problems: solvedProblems,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('문제집 진도 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제집 진도 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }

  // 모든 문제집 진도 요약 조회
  static async getAllWorkbooksProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const workbooksProgress = await DatabaseService.getAllWorkbooksProgress(userId);

      const response: ApiResponse = {
        success: true,
        data: workbooksProgress,
      };

      res.json(response);
    } catch (error) {
      console.error('전체 문제집 진도 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '전체 문제집 진도 조회 중 오류가 발생했습니다',
      };
      res.status(500).json(response);
    }
  }
}