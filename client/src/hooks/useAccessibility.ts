import { useEffect, useRef, useCallback } from 'react';

export interface AccessibilityOptions {
  announcePageChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
}

/**
 * Hook for managing accessibility features throughout the application
 */
export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announcePageChanges = true,
    focusManagement = true,
    keyboardNavigation = true
  } = options;

  // Screen reader announcement
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Focus management for single page applications
  const focusMainContent = useCallback(() => {
    if (!focusManagement) return;
    
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent && mainContent instanceof HTMLElement) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, [focusManagement]);

  // Skip link functionality
  const addSkipLinks = useCallback(() => {
    if (document.querySelector('[data-skip-link]')) return; // Already exists
    
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('data-skip-link', 'true');
    skipLink.className = `
      sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 
      focus:z-50 focus:bg-brand focus:text-white focus:px-4 focus:py-2 
      focus:rounded-b-md focus:font-medium focus:no-underline
    `;
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }, []);

  // Keyboard navigation helpers
  const trapFocus = useCallback((element: HTMLElement) => {
    if (!keyboardNavigation) return () => {};

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        element.dispatchEvent(new CustomEvent('escape-key'));
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardNavigation]);

  // Initialize accessibility features
  useEffect(() => {
    addSkipLinks();
  }, [addSkipLinks]);

  return {
    announceToScreenReader,
    focusMainContent,
    trapFocus,
    addSkipLinks
  };
}

/**
 * Hook for managing focus state and visual indicators
 */
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);

  const setFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'previous') => {
    const currentElement = document.activeElement as HTMLElement;
    if (!currentElement) return;

    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1 < 0 ? focusableElements.length - 1 : currentIndex - 1;
    }

    focusableElements[nextIndex]?.focus();
  }, []);

  return {
    focusRef,
    setFocus,
    moveFocus
  };
}

/**
 * Hook for managing ARIA live regions and announcements
 */
export function useAriaLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const clearAnnouncement = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, []);

  return {
    liveRegionRef,
    announce,
    clearAnnouncement
  };
}