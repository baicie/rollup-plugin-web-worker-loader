import { defineConfig } from 'rollup'
import workerLoader from '@baicie/web-worker-inline'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import replace from 'rollup-plugin-replace'
import esbuild from 'rollup-plugin-esbuild'

export default defineConfig({
  input: './src/index.ts',
  output: {
    file: './dist/bundle.js',
    format: 'iife',
    name: 'ExampleApp',
    sourcemap: 'inline',
  },
  plugins: [
    commonjs({ include: /node_modules/ }),
    json(),
    resolve(),
    workerLoader({
      targetPlatform: 'browser',
      inline: true,
      preserveSource: false,
    }),
    replace({
      'process.env.DEBUG': 'true',
    }),
    esbuild({
      target: 'es5',
      minify: false,
    }),
  ],
})
