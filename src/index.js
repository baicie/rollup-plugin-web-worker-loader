import { optionsImp } from './plugin/options.js'
import { resolveId, buildInputOptions } from './plugin/resolveId.js'
import { load } from './plugin/load.js'
import { transform } from './plugin/transform.js'
import { outputOptions } from './plugin/outputOptions.js'
import { generateBundle } from './plugin/generateBundle.js'
import { rolldownLoad } from './plugin/rolldownLoad.js'

export { buildInputOptions }

const defaultConfig = {
  targetPlatform: 'auto',
  browserWorker: 'Worker',
  sourcemap: false,
  loadPath: '',
  preserveSource: false,
  preserveFileNames: false,
  enableUnicode: false,
  webWorkerPattern: /web-worker:(.+)/,
  audioWorkletPattern: /audio-worklet:(.+)/,
  paintWorkletPattern: /paint-worklet:(.+)/,
  serviceWorkerPattern: /service-worker:(.+)/,
  sharedWorkerPattern: /shared-worker:(.+)/,
  inline: true,
  forceInline: false,
  external: undefined,
  extensions: ['.js', '.ts'],
  outputFolder: '',
  skipPlugins: [
    'liveServer',
    'serve',
    'livereload',
    'commonjs',
    'commonjs--resolver',
  ],
}

function createState() {
  return {
    idMap: new Map(),
    exclude: new Set(),
    outFiles: new Map(),
    options: null,
    basePath: null,
    forceInlineCounter: 0,
    configuredFileNames: new Map(),
    _buildCount: 0,
  }
}

function applySharedHooks(pluginObj, state, config) {
  pluginObj.options = optionsArg => {
    if (state._buildCount > 0) {
      state.exclude.clear()
      state.outFiles.clear()
      state.configuredFileNames.clear()
      state.forceInlineCounter = 0
      state._initialized = false
    }
    state._buildCount++

    optionsImp(state, config, optionsArg)
    return null
  }
  pluginObj.resolveId = (importee, importer) =>
    resolveId(state, config, importee, importer)
  pluginObj.transform = (code, id) => transform(state, config, code, id)
}

export function workerLoaderPlugin(userConfig = null) {
  const config = Object.assign({}, defaultConfig, userConfig)
  config.skipPlugins = new Set(config.skipPlugins)

  const state = createState()

  const pluginObj = {
    name: 'rollup-plugin-web-worker-loader',

    load(id) {
      const rawAddWatchFile = this.addWatchFile
      const ctx = this
      const addWatchFile = dep => {
        if (!dep || !rawAddWatchFile) return
        try {
          rawAddWatchFile.call(ctx, dep)
        } catch {
          // ignore
        }
      }
      return load(state, config, addWatchFile, id)
    },

    outputOptions(options) {
      return outputOptions(state, config, options)
    },

    generateBundle(options, bundle) {
      generateBundle(state, config, options, bundle)
    },
  }

  applySharedHooks(pluginObj, state, config)
  return pluginObj
}

export function workerLoaderRolldownPlugin(userConfig = null) {
  const config = Object.assign({}, defaultConfig, userConfig)
  config.skipPlugins = new Set(config.skipPlugins)

  const state = createState()

  const pluginObj = {
    name: 'rollup-plugin-web-worker-loader',

    resolveId(source, importer) {
      return resolveId(state, config, source, importer)
    },

    async load(id) {
      return await rolldownLoad(state, config, this, id)
    },

    outputOptions(options) {
      return outputOptions(state, config, options)
    },

    generateBundle(options, bundle) {
      generateBundle(state, config, options, bundle)
    },
  }

  applySharedHooks(pluginObj, state, config)
  return pluginObj
}

export { workerLoaderPlugin as webWorkerLoader }
export { workerLoaderPlugin as default }
