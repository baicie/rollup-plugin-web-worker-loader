import type { Plugin } from 'rollup'

export type TargetPlatform = 'auto' | 'browser' | 'node'
export type WorkerType =
  | 'web-worker'
  | 'audio-worklet'
  | 'paint-worklet'
  | 'service-worker'
  | 'shared-worker'
export type BrowserWorkerClass = 'Worker' | 'SharedWorker'

export interface WorkerLoaderConfig {
  /**
   * Target runtime platform: `auto` detects environment, `browser` forces browser mode, `node` forces Node.js mode.
   * @default 'auto'
   */
  targetPlatform?: TargetPlatform
  /**
   * Worker class to use in browser environment: `'Worker'` or `'SharedWorker'`.
   * @default 'Worker'
   */
  browserWorker?: BrowserWorkerClass
  /**
   * Whether to generate source maps for worker bundles.
   * @default false
   */
  sourcemap?: boolean
  /**
   * URL path prefix for loading external worker files (when `inline: false`).
   * @default ''
   */
  loadPath?: string
  /**
   * Preserve the original worker source code instead of minifying it.
   * @default false
   */
  preserveSource?: boolean
  /**
   * Use the original filename (minus extension) as the worker output name instead of an auto-generated name.
   * @default false
   */
  preserveFileNames?: boolean
  /**
   * Use Unicode characters in Base64 encoding for inline workers instead of URL-safe encoding.
   * @default false
   */
  enableUnicode?: boolean
  /**
   * RegExp pattern to match web worker import paths. Capture group 1 specifies the worker path.
   * @default /web-worker:(.+)/
   */
  webWorkerPattern?: RegExp
  /**
   * RegExp pattern to match AudioWorklet import paths. Capture group 1 specifies the worklet path.
   * @default /audio-worklet:(.+)/
   */
  audioWorkletPattern?: RegExp
  /**
   * RegExp pattern to match PaintWorklet import paths. Capture group 1 specifies the worklet path.
   * @default /paint-worklet:(.+)/
   */
  paintWorkletPattern?: RegExp
  /**
   * RegExp pattern to match ServiceWorker import paths. Capture group 1 specifies the worker path.
   * @default /service-worker:(.+)/
   */
  serviceWorkerPattern?: RegExp
  /**
   * RegExp pattern to match SharedWorker import paths. Capture group 1 specifies the worker path.
   * @default /shared-worker:(.+)/
   */
  sharedWorkerPattern?: RegExp
  /**
   * Inline worker code as a base64 URL or string instead of an external file URL.
   * @default true
   */
  inline?: boolean
  /**
   * Force inlining all workers by prefixing resolved worker IDs, ignoring other inline settings.
   * @default false
   */
  forceInline?: boolean
  /**
   * Function or array of strings to mark worker dependencies as external (passed to the nested Rollup bundle).
   */
  external?:
    | ((id: string | null, isEntry: boolean, options: object) => boolean)
    | string[]
    | RegExp
    | (string | RegExp)[]
  /**
   * File extensions to try when resolving worker module paths.
   * @default ['.js']
   */
  extensions?: string[]
  /**
   * Output subdirectory for external worker files (relative to `dir`).
   * @default ''
   */
  outputFolder?: string
  /**
   * Array of plugin names to skip during worker bundle compilation (e.g., dev server plugins).
   * @default ['liveServer', 'serve', 'livereload']
   */
  skipPlugins?: string[]
}

export type WorkerLoaderPlugin = (config?: WorkerLoaderConfig) => Plugin

declare const workerLoaderPlugin: WorkerLoaderPlugin
export default workerLoaderPlugin
