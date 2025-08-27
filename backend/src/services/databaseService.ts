import { supabase } from '../config/supabase';
import { User, Problem, Workbook, WorkbookProblem } from '../types';

// Export supabase client for direct use
export { supabase };

export class DatabaseService {
  // User related operations
  static async createUser(userData: {
    username: string;
    email: string;
    passwordHash: string;
    role?: string;
    fullName?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: userData.username,
        email: userData.email,
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
    const { data, error } = await supabase
      .from('solution_records')
      .insert([{
        user_id: recordData.userId,
        problem_id: recordData.problemId,
        problem_set_id: recordData.problemSetId,
        user_answer: recordData.userAnswer,
        is_correct: recordData.isCorrect,
        time_spent: recordData.timeSpent,
        attempt_number: recordData.attemptNumber || 1,
        next_review_date: recordData.isCorrect 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1일 후
          : new Date().toISOString(), // 틀렸으면 즉시 다시 복습
        mastery_level: recordData.isCorrect ? 1 : 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserSolutionRecords(userId: string, filters: {
    page?: number;
    limit?: number;
    problemSetId?: string;
  } = {}) {
    const { page = 1, limit = 10, problemSetId } = filters;
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
    problemSetId: string;
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
      .from('workbooks')
      .select(`
        *,
        created_by_user:users!workbooks_created_by_fkey(username, full_name),
        problem_count:workbook_problems(count)
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

  static async getWorkbook(id: string) {
    const { data, error } = await supabase
      .from('workbooks')
      .select(`
        *,
        created_by_user:users!workbooks_created_by_fkey(username, full_name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async getWorkbookWithProblems(id: string) {
    const { data, error } = await supabase
      .from('workbooks')
      .select(`
        *,
        created_by_user:users!workbooks_created_by_fkey(username, full_name),
        problems:workbook_problems(
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
      data.problems = data.problems.sort((a, b) => a.order_index - b.order_index);
    }

    return data;
  }

  static async createWorkbook(workbookData: {
    title: string;
    description?: string;
    status?: string;
    createdBy: string;
  }) {
    const { data, error } = await supabase
      .from('workbooks')
      .insert([{
        title: workbookData.title,
        description: workbookData.description,
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
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('workbooks')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWorkbook(id: string) {
    const { data, error } = await supabase
      .from('workbooks')
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
        .from('workbook_problems')
        .select('order_index')
        .eq('workbook_id', workbookId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();
      
      order = (maxOrderData?.order_index || 0) + 1;
    }

    const { data, error } = await supabase
      .from('workbook_problems')
      .insert([{
        workbook_id: workbookId,
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
      .from('workbook_problems')
      .delete()
      .eq('workbook_id', workbookId)
      .eq('problem_id', problemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async reorderWorkbookProblems(workbookId: string, problemOrders: { problemId: string; order: number }[]) {
    const promises = problemOrders.map(({ problemId, order }) =>
      supabase
        .from('workbook_problems')
        .update({ order_index: order })
        .eq('workbook_id', workbookId)
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
      .from('workbook_problems')
      .select(`
        *,
        problem:problems(*)
      `)
      .eq('workbook_id', workbookId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}