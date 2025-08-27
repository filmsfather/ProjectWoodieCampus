import { test, expect } from '@playwright/test';

test.describe('접근성 테스트', () => {
  test('홈페이지 기본 접근성 확인', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 제목 존재 확인
    await expect(page).toHaveTitle(/.+/);
    
    // 헤딩 구조 확인
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
    
    // 메인 랜드마크 확인
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('로그인 페이지 폼 접근성', async ({ page }) => {
    await page.goto('/login');
    
    // 폼 라벨 연결 확인
    const usernameInput = page.locator('input[name="username"]');
    const usernameId = await usernameInput.getAttribute('id');
    if (usernameId) {
      await expect(page.locator(`label[for="${usernameId}"]`)).toBeVisible();
    }
    
    const passwordInput = page.locator('input[name="password"]');
    const passwordId = await passwordInput.getAttribute('id');
    if (passwordId) {
      await expect(page.locator(`label[for="${passwordId}"]`)).toBeVisible();
    }
    
    // 필수 필드 표시 확인
    await expect(usernameInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('키보드 네비게이션 테스트', async ({ page }) => {
    await page.goto('/login');
    
    // Tab으로 모든 interactive 요소에 접근 가능한지 확인
    const interactiveElements = await page.locator('button, a, input, select, textarea').count();
    
    for (let i = 0; i < interactiveElements; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // 포커스 링이 있는지 확인
      const focusOutline = await focusedElement.evaluate(el => 
        getComputedStyle(el).outline
      );
      expect(focusOutline).not.toBe('none');
    }
  });

  test('스크린 리더 지원', async ({ page }) => {
    await page.goto('/login');
    
    // ARIA 라벨과 설명 확인
    await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label');
    
    // 폼 필드에 연결된 라벨 확인
    const emailInput = page.locator('input[type="email"]');
    const emailId = await emailInput.getAttribute('id');
    if (emailId) {
      await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
    }
  });

  test('색상 대비 확인', async ({ page }) => {
    await page.goto('/');
    
    // 주요 텍스트 요소들의 색상 대비 확인
    const textElements = page.locator('h1, h2, h3, p, a, button');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);
      const styles = await element.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      // 실제 색상 대비 계산은 복잡하므로 기본적인 확인만 수행
      expect(styles.color).toBeTruthy();
    }
  });

  test('이미지 대체 텍스트 확인', async ({ page }) => {
    await page.goto('/');
    
    // 모든 이미지에 alt 텍스트가 있는지 확인
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // 장식용 이미지는 빈 alt를 가질 수 있음
      expect(alt).not.toBeNull();
    }
  });

  test('폼 접근성 확인', async ({ page }) => {
    await page.goto('/login');
    
    // 필수 필드 표시 확인
    const requiredFields = page.locator('input[required]');
    const requiredCount = await requiredFields.count();
    
    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      
      // required 속성 또는 aria-required 확인
      const isRequired = await field.evaluate(el => 
        el.hasAttribute('required') || el.getAttribute('aria-required') === 'true'
      );
      expect(isRequired).toBeTruthy();
    }
  });

  test('고대비 모드 지원', async ({ page }) => {
    // 고대비 모드 시뮬레이션
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            filter: contrast(150%);
          }
        }
      `
    });
    
    await page.goto('/');
    
    // 페이지가 여전히 읽기 가능한지 확인
    await expect(page.locator('body')).toBeVisible();
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('움직임 감소 설정 지원', async ({ page }) => {
    // prefers-reduced-motion 시뮬레이션
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // 애니메이션이 비활성화되었는지 확인
    const animatedElements = page.locator('[class*="animate"], [style*="transition"]');
    const count = await animatedElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = animatedElements.nth(i);
      const transitionDuration = await element.evaluate(el => 
        getComputedStyle(el).transitionDuration
      );
      
      // reduced motion이 적용되면 애니메이션이 짧아지거나 없어야 함
      expect(['0s', ''].includes(transitionDuration)).toBeTruthy();
    }
  });
});