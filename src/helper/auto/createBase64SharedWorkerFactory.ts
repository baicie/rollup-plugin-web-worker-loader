import { createBase64SharedWorkerFactory as browserCreateBase64SharedWorkerFactory } from '../browser/createBase64SharedWorkerFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createBase64SharedWorkerFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): () => (options?: SharedWorkerOptions) => SharedWorker {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Shared Worker in Node.JS',
    )
  }
  return browserCreateBase64SharedWorkerFactory(
    base64,
    sourcemapArg,
    enableUnicodeArg,
  )
}
