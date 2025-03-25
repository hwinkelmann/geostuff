import { TileDescriptor } from "../../../models/TileDescriptor";
import { RenderContext } from "../../../rendering/RenderContext";
import { TextureLayer } from "./TextureLayer";

export class BingAerialLayer extends TextureLayer {
    constructor(context: RenderContext) {
        super(context, 1, 19);
    }

    protected getTileUrl(tile: TileDescriptor): string {
        return `https://t0.tiles.virtualearth.net/tiles/a${tile.getQuadKey()}.jpeg?g=854&mkt=en-US&n=z`;
    }
}