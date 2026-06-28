import { glob } from 'glob'
import path from 'node:path'
import { mergeIgnorePatterns } from './ignorePatterns.js'

export type CollectOptionsT = {
  // Only include files with these extensions (without leading dot).
  extensions?: string[]
  // Exclude files with these extensions (without leading dot).
  notExtensions?: string[]
  // Additional ignore patterns on top of the defaults.
  ignore?: string[]
}

// Build a glob pattern that matches the requested extensions.
const buildExtensionPattern = (extensions: string[]): string => {
  const isSingleExtension = extensions.length === 1
  if (isSingleExtension) return `**/*.${extensions[0]}`

  const extensionList = extensions.join(',')
  return `**/*.{${extensionList}}`
}

// Bare ignore names match at any depth; patterns that already
// contain a slash are used as written.
const expandIgnorePattern = (ignorePattern: string): string => {
  const isNestedPattern = ignorePattern.includes('/')
  if (isNestedPattern) return ignorePattern
  return `**/${ignorePattern}/**`
}

// Recursively collect files under rootDir according to the given
// options. Returns absolute paths sorted alphabetically.
export const collectFiles = async (
  rootDir: string,
  options: CollectOptionsT = {}
): Promise<string[]> => {
  const ignorePatterns = mergeIgnorePatterns(options.ignore)
  const expandedIgnorePatterns = ignorePatterns.map((ignorePattern) => {
    return expandIgnorePattern(ignorePattern)
  })

  const requestedExtensions = options.extensions ?? []
  const hasRequestedExtensions = requestedExtensions.length > 0
  const globPattern = hasRequestedExtensions
    ? buildExtensionPattern(requestedExtensions)
    : '**/*'

  const matchedPaths = await glob(globPattern, {
    cwd: rootDir,
    absolute: true,
    nodir: true,
    ignore: expandedIgnorePatterns,
    dot: false,
  })

  const sortedPaths = matchedPaths.sort()

  const excludedExtensions = options.notExtensions ?? []
  const hasExcludedExtensions = excludedExtensions.length > 0
  if (!hasExcludedExtensions) return sortedPaths

  const excludedExtensionSet = new Set(
    excludedExtensions.map((extension) => {
      return `.${extension}`
    })
  )
  const filteredPaths = sortedPaths.filter((filePath) => {
    const fileExtension = path.extname(filePath)
    return !excludedExtensionSet.has(fileExtension)
  })
  return filteredPaths
}
