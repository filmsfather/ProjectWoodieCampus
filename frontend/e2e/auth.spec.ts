import { test, expect } from '@playwright/test';

test.describe('인증 테스트', () => {
  test('로그인 페이지 접근 및 기본 요소 확인', async ({ page }) => {
    await page.goto('/login');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Woodie Campus/);
    
    // 로그인 폼 요소 확인 (실제 구조에 맞춤)
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // 폼 제목 확인
    await expect(page.locator('h1:has-text("로그인")')).toBeVisible();
  });

  test('학생 로그인 플로우', async ({ page }) => {
    await page.goto('/login');
    
    // 테스트 학생 계정으로 로그인 (실제 username 필드 사용)
    await page.fill('input[name="username"]', 'student');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 로딩 상태 확인
    await expect(page.locator('button:has-text("로그인 중...")')).toBeVisible({ timeout: 2000 });
    
    // 대시보드로 리다이렉트 확인 (더 긴 timeout 설정)
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('교사 로그인 플로우', async ({ page }) => {
    await page.goto('/login');
    
    // 테스트 교사 계정으로 로그인
    await page.fill('input[name="username"]', 'teacher');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('잘못된 로그인 정보 처리', async ({ page }) => {
    await page.goto('/login');
    
    // 잘못된 계정 정보
    await page.fill('input[name="username"]', 'invalid-user');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    // 오류 메시지 확인
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
  });

  test('빈 필드 유효성 검사', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 필드로 제출 시도
    await page.click('button[type="submit"]');
    
    // HTML5 validation 확인 (required 속성으로 인한)
    const usernameField = page.locator('input[name="username"]');
    await expect(usernameField).toHaveAttribute('required');
    
    const passwordField = page.locator('input[name="password"]');
    await expect(passwordField).toHaveAttribute('required');
  });
});