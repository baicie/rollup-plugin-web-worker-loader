import { createInlineSharedWorkerFactory as browserCreateInlineSharedWorkerFactory } from '../browser/createInlineSharedWorkerFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createInlineSharedWorkerFactory(
  fn: () => void,
  sourcemapArg?: string | null,
): () => (options?: SharedWorkerOptions) => SharedWorker {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Shared Worker in Node.JS',
    )
  }
  return browserCreateInlineSharedWorkerFactory(fn, sourcemapArg)
}
