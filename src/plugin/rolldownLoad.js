import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { rolldown } from 'rolldown'
import { extractSource } from '../utils/extractSource.js'
import { buildWorkerCode } from '../utils/buildWorkerCode.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const helperPattern = /^\0rollup-plugin-web-worker-loader::helper::(.+)/

export function loadHelperFile(id, match) {
  const modulePart = match[1]
  const content = helperFiles.get(modulePart)
  return content || null
}

export function isHelperId(id) {
  return helperPattern.test(id)
}

function createHelperPlugin() {
  return {
    name: 'rollup-plugin-web-worker-loader-helper',
    resolveId(source) {
      if (helperPattern.test(source)) {
        return source
      }
      return null
    },
    load(id) {
      const match = helperPattern.exec(id)
      if (match) {
        const content = loadHelperFile(id, match)
        if (content) {
          return content
        }
      }
      return null
    },
  }
}

function findChunk(output) {
  for (const chunk of output) {
    if (!chunk.type || chunk.type === 'chunk') {
      return chunk
    }
  }
  return null
}

function findIdMapEntry(state, id) {
  if (state.idMap.has(id)) {
    return state.idMap.get(id)
  }
  for (const [key, value] of state.idMap) {
    if (key.endsWith(id) || id.endsWith(key) || key.includes(id)) {
      return value
    }
  }
  return null
}

export async function rolldownLoad(state, config, ctx, id) {
  const helperMatch = helperPattern.exec(id)
  if (helperMatch) {
    const content = loadHelperFile(id, helperMatch)
    if (content) {
      return { code: content }
    }
    return null
  }

  const entry = findIdMapEntry(state, id)
  if (!entry || state.exclude.has(id)) {
    return null
  }

  state.exclude.add(id)
  const { workerID, target, type } = entry

  try {
    const nestedBundler = await rolldown({
      input: target,
      plugins: [createHelperPlugin()],
      external: config.external,
      platform: config.targetPlatform === 'node' ? 'node' : 'browser',
      treeshake: !config.preserveSource,
    })

    const output = await nestedBundler.generate({
      format: 'iife',
      name: 'worker_code',
      inlineDynamicImports: true,
      sourcemap: config.sourcemap || false,
    })

    await nestedBundler.close()

    const chunk = findChunk(output.output)
    if (!chunk) {
      return null
    }

    if (config.inline || config.targetPlatform === 'base64') {
      const source = extractSource(chunk.code, config.preserveSource)
      let map = null
      if (config.sourcemap && chunk.map) {
        map = chunk.map
      }
      return {
        code: buildWorkerCode(source, map, {
          inline: true,
          preserveSource: config.preserveSource,
          enableUnicode: config.enableUnicode,
          targetPlatform: config.targetPlatform,
          type,
        }),
      }
    }

    const emittedFileName = `${config.outputFolder ? `${config.outputFolder}/` : ''}${workerID}`

    ctx.emitFile({
      type: 'chunk',
      id: target,
      fileName: emittedFileName,
    })

    const relativePath = `./${emittedFileName}`
    return {
      code: buildWorkerCode(relativePath, null, {
        inline: false,
        preserveSource: config.preserveSource,
        enableUnicode: config.enableUnicode,
        targetPlatform: config.targetPlatform,
        type,
      }),
    }
  } finally {
    state.exclude.delete(id)
  }
}
