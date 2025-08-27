-- Review System Enhancement SQL
-- 복습 시스템 성능 최적화 및 기능 확장
-- 
-- ✅ APPLIED TO SUPABASE: 2025-08-27
-- ✅ VERSION: v0.9.0
-- ✅ STATUS: COMPLETED - 이 스크립트는 이미 Supabase에 적용되었습니다
-- 
-- 이 파일은 마이그레이션 이력 보관용입니다. 재실행하지 마세요.

-- 복습 이력 추적 테이블
CREATE TABLE IF NOT EXISTS review_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    solution_record_id UUID REFERENCES solution_records(id) ON DELETE CASCADE,
    
    -- 복습 세션 정보
    review_session_date DATE NOT NULL,
    previous_mastery_level INTEGER NOT NULL,
    new_mastery_level INTEGER NOT NULL,
    
    -- 복습 결과
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER, -- seconds
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5), -- 1-5 자신감 레벨
    
    -- 복습 효과 추적
    difficulty_perceived INTEGER CHECK (difficulty_perceived >= 1 AND difficulty_perceived <= 5), -- 1-5 체감 난이도
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 일일 복습 목표 및 통계 테이블
CREATE TABLE IF NOT EXISTS daily_review_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    
    -- 목표 및 실제 수행량
    target_review_count INTEGER DEFAULT 0,
    completed_review_count INTEGER DEFAULT 0,
    
    -- 성과 지표
    correct_answers INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    average_confidence DECIMAL(3,2), -- 1.00-5.00
    
    -- 학습 효율 지표
    efficiency_score DECIMAL(5,2), -- 정답률 * 시간효율성
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, target_date)
);

-- 복습 우선순위 계산을 위한 뷰
CREATE OR REPLACE VIEW review_priority_view AS
SELECT 
    sr.id as solution_record_id,
    sr.user_id,
    sr.problem_id,
    sr.problem_set_id,
    sr.mastery_level,
    sr.next_review_date,
    sr.time_spent,
    sr.attempt_number,
    
    -- 우선순위 점수 계산 (낮을수록 우선순위 높음)
    CASE 
        WHEN sr.mastery_level = 0 THEN 1 -- 처음 복습: 최우선
        WHEN sr.next_review_date <= CURRENT_DATE - INTERVAL '1 day' THEN 2 -- 연체: 높은 우선순위
        WHEN sr.next_review_date <= CURRENT_DATE THEN 3 -- 오늘 복습: 보통
        ELSE 4 -- 미래 일정: 낮은 우선순위
    END as priority_score,
    
    -- 복습 긴급도 (연체 일수)
    CASE 
        WHEN sr.next_review_date <= CURRENT_DATE 
        THEN EXTRACT(DAY FROM CURRENT_DATE - sr.next_review_date::DATE)::INTEGER
        ELSE 0
    END as overdue_days,
    
    p.title as problem_title,
    p.subject,
    p.difficulty,
    ps.title as problem_set_title
    
FROM solution_records sr
JOIN problems p ON sr.problem_id = p.id
LEFT JOIN problem_sets ps ON sr.problem_set_id = ps.id
WHERE sr.mastery_level < 4; -- 완전 학습된 문제는 제외

-- 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_solution_records_mastery_next_review 
    ON solution_records(user_id, mastery_level, next_review_date) 
    WHERE mastery_level < 4;

CREATE INDEX IF NOT EXISTS idx_review_history_user_date 
    ON review_history(user_id, review_session_date);

CREATE INDEX IF NOT EXISTS idx_review_history_problem 
    ON review_history(problem_id, review_session_date);

CREATE INDEX IF NOT EXISTS idx_daily_review_stats_user_date 
    ON daily_review_stats(user_id, target_date);

-- 복습 성과 분석을 위한 함수
CREATE OR REPLACE FUNCTION calculate_review_efficiency(
    p_user_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    avg_correct_rate DECIMAL(5,2),
    avg_time_per_problem INTEGER,
    mastery_progression_rate DECIMAL(5,2),
    total_reviews INTEGER
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(CASE WHEN rh.is_correct THEN 100.0 ELSE 0.0 END), 2) as avg_correct_rate,
        AVG(rh.time_spent)::INTEGER as avg_time_per_problem,
        ROUND(AVG(rh.new_mastery_level - rh.previous_mastery_level) * 100.0, 2) as mastery_progression_rate,
        COUNT(*)::INTEGER as total_reviews
    FROM review_history rh
    WHERE rh.user_id = p_user_id
      AND rh.review_session_date BETWEEN p_start_date AND p_end_date;
END;
$$;

-- 자동으로 daily_review_stats 업데이트하는 트리거 함수
CREATE OR REPLACE FUNCTION update_daily_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT 또는 UPDATE 시 해당 날짜의 통계 업데이트
    INSERT INTO daily_review_stats (
        user_id, 
        target_date, 
        completed_review_count,
        correct_answers,
        total_time_spent
    )
    VALUES (
        NEW.user_id,
        NEW.review_session_date,
        1,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        COALESCE(NEW.time_spent, 0)
    )
    ON CONFLICT (user_id, target_date) 
    DO UPDATE SET
        completed_review_count = daily_review_stats.completed_review_count + 1,
        correct_answers = daily_review_stats.correct_answers + 
            CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        total_time_spent = daily_review_stats.total_time_spent + COALESCE(NEW.time_spent, 0),
        updated_at = CURRENT_TIMESTAMP;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_daily_review_stats ON review_history;
CREATE TRIGGER trigger_update_daily_review_stats
    AFTER INSERT ON review_history
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_review_stats();

-- 데이터 정리를 위한 파티셔닝 준비 (PostgreSQL 10+)
-- review_history 테이블의 월별 파티셔닝 (대량 데이터 처리 시)
-- 주석 처리: 필요시 활성화
/*
ALTER TABLE review_history 
    RENAME TO review_history_template;

CREATE TABLE review_history (
    LIKE review_history_template INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 월별 파티션 예시 (필요시 생성)
CREATE TABLE review_history_2025_01 PARTITION OF review_history
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
*/

COMMENT ON TABLE review_history IS '복습 이력 추적 테이블 - 각 복습 세션의 상세 기록';
COMMENT ON TABLE daily_review_stats IS '일일 복습 통계 테이블 - 사용자별 일일 학습 성과 추적';
COMMENT ON VIEW review_priority_view IS '복습 우선순위 계산 뷰 - 복습 대상 정렬 및 우선순위 결정';
COMMENT ON FUNCTION calculate_review_efficiency IS '복습 효율성 계산 함수 - 사용자의 학습 효과 분석';