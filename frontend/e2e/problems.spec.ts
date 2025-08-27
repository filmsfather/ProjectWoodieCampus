import { test, expect } from '@playwright/test';

test.describe('문제 관련 테스트', () => {
  test('학생 - 문제 풀이 플로우', async ({ page }) => {
    // 학생으로 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 문제집에서 문제 선택
    await page.click('a[href="/workbooks"]');
    await page.click('[data-testid="workbook-item"]:first-child');
    await page.click('[data-testid="problem-item"]:first-child');
    
    // 문제 풀이 페이지 확인
    await expect(page.locator('[data-testid="problem-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="problem-options"]')).toBeVisible();
    
    // 답 선택 및 제출
    await page.click('[data-testid="option-1"]');
    await page.click('[data-testid="submit-answer"]');
    
    // 결과 확인
    await expect(page.locator('[data-testid="answer-result"]')).toBeVisible();
  });

  test('교사 - 문제 생성 플로우', async ({ page }) => {
    // 교사로 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 문제 생성 페이지로 이동
    await page.click('a[href="/problems"]');
    await page.click('a[href="/problems/create"]');
    
    // 문제 생성 폼 확인
    await expect(page.locator('[data-testid="create-problem-form"]')).toBeVisible();
    
    // 문제 정보 입력
    await page.fill('[data-testid="problem-title"]', 'E2E 테스트 문제');
    await page.fill('[data-testid="problem-content"]', '다음 중 올바른 답은?');
    
    // 선택지 추가
    await page.fill('[data-testid="option-1"]', '선택지 1');
    await page.fill('[data-testid="option-2"]', '선택지 2');
    await page.fill('[data-testid="option-3"]', '선택지 3');
    await page.fill('[data-testid="option-4"]', '선택지 4');
    
    // 정답 설정
    await page.check('[data-testid="correct-answer-1"]');
    
    // 문제 저장
    await page.click('[data-testid="save-problem"]');
    
    // 성공 메시지 확인
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('에빙하우스 복습 스케줄링 확인', async ({ page }) => {
    // 학생으로 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 대시보드에서 복습 섹션 확인
    await expect(page.locator('[data-testid="review-section"]')).toBeVisible();
    
    // 오늘의 복습 문제가 있는지 확인
    const reviewProblems = page.locator('[data-testid="review-problem"]');
    const count = await reviewProblems.count();
    
    if (count > 0) {
      // 복습 문제 클릭
      await reviewProblems.first().click();
      
      // 복습 문제 풀이 페이지 확인
      await expect(page.locator('[data-testid="review-problem-content"]')).toBeVisible();
      
      // 복습 마킹 확인
      await expect(page.locator('[data-testid="review-indicator"]')).toBeVisible();
    }
  });

  test('문제 이미지 업로드 및 표시', async ({ page }) => {
    // 교사로 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 문제 생성 페이지로 이동
    await page.click('a[href="/problems"]');
    await page.click('a[href="/problems/create"]');
    
    // 이미지 업로드 섹션 확인
    await expect(page.locator('[data-testid="image-upload"]')).toBeVisible();
    
    // 파일 선택 버튼 확인
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('문제 검색 및 필터링', async ({ page }) => {
    // 교사로 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 문제 목록 페이지로 이동
    await page.click('a[href="/problems"]');
    
    // 검색 기능 확인
    const searchInput = page.locator('[data-testid="problem-search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('수학');
      await page.keyboard.press('Enter');
      
      // 검색 결과 확인
      await expect(page.locator('[data-testid="problem-list"]')).toBeVisible();
    }
    
    // 필터 기능 확인
    const filterSelect = page.locator('[data-testid="subject-filter"]');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('math');
      
      // 필터된 결과 확인
      await expect(page.locator('[data-testid="problem-list"]')).toBeVisible();
    }
  });
});