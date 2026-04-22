# rollup-plugin-web-worker-loader

Web Worker, Service Worker, Shared Worker, Audio Worklet, and Paint Worklet integration plugin for Rollup and Rolldown. Written in TypeScript.

Web Workers are available in both Node.js and browsers. All other worklet types are browser-only.

Supports both **Rollup** (v1-v4) and **Rolldown** (v1+) as bundlers. The plugin automatically detects and uses whichever bundler is available in your project.

## Installation

```bash
npm install @baicie/web-worker-inline --save-dev
# or
yarn add @baicie/web-worker-inline --dev
# or
pnpm add @baicie/web-worker-inline --save-dev
```

## Usage

### With Rollup

```typescript
// rollup.config.ts
import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import webWorkerLoader from '@baicie/web-worker-inline'

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
    }),
    typescript(),
  ],
})
```

### With Rolldown

```typescript
// rolldown.config.ts
import { defineConfig } from 'rolldown'
import webWorkerLoader from '@baicie/web-worker-inline/rolldown'

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
    }),
  ],
})
```

## Import Pattern

Import workers using the `web-worker:` prefix (or a custom pattern):

```typescript
import MyWorker from 'web-worker:./worker'

const worker = new MyWorker()
worker.postMessage('Hello World!')
```

## Configuration Options

```typescript
import webWorkerLoader from '@baicie/web-worker-inline'

webWorkerLoader({
  // Target platform: 'auto', 'browser', 'node'
  // Default: 'auto'
  targetPlatform: 'auto',

  // Browser worker class: 'Worker' or 'SharedWorker'
  // Default: 'Worker'
  browserWorker: 'Worker',

  // Pattern to match web worker imports
  // Default: /web-worker:(.+)/
  webWorkerPattern: /web-worker:(.+)/,

  // Pattern to match audio worklet imports
  // Default: /audio-worklet:(.+)/
  audioWorkletPattern: /audio-worklet:(.+)/,

  // Pattern to match paint worklet imports
  // Default: /paint-worklet:(.+)/
  paintWorkletPattern: /paint-worklet:(.+)/,

  // Pattern to match service worker imports
  // Default: /service-worker:(.+)/
  serviceWorkerPattern: /service-worker:(.+)/,

  // Pattern to match shared worker imports
  // Default: /shared-worker:(.+)/
  sharedWorkerPattern: /shared-worker:(.+)/,

  // File extensions to try when resolving worker files
  // Default: ['.js', '.ts']
  extensions: ['.js', '.ts'],

  // Inline worker code as base64 URL (or preserve source)
  // Default: true
  inline: true,

  // Force code to be inlined every time it's imported
  // Default: false
  forceInline: false,

  // Enable source maps for inline workers
  // Default: false
  sourcemap: false,

  // Preserve full source code instead of base64 encoding
  // Default: false
  preserveSource: false,

  // Preserve input worker file names when code splitting
  // Default: false
  preserveFileNames: false,

  // Enable UTF-16 unicode support (doubles payload size)
  // Default: false
  enableUnicode: false,

  // Output folder for worker scripts (when inline: false)
  // Default: ''
  outputFolder: 'workers',

  // Path prefix for loading worker scripts
  // Default: ''
  loadPath: '/js',

  // External modules to keep external in worker bundles
  // Default: undefined
  external: ['lodash'],

  // Plugin names to skip when building workers
  // Default: ['liveServer', 'serve', 'livereload']
  skipPlugins: ['liveServer', 'serve', 'livereload'],
})
```

## Supported Worker Types

### Web Worker

```typescript
import MyWorker from 'web-worker:./worker'

const worker = new MyWorker()
worker.postMessage('Hello!')
```

### Shared Worker

```typescript
import SharedWorker from 'shared-worker:./SharedWorker'

const shared = new SharedWorker()
shared.port.postMessage('Hello!')
```

### Service Worker

```typescript
import ServiceWorker from 'service-worker:./ServiceWorker'

ServiceWorker.then((registration) => {
  console.log('Registered:', registration.scope)
})
```

### Audio Worklet

```typescript
import registerAudio from 'audio-worklet:./AudioProcessor'

class MyAudioProcessor extends AudioWorkletProcessor {}
registerProcessor('my-audio', MyAudioProcessor)

const audioContext = new AudioContext()
registerAudio(audioContext)
```

### Paint Worklet

```typescript
import registerPaint from 'paint-worklet:./Painter'

class MyPainter {}
registerPaint('my-paint', MyPainter)

registerPaint()
CSS.paintWorklet.addModule(url)
```

## Examples

See the `example/` directory for complete examples:

- `example/rollup/` - Rollup build with TypeScript
- `example/rolldown/` - Rolldown build example

## TypeScript

This plugin is written in TypeScript and provides full type definitions.

## License

MIT
