export function createURLServiceWorkerFactory(
    url: string,
): (options?: RegistrationOptions) => Promise<ServiceWorkerRegistration> {
    return function ServiceWorkerFactory(options?: RegistrationOptions): Promise<ServiceWorkerRegistration> {
        return navigator.serviceWorker.register(url, options);
    };
}
