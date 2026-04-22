import { optionsImp } from './plugin/options.js'
import { resolveId } from './plugin/resolveId.js'
import { load } from './plugin/load.js'
import { transform } from './plugin/transform.js'
import { outputOptions } from './plugin/outputOptions.js'
import { generateBundle } from './plugin/generateBundle.js'

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
  skipPlugins: ['liveServer', 'serve', 'livereload'],
}

export function workerLoaderPlugin(userConfig = null) {
  const config = Object.assign({}, defaultConfig, userConfig)
  config.skipPlugins = new Set(config.skipPlugins)

  const state = {
    idMap: new Map(),
    exclude: new Set(),
    outFiles: new Map(),
    options: null,
    basePath: null,
    forceInlineCounter: 0,
    configuredFileNames: new Map(),
  }

  return {
    name: 'rollup-plugin-web-worker-loader',

    options(optionsArg) {
      return optionsImp(state, config, optionsArg)
    },

    resolveId(importee, importer) {
      return resolveId(state, config, importee, importer)
    },

    load(id) {
      return load(state, config, this.addWatchFile, id)
    },

    transform(code, id) {
      return transform(state, config, code, id)
    },

    outputOptions(options) {
      return outputOptions(state, config, options)
    },

    generateBundle(options, bundle, isWrite) {
      generateBundle(state, config, options, bundle, isWrite)
    },
  }
}
export { workerLoaderPlugin as webWorkerLoader }
export { workerLoaderPlugin as default }
