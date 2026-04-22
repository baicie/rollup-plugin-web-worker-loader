import { funcToSource } from '../funcToSource.js';
import { WorkerClass } from './WorkerClass.js';

export function createInlineWorkerFactory(
    fn: () => void,
    sourcemapArg?: string | null,
): () => (options?: object) => Worker | null {
    const lines = funcToSource(fn, sourcemapArg);
    const concat = lines.join('\n');
    return function WorkerFactory(options?: object): Worker | null {
        if (!WorkerClass) return null;
        return new WorkerClass(concat, { ...options, eval: true } as ConstructorParameters<typeof WorkerClass>[1]);
    };
}
