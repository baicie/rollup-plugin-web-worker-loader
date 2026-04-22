import { defineConfig } from 'rolldown';
import { webWorkerLoader } from '@baicie/web-worker-inline';

export default defineConfig({
    input: './src/main.ts',
    output: {
        file: './dist/bundle.js',
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
