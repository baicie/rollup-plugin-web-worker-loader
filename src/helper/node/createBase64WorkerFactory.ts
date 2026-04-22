import { Buffer } from 'node:buffer'
import { WorkerClass } from './WorkerClass.js'

function decodeBase64(base64: string, enableUnicode: boolean): string {
  return Buffer.from(base64, 'base64').toString(
    enableUnicode ? 'utf16' : 'utf8',
  )
}

export function createBase64WorkerFactory(
  base64: string,
  sourcemapArg?: string | null,
  enableUnicodeArg?: boolean,
): (options?: object) => (source: string, opts?: object) => Worker | null {
  const sourcemap = sourcemapArg === undefined ? null : sourcemapArg
  const enableUnicode =
    enableUnicodeArg === undefined ? false : enableUnicodeArg
  const source = decodeBase64(base64, enableUnicode)
  const start = source.indexOf('\n', 10) + 1
  const body =
    source.substring(start) +
    (sourcemap ? `//# sourceMappingURL=${sourcemap}` : '')
  return function WorkerFactory(options?: object): Worker | null {
    if (!WorkerClass) return null
    return new WorkerClass(body, {
      ...options,
      eval: true,
    } as ConstructorParameters<typeof WorkerClass>[1])
  }
}
