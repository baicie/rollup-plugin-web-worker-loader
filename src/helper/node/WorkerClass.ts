type WorkerModule = typeof import('worker_threads');
type WorkerConstructor = new (script: string | URL, options?: object) => Worker;

declare const __non_webpack_require__: ((id: string) => unknown) | undefined;

let WorkerClass: WorkerConstructor | null = null;

if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    try {
        let mod: WorkerModule | null = null;
        if (typeof module !== 'undefined' && typeof module.require === 'function') {
            mod = module.require('worker_threads') as WorkerModule;
        } else if (typeof __non_webpack_require__ === 'function') {
            mod = __non_webpack_require__('worker_threads') as WorkerModule;
        } else if (typeof require === 'function') {
            mod = require('worker_threads') as WorkerModule;
        }
        if (mod) {
            WorkerClass = mod.Worker as unknown as WorkerConstructor;
        }
    } catch (_e) { }
}

export { WorkerClass };
