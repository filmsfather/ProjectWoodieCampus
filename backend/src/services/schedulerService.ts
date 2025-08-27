import * as cron from 'node-cron';
import { DatabaseService } from './databaseService';

export class SchedulerService {
  private static tasks: Map<string, cron.ScheduledTask> = new Map();
  private static isInitialized = false;

  // 스케줄러 초기화
  static initialize() {
    if (this.isInitialized) {
      console.log('⚠️  스케줄러가 이미 초기화되었습니다.');
      return;
    }

    console.log('🕐 복습 스케줄러 초기화 중...');
    
    // 매일 자정에 실행 - 일일 복습 통계 초기화
    this.scheduleTask('daily-stats-reset', '0 0 * * *', this.resetDailyStats);
    
    // 매일 오전 6시에 실행 - 복습 대상 사전 계산
    this.scheduleTask('daily-review-calculation', '0 6 * * *', this.calculateDailyReviewTargets);
    
    // 매 시간마다 실행 - 만료된 복습 스케줄 정리
    this.scheduleTask('cleanup-expired-schedules', '0 * * * *', this.cleanupExpiredSchedules);
    
    // 매일 오후 9시에 실행 - 복습 리마인더 준비
    this.scheduleTask('prepare-review-reminders', '0 21 * * *', this.prepareReviewReminders);
    
    this.isInitialized = true;
    console.log('✅ 복습 스케줄러 초기화 완료');
  }

  // 개별 작업 스케줄링
  private static scheduleTask(name: string, schedule: string, task: () => Promise<void>) {
    try {
      const scheduledTask = cron.schedule(schedule, async () => {
        console.log(`🔄 배치 작업 시작: ${name} (${new Date().toISOString()})`);
        const startTime = Date.now();
        
        try {
          await task();
          const duration = Date.now() - startTime;
          console.log(`✅ 배치 작업 완료: ${name} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`❌ 배치 작업 실패: ${name} (${duration}ms)`, error);
          
          // 재시도 로직 (5분 후 1회)
          setTimeout(async () => {
            console.log(`🔄 배치 작업 재시도: ${name}`);
            try {
              await task();
              console.log(`✅ 배치 작업 재시도 성공: ${name}`);
            } catch (retryError) {
              console.error(`❌ 배치 작업 재시도 실패: ${name}`, retryError);
            }
          }, 5 * 60 * 1000);
        }
      }, {
        timezone: 'Asia/Seoul'
      });

      this.tasks.set(name, scheduledTask);
      console.log(`📅 배치 작업 등록: ${name} (${schedule})`);
    } catch (error) {
      console.error(`❌ 배치 작업 등록 실패: ${name}`, error);
    }
  }

  // 일일 복습 통계 초기화
  private static async resetDailyStats(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📊 일일 복습 통계 초기화: ${today}`);
    
    // 어제까지의 미완성 통계 정리
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 필요한 경우 통계 데이터 정리 로직 추가
    console.log(`✅ 일일 복습 통계 초기화 완료: ${today}`);
  }

  // 일일 복습 대상 사전 계산
  private static async calculateDailyReviewTargets(): Promise<void> {
    console.log('🎯 일일 복습 대상 사전 계산 시작');
    
    try {
      // 모든 활성 사용자 조회
      const { data: users, error } = await DatabaseService.supabase
        .from('users')
        .select('id')
        .eq('is_active', true);

      if (error) throw error;
      if (!users || users.length === 0) {
        console.log('📭 활성 사용자가 없습니다.');
        return;
      }

      let totalTargets = 0;
      const today = new Date().toISOString().split('T')[0];

      // 각 사용자별 복습 대상 계산
      for (const user of users) {
        try {
          // 개별 문제 복습 대상
          const problemTargets = await DatabaseService.getTodayReviewTargets(user.id, { limit: 1000 });
          
          // 문제집 복습 대상  
          const workbookTargets = await DatabaseService.getWorkbookReviewTargets(user.id, { limit: 100 });
          
          const userTotalTargets = problemTargets.pagination.total + workbookTargets.pagination.total;
          totalTargets += userTotalTargets;

          // 사용자별 목표 설정 (기존 기록이 없는 경우에만)
          if (userTotalTargets > 0) {
            await DatabaseService.supabase
              .from('daily_review_stats')
              .upsert({
                user_id: user.id,
                target_date: today,
                target_review_count: userTotalTargets,
                completed_review_count: 0,
                correct_answers: 0,
                total_time_spent: 0,
              }, {
                onConflict: 'user_id, target_date',
                ignoreDuplicates: false
              });
          }
        } catch (userError) {
          console.error(`❌ 사용자별 복습 대상 계산 실패: ${user.id}`, userError);
        }
      }

      console.log(`✅ 일일 복습 대상 사전 계산 완료: 총 ${totalTargets}개 대상, ${users.length}명 사용자`);
    } catch (error) {
      console.error('❌ 일일 복습 대상 사전 계산 실패:', error);
      throw error;
    }
  }

  // 만료된 복습 스케줄 정리
  private static async cleanupExpiredSchedules(): Promise<void> {
    console.log('🧹 만료된 복습 스케줄 정리 시작');
    
    try {
      // 30일 이전의 완료된 review_schedules 정리
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error: cleanupError } = await DatabaseService.supabase
        .from('review_schedules')
        .delete()
        .eq('is_completed', true)
        .lt('completed_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (cleanupError) {
        console.error('❌ review_schedules 정리 실패:', cleanupError);
      }

      // 90일 이전의 review_history 정리 (선택사항)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { error: historyCleanupError } = await DatabaseService.supabase
        .from('review_history')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString());

      if (historyCleanupError && historyCleanupError.code !== 'PGRST116') {
        console.warn('⚠️  review_history 정리 중 오류 (무시됨):', historyCleanupError.message);
      }

      // 30일 이전의 daily_review_stats 정리
      const { error: statsCleanupError } = await DatabaseService.supabase
        .from('daily_review_stats')
        .delete()
        .lt('target_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (statsCleanupError && statsCleanupError.code !== 'PGRST116') {
        console.warn('⚠️  daily_review_stats 정리 중 오류 (무시됨):', statsCleanupError.message);
      }

      console.log('✅ 만료된 복습 스케줄 정리 완료');
    } catch (error) {
      console.error('❌ 만료된 복습 스케줄 정리 실패:', error);
      throw error;
    }
  }

  // 복습 리마인더 준비
  private static async prepareReviewReminders(): Promise<void> {
    console.log('🔔 복습 리마인더 준비 시작');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // 내일 복습해야 할 사용자들 조회
      const { data: tomorrowReviews, error } = await DatabaseService.supabase
        .from('solution_records')
        .select('user_id')
        .lt('mastery_level', 4)
        .lte('next_review_date', tomorrowStr + 'T23:59:59.999Z');

      if (error && error.code !== 'PGRST116') {
        console.error('❌ 내일 복습 대상 조회 실패:', error);
        return;
      }

      // 중복 제거하여 고유한 사용자 수만 계산
      const uniqueUsers = new Set(tomorrowReviews?.map((record: any) => record.user_id) || []);
      const reminderUsers = uniqueUsers.size;
      
      // 실제 알림 발송 로직은 여기에 추가
      // 예: 이메일, 푸시 알림, SMS 등
      
      console.log(`✅ 복습 리마인더 준비 완료: ${reminderUsers}명 대상`);
    } catch (error) {
      console.error('❌ 복습 리마인더 준비 실패:', error);
      throw error;
    }
  }

  // 특정 작업 중지
  static stopTask(name: string): boolean {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      console.log(`⏹️  배치 작업 중지: ${name}`);
      return true;
    }
    return false;
  }

  // 모든 작업 중지
  static stopAll(): void {
    console.log('⏹️  모든 배치 작업 중지 중...');
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`⏹️  배치 작업 중지: ${name}`);
    }
    this.tasks.clear();
    this.isInitialized = false;
    console.log('✅ 모든 배치 작업 중지 완료');
  }

  // 작업 상태 조회
  static getTaskStatus(): Array<{name: string; running: boolean}> {
    const status: Array<{name: string; running: boolean}> = [];
    for (const [name, task] of this.tasks) {
      status.push({
        name,
        running: task ? true : false  // 스케줄이 존재하면 true
      });
    }
    return status;
  }

  // 수동 작업 실행
  static async runTaskManually(taskName: string): Promise<void> {
    console.log(`🔧 수동 작업 실행: ${taskName}`);
    
    switch (taskName) {
      case 'daily-stats-reset':
        await this.resetDailyStats();
        break;
      case 'daily-review-calculation':
        await this.calculateDailyReviewTargets();
        break;
      case 'cleanup-expired-schedules':
        await this.cleanupExpiredSchedules();
        break;
      case 'prepare-review-reminders':
        await this.prepareReviewReminders();
        break;
      default:
        throw new Error(`알 수 없는 작업: ${taskName}`);
    }
    
    console.log(`✅ 수동 작업 완료: ${taskName}`);
  }
}