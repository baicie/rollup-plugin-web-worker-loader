self.onmessage = event => {
  self.postMessage({
    type: 'pong',
    payload: event.data,
  })
}
