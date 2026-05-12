import path from 'node:path'
import { createRequire } from 'node:module'
import * as rollup from 'rollup'
import { fixMapSources } from '../utils/fixMapSources.js'
import { extractSource } from '../utils/extractSource.js'
import { buildWorkerCode } from '../utils/buildWorkerCode.js'

const require = createRequire(import.meta.url)

const helperFiles = new Map([
  [
    'browser::createInlineWorkerFactory',
    `import { funcToSource } from '\0rollup-plugin-web-worker-loader::helper::funcToSource'

export function createURL(fn, sourcemapArg) {
  var lines = funcToSource(fn, sourcemapArg)
  var blob = new Blob(lines, { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

export function createInlineWorkerFactory(fn, sourcemapArg) {
  var url
  return function WorkerFactory(options) {
    url = url || createURL(fn, sourcemapArg)
    return new Worker(url, options)
  }
}`,
  ],
  [
    'browser::createBase64WorkerFactory',
    `export function createBase64URL(base64, sourcemapArg, enableUnicode) {
  var source = enableUnicode ? atob(base64) : atob(base64)
  try {
    source = new TextDecoder(enableUnicode ? 'utf-16le' : 'utf-8').decode(
      Uint8Array.from(base64, c => c.charCodeAt(0)),
    )
  } catch (e) {}
  var blob = new Blob([source], { type: 'application/javascript' })
  if (sourcemapArg) {
    var blobUrl = URL.createObjectURL(blob)
    return blobUrl + sourcemapArg
  }
  return URL.createObjectURL(blob)
}

export function createBase64WorkerFactory(base64, sourcemapArg, enableUnicode) {
  return function WorkerFactory(options) {
    return new Worker(createBase64URL(base64, sourcemapArg, enableUnicode), options)
  }
}`,
  ],
  [
    'browser::createURLWorkerFactory',
    `export function createURLWorkerFactory(url) {
  return function WorkerFactory(options) {
    return new Worker(url, options)
  }
}`,
  ],
  [
    'browser::createInlineAudioWorkletFactory',
    `import { funcToSource } from '\0rollup-plugin-web-worker-loader::helper::funcToSource'

export function createInlineAudioWorkletFactory(fn, sourcemapArg) {
  return function AudioWorkletFactory(options) {
    var source = funcToSource(fn, sourcemapArg)
    var blob = new Blob(source, { type: 'application/javascript' })
    var url = URL.createObjectURL(blob)
    return new AudioWorkletNode(typeof options !== 'object' ? {} : options, url)
  }
}`,
  ],
  [
    'browser::createBase64AudioWorkletFactory',
    `export function createBase64AudioWorkletFactory(base64, sourcemapArg, enableUnicode) {
  return function AudioWorkletFactory(options) {
    var source = enableUnicode ? atob(base64) : atob(base64)
    try {
      source = new TextDecoder(enableUnicode ? 'utf-16le' : 'utf-8').decode(
        Uint8Array.from(base64, c => c.charCodeAt(0)),
      )
    } catch (e) {}
    var blob = new Blob([source], { type: 'application/javascript' })
    var url = URL.createObjectURL(blob) + (sourcemapArg || '')
    return new AudioWorkletNode(typeof options !== 'object' ? {} : options, url)
  }
}`,
  ],
  [
    'browser::createURLAudioWorkletFactory',
    `export function createURLAudioWorkletFactory(url) {
  return function AudioWorkletFactory(options) {
    return new AudioWorkletNode(typeof options !== 'object' ? {} : options, url)
  }
}`,
  ],
  [
    'browser::createInlinePaintWorkletFactory',
    `import { funcToSource } from '\0rollup-plugin-web-worker-loader::helper::funcToSource'

export function createInlinePaintWorkletFactory(fn, sourcemapArg) {
  return function PaintWorkletFactory() {
    var source = funcToSource(fn, sourcemapArg)
    var blob = new Blob(source, { type: 'application/javascript' })
    var url = URL.createObjectURL(blob)
    return Promise.resolve({ src: url,credentials: 'omit' })
  }
}`,
  ],
  [
    'browser::createBase64PaintWorkletFactory',
    `export function createBase64PaintWorkletFactory(base64, sourcemapArg, enableUnicode) {
  return function PaintWorkletFactory() {
    var source = enableUnicode ? atob(base64) : atob(base64)
    try {
      source = new TextDecoder(enableUnicode ? 'utf-16le' : 'utf-8').decode(
        Uint8Array.from(base64, c => c.charCodeAt(0)),
      )
    } catch (e) {}
    var blob = new Blob([source], { type: 'application/javascript' })
    var url = URL.createObjectURL(blob) + (sourcemapArg || '')
    return Promise.resolve({ src: url,credentials: 'omit' })
  }
}`,
  ],
  [
    'browser::createURLPaintWorkletFactory',
    `export function createURLPaintWorkletFactory(url) {
  return function PaintWorkletFactory() {
    return Promise.resolve({ src: url,credentials: 'omit' })
  }
}`,
  ],
  [
    'browser::createInlineServiceWorkerFactory',
    `import { funcToSource } from '\0rollup-plugin-web-worker-loader::helper::funcToSource'

export function createInlineServiceWorkerFactory(fn, sourcemapArg) {
  return function ServiceWorkerFactory(options) {
    var source = funcToSource(fn, sourcemapArg)
    var blob = new Blob(source, { type: 'application/javascript' })
    var url = URL.createObjectURL(blob)
    return navigator.serviceWorker.register(url, options)
  }
}`,
  ],
  [
    'browser::createBase64ServiceWorkerFactory',
    `export function createBase64ServiceWorkerFactory(base64, sourcemapArg, enableUnicode) {
  return function ServiceWorkerFactory(options) {
    var source = enableUnicode ? atob(base64) : atob(base64)
    try {
      source = new TextDecoder(enableUnicode ? 'utf-16le' : 'utf-8').decode(
        Uint8Array.from(base64, c => c.charCodeAt(0)),
      )
    } catch (e) {}
    var blob = new Blob([source], { type: 'application/javascript' })
    var url = URL.createObjectURL(blob) + (sourcemapArg || '')
    return navigator.serviceWorker.register(url, options)
  }
}`,
  ],
  [
    'browser::createURLServiceWorkerFactory',
    `export function createURLServiceWorkerFactory(url) {
  return function ServiceWorkerFactory(options) {
    return navigator.serviceWorker.register(url, options)
  }
}`,
  ],
  [
    'browser::createInlineSharedWorkerFactory',
    `import { funcToSource } from '\0rollup-plugin-web-worker-loader::helper::funcToSource'

export function createInlineSharedWorkerFactory(fn, sourcemapArg) {
  return function SharedWorkerFactory(options) {
    var source = funcToSource(fn, sourcemapArg)
    var blob = new Blob(source, { type: 'application/javascript' })
    var url = URL.createObjectURL(blob)
    return new SharedWorker(url, options && options.name, options)
  }
}`,
  ],
  [
    'browser::createBase64SharedWorkerFactory',
    `export function createBase64SharedWorkerFactory(base64, sourcemapArg, enableUnicode) {
  return function SharedWorkerFactory(options) {
    var source = enableUnicode ? atob(base64) : atob(base64)
    try {
      source = new TextDecoder(enableUnicode ? 'utf-16le' : 'utf-8').decode(
        Uint8Array.from(base64, c => c.charCodeAt(0)),
      )
    } catch (e) {}
    var blob = new Blob([source], { type: 'application/javascript' })
    var url = URL.createObjectURL(blob) + (sourcemapArg || '')
    return new SharedWorker(url, options && options.name, options)
  }
}`,
  ],
  [
    'browser::createURLSharedWorkerFactory',
    `export function createURLSharedWorkerFactory(url) {
  return function SharedWorkerFactory(options) {
    return new SharedWorker(url, options && options.name, options)
  }
}`,
  ],
  [
    'node::createInlineWorkerFactory',
    `export function createInlineWorkerFactory(fn) {
  var worker = fn.call(null)
  return function WorkerFactory(options) {
    return worker
  }
}`,
  ],
  [
    'node::createBase64WorkerFactory',
    `import { Worker as NodeWorker } from 'node:worker_threads'

export function createBase64WorkerFactory(base64) {
  return function WorkerFactory(options) {
    var code = Buffer.from(base64, 'base64').toString('utf8')
    return new NodeWorker(code, options)
  }
}`,
  ],
  [
    'node::createURLWorkerFactory',
    `import { Worker as NodeWorker } from 'node:worker_threads'

export function createURLWorkerFactory(url) {
  return function WorkerFactory(options) {
    return new NodeWorker(url, options)
  }
}`,
  ],
  [
    'node::WorkerClass',
    `export var WorkerClass = (function () {
  try {
    return require('node:worker_threads').Worker
  } catch (e) {
    return null
  }
})()`,
  ],
  [
    'auto::createInlineWorkerFactory',
    `import { isNodeJS } from '\0rollup-plugin-web-worker-loader::helper::auto::isNodeJS'
import { createInlineWorkerFactory as browserCreateInlineWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createInlineWorkerFactory'
import { createInlineWorkerFactory as nodeCreateInlineWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::node::createInlineWorkerFactory'

export function createInlineWorkerFactory(fn, sourcemapArg) {
  if (isNodeJS()) {
    return nodeCreateInlineWorkerFactory(fn)
  }
  return browserCreateInlineWorkerFactory(fn, sourcemapArg)
}`,
  ],
  [
    'auto::createBase64WorkerFactory',
    `import { isNodeJS } from '\0rollup-plugin-web-worker-loader::helper::auto::isNodeJS'
import { createBase64WorkerFactory as browserCreateBase64WorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createBase64WorkerFactory'
import { createBase64WorkerFactory as nodeCreateBase64WorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::node::createBase64WorkerFactory'

export function createBase64WorkerFactory(base64, sourcemapArg, enableUnicode) {
  if (isNodeJS()) {
    return nodeCreateBase64WorkerFactory(base64)
  }
  return browserCreateBase64WorkerFactory(base64, sourcemapArg, enableUnicode)
}`,
  ],
  [
    'auto::createURLWorkerFactory',
    `import { isNodeJS } from '\0rollup-plugin-web-worker-loader::helper::auto::isNodeJS'
import { createURLWorkerFactory as browserCreateURLWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createURLWorkerFactory'
import { createURLWorkerFactory as nodeCreateURLWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::node::createURLWorkerFactory'

export function createURLWorkerFactory(url) {
  if (isNodeJS()) {
    return nodeCreateURLWorkerFactory(url)
  }
  return browserCreateURLWorkerFactory(url)
}`,
  ],
  [
    'auto::createInlineAudioWorkletFactory',
    `import { createInlineAudioWorkletFactory as browserCreateInlineAudioWorkletFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createInlineAudioWorkletFactory'

export function createInlineAudioWorkletFactory(fn, sourcemapArg) {
  return browserCreateInlineAudioWorkletFactory(fn, sourcemapArg)
}`,
  ],
  [
    'auto::createBase64AudioWorkletFactory',
    `import { createBase64AudioWorkletFactory as browserCreateBase64AudioWorkletFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createBase64AudioWorkletFactory'

export function createBase64AudioWorkletFactory(base64, sourcemapArg, enableUnicode) {
  return browserCreateBase64AudioWorkletFactory(base64, sourcemapArg, enableUnicode)
}`,
  ],
  [
    'auto::createURLAudioWorkletFactory',
    `import { createURLAudioWorkletFactory as browserCreateURLAudioWorkletFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createURLAudioWorkletFactory'

export function createURLAudioWorkletFactory(url) {
  return browserCreateURLAudioWorkletFactory(url)
}`,
  ],
  [
    'auto::createInlinePaintWorkletFactory',
    `import { createInlinePaintWorkletFactory as browserCreateInlinePaintWorkletFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createInlinePaintWorkletFactory'

export function createInlinePaintWorkletFactory(fn, sourcemapArg) {
  return browserCreateInlinePaintWorkletFactory(fn, sourcemapArg)
}`,
  ],
  [
    'auto::createBase64PaintWorkletFactory',
    `import { createBase64PaintWorkletFactory as browserCreateBase64PaintWorkletFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createBase64PaintWorkletFactory'

export function createBase64PaintWorkletFactory(base64, sourcemapArg, enableUnicode) {
  return browserCreateBase64PaintWorkletFactory(base64, sourcemapArg, enableUnicode)
}`,
  ],
  [
    'auto::createURLPaintWorkletFactory',
    `import { createURLPaintWorkletFactory as browserCreateURLPaintWorkletFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createURLPaintWorkletFactory'

export function createURLPaintWorkletFactory(url) {
  return browserCreateURLPaintWorkletFactory(url)
}`,
  ],
  [
    'auto::createInlineServiceWorkerFactory',
    `import { createInlineServiceWorkerFactory as browserCreateInlineServiceWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createInlineServiceWorkerFactory'

export function createInlineServiceWorkerFactory(fn, sourcemapArg) {
  return browserCreateInlineServiceWorkerFactory(fn, sourcemapArg)
}`,
  ],
  [
    'auto::createBase64ServiceWorkerFactory',
    `import { createBase64ServiceWorkerFactory as browserCreateBase64ServiceWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createBase64ServiceWorkerFactory'

export function createBase64ServiceWorkerFactory(base64, sourcemapArg, enableUnicode) {
  return browserCreateBase64ServiceWorkerFactory(base64, sourcemapArg, enableUnicode)
}`,
  ],
  [
    'auto::createURLServiceWorkerFactory',
    `import { createURLServiceWorkerFactory as browserCreateURLServiceWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createURLServiceWorkerFactory'

export function createURLServiceWorkerFactory(url) {
  return browserCreateURLServiceWorkerFactory(url)
}`,
  ],
  [
    'auto::createInlineSharedWorkerFactory',
    `import { createInlineSharedWorkerFactory as browserCreateInlineSharedWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createInlineSharedWorkerFactory'

export function createInlineSharedWorkerFactory(fn, sourcemapArg) {
  return browserCreateInlineSharedWorkerFactory(fn, sourcemapArg)
}`,
  ],
  [
    'auto::createBase64SharedWorkerFactory',
    `import { createBase64SharedWorkerFactory as browserCreateBase64SharedWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createBase64SharedWorkerFactory'

export function createBase64SharedWorkerFactory(base64, sourcemapArg, enableUnicode) {
  return browserCreateBase64SharedWorkerFactory(base64, sourcemapArg, enableUnicode)
}`,
  ],
  [
    'auto::createURLSharedWorkerFactory',
    `import { createURLSharedWorkerFactory as browserCreateURLSharedWorkerFactory } from '\0rollup-plugin-web-worker-loader::helper::browser::createURLSharedWorkerFactory'

export function createURLSharedWorkerFactory(url) {
  return browserCreateURLSharedWorkerFactory(url)
}`,
  ],
  [
    'auto::isNodeJS',
    `export function isNodeJS() {
  return typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
}`,
  ],
  [
    'funcToSource',
    `export function funcToSource(fn, sourcemapArg) {
  var sourcemap = sourcemapArg === undefined ? null : sourcemapArg
  var source = fn.toString()
  var lines = source.split('\\n')
  lines.pop()
  lines.shift()
  var blankPrefixLength = lines[0].search(/\\S/)
  var regex = /(['"])__worker_loader_strict__(['"])/g
  for (var i = 0, n = lines.length; i < n; ++i) {
    lines[i] =
      lines[i].substring(blankPrefixLength).replace(regex, '$1use strict$2') +
      '\\n'
  }
  if (sourcemap) {
    lines.push('\\/\\/# sourceMappingURL=' + sourcemap + '\\n')
  }
  return lines
}`,
  ],
])

const helperPattern =
  /^\0(?:[0-9]+::)?rollup-plugin-web-worker-loader::helper::(.+)/

export function loadHelperFile(id, match, resolve, reject) {
  const key = match[1]
  const content = helperFiles.get(key)
  if (content) {
    resolve(content)
  } else {
    reject(new Error(`Helper file not found: ${key}`))
  }
}

export function findChunk(rollupOutput) {
  for (const chunk of rollupOutput) {
    if (!chunk.isAsset) {
      return chunk
    }
  }
  return null
}

export function updateWatchModules(modules, addWatchFile) {
  const deps = Object.keys(modules)
  for (const dep of deps) {
    addWatchFile(dep)
  }
}

export function handleBundleGenerated(
  state,
  config,
  addWatchFile,
  id,
  workerID,
  result,
) {
  const chunk = findChunk(result.output)
  if (chunk !== null) {
    updateWatchModules(chunk.modules, addWatchFile)

    let map = null
    let source
    if (config.inline || config.targetPlatform === 'base64') {
      source = extractSource(chunk.code, config.preserveSource)
      map = null
      if (config.sourcemap) {
        map = fixMapSources(chunk, state.basePath)
      }
    } else {
      const workerPath = path.posix.join(config.outputFolder, workerID)
      source = path.posix.join(config.loadPath, workerPath)
      chunk.fileName = workerPath
      state.idMap.get(id).chunk = chunk
    }
    return {
      code: buildWorkerCode(source, map, {
        inline: config.inline,
        preserveSource: config.preserveSource,
        enableUnicode: config.enableUnicode,
        targetPlatform: config.targetPlatform,
        type: state.idMap.get(id).type,
      }),
    }
  }
  return null
}

export async function load(state, config, addWatchFile, id) {
  const helperMatch = helperPattern.exec(id)
  if (helperMatch) {
    return new Promise((resolve, reject) => {
      loadHelperFile(id, helperMatch, resolve, reject)
    })
  }

  if (!state.idMap.has(id) || state.exclude.has(id)) {
    return null
  }

  const meta = state.idMap.get(id)
  const { inputOptions, workerID, target } = meta

  state.exclude.add(id)
  state.exclude.add(target)

  try {
    if (config.external) {
      inputOptions.external = config.external
    }

    const bundle = await rollup.rollup(inputOptions)

    const result = await bundle.generate({
      format: 'iife',
      name: 'worker_code',
      sourcemap: true,
      inlineDynamicImports: true,
    })

    await bundle.close?.()

    return handleBundleGenerated(
      state,
      config,
      addWatchFile,
      id,
      workerID,
      result,
    )
  } finally {
    state.exclude.delete(id)
    state.exclude.delete(target)
  }
}
