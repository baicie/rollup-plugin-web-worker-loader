---
name: rollup-plugin-web-worker-loader
description: Rollup 和 Rolldown 的 Web Worker 集成插件
version: 0.2.3
---

# AGENT.md

## 语言要求

所有回答必须使用**中文（简体）**。在回答用户问题时，请使用中文进行交流，除非用户明确使用其他语言提问。

本仓库是 `@baicie/web-worker-inline` 的源码，这是一个 Rollup/Rolldown 插件，用于打包 Web Workers、Service Workers、Shared Workers、Audio Worklets 和 Paint Worklets。所有源码文件位于 `src/` 目录下。

## 构建命令

| 命令 | 工具 | 说明 |
|---|---|---|
| `pnpm dev` | rolldown (watch) | 监听模式开发构建，输出到 `dist/` |
| `pnpm build` | rolldown | 生产构建，输出到 `dist/`（ESM `.mjs` + CJS `.cjs`）|
| `pnpm lint` | eslint（`@antfu/eslint-config`）| 对 `src/**/*.ts` 文件进行代码检查 |
| `pnpm fix` | eslint `--fix` | 自动修复代码检查错误 |
| `pnpm format` | prettier `--write --cache` | 格式化所有文件 |
| `pnpm format:check` | prettier `--check` | 仅检查格式 |
| `pnpm typecheck` | tsc `--noEmit` | TypeScript 类型检查 |
| `pnpm release` | `tsx scripts/release.ts` | 创建发布（使用 `@baicie/release`）|
| `pnpm ci-publish` | `tsx scripts/publish.ts` | 发布到 npm（使用 `@baicie/release`）|

包管理器为 **pnpm**。所有脚本必须从仓库根目录运行。

## 包结构

本包暴露两个入口：

- `webWorkerLoader()` / 默认导出 — Rollup 插件（Rollup v1-v4）
- `webWorkerLoaderRolldownPlugin()` / `/rolldown` 导出 — Rolldown 插件（Rolldown v1+）

两个入口共享 `src/index.d.ts` 中定义的 `WorkerLoaderConfig` 接口。

## 源码架构

### 插件入口

- `src/index.js` — Rollup 插件（`workerLoaderPlugin`）+ Rolldown 插件（`workerLoaderRolldownPlugin`），共享状态管理。两个导出函数都使用 `applySharedHooks` 来注册通用钩子。
- `src/rolldown.js` — 薄封装重导出 `workerLoaderRolldownPlugin`，对应 `/rolldown` 导出路径。

### 插件生命周期文件（通过代码复制在 Rollup 和 Rolldown 之间共享）

- `src/plugin/options.js` — `options` 钩子：去重插件列表，使用 `require.resolve` 从 `options.input` 解析 `state.basePath`。
- `src/plugin/resolveId.js` — `resolveId` 钩子：拦截 `web-worker:`、`audio-worklet:`、`paint-worklet:`、`service-worker:`、`shared-worker:` 导入。将解析后的模块存储到 `state.idMap`，并返回以空字节前缀的虚拟模块 ID。
- `src/plugin/transform.js` — `transform` 钩子：为 worker 模块返回合成的 source map。
- `src/plugin/outputOptions.js` — `outputOptions` 钩子：将 `file` 输出选项转换为 worker 包的 `dir`。
- `src/plugin/generateBundle.js` — `generateBundle` 钩子：当 `inline: false` 时发射 worker chunk 文件。
- `src/plugin/load.js` — Rollup `load` 钩子：为每个 worker 创建嵌套的 Rollup 包，生成工厂代码。
- `src/plugin/rolldownLoad.js` — Rolldown `load` 钩子：等效功能，但使用 Rolldown 的 API（`rolldown()` + `generate()` + `close()`）。

### 辅助文件（通过空字节 ID 实现的虚拟模块）

- `src/helper/funcToSource.js` — 将函数的 `.toString()` 输出转换回源码行，去除包装缩进，恢复 `use strict`。
- `src/helper/browser/` — 浏览器 worker 的工厂函数（Worker、SharedWorker、ServiceWorker、AudioWorklet、PaintWorklet 的内联/base64/URL 变体）。
- `src/helper/node/` — Node.js worker 的工厂函数（使用 `node:worker_threads`）。
- `src/helper/auto/` — 根据 `isNodeJS()` 委托给浏览器或 node 的工厂函数。

### 工具函数

- `src/utils/buildWorkerCode.js` — 组合最终的工厂包装代码：选择正确的工厂函数名，将源码编码为 base64 或保留为字符串，为虚拟辅助模块生成导入语句。
- `src/utils/extractSource.js` — 将 Rollup 输出包装为函数或原始代码，用占位符 token 替换 `use strict`。
- `src/utils/fixMapSources.js` — 将 source map 的 `sources` 路径重写为内联 worker 的 `worker:/` URL。

### 关键设计模式

- **空字节虚拟 ID**：所有辅助模块和 worker 包使用 `\0` 前缀以避免与真实文件冲突。
- **嵌套打包器**：每个 worker 单独使用 Rollup 或 Rolldown 作为库进行打包，并注入辅助插件。
- **Worker 类型映射**：`buildWorkerCode.js` 中的 `typeMap` 将 `web-worker`/`audio-worklet`/`paint-worklet`/`service-worker`/`shared-worker` 映射到工厂函数名片段。
- **`state.idMap`**：存储每个 worker 的元数据（`workerID`、`chunk`、`inputOptions`、`target`、`type`），以空字节前缀的模块 ID 为键。
- **`state.exclude`**：要跳过的模块 ID 集合（防止打包包含其他 worker 的 worker 时出现无限递归）。
- **`state.forceInlineCounter`**：`forceInline: true` 的数字前缀，用于避免缓存冲突。

## 代码风格

- **语言**：JavaScript（`.js`）— 源码文件中不使用 TypeScript；`.d.ts` 仅用于类型声明。
- **格式化**：Prettier（单引号、无分号、尾随逗号、80 字符行宽）。
- **ESLint**：`@antfu/eslint-config`，支持 `src/**/*.ts` 文件的 TypeScript；`no-console: warn`。
- **EditorConfig**：4 空格缩进（EditorConfig 在编辑器交互时覆盖 prettier 的 2 空格设置）。
- **行尾符**：全部使用 LF。
- **源码中不使用 `console.log`**（如需调试可使用 `console.warn` 或调试标志）。

## 依赖处理

- **构建工具**：使用 **Rolldown**（而非 Rollup）构建，输出 ESM + CJS。
- **对等依赖**：`rolldown`（可选）和 `rollup`（可选）。两者都必须在 `rolldown.config.ts` 中列为外部依赖。
- **构建时不进行 TypeScript 转译**：源码是纯 ESM JavaScript。`tsconfig.json` 仅用于类型检查（`tsc --noEmit`）。
- **`simple-git-hooks`**：pre-commit 运行 lint-staged（eslint + prettier），commit-msg 运行 `@baicie/scripts` 的 verifyCommit。

## 测试与验证

运行示例项目来验证行为：

```bash
cd example/rollup && pnpm build && pnpm serve
cd example/rolldown && pnpm build && pnpm serve
```

目前没有正式的测试套件。手动检查 `dist/` 输出或浏览器控制台来验证 worker 工厂输出。

## 常见任务的常见模式

### 添加新的 worker 类型（例如 `animation-worklet`）

1. 在 `src/index.js` 的 `defaultConfig` 中添加新模式（例如 `animationWorkletPattern`）。
2. 在 `src/plugin/resolveId.js` 的 `getMatchAndType()` 中添加 `type` 分支。
3. 在 `src/utils/buildWorkerCode.js` 的 `typeMap` 中添加 `type`。
4. 在 `src/helper/browser/`、`src/helper/node/` 和 `src/helper/auto/` 中创建工厂辅助模板（参考现有 worker 类型结构）。
5. 在 `src/plugin/load.js` 和 `src/plugin/rolldownLoad.js` 的 `helperFiles` Map 中注册工厂。
6. 在 `src/index.d.ts` 中添加新的模式选项和模块声明。
7. 在 README.md 中添加使用示例。

### 修改工厂代码输出

工厂代码以模板字符串形式存储在 `helperFiles` Map 中。有两份副本——一份在 `src/plugin/load.js`（Rollup 路径），一份在 `src/plugin/rolldownLoad.js`（Rolldown 路径）。需要手动保持同步。

### 更改虚拟模块 ID 前缀

空字节前缀（`\0`）在各处使用。如需更改，更新以下所有文件中的出现位置：
- `src/plugin/resolveId.js`
- `src/plugin/load.js`
- `src/plugin/rolldownLoad.js`
- `src/utils/buildWorkerCode.js`

## 版本管理与发布

版本在 `package.json` 中手动设置。运行 `pnpm release` 调用 `@baicie/release` 处理 git 标签和 changelog。运行 `pnpm ci-publish` 进行发布。两个脚本都位于 `scripts/` 目录。
