import { createURLAudioWorkletFactory as browserCreateURLAudioWorkletFactory } from '../browser/createURLAudioWorkletFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createURLAudioWorkletFactory(
    url: string,
): (audioContext: AudioContext, options?: PerWorkerOptions) => Promise<void> {
    if (isNodeJS()) {
        throw new Error('rollup-plugin-web-worker-loader does not support Audio Worklet in Node.JS');
    }
    return browserCreateURLAudioWorkletFactory(url);
}
