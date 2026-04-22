import type { InternalConfig, InternalState, WorkerType } from '../types.js'
import path from 'node:path'

interface MatchResult {
  match: RegExpMatchArray | null
  type: WorkerType | null
}

function getMatchAndType(
  importee: string,
  config: InternalConfig,
): MatchResult {
  let match = importee.match(config.webWorkerPattern)
  if (match) {
    return { type: 'web-worker', match }
  }
  match = importee.match(config.audioWorkletPattern)
  if (match) {
    return { type: 'audio-worklet', match }
  }
  match = importee.match(config.paintWorkletPattern)
  if (match) {
    return { type: 'paint-worklet', match }
  }
  match = importee.match(config.serviceWorkerPattern)
  if (match) {
    return { type: 'service-worker', match }
  }
  match = importee.match(config.sharedWorkerPattern)
  if (match) {
    return { type: 'shared-worker', match }
  }
  return { match: null, type: null }
}

function resolveModule(
  name: string,
  paths: string[],
  extensions: string[],
): string | null {
  const testNames = [
    name,
    ...extensions.map(extension =>
      extension.startsWith('.')
        ? `${name}${extension}`
        : `${name}.${extension}`,
    ),
  ]

  for (const testName of testNames) {
    try {
      return require.resolve(testName, { paths })
    } catch {
      // empty
    }
  }

  return null
}

export function handleResolveId(
  state: InternalState,
  config: InternalConfig,
  importee: string,
  importer: string | null,
): string | null {
  const { match, type } = getMatchAndType(importee, config)
  if (importee.startsWith('\0rollup-plugin-web-worker-loader::helper')) {
    if (config.forceInline) {
      return `\0${state.forceInlineCounter++}::${importee.slice(1)}`
    }
    return importee
  }
  if (match && match.length && type) {
    const name = match[match.length - 1]
    if (!state.idMap.has(name)) {
      let target: string | null = null
      if (importer) {
        const folder = path.dirname(importer)
        const resolvePaths = require.resolve.paths(importer)
        resolvePaths.push(folder)
        target = resolveModule(name, resolvePaths, config.extensions)
      } else if (path.isAbsolute(name)) {
        target = name
      }

      if (target) {
        const prefix = `\0rollup-plugin-worker-loader::module:${config.forceInline ? `:${state.forceInlineCounter++}:` : ''}${target}`
        if (!state.idMap.has(prefix)) {
          const inputOptions = { ...state.options, input: target }

          let workerName: string
          if (config.preserveFileNames) {
            const extension = path.extname(target)
            workerName = path.basename(target, extension)
            if (!state.outFiles.has(workerName)) {
              state.outFiles.set(workerName, 0)
            } else {
              const duplicateCount = state.outFiles.get(workerName)!
              state.outFiles.set(workerName, duplicateCount + 1)
              workerName += duplicateCount + 1
            }
          } else {
            workerName = `${type}-${state.idMap.size}`
          }

          state.idMap.set(prefix, {
            workerID: `${workerName}.js`,
            chunk: null,
            inputOptions,
            target,
            type,
          })
        }

        if (!state.exclude.has(prefix)) {
          return prefix
        }
        return target
      }
    }
  }
  return null
}
