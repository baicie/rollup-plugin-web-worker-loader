export type TargetPlatform = 'auto' | 'browser' | 'node' | 'base64';
export type WorkerType = 'web-worker' | 'audio-worklet' | 'paint-worklet' | 'service-worker' | 'shared-worker';

export interface WebWorkerLoaderConfig {
    targetPlatform?: TargetPlatform;
    webWorkerPattern?: RegExp;
    audioWorkletPattern?: RegExp;
    paintWorkletPattern?: RegExp;
    serviceWorkerPattern?: RegExp;
    sharedWorkerPattern?: RegExp;
    extensions?: string[];
    sourcemap?: boolean;
    inline?: boolean;
    forceInline?: boolean;
    external?: string[] | ((id: string) => boolean);
    preserveSource?: boolean;
    preserveFileNames?: boolean;
    enableUnicode?: boolean;
    outputFolder?: string;
    loadPath?: string;
    skipPlugins?: string[];
}

export interface InternalConfig {
    targetPlatform: TargetPlatform;
    browserWorker: string;
    sourcemap: boolean;
    preserveSource: boolean;
    preserveFileNames: boolean;
    enableUnicode: boolean;
    webWorkerPattern: RegExp;
    audioWorkletPattern: RegExp;
    paintWorkletPattern: RegExp;
    serviceWorkerPattern: RegExp;
    sharedWorkerPattern: RegExp;
    inline: boolean;
    forceInline: boolean;
    external: string[] | ((id: string) => boolean) | undefined;
    extensions: string[];
    outputFolder: string;
    loadPath: string;
    skipPlugins: Set<string>;
}

export interface ChunkData {
    code?: string;
    map?: unknown;
    modules?: Record<string, { originalLength?: number }>;
    fileName?: string;
    type?: string;
    isAsset?: boolean;
}

export interface WorkerEntry {
    workerID: string;
    chunk: ChunkData | null;
    inputOptions: object;
    target: string;
    type: WorkerType;
}

export interface InternalState {
    idMap: Map<string, WorkerEntry>;
    exclude: Set<string>;
    outFiles: Map<string, number>;
    options: object | null;
    basePath: string | null;
    forceInlineCounter: number;
    configuredFileNames: Map<string, string>;
    isRolldown: boolean;
}

export interface BuildWorkerOptions {
    inline: boolean;
    preserveSource: boolean;
    enableUnicode: boolean;
    targetPlatform: TargetPlatform;
    type: WorkerType;
}
