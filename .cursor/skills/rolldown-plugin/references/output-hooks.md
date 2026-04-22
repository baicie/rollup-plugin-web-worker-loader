---
name: rolldown-output-hooks
description: Rolldown output generation hooks: renderStart, renderChunk, generateBundle, writeBundle, closeBundle, banner, footer, intro, outro
---

# Output Generation Hooks

Output generation hooks provide information about the generated bundle and modify it once complete. Plugins using only output hooks can be passed via output options to run only for certain outputs.

## Hook Order

```
renderStart → beforeAddons → banner/afterAddons → footer → intro → outro → renderChunk → minify → generateBundle → writeBundle → closeBundle
```

Each chunk: `renderChunk` → `minify` → `postBanner` → `postFooter` → `augmentChunkHash`

## renderStart

**Kind**: `sync`, `sequential`
**Purpose**: Called before output generation starts. Access to both input and output options.

```ts
renderStart(outputOptions, inputOptions) {
  // Can modify output options
  outputOptions.inlineDynamicImports = true
}
```

## banner & footer

**Kind**: `sync`, `sequential`
**Purpose**: Add content at the beginning/end of the bundle or each chunk.

```ts
banner = '/* my-banner */'
footer = '/* my-footer */'

// Function form (per chunk):
banner() { return '/* banner */' }
footer() { return '/* footer */' }
```

Note: `postBanner` / `postFooter` are **not** plugin hooks — they are output options without corresponding hooks.

## intro & outro

**Kind**: `sync`, `sequential`
**Purpose**: Add content inside the bundle before/after the module code.

```ts
intro = 'const global = window'
outro = 'console.log("done")'

// Function form:
intro() { return 'const global = window' }
```

## renderChunk

**Kind**: `async`, `sequential`
**Purpose**: Transform or modify individual chunks.

```ts
async renderChunk(code, chunk, outputOptions) {
  return {
    code: transform(code),
    map: null,
  }
}
```

Return values:
- `null` / `undefined`: No change
- A string: Replace chunk code
- `{ code, map }`: Replace code with optional source map

## minify

**Kind**: `sync`, `sequential`
**Purpose**: Hook into the minification process (not a plugin hook, internal step).

## augmentChunkHash

**Kind**: `sync`, `sequential`
**Purpose**: Modify the hash of a chunk (for cache busting).

```ts
augmentChunkHash(chunkInfo) {
  return { hash: 'custom-hash' }
}
```

## generateBundle

**Kind**: `sync`, `sequential`
**Purpose**: Inspect/modify bundle before it's written. Can add or remove files.

```ts
generateBundle(options, bundle, isWrite) {
  // Add manifest file
  this.emitFile({
    type: 'asset',
    fileName: 'manifest.json',
    source: JSON.stringify({ chunks: Object.keys(bundle) }),
  })

  // Remove a file
  delete bundle['old-chunk.js']
}
```

## writeBundle

**Kind**: `sync`, `sequential`
**Purpose**: Bundle is about to be written to disk.

```ts
writeBundle(options, bundle) {
  for (const [fileName, chunk] of Object.entries(bundle)) {
    console.log(fileName, chunk.type, chunk.fileName)
  }
}
```

Note: In Rolldown, `writeBundle` is sequential by default (unlike Rollup's parallel).

## closeBundle

**Kind**: `sync`, `sequential`
**Purpose**: Called as the very last hook.

In Rolldown: **only** when you called `generate()` or `write()` at least once.

User must manually call `bundle.close()` to trigger this. CLI always ensures this happens.

```ts
closeBundle() {
  console.log('build complete')
}
```

## renderError

**Kind**: `sync`, `sequential`
**Purpose**: Called when an error occurs during output generation.

```ts
renderError(error) {
  console.error('render error:', error)
}
```
