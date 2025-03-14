import { TileDescriptor } from "../../../models/TileDescriptor";
import { ElevationLayer } from "./ElevationLayer";

export class AsterLayer extends ElevationLayer {
    constructor() {
        super({
            resolution: 256,
        });
    }

    protected getTileUrl(tile: TileDescriptor): string {
        return `http://localhost:5173/api/elevation/tile?x=${x}&y=${y}&z=${tile.zoom}&resolution=256`;
    }
}