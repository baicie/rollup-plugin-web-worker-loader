import { createURLPaintWorkletFactory as browserCreateURLPaintWorkletFactory } from '../browser/createURLPaintWorkletFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createURLPaintWorkletFactory(
    url: string,
): (options?: PerWorkerOptions) => Promise<void> {
    if (isNodeJS()) {
        throw new Error('rollup-plugin-web-worker-loader does not support Paint Worklet in Node.JS');
    }
    return browserCreateURLPaintWorkletFactory(url);
}
