import { funcToSource } from '../funcToSource.js'

function createURL(fn: () => void, sourcemapArg?: string | null): string {
  const lines = funcToSource(fn, sourcemapArg)
  const blob = new Blob(lines, { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

export function createInlinePaintWorkletFactory(
  fn: () => void,
  sourcemapArg?: string | null,
): (options?: PerWorkerOptions) => Promise<void> {
  let url: string | undefined
  return function PaintWorkletFactory(
    options?: PerWorkerOptions,
  ): Promise<void> {
    url = url ?? createURL(fn, sourcemapArg)
    return (
      CSS as unknown as {
        paintWorklet: {
          addModule: (url: string, opts?: PerWorkerOptions) => Promise<void>
        }
      }
    ).paintWorklet.addModule(url, options)
  }
}
