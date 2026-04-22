import { funcToSource } from '../funcToSource.js';

function createURL(fn: () => void, sourcemapArg?: string | null): string {
    const lines = funcToSource(fn, sourcemapArg);
    const blob = new Blob(lines, { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}

export function createInlineAudioWorkletFactory(
    fn: () => void,
    sourcemapArg?: string | null,
): (audioContext: AudioContext, options?: PerWorkerOptions) => Promise<void> {
    let url: string | undefined;
    return async function AudioWorkletFactory(
        audioContext: AudioContext,
        options?: PerWorkerOptions,
    ): Promise<void> {
        url = url ?? createURL(fn, sourcemapArg);
        await audioContext.audioWorklet.addModule(url, options);
    };
}
