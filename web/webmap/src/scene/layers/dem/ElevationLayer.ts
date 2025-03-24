import { Projection } from "../../../geography/Projection";
import { TileDescriptor } from "../../../models/TileDescriptor";
import { Loader, LoaderDoneType } from "../../Loader";
import { Layer, MatchType, ResourceRequestType } from "../Layer";
import { ElevationTile } from "./ElevationTile";

export abstract class ElevationLayer extends Layer<ElevationTile> {
    private resolution: number;

    protected levels: number[];

    private cache: Map<string, {
        desc: TileDescriptor,
        url: string,
        data: ElevationTile,
        refCount: number,
    }> = new Map();

    protected minLevel: number;
    protected maxLevel: number;

    private loader: Loader<ElevationTile, undefined> = new Loader<ElevationTile, undefined>(async (response, request) => {
        const reader = response.body?.getReader();

        // Read the decompressed stream, and load the data as a stream of 16-bit integers
        const data: number[][] = Array(this.resolution).fill(0).map(() => Array(this.resolution).fill(0));

        let x = 0;
        let y = 0;

        const maxLength = this.resolution * this.resolution * 2;

        // Read chunks into a single buffer for processing
        const buffer = new Uint8Array(maxLength);
        let offset = 0;
        while (offset < maxLength) {
            const block = await reader?.read();
            if (!block || block.done)
                break;

            buffer.set(block.value, offset);
            offset += block.value.length;
        }

        // Process the buffer into signed int 2D array
        for (let i = 0; i < buffer.length; i += 2) {
            const unsignedValue = buffer[i] | (buffer[i + 1] << 8);
            const signedValue = unsignedValue > 32767 ? unsignedValue - 65536 : unsignedValue;

            data[x][y] = signedValue;

            x++;
            if (x >= this.resolution) {
                x = 0;
                y++;
            }
        }

        if (x !== 0 || y !== this.resolution)
            throw new Error("Invalid tile data");

        return new ElevationTile(request.descriptor!, data, this.resolution, request.descriptor!.getBounds(this.projection));
    });

    private doneHandler(data: LoaderDoneType<ElevationTile, undefined>) {
        console.log("loading elevation tile done", data.descriptor.toString());

        this.cache.set(data.descriptor.toString(), {
            desc: data.descriptor,
            url: data.url,
            data: data.data,
            refCount: 0,
        });

        for (const listener of this.listeners ?? [])
            listener({
                data: data.data,
                descriptor: data.descriptor,
            });
    }

    constructor(private projection: Projection, options?: {
        resolution?: number,
        levels: number[],
    }) {
        super();
        this.resolution = options?.resolution ?? 256;

        this.minLevel = options?.levels !== undefined ? Math.min(...options.levels) : 8;
        this.maxLevel = options?.levels !== undefined ? Math.max(...options.levels) : 16;

        this.levels = options?.levels ?? [...Array(this.maxLevel + 1).keys()].filter(x => x >= this.minLevel);

        this.loader.onDone = (data) => {
            this.doneHandler(data);
        };
    }

    public request(wishlist: ResourceRequestType[]) {
        for (let element of wishlist) {
            while (element.desc.zoom > this.minLevel && element.desc.zoom > this.maxLevel)
                element.desc = element.desc.getParent()!;

            const url = this.getTileUrl(element.desc);

            // Lower zoom levels have higher priority
            this.loader.request({
                descriptor: element.desc,
                priority: element.priority,
                url,
            });
        }

        this.loader.processQueue();
    }

    protected abstract getTileUrl(tile: TileDescriptor): string;

    public getCached(desc: TileDescriptor): ElevationTile | undefined {
        return this.cache.get(desc.toString())?.data;
    }

    public getBestAvailableMatch(desc: TileDescriptor): MatchType<ElevationTile> | undefined {
        const d = desc.clone();
        while (d.zoom >= this.minLevel) {
            const elem = this.cache.get(d.toString());
            if (elem)
                return {
                    descriptor: elem.desc,
                    data: elem.data,
                } as MatchType<ElevationTile>;

            d.up();
        }

        return undefined;
    }

    public increaseRefCount(desc: TileDescriptor) {
        const elem = this.cache.get(desc.toString());
        if (!elem)
            return;

        elem.refCount++;
    }

    public decreaseRefCount(desc: TileDescriptor) {
        const elem = this.cache.get(desc.toString());
        if (!elem)
            return;

        elem.refCount--;
    }
}