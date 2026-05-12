declare module 'web-worker:*' {
  const WorkerFactory: {
    new (options?: WorkerOptions): Worker
    prototype: Worker
  }
  export = WorkerFactory
}

declare module 'audio-worklet:*' {
  const AudioWorkletFactory: {
    new (options?: AudioWorkletOptions): AudioWorkletNode
    prototype: AudioWorkletNode
  }
  export = AudioWorkletFactory
}

declare module 'paint-worklet:*' {
  const PaintWorkletFactory: {
    registerPainter(name: string, painter: PaintWorkletPainter): void
  }
  export = PaintWorkletFactory
}

declare module 'service-worker:*' {
  function ServiceWorkerFactory(
    scriptURL: string,
    options?: RegistrationOptions,
  ): Promise<ServiceWorkerRegistration>
  export = ServiceWorkerFactory
}

declare module 'shared-worker:*' {
  const SharedWorkerFactory: {
    new (url: string | URL, options?: SharedWorkerOptions): SharedWorker
    prototype: SharedWorker
  }
  export = SharedWorkerFactory
}
