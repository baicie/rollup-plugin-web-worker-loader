import { builtinModules } from 'node:module'
import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import pkg from './package.json'

const externals = [
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...builtinModules,
  ...builtinModules.map(module => `node:${module}`),
  'require',
]

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
    input: './src/index.js',
    output: {
      dir: './dist',
      format: 'esm',
    },
    external: externals,
    treeshake: true,
    plugins: [
      dts({
        emitDtsOnly: true,
      }),
    ],
  },
])

export default config
