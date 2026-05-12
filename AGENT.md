---
name: rollup-plugin-web-worker-loader
description: Web Worker integration plugin for Rollup and Rolldown
version: 0.2.3
---

# AGENT.md

## 语言要求

所有回答必须使用**中文（简体）**。在回答用户问题时，请使用中文进行交流，除非用户明确使用其他语言提问。

This repository is the source of `@baicie/web-worker-inline`, a Rollup/Rolldown plugin that bundles Web Workers, Service Workers, Shared Workers, Audio Worklets, and Paint Worklets. All source files live under `src/`.

## Build Commands

| Command | Tool | Purpose |
|---|---|---|
| `pnpm dev` | rolldown (watch) | Watch-mode dev build, outputs to `dist/` |
| `pnpm build` | rolldown | Production build, outputs to `dist/` (ESM `.mjs` + CJS `.cjs`) |
| `pnpm lint` | eslint (`@antfu/eslint-config`) | Lint `src/**/*.ts` files |
| `pnpm fix` | eslint `--fix` | Auto-fix lint errors |
| `pnpm format` | prettier `--write --cache` | Format all files |
| `pnpm format:check` | prettier `--check` | Check formatting only |
| `pnpm typecheck` | tsc `--noEmit` | TypeScript type checking |
| `pnpm release` | `tsx scripts/release.ts` | Create release (uses `@baicie/release`) |
| `pnpm ci-publish` | `tsx scripts/publish.ts` | Publish to npm (uses `@baicie/release`) |

Package manager is **pnpm**. All scripts must be run from the repository root.

## Package Structure

The package exposes two entry points:

- `webWorkerLoader()` / default export — Rollup plugin (Rollup v1-v4)
- `webWorkerLoaderRolldownPlugin()` / `/rolldown` export — Rolldown plugin (Rolldown v1+)

Both entry points share the same `WorkerLoaderConfig` interface defined in `src/index.d.ts`.

## Source Architecture

### Plugin Entry Points

- `src/index.js` — Rollup plugin (`workerLoaderPlugin`) + Rolldown plugin (`workerLoaderRolldownPlugin`) with shared state management. Two exported functions, both use `applySharedHooks` for common hooks.
- `src/rolldown.js` — Thin re-export of `workerLoaderRolldownPlugin` for the `/rolldown` export path.

### Plugin Lifecycle Files (shared between Rollup and Rolldown via duplicated code)

- `src/plugin/options.js` — `options` hook: deduplicates plugin list, resolves `state.basePath` from `options.input` using `require.resolve`.
- `src/plugin/resolveId.js` — `resolveId` hook: intercepts `web-worker:`, `audio-worklet:`, `paint-worklet:`, `service-worker:`, `shared-worker:` imports. Stores resolved modules in `state.idMap` and returns a null-byte prefixed virtual module ID.
- `src/plugin/transform.js` — `transform` hook: returns a synthetic source map for worker modules.
- `src/plugin/outputOptions.js` — `outputOptions` hook: converts `file` output option to `dir` for worker bundles.
- `src/plugin/generateBundle.js` — `generateBundle` hook: emits worker chunk files when `inline: false`.
- `src/plugin/load.js` — Rollup `load` hook: creates nested Rollup bundle for each worker, generates factory code.
- `src/plugin/rolldownLoad.js` — Rolldown `load` hook: equivalent but using Rolldown's API (`rolldown()` + `generate()` + `close()`).

### Helper Files (virtual modules via null-byte IDs)

- `src/helper/funcToSource.js` — Converts a function's `.toString()` output back to source lines, strips wrapper indentation, restores `use strict`.
- `src/helper/browser/` — Factory functions for browser workers (inline/base64/URL variants for Worker, SharedWorker, ServiceWorker, AudioWorklet, PaintWorklet).
- `src/helper/node/` — Factory functions for Node.js workers (uses `node:worker_threads`).
- `src/helper/auto/` — Factory functions that delegate to browser or node based on `isNodeJS()`.

### Utilities

- `src/utils/buildWorkerCode.js` — Composes the final factory-wrapper code: picks the right factory function name, encodes source as base64 or preserves as string, generates import statement for the virtual helper module.
- `src/utils/extractSource.js` — Wraps Rollup output in a function or raw code, replaces `use strict` with a placeholder token.
- `src/utils/fixMapSources.js` — Rewrites source map `sources` paths to `worker:/` URLs for inline workers.

### Key Design Patterns

- **Null-byte virtual IDs**: All helper modules and worker bundles use `\0` prefix to avoid collisions with real files.
- **Nested bundler**: Each worker is bundled separately using Rollup or Rolldown as a library, with helper plugins injected.
- **Worker type mapping**: `typeMap` in `buildWorkerCode.js` maps `web-worker`/`audio-worklet`/`paint-worklet`/`service-worker`/`shared-worker` to factory function name segments.
- **`state.idMap`**: Stores per-worker metadata (`workerID`, `chunk`, `inputOptions`, `target`, `type`) keyed by the null-byte prefixed module ID.
- **`state.exclude`**: Set of module IDs to skip (prevents infinite recursion when bundling workers that import other workers).
- **`state.forceInlineCounter`**: Numeric prefix for `forceInline: true` to break cache collisions.

## Code Style

- **Language**: JavaScript (`.js`) — no TypeScript in source files; `.d.ts` only for type declarations.
- **Formatting**: Prettier (single quotes, no semicolons, trailing commas, 80-char print width).
- **ESLint**: `@antfu/eslint-config` with TypeScript support for `src/**/*.ts` files; `no-console: warn`.
- **EditorConfig**: 4-space indent (EditorConfig overrides prettier's 2-space for editor interactions).
- **Line endings**: LF everywhere.
- No `console.log` in source (use `console.warn` or debug flags if needed).

## Dependency Handling

- **Build**: Built with **Rolldown** (not Rollup), outputs ESM + CJS.
- **Peer dependencies**: `rolldown` (optional) and `rollup` (optional). Both must be listed as externals in `rolldown.config.ts`.
- **No TypeScript transpilation in build**: Source is plain ESM JavaScript. The `tsconfig.json` is for type-checking only (`tsc --noEmit`).
- **`simple-git-hooks`**: Pre-commit runs lint-staged (eslint + prettier), commit-msg runs `@baicie/scripts` verifyCommit.

## Test & Verification

Run the example projects to verify behavior:

```bash
cd example/rollup && pnpm build && pnpm serve
cd example/rolldown && pnpm build && pnpm serve
```

No formal test suite exists yet. Manually verify worker factory output by checking `dist/` output or browser console.

## Common Patterns for Common Tasks

### Adding a new worker type (e.g., `animation-worklet`)

1. Add a new pattern to `defaultConfig` in `src/index.js` (e.g., `animationWorkletPattern`).
2. Add `type` case in `getMatchAndType()` in `src/plugin/resolveId.js`.
3. Add `type` to `typeMap` in `src/utils/buildWorkerCode.js`.
4. Create factory helper templates in `src/helper/browser/`, `src/helper/node/`, and `src/helper/auto/` (mirror existing worker type structure).
5. Register the factory in the `helperFiles` Map in both `src/plugin/load.js` and `src/plugin/rolldownLoad.js`.
6. Update `src/index.d.ts` with new pattern option and module declaration.
7. Add to README.md usage examples.

### Modifying the factory code output

Factory code lives as template strings in `helperFiles` Maps. Two copies exist — one in `src/plugin/load.js` (Rollup path) and one in `src/plugin/rolldownLoad.js` (Rolldown path). Keep them in sync manually.

### Changing the virtual module ID prefix

The null-byte prefix (`\0`) is used throughout. If changing, update all occurrences in:
- `src/plugin/resolveId.js`
- `src/plugin/load.js`
- `src/plugin/rolldownLoad.js`
- `src/utils/buildWorkerCode.js`

## Version Bumping & Release

Version is manually set in `package.json`. Run `pnpm release` which calls `@baicie/release` to handle git tagging and changelog. Run `pnpm ci-publish` to publish. Both scripts live in the `scripts/` directory.
