import { cn } from '@/lib/utils';
import { ReactNode, useState, useEffect } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  className, 
  direction = 'up' 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: ''
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: ReactNode;
  trigger: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  className?: string;
}

export function SlideIn({ 
  children, 
  trigger, 
  direction = 'right', 
  duration = 300, 
  className 
}: SlideInProps) {
  const transforms = {
    left: trigger ? 'translateX(0)' : 'translateX(-100%)',
    right: trigger ? 'translateX(0)' : 'translateX(100%)',
    up: trigger ? 'translateY(0)' : 'translateY(-100%)',
    down: trigger ? 'translateY(0)' : 'translateY(100%)'
  };

  return (
    <div
      className={cn('transition-transform ease-out', className)}
      style={{ 
        transform: transforms[direction],
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}

interface PulseProps {
  children: ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  duration?: number;
  className?: string;
}

export function Pulse({ 
  children, 
  intensity = 'normal', 
  duration = 2000, 
  className 
}: PulseProps) {
  const scales = {
    subtle: { from: '1', to: '1.02' },
    normal: { from: '1', to: '1.05' },
    strong: { from: '1', to: '1.1' }
  };

  const scale = scales[intensity];

  return (
    <div
      className={cn('animate-pulse', className)}
      style={{
        animation: `pulse ${duration}ms ease-in-out infinite`,
        transform: `scale(${scale.from})`
      }}
    >
      {children}
    </div>
  );
}

interface ScaleOnHoverProps {
  children: ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export function ScaleOnHover({ 
  children, 
  scale = 1.05, 
  duration = 200, 
  className 
}: ScaleOnHoverProps) {
  return (
    <div
      className={cn(
        'transition-transform cursor-pointer hover:scale-105 active:scale-95',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

interface BouncingDotsProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BouncingDots({ 
  color = 'bg-brand', 
  size = 'md', 
  className 
}: BouncingDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-bounce',
            color,
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}

interface StaggeredFadeInProps {
  children: ReactNode[];
  staggerDelay?: number;
  childDelay?: number;
  className?: string;
}

export function StaggeredFadeIn({ 
  children, 
  staggerDelay = 100, 
  childDelay = 0, 
  className 
}: StaggeredFadeInProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          delay={childDelay + (index * staggerDelay)}
          className="w-full"
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

interface ShakeProps {
  children: ReactNode;
  trigger: boolean;
  intensity?: 'subtle' | 'normal' | 'strong';
  duration?: number;
  className?: string;
}

export function Shake({ 
  children, 
  trigger, 
  intensity = 'normal', 
  duration = 500, 
  className 
}: ShakeProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  const intensityClasses = {
    subtle: 'animate-shake-subtle',
    normal: 'animate-shake',
    strong: 'animate-shake-strong'
  };

  return (
    <div 
      className={cn(
        isShaking && intensityClasses[intensity],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ProgressiveBlurProps {
  children: ReactNode;
  isBlurred: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
  className?: string;
}

export function ProgressiveBlur({ 
  children, 
  isBlurred, 
  intensity = 'medium', 
  duration = 300, 
  className 
}: ProgressiveBlurProps) {
  const blurClasses = {
    light: 'blur-sm',
    medium: 'blur-md',
    heavy: 'blur-lg'
  };

  return (
    <div
      className={cn(
        'transition-all',
        isBlurred && blurClasses[intensity],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Animation utility CSS that should be added to index.css
export const animationStyles = `
  /* Custom shake animations */
  @keyframes shake-subtle {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes shake-strong {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  .animate-shake-subtle {
    animation: shake-subtle 0.5s ease-in-out;
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  .animate-shake-strong {
    animation: shake-strong 0.5s ease-in-out;
  }

  /* Smooth page transitions */
  .page-transition-enter {
    opacity: 0;
    transform: translateY(20px);
  }

  .page-transition-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 300ms ease-out, transform 300ms ease-out;
  }

  .page-transition-exit {
    opacity: 1;
    transform: translateY(0);
  }

  .page-transition-exit-active {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 200ms ease-in, transform 200ms ease-in;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .animate-shake,
    .animate-shake-subtle,
    .animate-shake-strong,
    .animate-pulse,
    .animate-bounce {
      animation: none !important;
    }

    .transition-all,
    .transition-transform,
    .transition-opacity {
      transition: none !important;
    }
  }
`;

// Hook for managing animation preferences
export function useAnimationPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    prefersReducedMotion,
    shouldAnimate: !prefersReducedMotion
  };
}