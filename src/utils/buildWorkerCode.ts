import type { BuildWorkerOptions, TargetPlatform, WorkerType } from '../types.js';

const kDefaultsOptions: BuildWorkerOptions = {
    inline: true,
    preserveSource: false,
    enableUnicode: false,
    targetPlatform: 'browser',
    type: 'web-worker',
};

const typeMap: Record<WorkerType, string> = {
    'web-worker': 'Worker',
    'audio-worklet': 'AudioWorklet',
    'paint-worklet': 'PaintWorklet',
    'service-worker': 'ServiceWorker',
    'shared-worker': 'SharedWorker',
};

function getFactoryFuncName(options: BuildWorkerOptions): string {
    const typeFileNameSegment = typeMap[options.type];
    if (options.inline) {
        if (options.preserveSource) {
            return `createInline${typeFileNameSegment}Factory`;
        }
        return `createBase64${typeFileNameSegment}Factory`;
    }
    return `createURL${typeFileNameSegment}Factory`;
}

function getArgsString(source: string, sourcemap: string | null, options: BuildWorkerOptions): string {
    if (options.targetPlatform === 'base64') {
        const { Buffer } = require('node:buffer') as typeof import('node:buffer');
        return Buffer.from(source, options.enableUnicode ? 'utf16le' : 'utf8').toString('base64');
    }

    if (options.inline) {
        const sourcemapArg = sourcemap ? `'${sourcemap.toUrl()}'` : 'null';
        if (options.preserveSource) {
            return `${source.substring(0, source.length - 1)}, ${sourcemapArg}`;
        }
        const { Buffer } = require('node:buffer') as typeof import('node:buffer');
        const sourceArg = Buffer.from(source, options.enableUnicode ? 'utf16le' : 'utf8').toString('base64');
        return `'${sourceArg}', ${sourcemapArg}, ${options.enableUnicode.toString()}`;
    }
    return `'${source}'`;
}

function buildWorkerSource(options: BuildWorkerOptions, factoryFuncName: string, argsString: string): string {
    if (options.targetPlatform === 'base64') {
        return `
/* eslint-disable */
var base64 = '${argsString}';
export default base64;
/* eslint-enable */
`;
    }

    return `
/* eslint-disable */
import {${factoryFuncName}} from '\\0rollup-plugin-web-worker-loader::helper::${options.targetPlatform}::${factoryFuncName}';
var WorkerFactory = /*#__PURE__*/${factoryFuncName}(${argsString});
export default WorkerFactory;
/* eslint-enable */
`;
}

export function buildWorkerCode(
    source: string,
    sourcemap: string | null = null,
    optionsArg: Partial<BuildWorkerOptions> = {},
): string {
    const options: BuildWorkerOptions = { ...kDefaultsOptions, ...optionsArg };
    if (options.targetPlatform === 'node' && options.type !== 'web-worker') {
        throw new Error(
            `rollup-plugin-web-worker-loader only supports web-workers in node. ${options.type} is unavailable.`,
        );
    }
    const factoryFuncName = getFactoryFuncName(options);
    const argsString = getArgsString(source, sourcemap, options);
    return buildWorkerSource(options, factoryFuncName, argsString);
}
