# Woodie Campus Database Schema

## 개요

Woodie Campus는 에빙하우스 망각곡선을 기반으로 한 학습 플랫폼의 데이터베이스 스키마입니다. PostgreSQL을 기반으로 하며, Supabase에서 호스팅됩니다.

## 주요 테이블

### 1. users (사용자)
사용자 계정 정보를 저장하는 테이블입니다.

```sql
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
```

**역할 구분:**
- `admin`: 시스템 관리자 (모든 권한)
- `teacher`: 교사 (문제 생성, 학생 관리)
- `student`: 학생 (문제 풀이)

### 2. problems (문제)
학습 문제 정보를 저장하는 테이블입니다.

```sql
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
```

**문제 유형:**
- `multiple_choice`: 객관식
- `short_answer`: 단답형
- `essay`: 서술형
- `true_false`: 참/거짓

**난이도 구분:**
- `easy`: 쉬움
- `medium`: 보통
- `hard`: 어려움

### 3. problem_sets (문제집)
문제들을 그룹화한 문제집 정보입니다.

```sql
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
```

### 4. problem_set_problems (문제집-문제 매핑)
문제집과 문제를 연결하는 중간 테이블입니다.

```sql
CREATE TABLE problem_set_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_set_id UUID REFERENCES problem_sets(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_set_id, problem_id),
    UNIQUE(problem_set_id, order_index)
);
```

### 5. solution_records (풀이 기록)
학생들의 문제 풀이 기록을 저장합니다.

```sql
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
```

**숙련도 레벨 (mastery_level):**
- `0`: 처음 틀림
- `1`: 처음 맞음
- `2`: 1차 복습 완료
- `3`: 2차 복습 완료
- `4`: 완전 숙달

### 6. review_schedules (복습 스케줄)
에빙하우스 망각곡선에 기반한 복습 스케줄을 관리합니다.

```sql
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
```

**복습 스케줄 (에빙하우스 망각곡선):**
- `Stage 1`: 1일 후 (24시간)
- `Stage 2`: 3일 후 (72시간)
- `Stage 3`: 7일 후 (1주일)
- `Stage 4`: 14일 후 (2주일)

## 데이터베이스 관계도

```
users
├── problems (created_by)
├── problem_sets (created_by)
├── solution_records (user_id)
└── review_schedules (user_id)

problems
├── problem_set_problems (problem_id)
├── solution_records (problem_id)
└── review_schedules (problem_id)

problem_sets
├── problem_set_problems (problem_set_id)
├── solution_records (problem_set_id)
└── review_schedules (problem_set_id)
```

## 인덱스 및 성능 최적화

### 주요 인덱스
- `idx_users_email`: 이메일 기반 로그인 최적화
- `idx_problems_subject`: 과목별 문제 검색
- `idx_solution_records_user`: 사용자별 풀이 기록 조회
- `idx_solution_records_next_review`: 복습 대상 문제 조회
- `idx_review_schedules_scheduled`: 일별 복습 스케줄 조회

## Row Level Security (RLS) 정책

### users 테이블
- 사용자는 자신의 프로필만 조회/수정 가능
- 관리자는 모든 사용자 데이터 접근 가능

### problems, problem_sets 테이블
- 인증된 모든 사용자는 조회 가능
- 교사와 관리자만 생성/수정/삭제 가능

### solution_records, review_schedules 테이블
- 사용자는 자신의 기록만 접근 가능
- 교사와 관리자는 모든 기록 접근 가능

## 트리거

### 자동 타임스탬프 업데이트
모든 주요 테이블에 `updated_at` 필드 자동 업데이트 트리거가 설정되어 있습니다.

```sql
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 데이터 무결성

### 외래 키 제약조건
- 모든 관계는 적절한 외래 키로 연결
- CASCADE 삭제로 데이터 일관성 보장

### 체크 제약조건
- 역할, 난이도, 문제 유형 등의 열거형 값 검증
- 숙련도 레벨, 복습 단계의 범위 제한

## 사용 예제

### 1. 오늘 복습할 문제 조회
```sql
SELECT p.title, p.content, rs.review_stage
FROM review_schedules rs
JOIN problems p ON rs.problem_id = p.id
WHERE rs.user_id = ? AND rs.scheduled_date <= CURRENT_DATE AND NOT rs.is_completed;
```

### 2. 사용자별 정답률 계산
```sql
SELECT 
    u.full_name,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN sr.is_correct THEN 1 ELSE 0 END) as correct_answers,
    ROUND(AVG(CASE WHEN sr.is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_rate
FROM users u
JOIN solution_records sr ON u.id = sr.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name;
```

### 3. 과목별 문제 수 통계
```sql
SELECT 
    subject,
    COUNT(*) as problem_count,
    COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_count,
    COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_count,
    COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_count
FROM problems
WHERE is_active = true
GROUP BY subject
ORDER BY problem_count DESC;
```

## 마이그레이션 및 배포

### 스키마 생성
```bash
# Supabase SQL Editor에서 실행
# 1. supabase-schema.sql 실행
# 2. sample-data.sql 실행 (개발 환경)
```

### 백업 및 복원
```sql
-- 전체 데이터 백업
pg_dump --dbname=postgresql://[CONNECTION_STRING] > backup.sql

-- 특정 테이블만 백업
pg_dump --dbname=postgresql://[CONNECTION_STRING] -t users -t problems > partial_backup.sql
```