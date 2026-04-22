import { defineConfig } from 'rolldown';
import webWorkerLoader from '@baicie/web-worker-inline/rolldown';

export default defineConfig({
    input: './src/main.ts',
    output: {
        dir: './dist',
        format: 'esm',
        sourcemap: true,
    },
    plugins: [
        webWorkerLoader({
            targetPlatform: 'browser',
            inline: true,
            sourcemap: false,
        }),
    ],
});
