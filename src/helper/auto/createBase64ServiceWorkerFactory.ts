import { createBase64ServiceWorkerFactory as browserCreateBase64ServiceWorkerFactory } from '../browser/createBase64ServiceWorkerFactory.js';
import { isNodeJS } from './isNodeJS.js';

export function createBase64ServiceWorkerFactory(
    base64: string,
    sourcemapArg?: string | null,
    enableUnicodeArg?: boolean,
): (options?: RegistrationOptions) => Promise<ServiceWorkerRegistration> {
    if (isNodeJS()) {
        throw new Error('rollup-plugin-web-worker-loader does not support Service Worker in Node.JS');
    }
    return browserCreateBase64ServiceWorkerFactory(base64, sourcemapArg, enableUnicodeArg);
}
