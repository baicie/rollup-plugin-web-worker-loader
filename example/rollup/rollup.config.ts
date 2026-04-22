import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { webWorkerLoader } from '../../src/index';

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
        typescript({
            compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'bundler',
                target: 'ES2022',
                lib: ['ES2022', 'DOM'],
                strict: true,
                esModuleInterop: true,
            },
        }),
    ],
});
