import { TileDescriptor } from "../../../models/TileDescriptor";
import { ElevationTile } from "./ElevationTile";

export class ElevationLayer {
    private resolution: number;

    private cache = new Map<string, ElevationTile>();

    private requestQueue = new Map<string, Promise<ElevationTile>>();

    constructor(private urlTemplate: string, options?: {
        resolution?: number,
    }) {
        this.resolution = options?.resolution ?? 256;
    }

    /**
     * Returns a cached elevation tile if it exists, otherwise requests it from the server
     * @param desc Tile descriptor
     */
    public getOrRequestTile(desc: TileDescriptor) {
        const key = desc.toString();
        let tile = this.cache.get(key);

        if (!tile && !this.requestQueue.has(key)) {
            const request = this.loadTileAsync(desc);
            this.requestQueue.set(key, request);

            request.then((tile) => {
                this.cache.set(key, tile);
            }).catch((error) => {
                console.error(error);
            }).finally(() => {
                this.requestQueue.delete(key);
            });
        }

        return tile;
    }

    public async loadTileAsync(desc: TileDescriptor) {
        const url = this.getTileUrl(desc.x, desc.y, desc.zoom);
        const response = await fetch(url);
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

        return new ElevationTile(desc, data, this.resolution);
    }

    private getTileUrl(x: number, y: number, zoom: number) {
        return this.urlTemplate
            .replace("{x}", x.toString())
            .replace("{y}", y.toString())
            .replace("{z}", zoom.toString())
            .replace("{resolution}", this.resolution.toString());
    }
}