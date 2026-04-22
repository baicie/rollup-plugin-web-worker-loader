import { createInlineWorkerFactory as nodeCreateInlineWorkerFactory } from '../node/createInlineWorkerFactory.js';
import { createInlineWorkerFactory as browserCreateInlineWorkerFactory } from '../browser/createInlineWorkerFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createInlineWorkerFactory(fn: () => void, sourcemapArg?: string | null): () => (options?: WorkerOptions) => Worker {
    if (isNodeJS()) {
        return nodeCreateInlineWorkerFactory(fn, sourcemapArg);
    }
    return browserCreateInlineWorkerFactory(fn, sourcemapArg);
}
