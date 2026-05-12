// Main entry file that imports a worker
import MyWorker from 'web-worker:./worker'

const worker = new MyWorker()

worker.onmessage = (event) => {
  const { type, result, message } = event.data

  if (type === 'result') {
    console.log('Sum:', result.sum)
    console.log('Product:', result.product)
    console.log('Timestamp:', result.timestamp)
  } else if (type === 'error') {
    console.error('Worker error:', message)
  }
}

worker.postMessage({ type: 'process', data: { numbers: [1, 2, 3, 4, 5] } })

export { worker }
