-- Sample data for Woodie Campus
-- 테스트 및 개발용 샘플 데이터

-- Insert sample users
-- 비밀번호: admin123, teacher123, student123
INSERT INTO users (id, username, email, password_hash, role, full_name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@woodie.com', '$2b$12$eWWVoIGQ8Nm4kWxtGs1hquMoQY3iZ80Pot3irFaAJt4bJ8tZDOQeS', 'admin', '관리자'),
    ('550e8400-e29b-41d4-a716-446655440002', 'teacher1', 'teacher1@woodie.com', '$2b$12$jj.7usF.JorAqj7y.EK2YuDoXHJ8.bt4HE6CF4nZUvYYtXW6D3fty', 'teacher', '김선생'),
    ('550e8400-e29b-41d4-a716-446655440003', 'teacher2', 'teacher2@woodie.com', '$2b$12$jj.7usF.JorAqj7y.EK2YuDoXHJ8.bt4HE6CF4nZUvYYtXW6D3fty', 'teacher', '이선생'),
    ('550e8400-e29b-41d4-a716-446655440004', 'student1', 'student1@woodie.com', '$2b$12$61fmggDt/PIqq6kJri6k3OHhYZPm0mRzqqFEclUMRWopPaE3SANKS', 'student', '박학생'),
    ('550e8400-e29b-41d4-a716-446655440005', 'student2', 'student2@woodie.com', '$2b$12$61fmggDt/PIqq6kJri6k3OHhYZPm0mRzqqFEclUMRWopPaE3SANKS', 'student', '최학생'),
    ('550e8400-e29b-41d4-a716-446655440006', 'student3', 'student3@woodie.com', '$2b$12$61fmggDt/PIqq6kJri6k3OHhYZPm0mRzqqFEclUMRWopPaE3SANKS', 'student', '정학생');

-- Insert sample problems (수학)
INSERT INTO problems (id, title, content, answer, explanation, difficulty, subject, topic, problem_type, created_by) VALUES 
    ('550e8400-e29b-41d4-a716-446655441001', '이차방정식의 해', 'x² - 5x + 6 = 0을 풀어보세요.', 'x = 2 또는 x = 3', '인수분해하면 (x-2)(x-3) = 0이므로 x = 2 또는 x = 3입니다.', 'easy', '수학', '이차방정식', 'short_answer', '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655441002', '삼차방정식의 해', 'x³ - 6x² + 11x - 6 = 0을 풀어보세요.', 'x = 1, x = 2, x = 3', '인수분해하면 (x-1)(x-2)(x-3) = 0입니다.', 'medium', '수학', '삼차방정식', 'short_answer', '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655441003', '함수의 극값', 'f(x) = x³ - 3x² + 2에서 극값을 구하세요.', '극대값: f(0) = 2, 극소값: f(2) = -2', 'f''(x) = 3x² - 6x = 3x(x-2)이므로 x = 0에서 극대, x = 2에서 극소입니다.', 'hard', '수학', '미분', 'short_answer', '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655441004', '정적분 계산', '∫₀² (2x + 1) dx를 계산하세요.', '6', '[x² + x]₀² = (4 + 2) - (0 + 0) = 6입니다.', 'medium', '수학', '적분', 'short_answer', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample problems (영어)
INSERT INTO problems (id, title, content, answer, explanation, difficulty, subject, topic, problem_type, created_by) VALUES 
    ('550e8400-e29b-41d4-a716-446655441005', '관계대명사 선택', 'The book ___ I bought yesterday is very interesting. (A) which (B) who (C) where (D) when', 'A', '선행사가 사물(book)이므로 which를 사용합니다.', 'easy', '영어', '문법', 'multiple_choice', '550e8400-e29b-41d4-a716-446655440003'),
    ('550e8400-e29b-41d4-a716-446655441006', '시제 일치', 'He said that he ___ to Seoul the next day. (A) goes (B) will go (C) would go (D) went', 'C', '주절이 과거시제이므로 종속절도 과거시제로 일치시켜 would go를 사용합니다.', 'medium', '영어', '문법', 'multiple_choice', '550e8400-e29b-41d4-a716-446655440003'),
    ('550e8400-e29b-41d4-a716-446655441007', '가정법 과거완료', 'If I had studied harder, I ___ the exam. (A) would pass (B) will pass (C) would have passed (D) had passed', 'C', '가정법 과거완료 구문으로 주절에 would have + 과거분사를 사용합니다.', 'hard', '영어', '문법', 'multiple_choice', '550e8400-e29b-41d4-a716-446655440003');

-- Insert sample problems (과학)
INSERT INTO problems (id, title, content, answer, explanation, difficulty, subject, topic, problem_type, created_by) VALUES 
    ('550e8400-e29b-41d4-a716-446655441008', '뉴턴 제2법칙', '질량이 5kg인 물체에 20N의 힘이 작용할 때 가속도는?', '4 m/s²', 'F = ma에서 a = F/m = 20/5 = 4 m/s²입니다.', 'easy', '물리', '역학', 'short_answer', '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655441009', '등속원운동', '반지름 2m인 원 위에서 속력 4m/s로 등속원운동하는 물체의 구심가속도는?', '8 m/s²', 'a = v²/r = 16/2 = 8 m/s²입니다.', 'medium', '물리', '역학', 'short_answer', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample problem sets
INSERT INTO problem_sets (id, title, description, subject, grade_level, estimated_time, created_by) VALUES 
    ('550e8400-e29b-41d4-a716-446655442001', '중학교 수학 기초', '중학교 수준의 기본적인 수학 문제들', '수학', '중학교', 30, '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655442002', '고등 수학 심화', '고등학교 수준의 심화 수학 문제들', '수학', '고등학교', 45, '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655442003', '영어 문법 기초', '기본적인 영어 문법 문제들', '영어', '중학교', 25, '550e8400-e29b-41d4-a716-446655440003'),
    ('550e8400-e29b-41d4-a716-446655442004', '물리 역학', '물리학 역학 문제들', '물리', '고등학교', 40, '550e8400-e29b-41d4-a716-446655440002');

-- Link problems to problem sets
INSERT INTO problem_set_problems (problem_set_id, problem_id, order_index) VALUES 
    -- 중학교 수학 기초
    ('550e8400-e29b-41d4-a716-446655442001', '550e8400-e29b-41d4-a716-446655441001', 1),
    ('550e8400-e29b-41d4-a716-446655442001', '550e8400-e29b-41d4-a716-446655441008', 2),
    
    -- 고등 수학 심화
    ('550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655441002', 1),
    ('550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655441003', 2),
    ('550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655441004', 3),
    
    -- 영어 문법 기초
    ('550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655441005', 1),
    ('550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655441006', 2),
    ('550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655441007', 3),
    
    -- 물리 역학
    ('550e8400-e29b-41d4-a716-446655442004', '550e8400-e29b-41d4-a716-446655441008', 1),
    ('550e8400-e29b-41d4-a716-446655442004', '550e8400-e29b-41d4-a716-446655441009', 2);

-- Insert sample solution records
INSERT INTO solution_records (user_id, problem_id, problem_set_id, user_answer, is_correct, time_spent, submitted_at, next_review_date, review_count, mastery_level) VALUES 
    -- 박학생의 풀이 기록
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655442001', 'x = 2 또는 x = 3', true, 120, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day', 1, 1),
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655442003', 'A', true, 45, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 0, 1),
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441008', '550e8400-e29b-41d4-a716-446655442004', '4', true, 90, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_DATE + INTERVAL '1 day', 0, 1),
    
    -- 최학생의 풀이 기록
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655442002', 'x = 1, x = 2, x = 3', true, 180, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', 0, 1),
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655441006', '550e8400-e29b-41d4-a716-446655442003', 'B', false, 60, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_DATE, 0, 0);

-- Insert sample review schedules (에빙하우스 망각곡선)
INSERT INTO review_schedules (user_id, problem_id, problem_set_id, review_stage, scheduled_date, is_completed) VALUES 
    -- 박학생 복습 스케줄
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655442001', 2, CURRENT_DATE + INTERVAL '1 day', false),
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655442003', 1, CURRENT_DATE + INTERVAL '2 days', false),
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441008', '550e8400-e29b-41d4-a716-446655442004', 1, CURRENT_DATE + INTERVAL '1 day', false),
    
    -- 최학생 복습 스케줄
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655442002', 1, CURRENT_DATE + INTERVAL '1 day', false),
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655441006', '550e8400-e29b-41d4-a716-446655442003', 1, CURRENT_DATE, false);

-- Update user last_login times
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '1 hour' WHERE username IN ('student1', 'student2');
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '3 hours' WHERE username = 'teacher1';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '30 minutes' WHERE username = 'admin';

COMMIT;