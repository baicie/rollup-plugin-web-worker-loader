import { createURLSharedWorkerFactory as browserCreateURLSharedWorkerFactory } from '../browser/createURLSharedWorkerFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createURLSharedWorkerFactory(
    url: string,
): (options?: SharedWorkerOptions) => SharedWorker {
    if (isNodeJS()) {
        throw new Error('rollup-plugin-web-worker-loader does not support Shared Worker in Node.JS');
    }
    return browserCreateURLSharedWorkerFactory(url);
}
