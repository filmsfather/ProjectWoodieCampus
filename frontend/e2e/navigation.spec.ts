import { test, expect } from '@playwright/test';

test.describe('네비게이션 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 학생으로 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('사이드바 네비게이션 확인', async ({ page }) => {
    // 사이드바가 표시되는지 확인
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // 주요 네비게이션 링크 확인
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/workbooks"]')).toBeVisible();
  });

  test('대시보드에서 문제집으로 이동', async ({ page }) => {
    await page.click('a[href="/workbooks"]');
    await expect(page).toHaveURL(/.*\/workbooks/);
    await expect(page.locator('[data-testid="workbooks-page"]')).toBeVisible();
  });

  test('헤더 네비게이션 확인', async ({ page }) => {
    // 헤더가 표시되는지 확인
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    
    // 로고 클릭으로 대시보드 이동 확인
    await page.click('[data-testid="logo"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('키보드 네비게이션 접근성', async ({ page }) => {
    // Tab 키로 네비게이션 요소들이 포커스를 받는지 확인
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Skip to main content 링크 확인
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('모바일 반응형 네비게이션', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 390, height: 844 });
    
    // 햄버거 메뉴 버튼이 표시되는지 확인
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // 햄버거 메뉴 클릭
    await page.click('[data-testid="mobile-menu-button"]');
    
    // 모바일 메뉴가 열리는지 확인
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('브레드크럼 네비게이션', async ({ page }) => {
    // 문제집 상세 페이지로 이동
    await page.click('a[href="/workbooks"]');
    await page.click('[data-testid="workbook-item"]:first-child');
    
    // 브레드크럼 확인
    await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('문제집');
  });
});