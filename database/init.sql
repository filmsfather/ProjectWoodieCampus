-- 로컬 개발용 PostgreSQL 초기화 스크립트
-- 실제 운영에서는 Supabase를 사용

-- 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    subject VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 문제집 테이블
CREATE TABLE IF NOT EXISTS problem_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 문제집-문제 연결 테이블
CREATE TABLE IF NOT EXISTS problem_set_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_set_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_set_id, problem_id)
);

-- 풀이 기록 테이블
CREATE TABLE IF NOT EXISTS solution_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_review_date TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_problems_created_by ON problems(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_subject ON problems(subject);
CREATE INDEX IF NOT EXISTS idx_solution_records_user_id ON solution_records(user_id);
CREATE INDEX IF NOT EXISTS idx_solution_records_problem_id ON solution_records(problem_id);
CREATE INDEX IF NOT EXISTS idx_solution_records_next_review_date ON solution_records(next_review_date);

-- 테스트 데이터 삽입
INSERT INTO users (id, username, email, password_hash, role) VALUES 
    (uuid_generate_v4(), 'admin', 'admin@woodie.com', '$2a$10$placeholder', 'admin'),
    (uuid_generate_v4(), 'teacher1', 'teacher@woodie.com', '$2a$10$placeholder', 'teacher'),
    (uuid_generate_v4(), 'student1', 'student@woodie.com', '$2a$10$placeholder', 'student')
ON CONFLICT (username) DO NOTHING;

COMMIT;