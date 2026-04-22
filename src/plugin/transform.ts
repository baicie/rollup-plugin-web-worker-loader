import path from 'node:path';
import type { InternalConfig, InternalState } from '../types.js';

export function handleTransform(
    state: InternalState,
    config: InternalConfig,
    code: string,
    id: string,
): { code: string; map: string } | null {
    if (state.idMap.has(id) && !state.exclude.has(id)) {
        const { inputOptions } = state.idMap.get(id)!;
        return {
            code,
            map: `{"version":3,"file":"${path.basename(inputOptions.input as string)}","sources":[],"sourcesContent":[],"names":[],"mappings":""}`,
        };
    }
    return null;
}
