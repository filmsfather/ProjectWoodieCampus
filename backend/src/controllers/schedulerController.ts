import { Request, Response } from 'express';
import { SchedulerService } from '../services/schedulerService';
import { AuthRequest, ApiResponse } from '../types';
import { DatabaseService } from '../services/databaseService';

export class SchedulerController {
  // 스케줄러 상태 조회
  static async getStatus(req: AuthRequest, res: Response) {
    try {
      const taskStatus = SchedulerService.getTaskStatus();
      
      const response: ApiResponse = {
        success: true,
        message: '스케줄러 상태를 조회했습니다',
        data: {
          tasks: taskStatus,
          totalTasks: taskStatus.length,
          runningTasks: taskStatus.filter(task => task.running).length,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('스케줄러 상태 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '스케줄러 상태 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 수동 작업 실행
  static async runTask(req: AuthRequest, res: Response) {
    try {
      const { taskName } = req.params;
      
      if (!taskName) {
        const response: ApiResponse = {
          success: false,
          message: '작업 이름이 필요합니다',
        };
        return res.status(400).json(response);
      }

      await SchedulerService.runTaskManually(taskName);

      const response: ApiResponse = {
        success: true,
        message: `작업 '${taskName}'이 성공적으로 실행되었습니다`,
        data: { taskName, executedAt: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      console.error('수동 작업 실행 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : '작업 실행에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }

  // 시스템 메트릭 조회
  static async getSystemMetrics(req: AuthRequest, res: Response) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 오늘의 전체 복습 통계 조회
      const { data: todayStats, error: statsError } = await DatabaseService.supabase
        .from('daily_review_stats')
        .select('*')
        .eq('target_date', today);

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('일일 통계 조회 실패:', statsError);
      }

      const stats = todayStats || [];
      const totalUsers = stats.length;
      const totalTargets = stats.reduce((sum: number, stat: any) => sum + (stat.target_review_count || 0), 0);
      const totalCompleted = stats.reduce((sum: number, stat: any) => sum + (stat.completed_review_count || 0), 0);
      const totalCorrect = stats.reduce((sum: number, stat: any) => sum + (stat.correct_answers || 0), 0);
      const completionRate = totalTargets > 0 ? Math.round((totalCompleted / totalTargets) * 100) : 0;
      const accuracyRate = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;

      const response: ApiResponse = {
        success: true,
        message: '시스템 메트릭을 조회했습니다',
        data: {
          date: today,
          users: {
            total: totalUsers,
            active: stats.filter((stat: any) => (stat.completed_review_count || 0) > 0).length,
          },
          reviews: {
            target: totalTargets,
            completed: totalCompleted,
            correct: totalCorrect,
            completionRate: `${completionRate}%`,
            accuracyRate: `${accuracyRate}%`,
          },
          scheduler: {
            tasks: SchedulerService.getTaskStatus(),
          },
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('시스템 메트릭 조회 실패:', error);
      const response: ApiResponse = {
        success: false,
        message: '시스템 메트릭 조회에 실패했습니다',
      };
      return res.status(500).json(response);
    }
  }
}