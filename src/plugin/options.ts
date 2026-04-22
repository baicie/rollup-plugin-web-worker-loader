import type { InputOptions as RollupInputOptions } from 'rollup'
import type { InternalConfig, InternalState } from '../types.js'
import path from 'node:path'
import process from 'node:process'

export function handleOptions(
  state: InternalState,
  config: InternalConfig,
  options: RollupInputOptions,
): null {
  if (!state.options) {
    state.options = { ...options }
    if (options.plugins && options.plugins.length) {
      const plugins: unknown[] = []
      for (const plugin of options.plugins) {
        if (
          typeof plugin === 'object' &&
          plugin &&
          'name' in plugin &&
          config.skipPlugins.has((plugin as { name: string }).name)
        ) {
          continue
        }
        plugins.push(plugin)
      }
      ;(state.options as RollupInputOptions & { plugins: unknown[] }).plugins =
        plugins

      const cwd = process.cwd()
      if (typeof options.input === 'string') {
        try {
          const entry = require.resolve(options.input, { paths: [cwd] })
          state.basePath = path.dirname(entry)
        } catch {
          /* EMPTY */
        }
      } else if (Array.isArray(options.input)) {
        let componentCount = Number.MAX_SAFE_INTEGER
        let shortestPath: string | null = null
        for (const input of options.input) {
          try {
            const entry = require.resolve(input, { paths: [cwd] })
            const entryPath = path.dirname(entry)
            const components = entryPath.split(path.sep)
            if (components.length < componentCount) {
              componentCount = components.length
              shortestPath = entryPath
            }
          } catch {
            /* EMPTY */
          }
        }
        state.basePath = shortestPath
      } else if (typeof options.input === 'object') {
        const keys = Object.keys(options.input)
        let componentCount = Number.MAX_SAFE_INTEGER
        let shortestPath: string | null = null
        for (const key of keys) {
          const input = (options.input as Record<string, string>)[key]
          try {
            const entry = require.resolve(input, { paths: [cwd] })
            const entryPath = path.dirname(entry)
            const components = entryPath.split(path.sep)
            if (components.length < componentCount) {
              componentCount = components.length
              shortestPath = entryPath
            }
          } catch {
            /* EMPTY */
          }
        }
        state.basePath = shortestPath
      }

      if (!state.basePath) {
        state.basePath = '.'
      }
    }
  }

  return null
}
