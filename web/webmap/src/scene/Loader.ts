/**
 * Converts a response to a promise of the desired type.
 */
export type ResponseConverter<T> = (response: Response) => Promise<T>;

export type ResourceRequest<METADATA> = {
    url: string,
    priority: number,
    meta: METADATA | undefined,
};

export class Loader<T, METADATA> {
    public onDone?: (data: T, meta: METADATA | undefined) => void;
    public onError?: (url: string) => void;

    private queue: ResourceRequest<METADATA>[] = [];

    private ongoingRequests: {
        url: string,
        meta: METADATA | undefined,
        promise: Promise<void>,
        controller: AbortController
    }[] = [];

    constructor(private onResponse: ResponseConverter<T>, private maxConcurrentRequests = 1) {
        this.processQueue = this.processQueue.bind(this);
    }

    public isRequested(url: string) {
        return this.queue.some(q => q.url === url) || this.ongoingRequests.some(o => o.url === url);
    }

    public dispose() {
        this.queue = [];
        for (const request of this.ongoingRequests) {
            request.controller.abort();
            request.promise.finally(() => { });
        }
    }

    /**
     * Cancels a specific request
     * @param url Resource URL to cancel
     */
    public cancel(url: string) {
        const request = this.ongoingRequests.find(r => r.url === url);
        if (request) {
            request.controller.abort();
        }
        this.queue = this.queue.filter(q => q.url !== url);
    }

    /**
     * Requests a resource
     * @param url The URL to fetch
     * @param priority Resource priority. The higher, the sooner it will be loaded.
     * @param meta user-defined metadata. Could be anything or undefined. The loader doesn't care.
     * @returns 
     */
    public request(url: string, meta: METADATA, priority: number = 0) {
        if (this.ongoingRequests.some(o => o.url === url))
            // Already loading, ignore
            return;

        const existing = this.queue.find(q => q.url === url);
        if (existing) {
            existing.priority = Math.max(existing.priority, priority);
            return;
        }

        this.queue.push({ url, priority, meta });
    }

    public processQueue() {
        if (this.ongoingRequests.length >= this.maxConcurrentRequests)
            return;

        const next = this.queue.sort((a, b) => a.priority - b.priority).pop();
        if (!next)
            return;

        const controller = new AbortController();
        const promise = fetch(next.url, { signal: controller.signal })
            .then(response => {
                if (!response.ok) {
                    this.onError?.(next!.url);
                    return;
                }

                // TODO: Remove delay here
                return new Promise(resolve => setTimeout(resolve, 750))
                    .then(() => this.onResponse(response))
                    .then(d => {
                        if (this.onDone)
                            this.onDone(d, next.meta);
                    });
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    // Handle abort silently
                    return;
                }
                // Re-throw other errors
                throw error;
            });

        this.queue = this.queue.filter(q => q.url !== next.url);
        this.ongoingRequests.push({ url: next.url, promise, controller, meta: next.meta });

        promise.finally(() => {
            this.ongoingRequests = this.ongoingRequests.filter(o => o.url !== next.url);
            this.processQueue();
        });
    }
}