# 诊断报告：rollup watch rebuild 卡住问题

## 问题描述

- 使用 `one.js` 作为入口时，`rollup --watch` 首次打包成功，但修改代码后卡在 `bundles` 阶段
- 使用 `index.js` / `npm.js` 作为入口时，无此问题

---

## 根本原因分析

### 核心问题：Watch 模式下 `state` 未在重建间重置

这是 `rollup-plugin-web-worker-loader` 的一个 **状态泄漏 (state leaking)** 问题。

#### 1. 状态持久化的设计

插件通过 `createState()` 在顶层创建了持久的共享状态：

```js
// src/index.js
function createState() {
  return {
    idMap: new Map(),      // 记录每个 worker 模块的元信息
    exclude: new Set(),     // 标记在嵌套 rollup 构建中已排除的文件
    outFiles: new Map(),
    options: null,
    basePath: null,
    forceInlineCounter: 0,
    configuredFileNames: new Map(),
  }
}
```

这个 `state` 对象在插件实例创建时生成，在整个进程生命周期内持久存在。

#### 2. Watch 模式下重建时的状态累积

首次构建流程：

```
one.js → resolveId (匹配 web-worker: pattern)
         → state.idMap.set(prefixed, { inputOptions, workerID, ... })
```

重建流程：

```
修改代码 → Rollup 检测变化 → 重新调用 options hook → ... → resolveId
                                        ↓
                              state.idMap 已有上次构建的遗留数据！
                                        ↓
                              resolveId 中 idMap.has(name) 返回 true
                                        ↓
                              返回之前缓存的 prefixed ID
                                        ↓
                              但对应的 inputOptions / chunk 数据已过期
                                        ↓
                              load hook 触发嵌套 rollup.rollup(inputOptions)
                                        ↓
                              嵌套构建中遇到该 worker 的 target
                                        ↓
                              嵌套 resolveId 检查 exclude.has(prefixed)
                                        ↓
                              exclude 中没有该 target（因为状态丢失）
                                        ↓
                              嵌套 rollup 再次尝试加载该 worker
                                        ↓
                              再次触发 rollup.rollup → 循环依赖 → **死锁/挂起**
```

#### 3. `exclude` 机制失效是直接触发点

`exclude` Set 的设计是在 `load` 执行时将当前 id 和 target 排除出嵌套构建：

```js
// src/plugin/load.js
export async function load(state, config, addWatchFile, id) {
  // ...
  state.exclude.add(id)
  state.exclude.add(target)           // ← 在当前 load 调用栈中排除

  const bundle = await rollup.rollup(inputOptions)  // ← 嵌套 rollup
  // ...
  state.exclude.delete(id)           // ← load 完成后才删除
  state.exclude.delete(target)
}
```

这个机制在**首次构建**时工作正常。但重建时：

- `state.exclude` 在首次构建后可能有残留数据
- 嵌套构建看到的 `exclude` 与预期不符
- 嵌套 rollup 的 `resolveId` 可能再次拦截了应该透传的文件
- 形成嵌套 rollup 调用自身的递归，最终挂起

#### 4. `index.js` / `npm.js` 不触发问题的原因

```js
// index.js - 不导入任何 worker
import { ... } from "./tools/utils.js";   // 普通模块
import { initIntersectionObserver } from "./engine/modules/...";  // 普通模块

// npm.js - 导入 one.js，但 one.js 通过 BonreeRecord 间接使用 worker
import { BonreeStart, ... } from './one.js'
```

而 `one.js` 直接导入了：

```js
import { BonreeRecord, ... } from "./BonreeRecord/BonreeRecord.js";
```

`BonreeRecord` 模块及其深层依赖链中存在 `web-worker:` 的 worker 导入（通过 `workerBridge.js` 中的 `import WorkerFactory from 'web-worker:./compressionWorker.js'`）。

只有直接触发 worker 处理的入口才会命中 `resolveId` → `idMap` 的路径，`index.js` 和 `npm.js` 没有直接使用 worker 相关导入。

---

## 修复方案

### 方案：在 `options` hook 中重置状态

`options` hook 在每次**新构建开始**时被调用，适合在这里检测并重置状态。

#### 修改 `src/index.js`

在 `applySharedHooks` 中添加构建次数检测：

```js
// 在 createState 中增加一个计数器
function createState() {
  return {
    // ...
    _buildCount: 0,  // ← 新增
  }
}

// 在 applySharedHooks 中，当 options hook 检测到新的构建时，重置状态
function applySharedHooks(pluginObj, state, config) {
  pluginObj.options = optionsArg => {
    const result = optionsImp(state, config, optionsArg)

    // 每次新构建开始时，如果 idMap 已有数据（说明是重建），先重置状态
    // 这样可以避免 watch 模式下状态累积导致的问题
    if (state._buildCount > 0 && state.idMap.size > 0) {
      state.idMap.clear()
      state.exclude.clear()
      state.outFiles.clear()
      state.configuredFileNames.clear()
      state.forceInlineCounter = 0
    }
    state._buildCount++

    return result
  }
  // ...
}
```

---

## 验证方法

1. 应用上述修复到 `src/index.js`
2. 在 `example/sdk` 目录执行 `npx rollup -c -w`
3. 首次构建成功后，修改任意源文件
4. 观察终端输出，确认重建不再卡在 `bundles` 阶段

---

## 相关文件索引

| 文件 | 作用 |
|---|---|
| `src/index.js` | 插件主入口，包含 `createState` 和 `applySharedHooks` |
| `src/plugin/options.js` | `options` hook 实现，处理主 rollup 的选项初始化 |
| `src/plugin/resolveId.js` | `resolveId` hook，匹配 worker 导入并注册到 `idMap` |
| `src/plugin/load.js` | `load` hook，执行嵌套 rollup 构建 worker 代码 |
| `src/plugin/transform.js` | `transform` hook，为 worker 模块注入空 sourcemap |
| `src/plugin/generateBundle.js` | `generateBundle` hook，将 worker chunk 加入输出 |
| `example/sdk/rollup.config.ts` | 使用插件的示例配置 |
| `example/sdk/src/one.js` | 触发问题的入口文件 |
| `example/sdk/src/BonreeRecord/workerBridge.js` | 使用 `web-worker:` 导入 worker 的文件 |
