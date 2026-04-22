import MyWorker from 'web-worker:./worker';

const worker = new MyWorker();

worker.onmessage = (event: MessageEvent) => {
    const { type, result, items, message } = event.data;

    if (type === 'result') {
        console.log('Sum:', result.sum);
        console.log('Product:', result.product);
        console.log('Timestamp:', result.timestamp);
    } else if (type === 'filtered') {
        console.log('Filtered items:', items);
    } else if (type === 'error') {
        console.error('Worker error:', message);
    }
};

worker.postMessage({ type: 'process', data: { numbers: [1, 2, 3, 4, 5] } });
worker.postMessage({ type: 'filter', data: { items: [1, null, 2, undefined, 3] } });

export { worker };
