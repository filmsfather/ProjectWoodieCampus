// 접근성 및 키보드 내비게이션 유틸리티

/**
 * 키보드/마우스 사용자 감지 및 적절한 CSS 클래스 적용
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private isKeyboardUser = false;
  private lastInteractionWasKeyboard = false;

  private constructor() {
    this.init();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private init() {
    // 키보드 사용 감지
    document.addEventListener('keydown', this.handleKeyboardInteraction);
    
    // 마우스 사용 감지
    document.addEventListener('mousedown', this.handleMouseInteraction);
    document.addEventListener('mousemove', this.handleMouseInteraction);
    
    // 터치 사용 감지
    document.addEventListener('touchstart', this.handleTouchInteraction);

    // 포커스 이벤트 감지
    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('focusout', this.handleFocusOut);

    // Skip to main content 링크 추가
    this.addSkipLink();
  }

  private handleKeyboardInteraction = (event: KeyboardEvent) => {
    // Tab, Arrow keys, Enter, Space 등 내비게이션 키 감지
    if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(event.key)) {
      this.setKeyboardUser(true);
      this.lastInteractionWasKeyboard = true;
    }
  };

  private handleMouseInteraction = () => {
    this.setKeyboardUser(false);
    this.lastInteractionWasKeyboard = false;
  };

  private handleTouchInteraction = () => {
    this.setKeyboardUser(false);
    this.lastInteractionWasKeyboard = false;
  };

  private handleFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    
    // 키보드로 포커스된 경우에만 visual focus 표시
    if (this.lastInteractionWasKeyboard && target) {
      target.classList.add('keyboard-focused');
      
      // 포커스된 요소가 화면에 보이도록 스크롤
      this.scrollIntoViewIfNeeded(target);
    }
  };

  private handleFocusOut = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('keyboard-focused');
    }
  };

  private setKeyboardUser(isKeyboard: boolean) {
    if (this.isKeyboardUser !== isKeyboard) {
      this.isKeyboardUser = isKeyboard;
      document.body.classList.toggle('keyboard-user', isKeyboard);
      document.body.classList.toggle('mouse-user', !isKeyboard);
    }
  }

  private scrollIntoViewIfNeeded(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    
    if (!isVisible) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  private addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-main';
    skipLink.textContent = '메인 콘텐츠로 바로가기';
    skipLink.setAttribute('aria-label', '메인 콘텐츠로 바로가기');
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * 포커스 트랩 (모달 등에서 사용)
   */
  static trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      } else if (event.key === 'Escape') {
        // ESC로 모달 닫기
        const closeButton = element.querySelector('[data-modal-close]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // 첫 번째 요소에 포커스
    if (firstElement) {
      firstElement.focus();
    }

    // cleanup 함수 반환
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * ARIA live region을 통한 동적 콘텐츠 알림
   */
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'live-region';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // 메시지 전달 후 제거
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }

  /**
   * 색상 대비율 체크 (개발 도구용)
   */
  static checkColorContrast(foreground: string, background: string): number {
    const getLuminance = (rgb: number[]): number => {
      const [r, g, b] = rgb.map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const hexToRgb = (hex: string): number[] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [0, 0, 0];
    };

    const fgLuminance = getLuminance(hexToRgb(foreground));
    const bgLuminance = getLuminance(hexToRgb(background));
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * 키보드 단축키 등록
   */
  static registerKeyboardShortcuts(shortcuts: Record<string, () => void>) {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifiers = [];
      
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('alt');
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('meta');

      const shortcut = [...modifiers, key].join('+');
      
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
}

/**
 * 색상 접근성 유틸리티
 */
export class ColorAccessibility {
  /**
   * 색상이 WCAG AA 기준을 만족하는지 확인
   */
  static isWCAGAACompliant(foreground: string, background: string): boolean {
    const contrast = AccessibilityManager.checkColorContrast(foreground, background);
    return contrast >= 4.5; // WCAG AA 기준
  }

  /**
   * 색상이 WCAG AAA 기준을 만족하는지 확인
   */
  static isWCAGAAACompliant(foreground: string, background: string): boolean {
    const contrast = AccessibilityManager.checkColorContrast(foreground, background);
    return contrast >= 7; // WCAG AAA 기준
  }

  /**
   * 접근성 친화적인 색상 조합 추천
   */
  static getAccessibleColorPairs(): Array<{name: string, foreground: string, background: string}> {
    return [
      { name: 'Primary on White', foreground: '#5A6450', background: '#FFFFFF' },
      { name: 'White on Primary', foreground: '#FFFFFF', background: '#5A6450' },
      { name: 'Accent on White', foreground: '#AA4632', background: '#FFFFFF' },
      { name: 'White on Accent', foreground: '#FFFFFF', background: '#AA4632' },
      { name: 'Dark Text on Light Background', foreground: '#41413C', background: '#F5F5F0' },
      { name: 'Light Text on Dark Background', foreground: '#F5F5F0', background: '#41413C' }
    ];
  }
}

/**
 * 스크린 리더 유틸리티
 */
export class ScreenReaderUtils {
  /**
   * 요소에 적절한 ARIA 레이블 추가
   */
  static addAriaLabels(element: HTMLElement, label: string, describedBy?: string) {
    element.setAttribute('aria-label', label);
    if (describedBy) {
      element.setAttribute('aria-describedby', describedBy);
    }
  }

  /**
   * 동적 콘텐츠 변경 알림
   */
  static announceChange(message: string, priority: 'polite' | 'assertive' = 'polite') {
    AccessibilityManager.announceToScreenReader(message, priority);
  }

  /**
   * 로딩 상태 알림
   */
  static announceLoading(isLoading: boolean, context: string = '콘텐츠') {
    if (isLoading) {
      this.announceChange(`${context} 로딩 중입니다.`, 'polite');
    } else {
      this.announceChange(`${context} 로딩이 완료되었습니다.`, 'polite');
    }
  }

  /**
   * 에러 상태 알림
   */
  static announceError(error: string) {
    this.announceChange(`오류: ${error}`, 'assertive');
  }

  /**
   * 성공 상태 알림
   */
  static announceSuccess(message: string) {
    this.announceChange(`성공: ${message}`, 'polite');
  }
}

// 페이지 로드시 접근성 매니저 초기화
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    AccessibilityManager.getInstance();
  });
}