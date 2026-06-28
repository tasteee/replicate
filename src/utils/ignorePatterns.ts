// Default patterns that replicate ignores unless overridden.
// These cover common non-source directories and generated
// or lock files.
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

  // Compiled / map files (but NOT *.d.ts — declaration files
  // are often hand-written source and must be included)
  "*.map",
  "*.tsbuildinfo",

  // Log files
  "*.log",
  "logs",
];

// Merge user-supplied ignore patterns with the defaults. Users
// can add extra patterns; the defaults always apply.
export const mergeIgnorePatterns = (userPatterns: string[] = []): string[] => {
  const mergedPatterns = new Set([...DEFAULT_IGNORE_PATTERNS, ...userPatterns])
  return Array.from(mergedPatterns)
}
