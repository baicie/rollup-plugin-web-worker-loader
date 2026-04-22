import { createURLServiceWorkerFactory as browserCreateURLServiceWorkerFactory } from '../browser/createURLServiceWorkerFactory.js'
import { isNodeJS } from './isNodeJS.js'

export function createURLServiceWorkerFactory(
  url: string,
): (options?: RegistrationOptions) => Promise<ServiceWorkerRegistration> {
  if (isNodeJS()) {
    throw new Error(
      'rollup-plugin-web-worker-loader does not support Service Worker in Node.JS',
    )
  }
  return browserCreateURLServiceWorkerFactory(url)
}
