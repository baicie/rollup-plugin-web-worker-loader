import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    formatters: true,
    lintCommand: 'lint',
    ignores: [
      'node_modules',
      '.*',
      'bamboo',
      'coverage',
      'dist',
      'example',
      'gulpfile.js',
      'tests',
      'src',
      '*.md',
      'AGENT.md',
    ],
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'warn',
    },
  },
)
