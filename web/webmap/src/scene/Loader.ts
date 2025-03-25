import { TileDescriptor } from "../models/TileDescriptor";

/**
 * Converts a response to a promise of the desired type.
 */
export type ResponseConverter<T, METADATA> = (response: Response, request: ResourceRequest<METADATA>) => Promise<T>;

export type ResourceRequest<METADATA> = {
    url: string,
    priority: number,
    descriptor: TileDescriptor,
    meta?: METADATA | undefined,
};

export type LoaderDoneType<T, METADATA> = ResourceRequest<METADATA> & {
    data: T,
};

export class Loader<T, METADATA> {
    public onDone?: (data: LoaderDoneType<T, METADATA>) => void;

    // TODO: Attach error object
    public onError?: (data: ResourceRequest<METADATA>) => void;

    private queue: ResourceRequest<METADATA>[] = [];

    public getStats() {
        return {
            queued: this.queue.length,
            loading: this.ongoingRequests.length,
        };
    }

    private ongoingRequests: {
        request: ResourceRequest<METADATA>,
        promise: Promise<void>,
        controller: AbortController
    }[] = [];

    constructor(private onResponse: ResponseConverter<T, METADATA | undefined>, private maxConcurrentRequests = 1) {
        this.processQueue = this.processQueue.bind(this);
    }

    public dispose() {
        this.queue = [];
        for (const request of this.ongoingRequests) {
            request.promise.finally(() => { });
            request.controller.abort();
        }
    }

    /**
     * Cancels a specific request
     * @param desc The descriptor of the request to cancel
     */
    public cancel(desc: TileDescriptor) {
        const request = this.ongoingRequests.find(r => r.request.descriptor.equals(desc));
        if (request) {
            request.controller.abort();
        }
        this.queue = this.queue.filter(q => q.descriptor.equals(desc));
    }

    /**
     * Dequeues all requests that are not included in the wishlist or are parents of something in it.
     */
    public prune(wishlist: TileDescriptor[]) {
        this.queue = this.queue.filter(q => wishlist.some(w => q.descriptor.includes(w)));

        const requestsToCancel = this.ongoingRequests.filter(o => !wishlist.some(w => o.request.descriptor.includes(w)));
        this.ongoingRequests = this.ongoingRequests.filter(o => wishlist.some(w => o.request.descriptor.includes(w)));
        for (const request of requestsToCancel)
            request.controller.abort();
    }

    /**
     * Requests a resource
     * @param url The URL to fetch
     * @param priority Resource priority. The higher, the sooner it will be loaded.
     * @param meta user-defined metadata. Could be anything or undefined. The loader doesn't care.
     * @returns 
     */
    public request(request: ResourceRequest<METADATA>) {
        if (this.ongoingRequests.some(o => o.request.descriptor.equals(request.descriptor)))
            // Already loading, ignore
            return;

        const existing = this.queue.find(q => q.descriptor.equals(request.descriptor));
        if (existing) {
            existing.priority = Math.max(existing.priority, request.priority);
            existing.meta = request.meta;
            existing.url = request.url;
            return;
        }

        this.queue.push(request);
    }

    public processQueue() {
        if (this.ongoingRequests.length >= this.maxConcurrentRequests)
            return;

        // Pick request with highest priority
        const next = this.queue.sort((a, b) => a.priority - b.priority).pop();
        if (!next)
            return;

        const controller = new AbortController();
        const promise = fetch(next.url, { signal: controller.signal })
            .then(response => {
                if (!response.ok) {
                    this.onError?.(next);
                    return;
                }

                // TODO: Remove delay here
                return new Promise(resolve => setTimeout(resolve, 0))
                    .then(() => this.onResponse(response, next))
                    .then(d => {
                        if (this.onDone)
                            this.onDone({
                                ...next,
                                data: d,
                            });
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

        // Move request to ongoing
        this.queue = this.queue.filter(q => !q.descriptor.equals(next.descriptor));
        this.ongoingRequests.push({
            request: next,
            promise,
            controller,
        });

        promise.finally(() => {
            this.ongoingRequests = this.ongoingRequests.filter(o => !o.request.descriptor.equals(next.descriptor));
            this.processQueue();
        });
    }
}