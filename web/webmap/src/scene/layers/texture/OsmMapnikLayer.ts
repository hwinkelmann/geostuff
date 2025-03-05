import { TileDescriptor } from "../../../models/TileDescriptor";
import { RenderContext } from "../../../rendering/RenderContext";
import { TextureLayer } from "./TextureLayer";

export class OsmMapnikLayer extends TextureLayer {
    constructor(context: RenderContext) {
        super(context, 0, 16);
    }

    protected getTileUrl(tile: TileDescriptor): string {
        return `https://tile.openstreetmap.de${tile.zoom}/${tile.x}/${tile.y}.png`;
    }
}