import { createURL as createWorkerURL } from './createInlineWorkerFactory.js';

export function createInlineSharedWorkerFactory(
    fn: () => void,
    sourcemapArg?: string | null,
): () => (options?: SharedWorkerOptions) => SharedWorker {
    let url: string | undefined;
    return function SharedWorkerFactory(options?: SharedWorkerOptions): SharedWorker {
        url = url ?? createWorkerURL(fn, sourcemapArg);
        return new SharedWorker(url, options);
    };
}
