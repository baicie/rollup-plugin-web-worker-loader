import type { Plugin } from 'rollup';
import type { WebWorkerLoaderConfig, InternalConfig, InternalState, WorkerEntry } from './types.js';
import { handleOptions } from './plugin/options.js';
import { handleResolveId } from './plugin/resolveId.js';
import { handleLoad } from './plugin/load.js';
import { handleTransform } from './plugin/transform.js';
import { handleOutputOptions } from './plugin/outputOptions.js';
import { handleGenerateBundle } from './plugin/generateBundle.js';

const defaultConfig: Omit<InternalConfig, 'skipPlugins'> & { skipPlugins: string[] } = {
    targetPlatform: 'auto',
    browserWorker: 'Worker',
    sourcemap: false,
    preserveSource: false,
    preserveFileNames: false,
    enableUnicode: false,
    webWorkerPattern: /web-worker:(.+)/,
    audioWorkletPattern: /audio-worklet:(.+)/,
    paintWorkletPattern: /paint-worklet:(.+)/,
    serviceWorkerPattern: /service-worker:(.+)/,
    sharedWorkerPattern: /shared-worker:(.+)/,
    inline: true,
    forceInline: false,
    external: undefined,
    extensions: ['.js'],
    outputFolder: '',
    loadPath: '',
    skipPlugins: [
        'liveServer',
        'serve',
        'livereload',
    ],
};

function createPlugin(userConfig: WebWorkerLoaderConfig = {}): Plugin {
    const config: InternalConfig = {
        ...defaultConfig,
        ...userConfig,
        skipPlugins: new Set(defaultConfig.skipPlugins),
    } as InternalConfig;

    const state: InternalState = {
        idMap: new Map<string, WorkerEntry>(),
        exclude: new Set<string>(),
        outFiles: new Map<string, number>(),
        options: null,
        basePath: null,
        forceInlineCounter: 0,
        configuredFileNames: new Map<string, string>(),
        isRolldown: false,
    };

    return {
        name: 'rollup-plugin-web-worker-loader',

        async options(optionsArg) {
            return handleOptions(state, config, optionsArg);
        },

        resolveId(importee, importer) {
            return handleResolveId(state, config, importee, importer ?? null);
        },

        async load(id) {
            return handleLoad(state, config, this.addWatchFile.bind(this), id);
        },

        transform(code, id) {
            return handleTransform(state, config, code, id);
        },

        outputOptions(options) {
            return handleOutputOptions(state, config, options);
        },

        generateBundle(options, bundle, isWrite) {
            handleGenerateBundle(state, config, options, bundle, isWrite);
        },
    };
}

export default createPlugin;
export { createPlugin as webWorkerLoader };
export type { WebWorkerLoaderConfig };
