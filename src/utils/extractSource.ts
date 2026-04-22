import path from 'node:path';
import type { RawSourceMap } from 'rollup';

export function extractSource(code: string, asFunction = true): string {
    if (asFunction) {
        return `/* rollup-plugin-web-worker-loader */function () {\n${code.replace(
            /(['"])use strict(['"])/g,
            '$1__worker_loader_strict__$2',
        )}}\n`;
    }
    return `/* rollup-plugin-web-worker-loader */\n${code}\n`;
}

export function fixMapSources(
    chunk: { map: RawSourceMap & { sources: string[]; sourcesContent: string[] }; modules: Record<string, { originalLength: number }> },
    basePath: string,
): RawSourceMap {
    const map = chunk.map;
    const newSourcesComponents: (string[] | null)[] = [];
    let maxUpFolder = 0;

    for (let i = 0; i < map.sources.length; ++i) {
        const full = findFullPath(map.sources[i], map.sourcesContent[i]?.length ?? 0, chunk.modules);
        if (full) {
            const relative = path.relative(basePath, full);
            const base = path.dirname(relative);
            const components = base.split(path.sep);
            const newComponents: string[] = [];
            let upFolder = 0;
            for (const component of components) {
                if (component === '..') {
                    ++upFolder;
                } else {
                    newComponents.push(component);
                }
            }
            newComponents.push(path.basename(full));
            maxUpFolder = Math.max(maxUpFolder, upFolder);
            newSourcesComponents[i] = newComponents;
        } else {
            newSourcesComponents[i] = null;
        }
    }

    const basePathComponents = basePath.split(path.sep);
    const newBaseComponents: string[] = [];
    for (let i = 0; i < maxUpFolder; ++i) {
        newBaseComponents.unshift(basePathComponents.pop()!);
    }
    const newBase = path.resolve('/web-worker', ...newBaseComponents);

    for (let i = 0; i < map.sources.length; ++i) {
        if (newSourcesComponents[i]) {
            map.sources[i] = 'worker:/' + path.resolve(newBase, ...newSourcesComponents[i]!);
        }
    }

    return map;
}

function findFullPath(
    file: string,
    length: number,
    modules: Record<string, { originalLength: number }>,
): string | null {
    const keys = Object.keys(modules);
    for (const key of keys) {
        if (key.endsWith(file) && modules[key].originalLength === length) {
            return key;
        }
    }
    return null;
}
