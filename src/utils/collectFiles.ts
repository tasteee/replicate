import { glob } from 'glob'
import path from 'node:path'
import { mergeIgnorePatterns } from './ignorePatterns.js'

export interface CollectOptions {
  /** Only include files with these extensions (without leading dot). */
  extensions?: string[]
  /** Exclude files with these extensions (without leading dot). */
  notExtensions?: string[]
  /** Additional ignore patterns on top of the defaults. */
  ignore?: string[]
}

/**
 * Recursively collect files under `rootDir` according to the given options.
 * Returns absolute paths sorted alphabetically.
 */
export async function collectFiles(
  rootDir: string,
  options: CollectOptions = {}
): Promise<string[]> {
  const { extensions, notExtensions, ignore: extraIgnore } = options

  const ignorePatterns = mergeIgnorePatterns(extraIgnore)

  // Build a glob pattern based on requested extensions
  let pattern: string
  if (extensions && extensions.length > 0) {
    const extList = extensions.join(',')
    pattern =
      extensions.length === 1
        ? `**/*.${extensions[0]}`
        : `**/*.{${extList}}`
  } else {
    pattern = '**/*'
  }

  const matches = await glob(pattern, {
    cwd: rootDir,
    absolute: true,
    nodir: true,
    ignore: ignorePatterns.map((p) =>
      // Make sure nested patterns like node_modules/**/* work
      p.includes('/') ? p : `**/${p}/**`
    ),
    dot: false,
  })

  let files = matches.sort()

  // Apply notExtensions filter
  if (notExtensions && notExtensions.length > 0) {
    const excluded = new Set(notExtensions.map((e) => `.${e}`))
    files = files.filter((f) => !excluded.has(path.extname(f)))
  }

  return files
}
