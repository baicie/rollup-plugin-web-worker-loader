import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import * as rollup from 'rollup'
import { fixMapSources } from '../utils/fixMapSources.js'
import { extractSource } from '../utils/extractSource.js'
import { buildWorkerCode } from '../utils/buildWorkerCode.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const helperFiles = new Map()

function preloadHelpers() {
  const helperDir = path.resolve(__dirname, '../src/helper')
  const categories = ['browser', 'node', 'auto']
  for (const cat of categories) {
    const catDir = path.join(helperDir, cat)
    if (fs.existsSync(catDir)) {
      for (const file of fs.readdirSync(catDir)) {
        if (file.endsWith('.js')) {
          const key = `${cat}::${file.replace(/\.js$/, '')}`
          const content = fs.readFileSync(path.join(catDir, file), 'utf8')
          helperFiles.set(key, content)
        }
      }
    }
  }
  const funcToSourcePath = path.join(helperDir, 'funcToSource.js')
  if (fs.existsSync(funcToSourcePath)) {
    helperFiles.set('funcToSource', fs.readFileSync(funcToSourcePath, 'utf8'))
  }
}

preloadHelpers()

const helperPattern =
  /^\0(?:[0-9]+::)?rollup-plugin-web-worker-loader::helper(?:::)?/

export function loadHelperFile(id, match, resolve, reject) {
  const helperParts = id.substr(match[0].length).split('::')
  const key = helperParts.join('::')
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

export function load(state, config, addWatchFile, id) {
  return new Promise((resolve, reject) => {
    const helperMatch = helperPattern.exec(id)
    if (helperMatch) {
      loadHelperFile(id, helperMatch, resolve, reject)
    } else if (state.idMap.has(id) && !state.exclude.has(id)) {
      const { inputOptions, workerID, target } = state.idMap.get(id)
      state.exclude.add(id)
      state.exclude.add(target)
      if (config.external) {
        inputOptions.external = config.external
      }
      rollup
        .rollup(inputOptions)
        .then(bundle => {
          state.exclude.delete(id)
          state.exclude.delete(target)
          const bundleOptions = {
            format: 'iife',
            name: 'worker_code',
            sourcemap: true,
            inlineDynamicImports: true,
          }
          bundle
            .generate(bundleOptions)
            .then(result => {
              resolve(
                handleBundleGenerated(
                  state,
                  config,
                  addWatchFile,
                  id,
                  workerID,
                  result,
                ),
              )
            })
            .catch(reject)
        })
        .catch(reason => {
          state.exclude.delete(id)
          state.exclude.delete(target)
          reject(reason)
        })
    } else {
      resolve(null)
    }
  })
}
