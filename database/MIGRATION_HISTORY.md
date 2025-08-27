# 데이터베이스 마이그레이션 이력

## 적용된 마이그레이션

### v0.9.0 - Task 8 복습 스케줄링 시스템 (2025-08-27)
✅ **적용 완료** - `review-system-enhancement.sql`

**추가된 테이블:**
- `review_history` - 복습 이력 추적
- `daily_review_stats` - 일일 복습 통계 (자동 업데이트 트리거 포함)

**추가된 뷰:**
- `review_priority_view` - 복습 우선순위 계산

**추가된 함수:**
- `calculate_review_efficiency()` - 복습 효율성 분석
- `update_daily_review_stats()` - 일일 통계 업데이트

**추가된 인덱스:**
- `idx_solution_records_mastery_next_review`
- `idx_review_history_user_date` 
- `idx_review_history_problem`
- `idx_daily_review_stats_user_date`

**노트:** `workbook_review_schedules` 테이블은 런타임에 동적 생성됨

---

### v0.8.x - 기본 스키마 (이전)
✅ **기적용** - `supabase-schema.sql`

**기본 테이블:**
- `users` - 사용자 관리
- `problems` - 문제 관리
- `problem_sets` - 문제집 관리
- `problem_set_problems` - 문제집-문제 연결
- `solution_records` - 풀이 기록 (에빙하우스 필드 포함)
- `review_schedules` - 기본 복습 스케줄

---

## 🚨 주의사항

1. **중복 적용 금지**: 이미 적용된 스크립트는 재실행하지 마세요
2. **백업 필수**: 마이그레이션 전 반드시 데이터베이스 백업
3. **테스트 환경**: 가능한 경우 테스트 환경에서 먼저 검증

## 📝 다음 마이그레이션 시

새로운 마이그레이션을 추가할 때:
1. 새 SQL 파일 생성 (예: `v0.10.0-feature-name.sql`)
2. 적용 후 이 파일에 기록 추가
3. SQL 파일 상단에 적용 완료 표시