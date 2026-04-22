import { createURLWorkerFactory as nodeCreateURLWorkerFactory } from '../node/createURLWorkerFactory.js';
import { createURLWorkerFactory as browserCreateURLWorkerFactory } from '../browser/createURLWorkerFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createURLWorkerFactory(url: string): (options?: WorkerOptions) => Worker {
    if (isNodeJS()) {
        return nodeCreateURLWorkerFactory(url);
    }
    return browserCreateURLWorkerFactory(url);
}
