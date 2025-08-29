import { supabase } from '../config/supabase';
import { User, Problem, ProblemSet, ProblemSetProblem } from '../types';

// Export supabase client for direct use
export { supabase };

export class DatabaseService {
  // Export supabase client as static property for direct access
  static supabase = supabase;
  
  // User related operations
  static async createUser(userData: {
    username: string;
    email: string | null;
    passwordHash: string;
    role?: string;
    fullName?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: userData.username,
        email: userData.email, // null 가능
        password_hash: userData.passwordHash,
        role: userData.role || 'student',
        full_name: userData.fullName,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single(); // 관리자 기능에서는 비활성 사용자도 조회 가능

    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUserLastLogin(id: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 관리자용 사용자 목록 조회 (필터링, 페이징 지원)
  static async getUsersWithFilters(filters: {
    role?: string;
    is_active?: boolean;
    search?: string;
  }, limit: number, offset: number) {
    let query = supabase
      .from('users')
      .select('*');

    // 역할 필터
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    // 활성 상태 필터
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // 검색 필터 (username, email, full_name)
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // 관리자용 사용자 수 조회 (필터링 지원)
  static async getUsersCount(filters: {
    role?: string;
    is_active?: boolean;
    search?: string;
  }) {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // 역할 필터
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    // 활성 상태 필터
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // 검색 필터 (username, email, full_name)
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  // Problem related operations
  static async getProblems(filters: {
    page?: number;
    limit?: number;
    subject?: string;
    difficulty?: string;
    topic?: string;
  } = {}) {
    const { page = 1, limit = 10, subject, difficulty, topic } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('problems')
      .select(`
        *,
        created_by_user:users!problems_created_by_fkey(username, full_name)
      `)
      .eq('is_active', true);

    if (subject) query = query.eq('subject', subject);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (topic) query = query.eq('topic', topic);

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  static async getProblemById(id: string) {
    const { data, error } = await supabase
      .from('problems')
      .select(`
        *,
        created_by_user:users!problems_created_by_fkey(username, full_name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async createProblem(problemData: {
    title: string;
    content: string;
    answer?: string;
    explanation?: string;
    imageUrl?: string;
    difficulty: string;
    subject: string;
    topic?: string;
    problemType?: string;
    points?: number;
    createdBy: string;
  }) {
    const { data, error } = await supabase
      .from('problems')
      .insert([{
        title: problemData.title,
        content: problemData.content,
        answer: problemData.answer,
        explanation: problemData.explanation,
        image_url: problemData.imageUrl,
        difficulty: problemData.difficulty,
        subject: problemData.subject,
        topic: problemData.topic,
        problem_type: problemData.problemType || 'multiple_choice',
        points: problemData.points || 1,
        created_by: problemData.createdBy,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProblem(id: string, updates: {
    title?: string;
    content?: string;
    answer?: string;
    explanation?: string;
    imageUrl?: string;
    difficulty?: string;
    subject?: string;
    topic?: string;
    problemType?: string;
    points?: number;
  }) {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.answer !== undefined) updateData.answer = updates.answer;
    if (updates.explanation !== undefined) updateData.explanation = updates.explanation;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.topic !== undefined) updateData.topic = updates.topic;
    if (updates.problemType !== undefined) updateData.problem_type = updates.problemType;
    if (updates.points !== undefined) updateData.points = updates.points;

    const { data, error } = await supabase
      .from('problems')
      .update(updateData)
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProblem(id: string) {
    const { data, error } = await supabase
      .from('problems')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Problem Set related operations
  static async getProblemSets(filters: {
    page?: number;
    limit?: number;
    subject?: string;
    gradeLevel?: string;
  } = {}) {
    const { page = 1, limit = 10, subject, gradeLevel } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('problem_sets')
      .select(`
        *,
        created_by_user:users!problem_sets_created_by_fkey(username, full_name),
        problem_count:problem_set_problems(count)
      `)
      .eq('is_active', true);

    if (subject) query = query.eq('subject', subject);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // problem_count 데이터 변환
    const processedData = (data || []).map(item => ({
      ...item,
      problem_count: item.problem_count?.[0]?.count || 0
    }));

    return {
      data: processedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  static async getProblemSetWithProblems(id: string) {
    const { data, error } = await supabase
      .from('problem_sets')
      .select(`
        *,
        created_by_user:users!problem_sets_created_by_fkey(username, full_name),
        problems:problem_set_problems(
          order_index,
          problem:problems(*)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Solution Records related operations
  static async createSolutionRecord(recordData: {
    userId: string;
    problemId: string;
    problemSetId?: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent?: number;
    attemptNumber?: number;
  }) {
    // 기존 풀이 기록을 조회하여 현재 숙련도 레벨 확인
    const existingRecords = await supabase
      .from('solution_records')
      .select('mastery_level, is_correct')
      .eq('user_id', recordData.userId)
      .eq('problem_id', recordData.problemId)
      .order('submitted_at', { ascending: false })
      .limit(1);

    let currentMasteryLevel = 0;
    if (existingRecords.data && existingRecords.data.length > 0) {
      currentMasteryLevel = existingRecords.data[0].mastery_level || 0;
    }

    // 에빙하우스 망각곡선 기반 다음 복습일 계산
    const { nextReviewDate, masteryLevel } = DatabaseService.calculateNextReview(
      recordData.isCorrect,
      currentMasteryLevel
    );

    const { data, error } = await supabase
      .from('solution_records')
      .insert([{
        user_id: recordData.userId,
        problem_id: recordData.problemId,
        problem_set_id: recordData.problemSetId || null,
        user_answer: recordData.userAnswer,
        is_correct: recordData.isCorrect,
        time_spent: recordData.timeSpent,
        attempt_number: recordData.attemptNumber || 1,
        next_review_date: nextReviewDate,
        mastery_level: masteryLevel,
      }])
      .select()
      .single();

    if (error) throw error;

    // 복습 스케줄 생성 (정답인 경우에만)
    if (recordData.isCorrect && masteryLevel < 4) {
      await DatabaseService.createReviewSchedule({
        userId: recordData.userId,
        problemId: recordData.problemId,
        problemSetId: recordData.problemSetId || null,
        reviewStage: masteryLevel + 1,
        scheduledDate: nextReviewDate.split('T')[0], // YYYY-MM-DD 형식으로 변환
      });
    }

    // 문제집 완료 시 복습 일정 생성 확인
    if (recordData.problemSetId && recordData.isCorrect) {
      try {
        await this.checkAndGenerateWorkbookReviewSchedule(
          recordData.userId,
          recordData.problemSetId
        );
      } catch (scheduleError) {
        // 복습 일정 생성 실패는 로그만 남기고 계속 진행
        console.warn('문제집 복습 일정 생성 실패:', scheduleError);
      }
    }

    return data;
  }

  // 문제집 완료 시 복습 일정 자동 생성
  static async checkAndGenerateWorkbookReviewSchedule(userId: string, problemSetId: string) {
    // 문제집의 총 문제 수 조회
    const { data: problemSetProblems, error: problemsError } = await supabase
      .from('problem_set_problems')
      .select('problem_id')
      .eq('problem_set_id', problemSetId);

    if (problemsError) throw problemsError;
    if (!problemSetProblems || problemSetProblems.length === 0) return;

    const totalProblems = problemSetProblems.length;
    const problemIds = problemSetProblems.map(p => p.problem_id);

    // 사용자가 해당 문제집에서 정답으로 풀이한 문제 수 조회
    const { data: solvedProblems, error: solvedError } = await supabase
      .from('solution_records')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('problem_set_id', problemSetId)
      .eq('is_correct', true)
      .in('problem_id', problemIds);

    if (solvedError) throw solvedError;

    const solvedCount = solvedProblems?.length || 0;
    const completionRate = solvedCount / totalProblems;

    // 80% 이상 완료 시 복습 일정 생성
    if (completionRate >= 0.8) {
      // 이미 생성된 문제집 복습 스케줄이 있는지 확인
      const { data: existingSchedule, error: scheduleCheckError } = await supabase
        .from('review_schedules')
        .select('id')
        .eq('user_id', userId)
        .eq('problem_set_id', problemSetId)
        .limit(1);

      if (scheduleCheckError && scheduleCheckError.code !== 'PGRST116') {
        console.warn('문제집 복습 스케줄 조회 실패:', scheduleCheckError);
      }

      // 이미 스케줄이 없는 경우에만 생성
      if (!existingSchedule || existingSchedule.length === 0) {
        await this.generateWorkbookReviewSchedule(userId, problemSetId, completionRate);
        console.log(`✅ 문제집 복습 일정 생성됨: 사용자 ${userId}, 문제집 ${problemSetId}, 완료율 ${(completionRate * 100).toFixed(1)}%`);
      }
    }
  }


  // 문제집 복습 일정 생성
  static async generateWorkbookReviewSchedule(userId: string, problemSetId: string, completionRate: number) {
    const firstReviewDate = new Date();
    firstReviewDate.setDate(firstReviewDate.getDate() + 1); // 1일 후

    const { data, error } = await supabase
      .from('review_schedules')
      .insert([{
        user_id: userId,
        problem_id: null, // 문제집 복습이므로 개별 문제 ID는 null
        problem_set_id: problemSetId,
        review_stage: 1,
        scheduled_date: firstReviewDate.toISOString().split('T')[0],
        is_completed: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 문제집 복습 대상 조회
  static async getWorkbookReviewTargets(userId: string, params: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('review_schedules')
      .select(`
        *,
        problem_set:problem_sets(
          id,
          title,
          description,
          subject,
          grade_level,
          estimated_time
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', false)
      .is('problem_id', null) // 문제집 복습 (개별 문제가 아님)
      .not('problem_set_id', 'is', null) // 문제집 ID가 있어야 함
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('review_stage', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error && error.code !== 'PGRST116') throw error;

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('review_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lte('next_review_date', today);

    if (countError && countError.code !== 'PGRST116') throw countError;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }

  // 문제집 복습 완료 처리
  static async completeWorkbookReview(scheduleId: string, success: boolean) {
    // 기존 스케줄 조회
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('review_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingSchedule) throw new Error('문제집 복습 스케줄을 찾을 수 없습니다');

    let nextReviewDate = null;
    let newReviewStage = existingSchedule.review_stage;
    let isCompleted = false;

    if (success) {
      // 성공 시 다음 단계로 진행
      newReviewStage = Math.min(existingSchedule.review_stage + 1, 4);
      
      if (newReviewStage <= 4) {
        const reviewIntervals = { 1: 1, 2: 3, 3: 7, 4: 14 };
        const intervalDays = reviewIntervals[newReviewStage as keyof typeof reviewIntervals] || 14;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervalDays);
        nextReviewDate = nextDate.toISOString().split('T')[0];
      }

      if (newReviewStage >= 4) {
        isCompleted = true; // 4단계 완료 시 종료
      }
    } else {
      // 실패 시 1단계로 리셋
      newReviewStage = 1;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      nextReviewDate = nextDate.toISOString().split('T')[0];
    }

    // 스케줄 업데이트
    const { data, error } = await supabase
      .from('review_schedules')
      .update({
        review_stage: newReviewStage,
        scheduled_date: nextReviewDate,
        completed_date: isCompleted ? new Date().toISOString().split('T')[0] : null,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      success,
      stageChanged: newReviewStage !== existingSchedule.review_stage,
      completed: isCompleted,
    };
  }

  // 에빙하우스 망각곡선 기반 다음 복습일 계산
  private static calculateNextReview(isCorrect: boolean, currentMasteryLevel: number): {
    nextReviewDate: string;
    masteryLevel: number;
  } {
    if (!isCorrect) {
      // 틀린 경우: 숙련도 레벨 리셋하고 즉시 복습
      return {
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 0
      };
    }

    // 맞은 경우: 숙련도 레벨 증가
    const newMasteryLevel = Math.min(currentMasteryLevel + 1, 4);
    
    // 에빙하우스 망각곡선 일정 (일 단위)
    const reviewIntervals = {
      1: 1,   // 1일 후
      2: 3,   // 3일 후  
      3: 7,   // 7일 후 (1주일)
      4: 14   // 14일 후 (2주일)
    };

    const intervalDays = reviewIntervals[newMasteryLevel as keyof typeof reviewIntervals] || 1;
    const nextReviewDate = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      nextReviewDate: nextReviewDate.toISOString(),
      masteryLevel: newMasteryLevel
    };
  }

  static async getUserSolutionRecords(userId: string, filters: {
    page?: number;
    limit?: number;
    problemSetId?: string;
    problemId?: string;
  } = {}) {
    const { page = 1, limit = 10, problemSetId, problemId } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('solution_records')
      .select(`
        *,
        problem:problems(title, subject, difficulty),
        problem_set:problem_sets(title)
      `)
      .eq('user_id', userId);

    if (problemSetId) query = query.eq('problem_set_id', problemSetId);
    if (problemId) query = query.eq('problem_id', problemId);

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Review Schedule related operations
  static async getReviewSchedule(userId: string, date: string = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('review_schedules')
      .select(`
        *,
        problem:problems(title, content, subject, difficulty),
        problem_set:problem_sets(title)
      `)
      .eq('user_id', userId)
      .eq('scheduled_date', date)
      .eq('is_completed', false)
      .order('review_stage', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createReviewSchedule(scheduleData: {
    userId: string;
    problemId: string;
    problemSetId: string | null;
    reviewStage: number;
    scheduledDate: string;
  }) {
    const { data, error } = await supabase
      .from('review_schedules')
      .insert([{
        user_id: scheduleData.userId,
        problem_id: scheduleData.problemId,
        problem_set_id: scheduleData.problemSetId,
        review_stage: scheduleData.reviewStage,
        scheduled_date: scheduleData.scheduledDate,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeReviewSchedule(id: string) {
    const { data, error } = await supabase
      .from('review_schedules')
      .update({
        is_completed: true,
        completed_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 오늘의 복습 대상 조회 (에빙하우스 망각곡선 기반)
  static async getTodayReviewTargets(userId: string, params: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];

    // solution_records에서 next_review_date가 오늘 이전이고 mastery_level이 4 미만인 문제들 조회
    const { data, error } = await supabase
      .from('solution_records')
      .select(`
        *,
        problem:problems(
          id,
          title,
          subject,
          difficulty,
          content,
          problem_type,
          answer
        ),
        problem_set:problem_sets(
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .lt('mastery_level', 4)
      .lte('next_review_date', today + 'T23:59:59.999Z')
      .order('next_review_date', { ascending: true })
      .order('mastery_level', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('solution_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lt('mastery_level', 4)
      .lte('next_review_date', today + 'T23:59:59.999Z');

    if (countError) throw countError;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }

  // 특정 풀이 기록 조회
  static async getSolutionRecordById(recordId: string) {
    const { data, error } = await supabase
      .from('solution_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) throw error;
    return data;
  }

  // 복습 이력 기록
  static async createReviewHistory(data: {
    userId: string;
    problemId: string;
    solutionRecordId: string;
    previousMasteryLevel: number;
    newMasteryLevel: number;
    isCorrect: boolean;
    timeSpent?: number;
    confidenceLevel?: number;
    difficultyPerceived?: number;
  }) {
    const { data: result, error } = await supabase
      .from('review_history')
      .insert([{
        user_id: data.userId,
        problem_id: data.problemId,
        solution_record_id: data.solutionRecordId,
        review_session_date: new Date().toISOString().split('T')[0],
        previous_mastery_level: data.previousMasteryLevel,
        new_mastery_level: data.newMasteryLevel,
        is_correct: data.isCorrect,
        time_spent: data.timeSpent,
        confidence_level: data.confidenceLevel,
        difficulty_perceived: data.difficultyPerceived,
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // 우선순위 기반 복습 대상 조회
  static async getReviewTargetsByPriority(userId: string, params: {
    page?: number;
    limit?: number;
    maxOverdueDays?: number;
  } = {}) {
    const { page = 1, limit = 20, maxOverdueDays = 30 } = params;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('review_priority_view')
      .select('*')
      .eq('user_id', userId)
      .lte('overdue_days', maxOverdueDays)
      .order('priority_score', { ascending: true })
      .order('overdue_days', { ascending: false })
      .order('mastery_level', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('review_priority_view')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('overdue_days', maxOverdueDays);

    if (countError) throw countError;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }

  // 일일 복습 통계 조회
  static async getDailyReviewStats(userId: string, targetDate?: string) {
    const date = targetDate || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_review_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('target_date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    
    return data || {
      user_id: userId,
      target_date: date,
      target_review_count: 0,
      completed_review_count: 0,
      correct_answers: 0,
      total_time_spent: 0,
      average_confidence: null,
      efficiency_score: null,
    };
  }

  // 복습 효율성 분석
  static async getReviewEfficiency(userId: string, startDate?: string, endDate?: string) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .rpc('calculate_review_efficiency', {
        p_user_id: userId,
        p_start_date: start,
        p_end_date: end,
      });

    if (error) throw error;
    return data?.[0] || {
      avg_correct_rate: 0,
      avg_time_per_problem: 0,
      mastery_progression_rate: 0,
      total_reviews: 0,
    };
  }

  // 복습 완료 처리 및 다음 복습 일정 업데이트 (개선된 버전)
  static async completeReview(recordId: string, isCorrect: boolean, timeSpent?: number, confidenceLevel?: number, difficultyPerceived?: number) {
    // 기존 풀이 기록 조회
    const { data: existingRecord, error: fetchError } = await supabase
      .from('solution_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingRecord) throw new Error('풀이 기록을 찾을 수 없습니다');

    const previousMasteryLevel = existingRecord.mastery_level;

    // 다음 복습 일정 계산
    const { nextReviewDate, masteryLevel } = this.calculateNextReview(
      isCorrect,
      existingRecord.mastery_level
    );

    // 풀이 기록 업데이트
    const { data, error } = await supabase
      .from('solution_records')
      .update({
        mastery_level: masteryLevel,
        next_review_date: nextReviewDate,
        time_spent: timeSpent || existingRecord.time_spent,
        attempt_number: existingRecord.attempt_number + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;

    // 복습 이력 기록 (새 테이블이 존재할 경우에만)
    try {
      await this.createReviewHistory({
        userId: existingRecord.user_id,
        problemId: existingRecord.problem_id,
        solutionRecordId: recordId,
        previousMasteryLevel,
        newMasteryLevel: masteryLevel,
        isCorrect,
        timeSpent,
        confidenceLevel,
        difficultyPerceived,
      });
    } catch (historyError) {
      // 복습 이력 기록 실패는 로그만 남기고 계속 진행
      console.warn('복습 이력 기록 실패:', historyError);
    }

    return {
      ...data,
      isCorrect,
      masteryLevelChanged: masteryLevel !== existingRecord.mastery_level,
      nextReviewDate,
    };
  }

  // Statistics and Analytics
  static async getUserStats(userId: string) {
    // Get total problems solved
    const { data: totalRecords, error: totalError } = await supabase
      .from('solution_records')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (totalError) throw totalError;

    // Get correct answers
    const { data: correctRecords, error: correctError } = await supabase
      .from('solution_records')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_correct', true);

    if (correctError) throw correctError;

    // Get today's reviews
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReviews, error: reviewError } = await supabase
      .from('review_schedules')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('scheduled_date', today);

    if (reviewError) throw reviewError;

    // Calculate streak (consecutive days of activity)
    // This is a simplified version - in production, you'd want a more robust calculation
    const { data: recentActivity, error: activityError } = await supabase
      .from('solution_records')
      .select('submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(30);

    if (activityError) throw activityError;

    let streak = 0;
    if (recentActivity && recentActivity.length > 0) {
      // Simple streak calculation - count consecutive days
      const dates = recentActivity.map(r => new Date(r.submitted_at).toDateString());
      const uniqueDates = [...new Set(dates)];
      
      let currentDate = new Date();
      for (const dateStr of uniqueDates) {
        const activityDate = new Date(dateStr);
        const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      totalProblems: totalRecords?.length || 0,
      solvedProblems: correctRecords?.length || 0,
      accuracy: totalRecords?.length ? ((correctRecords?.length || 0) / totalRecords.length) * 100 : 0,
      todayReviews: todayReviews?.length || 0,
      streak,
    };
  }

  // Workbook related operations
  static async getWorkbooks(filters: {
    page?: number;
    limit?: number;
    status?: string;
    createdBy?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 10, status, createdBy, search } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('problem_sets')
      .select(`
        *,
        created_by_user:users!problem_sets_created_by_fkey(username, full_name),
        problem_count:problem_set_problems(count)
      `)
      .eq('is_active', true);

    if (status) query = query.eq('status', status);
    if (createdBy) query = query.eq('created_by', createdBy);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // problem_count 데이터 변환
    const processedData = (data || []).map(item => ({
      ...item,
      problem_count: item.problem_count?.[0]?.count || 0
    }));

    return {
      data: processedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  static async getWorkbook(id: string) {
    const { data, error } = await supabase
      .from('problem_sets')
      .select(`
        *,
        created_by_user:users!problem_sets_created_by_fkey(username, full_name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async getWorkbookWithProblems(id: string) {
    const { data, error } = await supabase
      .from('problem_sets')
      .select(`
        *,
        created_by_user:users!problem_sets_created_by_fkey(username, full_name),
        problems:problem_set_problems(
          id,
          order_index,
          problem:problems(*)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    // Sort problems by order
    if (data?.problems) {
      data.problems = data.problems.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    return data;
  }

  static async createWorkbook(workbookData: {
    title: string;
    description?: string;
    subject?: string;
    gradeLevel?: string;
    estimatedTime?: number;
    status?: string;
    createdBy: string;
  }) {
    const { data, error } = await supabase
      .from('problem_sets')
      .insert([{
        title: workbookData.title,
        description: workbookData.description,
        subject: workbookData.subject || 'General', // 기본값 설정 (필수 컬럼)
        grade_level: workbookData.gradeLevel,
        estimated_time: workbookData.estimatedTime,
        status: workbookData.status || 'draft',
        created_by: workbookData.createdBy,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWorkbook(id: string, updates: {
    title?: string;
    description?: string;
    subject?: string;
    gradeLevel?: string;
    estimatedTime?: number;
    status?: string;
  }) {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.gradeLevel !== undefined) updateData.grade_level = updates.gradeLevel;
    if (updates.estimatedTime !== undefined) updateData.estimated_time = updates.estimatedTime;
    if (updates.status !== undefined) updateData.status = updates.status;
    
    // updated_at은 트리거에서 자동 업데이트됨

    const { data, error } = await supabase
      .from('problem_sets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWorkbook(id: string) {
    const { data, error } = await supabase
      .from('problem_sets')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Workbook-Problem relationship operations
  static async addProblemToWorkbook(workbookId: string, problemId: string, order?: number) {
    // Get current max order if order not specified
    if (order === undefined) {
      const { data: maxOrderData } = await supabase
        .from('problem_set_problems')
        .select('order_index')
        .eq('problem_set_id', workbookId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();
      
      order = (maxOrderData?.order_index || 0) + 1;
    }

    const { data, error } = await supabase
      .from('problem_set_problems')
      .insert([{
        problem_set_id: workbookId,
        problem_id: problemId,
        order_index: order,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeProblemFromWorkbook(workbookId: string, problemId: string) {
    const { data, error } = await supabase
      .from('problem_set_problems')
      .delete()
      .eq('problem_set_id', workbookId)
      .eq('problem_id', problemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async reorderWorkbookProblems(workbookId: string, problemOrders: { problemId: string; order: number }[]) {
    const promises = problemOrders.map(({ problemId, order }) =>
      supabase
        .from('problem_set_problems')
        .update({ order_index: order })
        .eq('problem_set_id', workbookId)
        .eq('problem_id', problemId)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw errors[0].error;
    }

    return results.map(result => result.data);
  }

  static async getWorkbookProblems(workbookId: string) {
    const { data, error } = await supabase
      .from('problem_set_problems')
      .select(`
        *,
        problem:problems(*)
      `)
      .eq('problem_set_id', workbookId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 문제집의 총 문제 수 조회
  static async getWorkbookProblemCount(workbookId: string): Promise<number> {
    const { count, error } = await supabase
      .from('problems')
      .select('*', { count: 'exact' })
      .eq('problem_set_id', workbookId);

    if (error) throw error;
    return count || 0;
  }

  // 사용자가 푼 문제집 내 문제들 조회
  static async getWorkbookSolvedProblems(userId: string, workbookId: string) {
    const { data, error } = await supabase
      .from('solution_records')
      .select(`
        problem_id,
        is_correct,
        time_spent,
        attempt_number,
        submitted_at,
        problem:problems!inner(
          id,
          title,
          difficulty,
          points,
          problem_set_id
        )
      `)
      .eq('user_id', userId)
      .eq('is_correct', true)
      .eq('problem.problem_set_id', workbookId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    
    // 중복 문제 제거 (같은 문제를 여러 번 푼 경우 최신 것만)
    const uniqueProblems = data?.reduce((acc, record) => {
      if (!acc.find(item => item.problem_id === record.problem_id)) {
        acc.push(record);
      }
      return acc;
    }, [] as typeof data) || [];

    return uniqueProblems;
  }

  // 모든 문제집 진도 요약 조회
  static async getAllWorkbooksProgress(userId: string) {
    const { data: workbooks, error: workbooksError } = await supabase
      .from('problem_sets')
      .select(`
        id,
        title,
        description,
        created_at
      `);

    if (workbooksError) throw workbooksError;

    const progressData = await Promise.all(
      workbooks?.map(async (workbook) => {
        const totalProblems = await this.getWorkbookProblemCount(workbook.id);
        const solvedProblems = await this.getWorkbookSolvedProblems(userId, workbook.id);
        const progressPercentage = totalProblems > 0 
          ? Math.round((solvedProblems.length / totalProblems) * 100)
          : 0;

        return {
          workbookId: workbook.id,
          title: workbook.title,
          description: workbook.description,
          totalProblems,
          solvedProblems: solvedProblems.length,
          progressPercentage,
          createdAt: workbook.created_at,
        };
      }) || []
    );

    return progressData;
  }

  // Class management methods for Task 11.1

  // Create a new class
  static async createClass(classData: {
    name: string;
    teacher_id?: string;
    grade_level?: string;
    subject?: string;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all classes
  static async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:users!classes_teacher_id_fkey(id, username, full_name),
        student_count:users!users_class_id_fkey(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get classes by teacher ID
  static async getClassesByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('teacher_classes')
      .select(`
        class:classes(
          id,
          name,
          grade_level,
          subject,
          description,
          created_at,
          student_count:users!users_class_id_fkey(count)
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('classes.is_active', true);

    if (error) throw error;
    return data?.map(item => item.class) || [];
  }

  // Get students in a class
  static async getStudentsByClass(classId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, full_name, created_at, last_login')
      .eq('class_id', classId)
      .eq('role', 'student')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Assign teacher to class
  static async assignTeacherToClass(teacherId: string, classId: string) {
    const { data, error } = await supabase
      .from('teacher_classes')
      .insert([{
        teacher_id: teacherId,
        class_id: classId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Remove teacher from class
  static async removeTeacherFromClass(teacherId: string, classId: string) {
    const { error } = await supabase
      .from('teacher_classes')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('class_id', classId);

    if (error) throw error;
    return { success: true };
  }

  // Assign student to class
  static async assignStudentToClass(studentId: string, classId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        class_id: classId,
      })
      .eq('id', studentId)
      .eq('role', 'student')
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Subject management methods

  // Create a new subject
  static async createSubject(subjectData: {
    name: string;
    description?: string;
    grade_level?: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subjectData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all subjects
  static async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        creator:users(id, username, full_name)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Update subject
  static async updateSubject(subjectId: string, updateData: {
    name?: string;
    description?: string;
    grade_level?: string;
  }) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', subjectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete subject (soft delete)
  static async deleteSubject(subjectId: string) {
    const { data, error } = await supabase
      .from('subjects')
      .update({ is_active: false })
      .eq('id', subjectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Workbook assignment methods

  // Create workbook assignment
  static async createWorkbookAssignment(assignmentData: {
    workbook_id: string;
    assigned_by: string;
    assigned_to_type: 'student' | 'class';
    assigned_to_id: string;
    due_date?: string;
  }) {
    const { data, error } = await supabase
      .from('workbook_assignments')
      .insert([assignmentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get workbook assignments for a student
  static async getWorkbookAssignmentsForStudent(studentId: string) {
    const { data: directAssignments, error: directError } = await supabase
      .from('workbook_assignments')
      .select(`
        *,
        workbook:problem_sets(
          id,
          title,
          description,
          subject,
          estimated_time
        ),
        assigner:users(id, username, full_name)
      `)
      .eq('assigned_to_type', 'student')
      .eq('assigned_to_id', studentId)
      .eq('is_active', true);

    if (directError) throw directError;

    // Get class assignments for this student
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('class_id')
      .eq('id', studentId)
      .single();

    if (userError) throw userError;

    let classAssignments = [];
    if (user?.class_id) {
      const { data: classData, error: classError } = await supabase
        .from('workbook_assignments')
        .select(`
          *,
          workbook:problem_sets(
            id,
            title,
            description,
            subject,
            estimated_time
          ),
          assigner:users(id, username, full_name)
        `)
        .eq('assigned_to_type', 'class')
        .eq('assigned_to_id', user.class_id)
        .eq('is_active', true);

      if (classError) throw classError;
      classAssignments = classData || [];
    }

    return [...(directAssignments || []), ...classAssignments];
  }

  // Get workbook assignments created by a teacher
  static async getWorkbookAssignmentsByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('workbook_assignments')
      .select(`
        *,
        workbook:problem_sets(
          id,
          title,
          description,
          subject,
          estimated_time
        ),
        assigned_to_class:classes(id, name),
        assigned_to_student:users(id, username, full_name)
      `)
      .eq('assigned_by', teacherId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get progress statistics for a class
  static async getClassProgressStats(classId: string) {
    const students = await this.getStudentsByClass(classId);
    
    const progressStats = await Promise.all(
      students?.map(async (student) => {
        const assignments = await this.getWorkbookAssignmentsForStudent(student.id);
        const completedCount = await this.getCompletedAssignmentsCount(student.id);
        
        return {
          student,
          totalAssignments: assignments.length,
          completedAssignments: completedCount,
          progressPercentage: assignments.length > 0 
            ? Math.round((completedCount / assignments.length) * 100)
            : 0
        };
      }) || []
    );

    return progressStats;
  }

  // Helper method to get completed assignments count for a student
  private static async getCompletedAssignmentsCount(studentId: string): Promise<number> {
    const assignments = await this.getWorkbookAssignmentsForStudent(studentId);
    let completedCount = 0;

    const allProgress = await this.getAllWorkbooksProgress(studentId);
    
    for (const assignment of assignments) {
      const workbookProgress = allProgress.find(p => p.workbookId === assignment.workbook_id);
      if (workbookProgress && workbookProgress.progressPercentage === 100) {
        completedCount++;
      }
    }

    return completedCount;
  }

  // Update user with email made optional
  static async updateUserWithOptionalEmail(userId: string, updateData: {
    username?: string;
    email?: string | null;
    full_name?: string;
    role?: string;
    class_id?: string | null;
    is_active?: boolean;
    password_hash?: string;
  }) {
    // Filter out undefined values
    const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const { data, error } = await supabase
      .from('users')
      .update(cleanedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}