interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 
        focus:z-50 focus:bg-brand focus:text-white focus:px-4 focus:py-2 
        focus:rounded-b-md focus:font-medium focus:no-underline
        focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white
        transition-all duration-200
        ${className}
      `}
      data-testid="skip-link"
    >
      {children}
    </a>
  );
}

export function SkipLinks() {
  return (
    <nav aria-label="Skip navigation" className="skip-links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      <SkipLink href="#footer">Skip to footer</SkipLink>
    </nav>
  );
}