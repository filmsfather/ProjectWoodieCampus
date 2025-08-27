import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { AuthRequest, ApiResponse } from '../types';
import { supabase } from '../config/supabase';

export class ReviewController {
  // 오늘의 복습 대상 조회
  static async getTodayReviewTargets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { page, limit } = req.query;
      const result = await DatabaseService.getTodayReviewTargets(userId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        message: '오늘의 복습 대상을 조회했습니다',
        data: result,
      };

      return res.json(response);
    } catch (error) {
      console.error('복습 대상 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '복습 대상 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 복습 완료 처리
  static async completeReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { recordId } = req.params;
      const { isCorrect, timeSpent, confidenceLevel, difficultyPerceived } = req.body;

      if (!recordId || typeof isCorrect !== 'boolean') {
        const response: ApiResponse = {
          success: false,
          message: '풀이 기록 ID와 정답 여부가 필요합니다',
        };
        return res.status(400).json(response);
      }

      // 해당 풀이 기록이 요청한 사용자의 것인지 확인
      const existingRecord = await DatabaseService.getSolutionRecordById(recordId);
      if (!existingRecord || existingRecord.user_id !== userId) {
        const response: ApiResponse = {
          success: false,
          message: '접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      const result = await DatabaseService.completeReview(recordId, isCorrect, timeSpent, confidenceLevel, difficultyPerceived);

      const response: ApiResponse = {
        success: true,
        message: '복습이 완료되었습니다',
        data: {
          masteryLevel: result.mastery_level,
          nextReviewDate: result.nextReviewDate,
          masteryLevelChanged: result.masteryLevelChanged,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('복습 완료 처리 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '복습 완료 처리에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 복습 진행률 조회
  static async getReviewProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const today = new Date().toISOString().split('T')[0];

      // 오늘 복습해야 할 총 개수 조회
      const todayTargets = await DatabaseService.getTodayReviewTargets(userId, { limit: 1000 });
      
      // 각 숙련도별 분포 계산
      const masteryDistribution = {
        level0: 0, // 처음 복습
        level1: 0, // 1일 주기
        level2: 0, // 3일 주기  
        level3: 0, // 7일 주기
        completed: 0, // 완료 (level 4)
      };

      todayTargets.data.forEach((record: any) => {
        const level = record.mastery_level;
        if (level === 0) masteryDistribution.level0++;
        else if (level === 1) masteryDistribution.level1++;
        else if (level === 2) masteryDistribution.level2++;
        else if (level === 3) masteryDistribution.level3++;
      });

      const response: ApiResponse = {
        success: true,
        message: '복습 진행률을 조회했습니다',
        data: {
          todayTotal: todayTargets.pagination.total,
          masteryDistribution,
          reviewDate: today,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('복습 진행률 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '복습 진행률 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 우선순위 기반 복습 대상 조회
  static async getReviewTargetsByPriority(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { page, limit, maxOverdueDays } = req.query;
      const result = await DatabaseService.getReviewTargetsByPriority(userId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        maxOverdueDays: maxOverdueDays ? parseInt(maxOverdueDays as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        message: '우선순위 기반 복습 대상을 조회했습니다',
        data: result,
      };

      return res.json(response);
    } catch (error) {
      console.error('우선순위 복습 대상 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '우선순위 복습 대상 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 일일 복습 통계 조회
  static async getDailyStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { date } = req.query;
      const stats = await DatabaseService.getDailyReviewStats(userId, date as string);

      const response: ApiResponse = {
        success: true,
        message: '일일 복습 통계를 조회했습니다',
        data: stats,
      };

      return res.json(response);
    } catch (error) {
      console.error('일일 복습 통계 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '일일 복습 통계 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 복습 효율성 분석
  static async getEfficiencyAnalysis(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { startDate, endDate } = req.query;
      const efficiency = await DatabaseService.getReviewEfficiency(
        userId,
        startDate as string,
        endDate as string
      );

      const response: ApiResponse = {
        success: true,
        message: '복습 효율성 분석을 완료했습니다',
        data: efficiency,
      };

      return res.json(response);
    } catch (error) {
      console.error('복습 효율성 분석 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '복습 효율성 분석에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 문제집 복습 대상 조회
  static async getWorkbookReviewTargets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { page, limit } = req.query;
      const result = await DatabaseService.getWorkbookReviewTargets(userId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        message: '문제집 복습 대상을 조회했습니다',
        data: result,
      };

      return res.json(response);
    } catch (error) {
      console.error('문제집 복습 대상 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제집 복습 대상 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 문제집 복습 완료 처리
  static async completeWorkbookReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          message: '사용자 인증이 필요합니다',
        };
        return res.status(401).json(response);
      }

      const { scheduleId } = req.params;
      const { success } = req.body;

      if (!scheduleId || typeof success !== 'boolean') {
        const response: ApiResponse = {
          success: false,
          message: '스케줄 ID와 성공 여부가 필요합니다',
        };
        return res.status(400).json(response);
      }

      // 스케줄 소유권 확인
      const { data: schedule, error: scheduleError } = await supabase
        .from('workbook_review_schedules')
        .select('user_id')
        .eq('id', scheduleId)
        .single();

      if (scheduleError || !schedule || schedule.user_id !== userId) {
        const response: ApiResponse = {
          success: false,
          message: '접근 권한이 없습니다',
        };
        return res.status(403).json(response);
      }

      const result = await DatabaseService.completeWorkbookReview(scheduleId, success);

      const response: ApiResponse = {
        success: true,
        message: '문제집 복습이 완료되었습니다',
        data: {
          reviewStage: result.review_stage,
          nextReviewDate: result.next_review_date,
          stageChanged: result.stageChanged,
          completed: result.completed,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('문제집 복습 완료 처리 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '문제집 복습 완료 처리에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }
}