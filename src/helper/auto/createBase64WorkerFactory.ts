import { createBase64WorkerFactory as browserCreateBase64WorkerFactory } from '../browser/createBase64WorkerFactory.js'
import { createBase64WorkerFactory as nodeCreateBase64WorkerFactory } from '../node/createBase64WorkerFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createBase64WorkerFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): () => (options?: WorkerOptions) => Worker {
  if (isNodeJS()) {
    return nodeCreateBase64WorkerFactory(base64, sourcemapArg, enableUnicodeArg)
  }
  return browserCreateBase64WorkerFactory(
    base64,
    sourcemapArg,
    enableUnicodeArg,
  )
}
