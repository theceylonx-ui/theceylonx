import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAccessibility, useAriaLiveRegion } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusMainContent: () => void;
  trapFocus: (element: HTMLElement) => () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { announceToScreenReader, focusMainContent, trapFocus } = useAccessibility();
  const { liveRegionRef } = useAriaLiveRegion();

  // Add global accessibility enhancements
  useEffect(() => {
    // Add reduced motion support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotionPreference = () => {
      if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        document.documentElement.style.setProperty('--transition-duration', '0.01ms');
      } else {
        document.documentElement.style.removeProperty('--animation-duration');
        document.documentElement.style.removeProperty('--transition-duration');
      }
    };

    updateMotionPreference();
    prefersReducedMotion.addEventListener('change', updateMotionPreference);

    // Add high contrast support
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
    
    const updateContrastPreference = () => {
      if (prefersHighContrast.matches) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    };

    updateContrastPreference();
    prefersHighContrast.addEventListener('change', updateContrastPreference);

    return () => {
      prefersReducedMotion.removeEventListener('change', updateMotionPreference);
      prefersHighContrast.removeEventListener('change', updateContrastPreference);
    };
  }, []);

  const contextValue: AccessibilityContextType = {
    announceToScreenReader,
    focusMainContent,
    trapFocus
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Global ARIA live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
        aria-label="Screen reader announcements"
      />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}