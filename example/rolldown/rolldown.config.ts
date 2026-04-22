import { defineConfig } from 'rolldown';
import { webWorkerLoader } from 'rollup-plugin-web-worker-loader';

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
