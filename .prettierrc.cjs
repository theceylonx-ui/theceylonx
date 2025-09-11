/**
 * Ceylon Expand - Prettier Configuration (CommonJS)
 * Consistent code formatting across the entire codebase
 */
module.exports = {
  // Basic formatting
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JSX formatting
  jsxSingleQuote: false,
  jsxBracketSameLine: false,
  
  // Trailing commas for better git diffs
  trailingComma: 'es5',
  
  // Bracket spacing for readability
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow function parentheses
  arrowParens: 'avoid',
  
  // Line endings - normalize for cross-platform
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // HTML formatting
  htmlWhitespaceSensitivity: 'css',
  
  // Markdown formatting
  proseWrap: 'preserve',
  
  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};