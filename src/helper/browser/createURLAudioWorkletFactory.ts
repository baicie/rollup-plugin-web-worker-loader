export function createURLAudioWorkletFactory(
  url: string,
): (audioContext: AudioContext, options?: PerWorkerOptions) => Promise<void> {
  return async function AudioWorkletFactory(
    audioContext: AudioContext,
    options?: PerWorkerOptions,
  ): Promise<void> {
    await audioContext.audioWorklet.addModule(url, options)
  }
}
