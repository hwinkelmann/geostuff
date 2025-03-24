import { Projection } from "../../../geography/Projection";
import { TileDescriptor } from "../../../models/TileDescriptor";
import { ElevationLayer } from "./ElevationLayer";

export class AsterLayer extends ElevationLayer {
    constructor(projection: Projection) {
        super(projection, {
            resolution: 256,
            levels: [6, 8, 10, 12, 14, 16],
        });
    }

    public getAppropriateDescriptor(desc: TileDescriptor): TileDescriptor | undefined {
        const result = desc.clone();

        while (result.zoom > this.minLevel && !this.levels.includes(result.zoom))
            result.up();

        return this.levels.includes(result.zoom) ? result : undefined;
    }

    protected getTileUrl(tile: TileDescriptor): string {
        return `http://localhost:5173/api/elevation/tile/${tile.zoom}/${tile.x}/${tile.y}`;
    }
}