import { TileDescriptor } from "../models/TileDescriptor";
import { ElevationTile } from "./ElevationTile";

export class ElevationLayer {
    private resolution: number;

    constructor(private urlTemplate: string, options?: {
        resolution?: number,
    }) {
        this.resolution = options?.resolution ?? 256;
    }

    public async load(desc: TileDescriptor) {
        const url = this.getTileUrl(desc.x, desc.y, desc.zoom);
        const response = await fetch(url);
        const reader = response.body?.getReader();

        // Read the decompressed stream, and load the data as a stream of 16-bit integers
        const data: number[][] = Array(this.resolution).fill(0).map(() => Array(this.resolution).fill(0));

        let x = 0;
        let y = 0;

        while (true) {
            const block = await reader?.read();
            if (!block || block.done)
                break;

            const chunk = block.value as Uint8Array;
            for (let i = 0; i < chunk.length; i += 2) {
                data[x][y] = chunk[i] | (chunk[i + 1] << 8);

                x++;
                if (x >= this.resolution) {
                    x = 0;
                    y++;
                }
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