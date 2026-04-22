import path from 'node:path';
import type { OutputOptions as RollupOutputOptions } from 'rollup';
import type { InternalConfig, InternalState } from '../types.js';

export function handleOutputOptions(
    state: InternalState,
    config: InternalConfig,
    options: RollupOutputOptions,
): RollupOutputOptions | null {
    if (!config.inline && options.file && !options.dir) {
        state.configuredFileNames.set(options.format!, path.basename(options.file));
        return {
            ...options,
            file: undefined,
            dir: path.dirname(options.file),
        };
    }
    return null;
}
