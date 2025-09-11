import { cn } from '@/lib/utils';
import { ReactNode, useState, useEffect } from 'react';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  padding?: boolean;
}

export function Container({ 
  children, 
  size = 'lg', 
  className, 
  padding = true 
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl', 
    lg: 'max-w-7xl',
    xl: 'max-w-8xl',
    full: 'max-w-full'
  };

  return (
    <div 
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 1, md: 2, lg: 3 },
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const gridClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    `gap-${gap}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('grid', gridClasses, className)}>
      {children}
    </div>
  );
}

interface StackProps {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

export function Stack({ 
  children, 
  direction = 'vertical',
  spacing = 4,
  align,
  justify,
  wrap = false,
  className 
}: StackProps) {
  const alignClasses = {
    start: direction === 'horizontal' ? 'items-start' : 'justify-start',
    center: direction === 'horizontal' ? 'items-center' : 'justify-center',
    end: direction === 'horizontal' ? 'items-end' : 'justify-end',
    stretch: direction === 'horizontal' ? 'items-stretch' : 'justify-stretch'
  };

  const justifyClasses = {
    start: direction === 'horizontal' ? 'justify-start' : 'items-start',
    center: direction === 'horizontal' ? 'justify-center' : 'items-center',
    end: direction === 'horizontal' ? 'justify-end' : 'items-end',
    between: direction === 'horizontal' ? 'justify-between' : 'items-between',
    around: direction === 'horizontal' ? 'justify-around' : 'items-around',
    evenly: direction === 'horizontal' ? 'justify-evenly' : 'items-evenly'
  };

  return (
    <div 
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        direction === 'horizontal' ? `space-x-${spacing}` : `space-y-${spacing}`,
        align && alignClasses[align],
        justify && justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveShowHideProps {
  children: ReactNode;
  show?: {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
  };
  hide?: {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
  };
  className?: string;
}

export function ResponsiveShowHide({ 
  children, 
  show = {},
  hide = {},
  className 
}: ResponsiveShowHideProps) {
  const classes = [];

  // Hide classes
  if (hide.sm) classes.push('sm:hidden');
  if (hide.md) classes.push('md:hidden');
  if (hide.lg) classes.push('lg:hidden');
  if (hide.xl) classes.push('xl:hidden');

  // Show classes
  if (show.sm) classes.push('hidden sm:block');
  if (show.md) classes.push('hidden md:block');
  if (show.lg) classes.push('hidden lg:block');
  if (show.xl) classes.push('hidden xl:block');

  return (
    <div className={cn(classes.join(' '), className)}>
      {children}
    </div>
  );
}

interface MobileFirstProps {
  children: ReactNode;
  className?: string;
}

export function MobileFirst({ children, className }: MobileFirstProps) {
  return (
    <div className={cn('block md:hidden', className)}>
      {children}
    </div>
  );
}

interface DesktopFirstProps {
  children: ReactNode;
  className?: string;
}

export function DesktopFirst({ children, className }: DesktopFirstProps) {
  return (
    <div className={cn('hidden md:block', className)}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'surface' | 'muted';
  fullHeight?: boolean;
}

export function Section({ 
  children, 
  className,
  padding = 'md',
  background = 'transparent',
  fullHeight = false
}: SectionProps) {
  const paddingClasses = {
    none: '',
    sm: 'py-4 sm:py-6',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16',
    xl: 'py-16 sm:py-24'
  };

  const backgroundClasses = {
    transparent: '',
    surface: 'bg-ui-surface',
    muted: 'bg-ui-bg'
  };

  return (
    <section 
      className={cn(
        paddingClasses[padding],
        backgroundClasses[background],
        fullHeight && 'min-h-screen',
        className
      )}
    >
      {children}
    </section>
  );
}

interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'col';
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: number;
  className?: string;
}

export function Flex({ 
  children, 
  direction = 'row',
  wrap = false,
  align,
  justify,
  gap,
  className 
}: FlexProps) {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  return (
    <div 
      className={cn(
        'flex',
        `flex-${direction}`,
        wrap && 'flex-wrap',
        align && alignClasses[align],
        justify && justifyClasses[justify],
        gap && `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl'>('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isLargeDesktop: breakpoint === 'xl'
  };
}