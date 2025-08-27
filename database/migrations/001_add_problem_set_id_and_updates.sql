-- Migration: Add problem_set_id to problems table and update constraints
-- Date: 2025-08-27
-- Description: 학생 문제 풀이 시스템 구현을 위한 스키마 업데이트

-- 1. problems 테이블에 problem_set_id 컬럼 추가 (이미 실행됨)
-- ALTER TABLE problems 
-- ADD COLUMN problem_set_id UUID REFERENCES problem_sets(id) ON DELETE SET NULL;

-- 2. solution_records의 mastery_level 제약조건 수정 (0-10 범위로 변경, 이미 실행됨)
-- ALTER TABLE solution_records 
-- DROP CONSTRAINT IF EXISTS solution_records_mastery_level_check;

-- ALTER TABLE solution_records 
-- ADD CONSTRAINT solution_records_mastery_level_check 
-- CHECK (mastery_level >= 0 AND mastery_level <= 10);

-- 3. problems 테이블에 인덱스 추가 (성능 최적화, 이미 실행됨)
-- CREATE INDEX idx_problems_problem_set ON problems(problem_set_id);

-- 4. problem_sets 테이블에 status 컬럼 추가 확인 (이미 존재함)
-- Supabase에는 이미 status 컬럼이 있음: status VARCHAR DEFAULT 'draft'

-- 마이그레이션 완료: 모든 스키마가 동기화됨
-- - problems.problem_set_id 컬럼 추가됨
-- - solution_records.mastery_level 범위가 0-10으로 확장됨
-- - 필요한 인덱스들이 추가됨