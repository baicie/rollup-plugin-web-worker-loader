import { createInlinePaintWorkletFactory as browserCreateInlinePaintWorkletFactory } from '../browser/createInlinePaintWorkletFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createInlinePaintWorkletFactory(
  fn: () => void,
  sourcemapArg?: string | null,
): (options?: PerWorkerOptions) => Promise<void> {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Paint Worklet in Node.JS',
    )
  }
  return browserCreateInlinePaintWorkletFactory(fn, sourcemapArg)
}
