---
name: rolldown-plugin-examples
description: Complete Rolldown plugin examples: virtual modules, code transform, CSS processing
---

# Rolldown Plugin Examples

## Virtual Module Plugin

Serve content that doesn't exist on disk:

```ts
import { definePlugin } from 'rolldown'

function virtualManifestPlugin(manifest) {
  const resolvedId = '\0virtual:manifest'

  return {
    name: 'virtual-manifest',
    resolveId(source) {
      if (source === 'virtual:manifest') return resolvedId
      return null
    },
    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(manifest)}`
      }
      return null
    },
  }
}

// Usage:
import manifest from 'virtual:manifest'
console.log(manifest)
```

## Code Transform Plugin

Transform files by extension:

```ts
import { definePlugin } from 'rolldown'

function customLangPlugin() {
  return {
    name: 'custom-lang',
    transform(code, id) {
      if (!id.endsWith('.custom')) return null

      // Use this.parse for TypeScript/JSX support
      const ast = this.parse(code, { lang: 'ts' })

      return {
        code: transformCustom(code, ast),
        map: null,
      }
    },
  }
}
```

## Banner/Footer Plugin

Add content around bundle:

```ts
function bannerPlugin(banner) {
  return {
    name: 'banner',
    banner,
  }
}

export default defineConfig({
  plugins: [
    bannerPlugin('/* Built with Rolldown */'),
  ],
})
```

## File Emission Plugin

Generate additional files during build:

```ts
function manifestPlugin() {
  return {
    name: 'manifest',
    generateBundle(options, bundle) {
      const manifest = {
        files: Object.keys(bundle).filter(
          (name) => !name.startsWith('_')
        ),
      }
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest, null, 2),
      })
    },
  }
}
```

## CSS-in-JS Plugin

Process CSS imports:

```ts
function cssPlugin(options = {}) {
  const styleMap = new Map()

  return {
    name: 'css-plugin',
    transform(code, id) {
      if (id.endsWith('.style')) {
        const css = transformStyleToJS(code)
        styleMap.set(id, css)
        return { code: css, map: null }
      }
      return null
    },
    renderChunk(code, chunk) {
      // Inject CSS into page
      return code.replace(
        '__INJECT_CSS__',
        Array.from(styleMap.values()).join('\n')
      )
    },
  }
}
```

## Plugin with Options

```ts
import { definePlugin } from 'rolldown'

function myPlugin(options = {}) {
  const {
    include = /\.(custom)$/,
    exclude,
    verbose = false,
  } = options

  return {
    name: 'my-plugin',
    transform(code, id) {
      if (exclude?.test(id)) return null
      if (!include.test(id)) return null

      if (verbose) this.warn(`transforming: ${id}`)

      return {
        code: doTransform(code),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [
    myPlugin({ include: /\.special$/, verbose: true }),
  ],
})
```

## Plugin Context Utilities

Available via `this` inside hooks:

```ts
{
  name: 'ctx-demo',
  resolveId(source) {
    // Get full module info
    const info = this.getModuleInfo(source)
    if (info) console.log('found:', info.id)

    return null
  },
  buildEnd(error) {
    // Report errors
    if (error) this.error(error.message)
    this.warn('build ended')
  },
  generateBundle() {
    // Emit files
    this.emitFile({
      type: 'asset',
      fileName: 'generated.json',
      source: '{}',
    })

    // Get all chunk info
    const ids = this.getChunkIds()
    console.log('chunks:', ids)
  },
}
```

## TypeScript Type Definition

```ts
import type { Plugin } from 'rolldown'

interface Options {
  prefix?: string
}

export default function myPlugin(options: Options = {}): Plugin {
  const { prefix = 'msg' } = options

  return {
    name: 'my-plugin',
    // hooks...
  }
}
```
