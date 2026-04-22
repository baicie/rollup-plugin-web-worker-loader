---
name: rolldown-plugin-interface
description: Rolldown plugin interface, hook types, execution order, conventions
---

# Plugin Interface

## Required Properties

Every plugin must have a `name` property (used in logs and errors):

```ts
{
  name: 'my-plugin',
}
```

## Hook Types

Rolldown hooks are classified by two axes.

### By Kind (sync / async)

| Kind | Description |
|------|-------------|
| `sync` | Synchronous, returns value directly |
| `async` | May return a Promise resolving to the same type |

### By Trigger (first / sequential / parallel)

| Trigger | Description |
|---------|-------------|
| `first` | Runs sequentially until a hook returns non-null/non-undefined value |
| `sequential` | All plugins run in order, async hooks wait for current to resolve |
| `parallel` | All plugins run in order, async hooks run concurrently without waiting |

Hooks can also be objects with a `handler` property for additional control (see ObjectHook type).

## Conventions

1. **Naming**: Prefix plugins with `rolldown-plugin-`
2. **Keywords**: Include `rolldown-plugin` in `package.json` keywords
3. **Source maps**: Output correct source mappings when appropriate
4. **Virtual modules**: Prefix resolved ID with `\0` (prevents other plugins from processing)
5. **Testing**: Recommended
6. **Documentation**: Recommended to be in English

## Hook Execution Flow

### Build Phase

```
watchChange → closeWatcher → options → outputOptions → buildStart → resolveId → load → transform → buildEnd
                                              ↓
                                    moduleParsed → resolveDynamicImport
```

First hook: `options`, Last hook: `buildEnd`

### Output Generation Phase

```
renderStart → beforeAddons → banner → afterAddons → footer → intro → outro → renderChunk → minify → generateBundle → writeBundle → closeBundle
                                                                                  ↓
                                                                        postBanner → postFooter → augmentChunkHash
```

First hook: `renderStart`, Last hook: `writeBundle` (success) or `renderError` (failure)

### Watch Mode

- `watchChange`: Notifies a new run will be triggered once current run completes
- `closeWatcher`: Triggered when watcher closes

### Unsupported (vs Rollup)

- Build hooks: `shouldTransformCachedModule`
- Output hooks: `resolveImportMeta`, `resolveFileUrl`, `renderDynamicImport`
