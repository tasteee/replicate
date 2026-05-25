/**
 * Default patterns that replicate ignores unless overridden.
 * These cover common non-source directories and generated/lock files.
 */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
  // Dependency dirs
  "node_modules",
  ".pnpm-store",
  ".yarn",
  ".npm",

  // Build / output dirs
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".expo",
  ".turbo",
  ".cache",
  "coverage",
  ".nyc_output",
  "storybook-static",

  // Lock files
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",

  // VCS / editor dirs
  ".git",
  ".svn",
  ".hg",
  ".idea",
  ".vscode",

  // Env / secrets
  ".env",
  ".env.*",

  // OS junk
  ".DS_Store",
  "Thumbs.db",

  // Compiled / map files
  "*.map",
  "*.d.ts",
  "*.tsbuildinfo",

  // Log files
  "*.log",
  "logs",
];

/**
 * Merge user-supplied ignore patterns with the defaults.
 * Users can add extra patterns; the defaults always apply.
 */
export function mergeIgnorePatterns(userPatterns: string[] = []): string[] {
  const merged = new Set([...DEFAULT_IGNORE_PATTERNS, ...userPatterns]);
  return Array.from(merged);
}
