import { createBase64AudioWorkletFactory as browserCreateBase64AudioWorkletFactory } from '../browser/createBase64AudioWorkletFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createBase64AudioWorkletFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): (audioContext: AudioContext, options?: PerWorkerOptions) => Promise<void> {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Audio Worklet in Node.JS',
    )
  }
  return browserCreateBase64AudioWorkletFactory(
    base64,
    sourcemapArg,
    enableUnicodeArg,
  )
}
