import { copyFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { resolve } from 'node:path'
import { defineConfig } from 'rolldown'
import pkg from './package.json'

const externals = [
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...builtinModules,
  ...builtinModules.map(module => `node:${module}`),
  'require',
]

function copyDtsPlugin() {
  return {
    name: 'copy-dts',
    writeBundle() {
      copyFileSync(
        resolve(__dirname, 'src/index.d.ts'),
        resolve(__dirname, 'dist/index.d.ts'),
      )
    },
  }
}

const config = defineConfig([
  {
    input: './src/index.js',
    output: {
      dir: './dist',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
      exports: 'named',
      sourcemap: true,
    },
    external: externals,
    treeshake: true,
    plugins: [copyDtsPlugin()],
  },
  {
    input: './src/index.js',
    output: {
      dir: './dist',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
      exports: 'named',
      sourcemap: true,
    },
    external: externals,
    treeshake: true,
  },
  {
    input: './src/rolldown.js',
    output: {
      dir: './dist',
      format: 'esm',
      entryFileNames: 'rolldown.mjs',
      chunkFileNames: '[name]-[hash].mjs',
      exports: 'named',
      sourcemap: true,
    },
    external: externals,
    treeshake: true,
  },
  {
    input: './src/rolldown.js',
    output: {
      dir: './dist',
      format: 'cjs',
      entryFileNames: 'rolldown.cjs',
      chunkFileNames: '[name]-[hash].cjs',
      exports: 'named',
      sourcemap: true,
    },
    external: externals,
    treeshake: true,
  },
])

export default config
