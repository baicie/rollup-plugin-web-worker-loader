import type { Worker as WorkerThreadsWorker } from 'node:worker_threads'
import process from 'node:process'

type WorkerConstructor = new (script: string | URL, options?: object) => Worker

declare const __non_webpack_require__: ((id: string) => unknown) | undefined

const WorkerClass: WorkerConstructor | null = (() => {
  if (
    typeof process !== 'undefined' &&
    Object.prototype.toString.call(process) === '[object process]'
  ) {
    try {
      let mod: WorkerThreadsWorker | null = null
      if (
        typeof module !== 'undefined' &&
        typeof module.require === 'function'
      ) {
        mod = module.require('worker_threads') as unknown as WorkerThreadsWorker
      } else if (typeof __non_webpack_require__ === 'function') {
        mod = __non_webpack_require__(
          'worker_threads',
        ) as unknown as WorkerThreadsWorker
      }
      if (mod) {
        return mod.Worker as unknown as WorkerConstructor
      }
    } catch {
      /* EMPTY */
    }
  }
  return null
})()

export { WorkerClass }
