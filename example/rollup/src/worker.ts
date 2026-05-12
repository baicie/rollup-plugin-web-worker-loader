// This worker handles data processing in a separate thread
self.onmessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
        case 'process':
            const result = {
                sum: data.numbers.reduce((a: number, b: number) => a + b, 0),
                product: data.numbers.reduce((a: number, b: number) => a * b, 1),
                timestamp: Date.now(),
            };
            self.postMessage({ type: 'result', result });
            break;

        case 'filter':
            const filtered = data.items.filter((item: unknown) => item !== null && item !== undefined);
            self.postMessage({ type: 'filtered', items: filtered });
            break;

        default:
            self.postMessage({ type: 'error', message: `Unknown message type: ${type}` });
    }
};

// changed at 23:14:03