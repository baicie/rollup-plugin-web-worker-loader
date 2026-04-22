export function createURLSharedWorkerFactory(
  url: string,
): (options?: SharedWorkerOptions) => SharedWorker {
  return function SharedWorkerFactory(
    options?: SharedWorkerOptions,
  ): SharedWorker {
    return new SharedWorker(url, options)
  }
}
