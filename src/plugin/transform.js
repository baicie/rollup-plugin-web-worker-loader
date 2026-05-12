import path from 'node:path'
import { buildInputOptions } from './resolveId.js'

export function transform(state, config, code, id) {
  if (state.idMap.has(id) && !state.exclude.has(id)) {
    const { target } = state.idMap.get(id)
    const inputOptions = buildInputOptions(state, target)
    return {
      code,
      map: `{"version":3,"file":"${path.basename(inputOptions.input)}","sources":[],"sourcesContent":[],"names":[],"mappings":""}`,
    }
  }
  return null
}
