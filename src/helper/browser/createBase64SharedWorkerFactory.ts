import { createURL as createWorkerURL } from './createBase64WorkerFactory.js'

export function createBase64SharedWorkerFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): () => (options?: SharedWorkerOptions) => SharedWorker {
  let url: string | undefined
  return function SharedWorkerFactory(
    options?: SharedWorkerOptions,
  ): SharedWorker {
    url = url ?? createWorkerURL(base64, sourcemapArg, enableUnicodeArg)
    return new SharedWorker(url, options)
  }
}
