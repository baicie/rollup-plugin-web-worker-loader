---
name: rolldown-build-hooks
description: Rolldown build phase hooks: options, resolveId, load, transform, buildStart, buildEnd, moduleParsed, resolveDynamicImport
---

# Build Hooks

Build hooks run during the build phase, concerned with locating, providing, and transforming input files.

## Hook Order

`options` → `outputOptions` → `buildStart` → `resolveId` → `load` → `transform` → `buildEnd`

Each import also triggers: `moduleParsed` → `resolveDynamicImport`

## options

**Kind**: `sync`, `sequential`
**Purpose**: Intercept and modify configuration before build starts.

```ts
options() {
  return {
    input: './src/main.js',
    external: ['external-lib'],
  }
}
```

## outputOptions

**Kind**: `sync`, `sequential`
**Note**: Called **before** build hooks in Rolldown (unlike Rollup where it's after).

```ts
outputOptions(outputOptions) {
  console.log('output format:', outputOptions.format)
}
```

## buildStart

**Kind**: `async`, `parallel`
**Purpose**: Called when build starts. Return type is ignored.

```ts
async buildStart() {
  await fetchManifest()
}
```

## resolveId

**Kind**: `async`, `first`
**Purpose**: Resolve import paths to module IDs.

```ts
resolveId(source, importer) {
  if (source === 'virtual:module') {
    return '\0' + source
  }
  return null  // null = let other plugins handle, undefined = treat as module ID
}
```

Return values:
- `null`: Skip this plugin, try others
- `undefined`: Module ID is the source itself, continue
- A string: Resolved module ID

With `customResolver` option for object form:

```ts
resolveId: {
  handler(source, importer) {
    if (source === 'virtual:module') return '\0' + source
    return null
  },
  customResolver(source, importer, options) {
    // options.context is the resolved context (dir)
    return null
  }
}
```

## load

**Kind**: `async`, `first`
**Purpose**: Provide module content for a resolved ID.

```ts
load(id) {
  if (id === '\0virtual:module') {
    return `export default 'Hello'`
  }
  return null  // null = let other plugins handle or read from filesystem
}
```

Return values:
- `null` / `undefined`: Let other plugins or filesystem handle
- A string: Use as module source code
- `{ code, map, ast }`: Provide code with optional source map and AST

## transform

**Kind**: `async`, `sequential`
**Purpose**: Transform module code before parsing.

```ts
transform(code, id) {
  if (!id.endsWith('.custom')) return null

  return {
    code: compile(code),
    map: null,  // null = auto-generate, provide your own RawSourceMap
    ast: undefined,  // Rolldown regenerates if undefined
  }
}
```

Rolldown runs internal TypeScript/JSX transforms **after** `transform` hook, so:
- Use `this.parse(code, { lang: 'ts' })` to support TS/JSX parsing
- Or use `transform` function from `rolldown/utils` to pre-transform

## moduleParsed

**Kind**: `sync`, `parallel`
**Purpose**: Called when a module has been completely parsed.

```ts
moduleParsed(moduleInfo) {
  // moduleInfo: { id, code, ast, dependencies, dynamicDependencies }
}
```

## resolveDynamicImport

**Kind**: `async`, `first`
**Purpose**: Resolve `import()` expressions.

```ts
resolveDynamicImport(source, importer) {
  if (source === 'virtual:module') {
    return '\0' + source
  }
  return null
}
```

## buildEnd

**Kind**: `async`, `parallel`
**Purpose**: Called when build completes (success or failure).

```ts
async buildEnd() {
  await cleanup()
}
```

## watchChange & closeWatcher

Only in watch mode:

```ts
watchChange(id) {
  console.log('file changed:', id)
}

closeWatcher() {
  console.log('watcher closed')
}
```
