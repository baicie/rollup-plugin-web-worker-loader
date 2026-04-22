export function funcToSource(
  fn: () => void,
  sourcemapArg?: string | null,
): string[] {
  const sourcemap = sourcemapArg === undefined ? null : sourcemapArg
  const source = fn.toString()
  const lines = source.split('\n')
  lines.pop()
  lines.shift()
  const blankPrefixLength = lines[0].search(/\S/)
  const regex = /(['"])__worker_loader_strict__(['"])/g
  for (let i = 0, n = lines.length; i < n; ++i) {
    lines[i]
      = `${lines[i].substring(blankPrefixLength).replace(regex, '$1use strict$2')}\n`
  }
  if (sourcemap) {
    lines.push(`//# sourceMappingURL=${sourcemap}\n`)
  }
  return lines
}
