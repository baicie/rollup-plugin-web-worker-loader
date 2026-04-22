import { createBase64PaintWorkletFactory as browserCreateBase64PaintWorkletFactory } from '../browser/createBase64PaintWorkletFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createBase64PaintWorkletFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): (options?: PerWorkerOptions) => Promise<void> {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Paint Worklet in Node.JS',
    )
  }
  return browserCreateBase64PaintWorkletFactory(
    base64,
    sourcemapArg,
    enableUnicodeArg,
  )
}
