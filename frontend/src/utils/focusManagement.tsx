// Focus Management Utilities

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: Element): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    'audio[controls]:not([aria-hidden="true"])',
    'video[controls]:not([aria-hidden="true"])',
    '[contenteditable]:not([contenteditable="false"]):not([aria-hidden="true"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter((element) => {
      const htmlElement = element as HTMLElement;
      return (
        htmlElement.offsetWidth > 0 &&
        htmlElement.offsetHeight > 0 &&
        !htmlElement.hasAttribute('inert')
      );
    }) as HTMLElement[];
}

/**
 * Focus trap for modals, drawers, etc.
 */
export class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousActiveElement: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
  }

  private updateFocusableElements() {
    this.focusableElements = getFocusableElements(this.container);
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    // If no focusable elements, prevent tabbing
    if (!this.firstFocusable) {
      event.preventDefault();
      return;
    }

    // If only one focusable element, keep focus on it
    if (this.focusableElements.length === 1) {
      event.preventDefault();
      this.firstFocusable.focus();
      return;
    }

    // Normal tab cycling
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable.focus();
      }
    }
  };

  activate() {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.updateFocusableElements();
    
    // Focus first element or container
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    } else {
      this.container.focus();
    }

    document.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Restore previous focus
    if (this.previousActiveElement && document.body.contains(this.previousActiveElement)) {
      this.previousActiveElement.focus();
    }
  }
}

/**
 * Hook for managing focus trap
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  const focusTrapRef = React.useRef<FocusTrap | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    if (isActive) {
      focusTrapRef.current = new FocusTrap(containerRef.current);
      focusTrapRef.current.activate();
    } else {
      focusTrapRef.current?.deactivate();
      focusTrapRef.current = null;
    }

    return () => {
      focusTrapRef.current?.deactivate();
    };
  }, [isActive, containerRef]);
}

/**
 * Skip link component for keyboard navigation
 */
export interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ targetId, children, className = '' }: SkipLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-tooltip
        bg-white px-4 py-2 rounded-md shadow-lg border border-neutral-200
        text-sm font-medium text-neutral-900
        focus:outline-none focus:ring-2 focus:ring-role-primary
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </a>
  );
}

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management for route changes
 */
export function focusMainContent() {
  const mainContent = document.getElementById('main-content') || document.querySelector('main');
  if (mainContent) {
    // Ensure the element is focusable
    if (!mainContent.hasAttribute('tabindex')) {
      mainContent.setAttribute('tabindex', '-1');
    }
    mainContent.focus();
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view if not visible
 */
export function scrollIntoViewIfNeeded(element: HTMLElement) {
  if (!isElementInViewport(element)) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest',
      inline: 'nearest'
    });
  }
}