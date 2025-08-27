-- Supabase SQL Editor에서 실행할 관리자 계정 생성 스크립트
-- 비밀번호: Admin123!@# (bcrypt 해시됨)

-- 기존 admin 사용자가 있다면 제거 (선택사항)
-- DELETE FROM users WHERE username = 'admin';

-- 새로운 admin 사용자 생성
INSERT INTO users (
    id,
    username, 
    email,
    password_hash,
    role,
    full_name,
    is_active,
    created_at,
    updated_at,
    last_login
) VALUES (
    gen_random_uuid(),
    'admin',
    'admin@woodiecampus.com',
    '$2b$12$bjB7s1CS2kKHQlTEQKXiYuPEiKw7ox7KETZEoAGtx/9K9XnM7ODnW',
    'admin',
    '시스템 관리자',
    true,
    NOW(),
    NOW(),
    NULL
) ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 생성된 사용자 확인
SELECT 
    id,
    username,
    email,
    role,
    full_name,
    is_active,
    created_at
FROM users 
WHERE username = 'admin';