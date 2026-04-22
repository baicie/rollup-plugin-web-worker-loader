import { funcToSource } from '../funcToSource.js';

function createURL(fn: () => void, sourcemapArg?: string | null): string {
    const lines = funcToSource(fn, sourcemapArg);
    const blob = new Blob(lines, { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}

export function createInlineServiceWorkerFactory(
    fn: () => void,
    sourcemapArg?: string | null,
): () => (options?: RegistrationOptions) => Promise<ServiceWorkerRegistration> {
    let url: string | undefined;
    return function ServiceWorkerFactory(options?: RegistrationOptions): Promise<ServiceWorkerRegistration> {
        url = url ?? createURL(fn, sourcemapArg);
        return navigator.serviceWorker.register(url, options);
    };
}
