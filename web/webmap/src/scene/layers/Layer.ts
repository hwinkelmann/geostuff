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
};

export type ResourceReceivedHandler<T> = (resource: MatchType<T>) => void;

export type ResourceRequestType = {
    desc: TileDescriptor;
    priority: number;
};

export type LayerStats = {
    size: number;
    queued: number;
    referenced: number;
    loading: number;
};

export abstract class Layer<T> {
    /**
     * Returns the currently loaded resource that matches the requested descriptor best.
     * Returns immediately.
     * @param desc 
     */
    public abstract getBestAvailableMatch(desc: TileDescriptor): MatchType<T> | undefined;

    /**
     * Request the loading of resources that stear towards the given wishlist.
     */
    public abstract request(wishlist: ResourceRequestType[]): void;

    /**
     * Returns the appropriate descriptor for this layer if you want to render the map tile with the given descriptor.
     * @param mapDescriptor The descriptor of the map tile.
     */
    public abstract getAppropriateDescriptor(mapDescriptor: TileDescriptor): TileDescriptor | undefined;

    public abstract increaseRefCount(desc: TileDescriptor): void;

    public abstract decreaseRefCount(desc: TileDescriptor): void;

    public abstract getStats(): LayerStats;
}