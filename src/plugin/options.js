import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function isPluginInOptions(plugins, pluginName) {
  if (!plugins || !Array.isArray(plugins)) return false
  for (let i = 0; i < plugins.length; i++) {
    const p = plugins[i]
    if (!p || typeof p !== 'object') continue
    if (typeof p.then === 'function') continue
    if (p.name === pluginName) {
      return true
    }
  }
  return false
}

export function optionsImp(state, config, options) {
  const isMainRollup = isPluginInOptions(
    options.plugins,
    'rollup-plugin-web-worker-loader',
  )

  if (isMainRollup) {
    if (!state._initialized) {
      const plugins = []
      options.plugins.forEach(plugin => {
        if (!plugin) return
        if (plugin.name === 'rollup-plugin-web-worker-loader') return
        if (config.skipPlugins.has(plugin.name)) return
        plugins.push(plugin)
      })
      state.options = Object.assign({}, options, { plugins })
      state._initialized = true
    }
    return null
  }

  if (!state._initialized) {
    return null
  }

  if (options.plugins && options.plugins.length) {
    const plugins = []

    options.plugins.forEach(plugin => {
      if (!plugin) return

      if (plugin.name === 'rollup-plugin-web-worker-loader') {
        return
      }

      if (config.skipPlugins.has(plugin.name)) {
        return
      }

      plugins.push(plugin)
    })

    state.options.plugins = plugins

    const cwd = process.cwd()
    if (typeof options.input === 'string') {
      try {
        const entry = require.resolve(options.input, { paths: [cwd] })
        state.basePath = path.dirname(entry)
      } catch (e) {
        /* EMPTY */
      }
    } else if (Array.isArray(options.input)) {
      let componentCount = Number.MAX_SAFE_INTEGER
      let shortestPath = null
      for (let i = 0, n = options.input.length; i < n; ++i) {
        try {
          const entry = require.resolve(options.input[i], { paths: [cwd] })
          const entryPath = path.dirname(entry)
          const components = entryPath.split(path.sep)
          if (components.length < componentCount) {
            componentCount = components.length
            shortestPath = entryPath
          }
        } catch (e) {
          /* EMPTY */
        }
      }
      state.basePath = shortestPath
    } else {
      const keys = Object.keys(options.input)
      let componentCount = Number.MAX_SAFE_INTEGER
      let shortestPath = null
      for (let i = 0, n = keys.length; i < n; ++i) {
        const input = options.input[keys[i]]
        try {
          const entry = require.resolve(input, { paths: [cwd] })
          const entryPath = path.dirname(entry)
          const components = entryPath.split(path.sep)
          if (components.length < componentCount) {
            componentCount = components.length
            shortestPath = entryPath
          }
        } catch (e) {
          /* EMPTY */
        }
      }
      state.basePath = shortestPath
    }

    if (!state.basePath) {
      state.basePath = '.'
    }
  }

  return null
}
