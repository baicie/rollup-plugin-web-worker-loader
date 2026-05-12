import workerLoader from '@baicie/web-worker-inline'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import type { ModuleFormat, OutputOptions, RollupOptions } from 'rollup'
import { defineConfig } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'

const input = './src/main.js'

function generateOutput(format: ModuleFormat): OutputOptions {
  return {
    file: `./dist/BonreeSDK_JS.${format === 'iife' ? 'min' : format}.js`,
    format,
    name: 'BonreeAgent',
    sourcemap: 'inline',
  }
}

const formats: ModuleFormat[] = ['iife']

const configs: RollupOptions[] = [
  {
    input,
    output: formats.map(format => generateOutput(format)),

    plugins: [
      commonjs({
        include: /node_modules/,
      }),
      json(),
      resolve(),
      workerLoader({
        targetPlatform: 'browser',
        inline: true,
        preserveSource: true,
      }),
      replace({
        'process.env.BRLOG': '0',
        'process.env.BRSDK': '0',
        'process.env.BRBRIDGE': '0',
        'process.env.DEBUG': 'true',
      }),
      esbuild({
        target: 'es2017',
        minify: false,
      }),
    ],

    onwarn(warning, warn) {
      if (
        ['CIRCULAR_DEPENDENCY', 'EVAL', 'UNKNOWN_OPTION'].includes(
          warning.code ?? '',
        )
      ) {
        return
      }
      warn(warning)
    },

    treeshake: true,
  },
]

export default defineConfig(configs)
