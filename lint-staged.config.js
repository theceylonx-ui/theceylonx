/**
 * Ceylon Expand - Lint-Staged Configuration
 * Automated quality checks for staged files
 */
module.exports = {
  // TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix --cache',
    'prettier --write',
    () => 'tsc --noEmit', // Type check all files
  ],
  
  // JSON, CSS, Markdown files
  '*.{json,css,md,yml,yaml}': [
    'prettier --write',
  ],
  
  // Test files - run tests that may be affected
  '*.{test,spec}.{ts,tsx,js,jsx}': [
    'vitest run --reporter=verbose',
  ],
  
  // Database schema changes
  'shared/schema.ts': [
    'eslint --fix --cache',
    'prettier --write',
    () => 'echo "⚠️  Database schema changed - consider running migration tests"',
  ],
  
  // API route changes
  'server/routes/**/*.ts': [
    'eslint --fix --cache',
    'prettier --write',
    () => 'echo "🔍 API routes changed - ensure API tests are updated"',
  ],
  
  // Component changes
  'client/src/components/**/*.{ts,tsx}': [
    'eslint --fix --cache',
    'prettier --write',
    () => 'echo "🧪 Components changed - consider updating component tests"',
  ],
};