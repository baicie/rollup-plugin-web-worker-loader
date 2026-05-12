import DemoWorker from 'web-worker:./demo.worker'

const worker = new DemoWorker()

worker.onmessage = event => {
  console.log('[main] from worker:', event.data)
}

worker.postMessage({
  type: 'ping',
  payload: Date.now(),
})
