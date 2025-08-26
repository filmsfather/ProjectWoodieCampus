-- Woodie Campus Database Schema for Supabase
-- 에빙하우스 망각곡선 기반 학습 플랫폼

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for reset)
DROP TABLE IF EXISTS solution_records CASCADE;
DROP TABLE IF EXISTS review_schedules CASCADE;
DROP TABLE IF EXISTS problem_set_problems CASCADE;
DROP TABLE IF EXISTS problem_sets CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table - 사용자 정보
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Problems table - 문제 정보
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    explanation TEXT,
    image_url VARCHAR(500),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(100),
    problem_type VARCHAR(50) DEFAULT 'multiple_choice' CHECK (problem_type IN ('multiple_choice', 'short_answer', 'essay', 'true_false')),
    points INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Problem Sets table - 문제집 정보
CREATE TABLE problem_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20),
    estimated_time INTEGER, -- minutes
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Problem Set Problems junction table - 문제집-문제 매핑
CREATE TABLE problem_set_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_set_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_set_id, problem_id),
    UNIQUE(problem_set_id, order_index)
);

-- Solution Records table - 풀이 기록
CREATE TABLE solution_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    problem_set_id UUID REFERENCES problem_sets(id) ON DELETE SET NULL,
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER, -- seconds
    attempt_number INTEGER DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 복습 관련 필드
    next_review_date TIMESTAMP WITH TIME ZONE,
    review_count INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 4)
);

-- Review Schedules table - 복습 스케줄 (에빙하우스 망각곡선)
CREATE TABLE review_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    problem_set_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    
    -- 복습 단계 (1일, 3일, 7일, 14일)
    review_stage INTEGER DEFAULT 1 CHECK (review_stage >= 1 AND review_stage <= 4),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    is_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_problems_subject ON problems(subject);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_created_by ON problems(created_by);
CREATE INDEX idx_problems_topic ON problems(topic);

CREATE INDEX idx_problem_sets_subject ON problem_sets(subject);
CREATE INDEX idx_problem_sets_created_by ON problem_sets(created_by);

CREATE INDEX idx_problem_set_problems_set ON problem_set_problems(problem_set_id);
CREATE INDEX idx_problem_set_problems_problem ON problem_set_problems(problem_id);

CREATE INDEX idx_solution_records_user ON solution_records(user_id);
CREATE INDEX idx_solution_records_problem ON solution_records(problem_id);
CREATE INDEX idx_solution_records_next_review ON solution_records(next_review_date);
CREATE INDEX idx_solution_records_submitted ON solution_records(submitted_at);

CREATE INDEX idx_review_schedules_user ON review_schedules(user_id);
CREATE INDEX idx_review_schedules_scheduled ON review_schedules(scheduled_date);
CREATE INDEX idx_review_schedules_completed ON review_schedules(is_completed);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic updated_at updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_sets_updated_at BEFORE UPDATE ON problem_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_schedules_updated_at BEFORE UPDATE ON review_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_set_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Problems: All authenticated users can read, teachers and admins can modify
CREATE POLICY "Authenticated users can view problems" ON problems
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can manage problems" ON problems
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('teacher', 'admin')
    ));

-- Problem Sets: All authenticated users can read, teachers and admins can modify
CREATE POLICY "Authenticated users can view problem sets" ON problem_sets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can manage problem sets" ON problem_sets
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('teacher', 'admin')
    ));

-- Solution Records: Users can access their own records, teachers can access all
CREATE POLICY "Users can view own solution records" ON solution_records
    FOR SELECT USING (auth.uid()::text = user_id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('teacher', 'admin')));

CREATE POLICY "Users can insert own solution records" ON solution_records
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own solution records" ON solution_records
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Review Schedules: Users can access their own schedules
CREATE POLICY "Users can manage own review schedules" ON review_schedules
    FOR ALL USING (auth.uid()::text = user_id::text OR 
                  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('teacher', 'admin')));

COMMIT;