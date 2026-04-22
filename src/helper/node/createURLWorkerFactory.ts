import { WorkerClass } from './WorkerClass.js';

export function createURLWorkerFactory(
    url: string,
): (options?: object) => Worker | null {
    return function WorkerFactory(options?: object): Worker | null {
        if (!WorkerClass) return null;
        return new WorkerClass(url, options as ConstructorParameters<typeof WorkerClass>[1]);
    };
}
