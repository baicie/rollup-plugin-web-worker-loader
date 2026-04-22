export function createURLPaintWorkletFactory(
  url: string,
): (options?: PerWorkerOptions) => Promise<void> {
  return function PaintWorkletFactory(
    options?: PerWorkerOptions,
  ): Promise<void> {
    return (
      CSS as unknown as {
        paintWorklet: {
          addModule: (url: string, opts?: PerWorkerOptions) => Promise<void>
        }
      }
    ).paintWorklet.addModule(url, options)
  }
}
