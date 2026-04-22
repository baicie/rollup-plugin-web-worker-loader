function decodeBase64(base64: string, enableUnicode: boolean): string {
  const binaryString = atob(base64)
  if (enableUnicode) {
    const binaryView = new Uint8Array(binaryString.length)
    for (let i = 0, n = binaryString.length; i < n; ++i) {
      binaryView[i] = binaryString.charCodeAt(i)
    }
    const decoder = new TextDecoder('utf-16le')
    return decoder.decode(new Uint16Array(binaryView.buffer))
  }
  return binaryString
}

function createURL(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): string {
  const sourcemap = sourcemapArg === undefined ? null : sourcemapArg
  const enableUnicode =
    enableUnicodeArg === undefined ? false : enableUnicodeArg
  const source = decodeBase64(base64, enableUnicode)
  const start = source.indexOf('\n', 10) + 1
  const body =
    source.substring(start) +
    (sourcemap ? `//# sourceMappingURL=${sourcemap}` : '')
  const blob = new Blob([body], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

export function createBase64AudioWorkletFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): (audioContext: AudioContext, options?: PerWorkerOptions) => Promise<void> {
  let url: string | undefined
  return async function AudioWorkletFactory(
    audioContext: AudioContext,
    options?: PerWorkerOptions,
  ): Promise<void> {
    url = url ?? createURL(base64, sourcemapArg, enableUnicodeArg)
    await audioContext.audioWorklet.addModule(url, options)
  }
}
