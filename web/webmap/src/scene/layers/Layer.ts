import { TileDescriptor } from "../../models/TileDescriptor";

export type MatchType<T> = {
    /**
     * Descriptor matching the data returned
     */
    descriptor: TileDescriptor;

    /**
     * Data
     */
    data: T;

    /**
     * Next refinement stage or undefined, if the descriptor is matching the request or is
     * the best we got.
     */
    refinement?: TileDescriptor;
};

export type ResourceReceivedHandler<T> = (resource: MatchType<T>) => void;

export abstract class Layer<T> {
    /**
     * Returns the currently loaded resource that matches the requested descriptor best.
     * Returns immediately.
     * @param desc 
     */
    public abstract getBestMatch(desc: TileDescriptor): MatchType<T> | undefined;

    /**
     * Can be called by interested parties to check if a given resource is already requested.
     * @param desc Tile descriptor
     * @returns True if the resource is already requested
     */
    public abstract isResourceRequested(desc: TileDescriptor): boolean;

    protected listeners = new Set<ResourceReceivedHandler<T>>();

    /**
     * Add a listener that will be called when a resource is received.
     */
    public addListener(listener: ResourceReceivedHandler<T>) {
        this.listeners.add(listener);
    }

    /**
     * Remove a listener that was previously added.
     */
    public removeListener(listener: ResourceReceivedHandler<T>) {
        this.listeners.delete(listener);
    }

    /**
     * Request the loading of resources that stear towards the given wishlist.
     */
    public abstract request(wishlist: TileDescriptor[]): void;
}