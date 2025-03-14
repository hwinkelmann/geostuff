import { TileDescriptor } from "../../../models/TileDescriptor";
import { Loader } from "../../Loader";
import { Layer, MatchType, ResourceRequestType } from "../Layer";
import { ElevationTile } from "./ElevationTile";

export abstract class ElevationLayer extends Layer<ElevationTile> {
    private resolution: number;

    private cache: Map<string, {
        desc: TileDescriptor,
        url: string,
        data: ElevationTile,
        refCount: number,
    }> = new Map();

    protected minLevel: number;
    protected maxLevel: number;

    private loader: Loader<ElevationTile, TileDescriptor> = new Loader<ElevationTile, TileDescriptor>(async (response, desc) => {
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
            data[x][y] = buffer[i] | (buffer[i + 1] << 8);

            x++;
            if (x >= this.resolution) {
                x = 0;
                y++;
            }
        }

        if (x !== 0 || y !== this.resolution)
            throw new Error("Invalid tile data");

        return new ElevationTile(desc!, data, this.resolution);
    });

    constructor(options?: {
        resolution?: number,
        minLevel?: number,
        maxLevel?: number,
    }) {
        super();
        this.resolution = options?.resolution ?? 256;
        this.minLevel = options?.minLevel ?? 8;
        this.maxLevel = options?.maxLevel ?? 16;

        this.loader.onDone = (data, meta) => {
            this.doneHandler(data, meta);
        };
    }

    private doneHandler(data: ElevationTile, desc?: TileDescriptor) {
        if (!desc)
            throw new Error("No descriptor - this should never happen");

        console.log("loading texture done", desc.toString());
        this.cache.set(desc.toString(), {
            desc,
            url: this.getTileUrl(desc),
            data,
            refCount: 0,
        });

        for (const listener of this.listeners ?? [])
            listener({
                descriptor: desc,
                data: data,
            });
    }

    public request(wishlist: ResourceRequestType[]) {
        for (let element of wishlist) {
            while (element.desc.zoom > this.minLevel && element.desc.zoom > this.maxLevel)
                element.desc = element.desc.getParent()!;

            const url = this.getTileUrl(element.desc);

            // Lower zoom levels have higher priority
            this.loader.request(url, element.desc, element.priority);
        }

        this.loader.processQueue();
    }

    protected abstract getTileUrl(tile: TileDescriptor): string;

    public getBestMatch(desc: TileDescriptor): MatchType<ElevationTile> | undefined {
        return undefined;
    }
}