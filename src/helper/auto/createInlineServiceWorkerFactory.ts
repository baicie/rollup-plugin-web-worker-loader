import { createInlineServiceWorkerFactory as browserCreateInlineServiceWorkerFactory } from '../browser/createInlineServiceWorkerFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createInlineServiceWorkerFactory(
  fn: () => void,
  sourcemapArg?: string | null,
): () => (options?: RegistrationOptions) => Promise<ServiceWorkerRegistration> {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Service Worker in Node.JS',
    )
  }
  return browserCreateInlineServiceWorkerFactory(fn, sourcemapArg)
}
