import { funcToSource } from '../funcToSource.js';

function createURL(fn: () => void, sourcemapArg?: string | null): string {
    const lines = funcToSource(fn, sourcemapArg);
    const blob = new Blob(lines, { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}

export function createInlineWorkerFactory(fn: () => void, sourcemapArg?: string | null): () => (options?: WorkerOptions) => Worker {
    let url: string | undefined;
    return function WorkerFactory(options?: WorkerOptions): Worker {
        url = url ?? createURL(fn, sourcemapArg);
        return new Worker(url, options);
    };
}
