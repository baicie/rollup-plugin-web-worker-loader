import type { InternalConfig, InternalState, WorkerEntry } from '../types.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildWorkerCode } from '../utils/buildWorkerCode.js'
import { extractSource, fixMapSources } from '../utils/extractSource.js'

const HELPER_PATTERN =
  /^\0(?:\d+::)?rollup-plugin-web-worker-loader::helper(?:::)?/

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadHelperFile(id: string, match: RegExpExecArray): Promise<string> {
  return new Promise((resolve, reject) => {
    const helperParts = id.slice(match[0].length).split('::')
    const helperPath = `${path.resolve(__dirname, '../helper', ...helperParts)}.ts`
    fs.readFile(helperPath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

interface OutputChunk {
  type: 'chunk'
  code?: string
  map?: unknown
  modules?: Record<string, { originalLength?: number }>
  fileName?: string
  isAsset?: boolean
}

interface OutputAsset {
  type: 'asset'
  fileName?: string
  source?: unknown
  isAsset?: boolean
}

type BundleOutput = OutputChunk | OutputAsset

function findChunk(output: BundleOutput[]): OutputChunk | null {
  for (const chunk of output) {
    if (chunk.type !== 'asset') {
      return chunk as OutputChunk
    }
  }
  return null
}

function updateWatchModules(
  modules: Record<string, unknown>,
  addWatchFile: (id: string) => void,
): void {
  const deps = Object.keys(modules)
  for (const dep of deps) {
    addWatchFile(dep)
  }
}

function handleBundleGenerated(
  state: InternalState,
  config: InternalConfig,
  addWatchFile: (id: string) => void,
  id: string,
  workerID: string,
  result: { output: BundleOutput[] },
): { code: string } | null {
  const chunk = findChunk(result.output)
  if (chunk === null) return null

  if (chunk.modules) {
    updateWatchModules(chunk.modules as Record<string, unknown>, addWatchFile)
  }

  const chunkCode = chunk.code ?? ''
  let map: unknown = null
  let source: string

  const effectivePlatform = config.targetPlatform

  if (config.inline || effectivePlatform === 'base64') {
    source = extractSource(chunkCode, config.preserveSource)
    if (config.sourcemap && chunk.map) {
      map = fixMapSources(
        {
          map: chunk.map as Parameters<typeof fixMapSources>[0]['map'],
          modules: chunk.modules ?? {},
        },
        state.basePath ?? '.',
      )
    }
  } else {
    const workerPath = path.posix.join(config.outputFolder, workerID)
    source = path.posix.join(config.loadPath, workerPath)
    chunk.fileName = workerPath
    state.idMap.get(id)!.chunk = chunk
  }

  return {
    code: buildWorkerCode(source, map as string | null, {
      inline: config.inline,
      preserveSource: config.preserveSource,
      enableUnicode: config.enableUnicode,
      targetPlatform: effectivePlatform,
      type: state.idMap.get(id)!.type,
    }),
  }
}

interface RollupBundle {
  generate: (options: object) => Promise<{ output: BundleOutput[] }>
}

async function bundleWorker(
  state: InternalState,
  config: InternalConfig,
  entry: WorkerEntry,
  addWatchFile: (id: string) => void,
): Promise<{ code: string } | null> {
  const { inputOptions, workerID, target } = entry

  for (const [key, val] of state.idMap) {
    if (val.target === target) {
      state.exclude.add(key)
    }
  }
  state.exclude.add(target)

  if (config.external) {
    ;(inputOptions as Record<string, unknown>).external = config.external
  }

  let bundler: { rollup: (options: object) => Promise<RollupBundle> } | null =
    null
  let bundlerName = ''

  try {
    bundler = (await import('rolldown')) as {
      rollup: (options: object) => Promise<RollupBundle>
    }
    bundlerName = 'rolldown'
  } catch {
    // rolldown not available, try @rolldown/rolldown
  }

  if (!bundler) {
    try {
      bundler = (await import('@rolldown/rolldown')) as {
        rollup: (options: object) => Promise<RollupBundle>
      }
      bundlerName = '@rolldown/rolldown'
    } catch {
      // @rolldown/rolldown not available, try rollup
    }
  }

  if (!bundler) {
    try {
      bundler = (await import('rollup')) as {
        rollup: (options: object) => Promise<RollupBundle>
      }
      bundlerName = 'rollup'
    } catch {
      // rollup not available
    }
  }

  if (!bundler) {
    state.exclude.clear()
    throw new Error('Failed to load rollup or rolldown')
  }

  try {
    const bundle = await bundler.rollup(inputOptions)
    for (const [key, val] of state.idMap) {
      if (val.target === target) {
        state.exclude.delete(key)
      }
    }
    state.exclude.delete(target)

    const bundleOptions: Record<string, unknown> = {
      format: 'iife',
      name: 'worker_code',
      sourcemap: true,
      inlineDynamicImports: true,
    }

    if (bundlerName === 'rolldown') {
      bundleOptions.format = 'iife'
      delete bundleOptions.inlineDynamicImports
    }

    const result = await bundle.generate(bundleOptions)

    for (const [key, val] of state.idMap) {
      if (val.target === target) {
        return handleBundleGenerated(
          state,
          config,
          addWatchFile,
          key,
          workerID,
          result,
        )
      }
    }
    return null
  } catch (reason) {
    state.exclude.clear()
    throw reason
  }
}

export async function handleLoad(
  state: InternalState,
  config: InternalConfig,
  addWatchFile: (id: string) => void,
  id: string,
): Promise<{ code: string } | null> {
  const helperMatch = HELPER_PATTERN.exec(id)
  if (helperMatch) {
    const data = await loadHelperFile(id, helperMatch)
    return { code: data }
  }

  if (state.idMap.has(id) && !state.exclude.has(id)) {
    const entry = state.idMap.get(id)!
    return bundleWorker(state, config, entry, addWatchFile)
  }

  return null
}
