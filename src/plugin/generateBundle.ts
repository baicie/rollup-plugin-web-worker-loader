import type { OutputAsset, OutputChunk } from 'rollup'
import type { InternalConfig, InternalState } from '../types.js'

type BundleEntry = OutputChunk | OutputAsset

export function handleGenerateBundle(
  state: InternalState,
  config: InternalConfig,
  _options: object,
  bundle: Record<string, BundleEntry>,
  isWrite: boolean,
): void {
  if (!config.inline && isWrite) {
    if (
      state.configuredFileNames.size > 0
      && Object.keys(bundle).length === 1
    ) {
      const key = Object.keys(bundle)[0]
      const configuredName = state.configuredFileNames.get(
        (bundle[key] as { facadeModuleId?: string }).facadeModuleId?.includes(
          '.css',
        )
          ? 'es'
          : 'es',
      )
      if (configuredName) {
        ;(bundle[key] as { fileName?: string }).fileName = configuredName
      }
    }
    for (const [, worker] of state.idMap) {
      if (worker.chunk && !bundle[worker.workerID]) {
        bundle[worker.workerID] = worker.chunk as BundleEntry
      }
    }
  }
}
