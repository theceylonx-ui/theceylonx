# Ceylon Expand v5.0 - UI Style Tokens

*Design system tokens for Apple-level clarity and consistency*

## Overview

This document defines the complete design token system for Ceylon Expand v5.0, following Apple's design principles of clarity, simplicity, and intuitive interaction. All tokens are designed to work seamlessly across light and dark themes with automatic adaptation.

## Typography Scale

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Heading Scale
```css
/* Display - Hero sections */
--font-size-display: 48px;
--line-height-display: 1.1;
--font-weight-display: 700;

/* Heading 1 - Page titles */
--font-size-h1: 40px;
--line-height-h1: 1.2;
--font-weight-h1: 700;

/* Heading 2 - Section titles */
--font-size-h2: 32px;
--line-height-h2: 1.25;
--font-weight-h2: 600;

/* Heading 3 - Subsection titles */
--font-size-h3: 24px;
--line-height-h3: 1.3;
--font-weight-h3: 600;

/* Heading 4 - Card titles */
--font-size-h4: 20px;
--line-height-h4: 1.4;
--font-weight-h4: 600;

/* Heading 5 - Small headings */
--font-size-h5: 18px;
--line-height-h5: 1.4;
--font-weight-h5: 600;
```

### Body Text Scale
```css
/* Large body - Introductions, important content */
--font-size-lg: 18px;
--line-height-lg: 1.6;
--font-weight-lg: 400;

/* Base body - Default text */
--font-size-base: 16px;
--line-height-base: 1.75;
--font-weight-base: 400;

/* Small body - Captions, metadata */
--font-size-sm: 14px;
--line-height-sm: 1.5;
--font-weight-sm: 400;

/* Extra small - Fine print, labels */
--font-size-xs: 12px;
--line-height-xs: 1.4;
--font-weight-xs: 400;
```

### UI Text Scale
```css
/* Button text */
--font-size-button-lg: 16px;
--font-size-button: 14px;
--font-size-button-sm: 12px;
--font-weight-button: 500;

/* Input text */
--font-size-input: 16px;
--line-height-input: 1.5;

/* Label text */
--font-size-label: 14px;
--font-weight-label: 500;
```

## Color Palette

### Semantic Colors (Light Theme)
```css
:root {
  /* Text Colors */
  --color-text-primary: #0B0B0B;
  --color-text-secondary: #4A4A4A;
  --color-text-tertiary: #8E8E8E;
  --color-text-disabled: #C7C7C7;
  
  /* Brand Colors */
  --color-brand-primary: #0F8B6E;
  --color-brand-secondary: #0D7A61;
  --color-brand-tertiary: #0A6B54;
  --color-brand-light: #E6F7F3;
  --color-brand-50: #F0FBF8;
  
  /* Surface Colors */
  --color-surface-primary: #FFFFFF;
  --color-surface-secondary: #F7F7F7;
  --color-surface-tertiary: #F0F0F0;
  --color-surface-raised: #FFFFFF;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);
  
  /* Border Colors */
  --color-border-subtle: #E6E6E6;
  --color-border-default: #D1D1D1;
  --color-border-strong: #B8B8B8;
  --color-border-brand: #0F8B6E;
  
  /* Status Colors */
  --color-success: #10B981;
  --color-success-light: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-danger: #EF4444;
  --color-danger-light: #FEE2E2;
  --color-info: #3B82F6;
  --color-info-light: #DBEAFE;
  
  /* Interactive States */
  --color-hover-bg: #F5F5F5;
  --color-active-bg: #E8E8E8;
  --color-focus-ring: #0F8B6E;
  --color-selected-bg: #E6F7F3;
}
```

### Semantic Colors (Dark Theme)
```css
.dark {
  /* Text Colors */
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #CFCFCF;
  --color-text-tertiary: #8E8E8E;
  --color-text-disabled: #4A4A4A;
  
  /* Brand Colors */
  --color-brand-primary: #12A082;
  --color-brand-secondary: #0F9171;
  --color-brand-tertiary: #0D7F63;
  --color-brand-light: #1A3A35;
  --color-brand-50: #0F2B28;
  
  /* Surface Colors */
  --color-surface-primary: #0B0B0B;
  --color-surface-secondary: #141414;
  --color-surface-tertiary: #1F1F1F;
  --color-surface-raised: #1F1F1F;
  --color-surface-overlay: rgba(0, 0, 0, 0.8);
  
  /* Border Colors */
  --color-border-subtle: #2A2A2A;
  --color-border-default: #404040;
  --color-border-strong: #5A5A5A;
  --color-border-brand: #12A082;
  
  /* Status Colors */
  --color-success: #10B981;
  --color-success-light: #064E3B;
  --color-warning: #F59E0B;
  --color-warning-light: #451A03;
  --color-danger: #EF4444;
  --color-danger-light: #450A0A;
  --color-info: #3B82F6;
  --color-info-light: #1E3A8A;
  
  /* Interactive States */
  --color-hover-bg: #1F1F1F;
  --color-active-bg: #2A2A2A;
  --color-focus-ring: #12A082;
  --color-selected-bg: #1A3A35;
}
```

## Spacing Scale

### Base Scale (4px grid)
```css
/* Micro spacing */
--space-0: 0px;
--space-px: 1px;
--space-0_5: 2px;

/* Small spacing */
--space-1: 4px;
--space-1_5: 6px;
--space-2: 8px;
--space-2_5: 10px;
--space-3: 12px;
--space-3_5: 14px;

/* Medium spacing */
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-9: 36px;
--space-10: 40px;

/* Large spacing */
--space-11: 44px;
--space-12: 48px;
--space-14: 56px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-28: 112px;
--space-32: 128px;

/* Extra large spacing */
--space-36: 144px;
--space-40: 160px;
--space-44: 176px;
--space-48: 192px;
--space-52: 208px;
--space-56: 224px;
--space-60: 240px;
--space-64: 256px;
--space-72: 288px;
--space-80: 320px;
--space-96: 384px;
```

### Semantic Spacing
```css
/* Component spacing */
--space-component-xs: var(--space-2);
--space-component-sm: var(--space-3);
--space-component-md: var(--space-4);
--space-component-lg: var(--space-6);
--space-component-xl: var(--space-8);

/* Layout spacing */
--space-layout-xs: var(--space-4);
--space-layout-sm: var(--space-6);
--space-layout-md: var(--space-8);
--space-layout-lg: var(--space-12);
--space-layout-xl: var(--space-16);
--space-layout-2xl: var(--space-24);
```

## Border Radius Scale

```css
/* Radius scale */
--radius-none: 0px;
--radius-sm: 2px;
--radius-default: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-3xl: 24px;
--radius-full: 9999px;

/* Component-specific radius */
--radius-button: var(--radius-md);
--radius-input: var(--radius-md);
--radius-card: var(--radius-lg);
--radius-modal: var(--radius-xl);
--radius-avatar: var(--radius-full);
```

## Shadow System

### Light Theme Shadows
```css
:root {
  /* Elevation shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* Component shadows */
  --shadow-button: var(--shadow-xs);
  --shadow-card: var(--shadow-sm);
  --shadow-modal: var(--shadow-xl);
  --shadow-dropdown: var(--shadow-lg);
  --shadow-tooltip: var(--shadow-md);
  
  /* Focus shadows */
  --shadow-focus: 0 0 0 2px var(--color-focus-ring);
  --shadow-focus-error: 0 0 0 2px var(--color-danger);
  --shadow-focus-success: 0 0 0 2px var(--color-success);
}
```

### Dark Theme Shadows
```css
.dark {
  /* Elevation shadows (more pronounced) */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
}
```

## Animation & Motion

### Timing Functions
```css
/* Easing curves */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale
```css
/* Animation durations */
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Common Animations
```css
/* Micro-interactions */
--animation-fade-in: opacity var(--duration-normal) var(--ease-out);
--animation-fade-out: opacity var(--duration-fast) var(--ease-in);
--animation-scale-in: transform var(--duration-normal) var(--ease-bounce);
--animation-slide-up: transform var(--duration-normal) var(--ease-out);
--animation-slide-down: transform var(--duration-normal) var(--ease-out);

/* Button interactions */
--animation-button-press: transform var(--duration-fast) var(--ease-out);
--animation-button-hover: all var(--duration-fast) var(--ease-out);
```

## Component Tokens

### Button Variants
```css
/* Primary Button */
--button-primary-bg: var(--color-brand-primary);
--button-primary-bg-hover: var(--color-brand-secondary);
--button-primary-bg-active: var(--color-brand-tertiary);
--button-primary-text: #FFFFFF;
--button-primary-border: var(--color-brand-primary);

/* Secondary Button */
--button-secondary-bg: transparent;
--button-secondary-bg-hover: var(--color-hover-bg);
--button-secondary-bg-active: var(--color-active-bg);
--button-secondary-text: var(--color-text-primary);
--button-secondary-border: var(--color-border-default);

/* Ghost Button */
--button-ghost-bg: transparent;
--button-ghost-bg-hover: var(--color-hover-bg);
--button-ghost-bg-active: var(--color-active-bg);
--button-ghost-text: var(--color-brand-primary);
--button-ghost-border: transparent;

/* Danger Button */
--button-danger-bg: var(--color-danger);
--button-danger-bg-hover: #DC2626;
--button-danger-bg-active: #B91C1C;
--button-danger-text: #FFFFFF;
--button-danger-border: var(--color-danger);
```

### Input Fields
```css
/* Base Input */
--input-bg: var(--color-surface-primary);
--input-bg-focus: var(--color-surface-primary);
--input-bg-disabled: var(--color-surface-secondary);
--input-text: var(--color-text-primary);
--input-text-placeholder: var(--color-text-tertiary);
--input-border: var(--color-border-default);
--input-border-focus: var(--color-brand-primary);
--input-border-error: var(--color-danger);

/* Input Sizing */
--input-height-sm: 32px;
--input-height-md: 40px;
--input-height-lg: 48px;
--input-padding-x: var(--space-3);
--input-padding-y: var(--space-2);
```

### Card Components
```css
/* Base Card */
--card-bg: var(--color-surface-primary);
--card-border: var(--color-border-subtle);
--card-shadow: var(--shadow-card);
--card-radius: var(--radius-card);
--card-padding: var(--space-6);

/* Interactive Card */
--card-interactive-bg-hover: var(--color-hover-bg);
--card-interactive-border-hover: var(--color-border-default);
--card-interactive-shadow-hover: var(--shadow-md);
```

### Avatar System
```css
/* Avatar sizes */
--avatar-size-xs: 24px;
--avatar-size-sm: 32px;
--avatar-size-md: 40px;
--avatar-size-lg: 48px;
--avatar-size-xl: 64px;
--avatar-size-2xl: 80px;

/* Avatar styling */
--avatar-bg: var(--color-brand-light);
--avatar-text: var(--color-brand-primary);
--avatar-border: var(--color-border-subtle);
```

## Responsive Breakpoints

```css
/* Mobile first breakpoints */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */

/* Container max-widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

## Accessibility Tokens

```css
/* Focus indicators */
--focus-outline-width: 2px;
--focus-outline-style: solid;
--focus-outline-color: var(--color-focus-ring);
--focus-outline-offset: 2px;

/* High contrast mode support */
@media (prefers-contrast: high) {
  --color-border-default: #000000;
  --color-text-secondary: #000000;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  --duration-instant: 0ms;
  --duration-fast: 0ms;
  --duration-normal: 0ms;
  --duration-slow: 0ms;
  --duration-slower: 0ms;
}

/* Touch target minimums */
--touch-target-min: 44px;
```

## Usage Guidelines

### Do's
- ✅ Use semantic color tokens instead of raw hex values
- ✅ Apply consistent spacing using the scale
- ✅ Follow the typography hierarchy
- ✅ Use appropriate shadows for elevation
- ✅ Implement smooth animations for micro-interactions

### Don'ts
- ❌ Create custom colors outside the defined palette
- ❌ Use arbitrary spacing values
- ❌ Mix different font weights randomly
- ❌ Apply heavy shadows to every element
- ❌ Overuse animations or make them too slow

### Implementation Notes

1. **CSS Custom Properties**: All tokens are implemented as CSS custom properties for easy theming
2. **Tailwind Integration**: Tokens map directly to Tailwind classes for consistency
3. **Component Libraries**: shadcn/ui components automatically use these tokens
4. **Dark Mode**: Automatic theme switching based on user preference
5. **Mobile First**: All tokens are optimized for mobile-first responsive design

---

*This design system ensures consistency, accessibility, and maintainability across the entire Ceylon Expand v5.0 platform.*