// This worker handles data processing in a separate thread
self.onmessage = (event) => {
  const { type, data } = event.data

  switch (type) {
    case 'process':
      const result = {
        sum: data.numbers.reduce((a, b) => a + b, 0),
        product: data.numbers.reduce((a, b) => a * b, 1),
        timestamp: Date.now(),
      }
      self.postMessage({ type: 'result', result })
      break

    default:
      self.postMessage({ type: 'error', message: `Unknown message type: ${type}` })
  }
}

// changed at 23:29:12
// changed at 23:31:25