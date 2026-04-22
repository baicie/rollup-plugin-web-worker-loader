import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

const esmConfig = defineConfig({
  input: './src/index.ts',
  output: {
    file: './dist/index.mjs',
    format: 'esm',
    sourcemap: true,
  },
  external: ['rollup', 'rolldown', '@rolldown/rolldown', /^node:/],
  plugins: [
    typescript({
      compilerOptions: {
        declaration: true,
        declarationDir: './dist',
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
      },
      exclude: ['node_modules/**', 'dist/**', 'example/**'],
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
})

const cjsConfig = defineConfig({
  input: './src/index.ts',
  output: {
    file: './dist/index.cjs',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    interop: 'auto',
  },
  external: [
    'rollup',
    'rolldown',
    '@rolldown/rolldown',
    /^node:/,
    'path',
    'fs',
    'buffer',
    'module',
  ],
  plugins: [
    typescript({
      compilerOptions: {
        declaration: false,
        sourceMap: true,
        outDir: './dist',
      },
      exclude: ['node_modules/**', 'dist/**', 'example/**'],
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
})

export default [esmConfig, cjsConfig]
