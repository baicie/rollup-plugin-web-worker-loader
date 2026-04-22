---
name: rolldown-plugin
description: Write Rolldown plugins with build hooks, output hooks, virtual modules, and plugin context. Use when creating a Rolldown plugin, authoring rollup-plugin compatible code, or working with plugin APIs.
metadata:
  author: Generated from https://rolldown.rs/apis/plugin-api
  version: "2026.4.22"
---

# Rolldown Plugin

> Rolldown's plugin interface is almost fully compatible with Rollup's. If you've written a Rollup plugin before, you already know how to write a Rolldown plugin.

A Rolldown plugin is an object that satisfies the plugin interface. It should be distributed as a package that exports a function returning the plugin object.

## Preferences

- Use TypeScript for type safety
- Always use ESM, avoid CommonJS
- Prefix plugin name with `rolldown-plugin-`
- Use `\0` prefix for virtual module IDs

## Topics

| Topic | Description | Reference |
|-------|-------------|-----------|
| Plugin Interface | Hook types, execution order, conventions | [plugin-interface](references/plugin-interface.md) |
| Build Hooks | Build phase hooks: options, resolveId, load, transform | [build-hooks](references/build-hooks.md) |
| Output Hooks | Output generation: renderStart, renderChunk, generateBundle | [output-hooks](references/output-hooks.md) |
| Examples | Virtual modules, transform, complete plugins | [examples](references/examples.md) |

## Quick Reference

### Basic Structure

```ts
import { definePlugin } from 'rolldown'

export default function myPlugin(options?: Options) {
  return {
    name: 'my-plugin',
    // hooks...
  }
}
```

### Virtual Modules

```ts
function virtualPlugin() {
  const id = 'virtual:module'
  const resolvedId = '\0' + id

  return {
    name: 'virtual-module',
    resolveId(source) {
      if (source === id) return resolvedId
      return null
    },
    load(id) {
      if (id === resolvedId) {
        return `export default 'Hello from virtual module'`
      }
      return null
    },
  }
}
```

### Transform Hook

```ts
transform(code, id) {
  if (id.endsWith('.custom')) {
    return { code: compile(code), map: null }
  }
  return null
}
```

### Plugin Context

Access via `this` inside hooks:

```ts
this.error('something went wrong')
this.warn('warning message')
this.parse(code, { lang: 'ts' })
this.getModuleInfo(id)
this.getChunkInfo(chunk)
this.getChunkIds()
```

### Rolldown vs Rollup Differences

| Aspect | Rolldown | Rollup |
|--------|----------|--------|
| outputOptions hook | Before build hooks | After build hooks |
| Build hooks | Called per output | Called once for all |
| closeBundle | Only when generate/write called | Always |
| options hook | Called once (watcher creation) | Called every rebuild |
| writeBundle hook | Sequential by default | Parallel by default |

## Official Documentation

- Plugin API: https://rolldown.rs/apis/plugin-api
- Hook Filters: https://rolldown.rs/guide/plugin/hook-filter
- Inter-plugin Communication: https://rolldown.rs/guide/plugin/inter-plugin-communication
