/** Map file extensions to markdown code-fence language identifiers. */
const EXT_TO_LANG: Record<string, string> = {
  // Web
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',

  // Config / data
  json: 'json',
  jsonc: 'jsonc',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  env: 'bash',
  xml: 'xml',

  // Shell
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',

  // Backend
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  cs: 'csharp',
  cpp: 'cpp',
  c: 'c',
  h: 'c',
  php: 'php',

  // Docs / markup
  md: 'markdown',
  mdx: 'mdx',
  txt: 'text',
  svg: 'svg',
  graphql: 'graphql',
  gql: 'graphql',

  // Other
  sql: 'sql',
  prisma: 'prisma',
  tf: 'hcl',
  dockerfile: 'dockerfile',
}

export function extToLang(ext: string): string {
  const clean = ext.startsWith('.') ? ext.slice(1).toLowerCase() : ext.toLowerCase()
  return EXT_TO_LANG[clean] ?? clean
}
