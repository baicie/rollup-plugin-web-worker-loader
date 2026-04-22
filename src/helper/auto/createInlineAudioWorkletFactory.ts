import { createInlineAudioWorkletFactory as browserCreateInlineAudioWorkletFactory } from '../browser/createInlineAudioWorkletFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createInlineAudioWorkletFactory(
    fn: () => void,
    sourcemapArg?: string | null,
): (audioContext: AudioContext, options?: PerWorkerOptions) => Promise<void> {
    if (isNodeJS()) {
        throw new Error('rollup-plugin-web-worker-loader does not support Audio Worklet in Node.JS');
    }
    return browserCreateInlineAudioWorkletFactory(fn, sourcemapArg);
}
