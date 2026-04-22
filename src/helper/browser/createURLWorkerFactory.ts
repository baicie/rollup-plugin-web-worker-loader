export function createURLWorkerFactory(url: string): (options?: WorkerOptions) => Worker {
    return function WorkerFactory(options?: WorkerOptions): Worker {
        return new Worker(url, options);
    };
}
