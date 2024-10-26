import { TileDescriptor } from "../../models/TileDescriptor";
import { RenderContext } from "../../rendering/RenderContext";
import { loadTexture } from "../../rendering/Utils";
import { Cache } from "../../utils/Cache";

export class TextureLayer {
    // TODO: Get a sane default for the cache size
    private cache: Cache<string, WebGLTexture> = new Cache(64);
    private requestQueue = new Map<string, Promise<WebGLTexture>>();

    constructor(private context: RenderContext, private urlTemplate: string = "https://tile.openstreetmap.de/{z}/{x}/{y}.png") {
    }

    public getOrRequestTile(desc: TileDescriptor) {
        const key = desc.toString();
        let tile = this.cache.get(key);
        if (!tile && !this.requestQueue.has(key)) {
            const url = this.getTileUrl(desc.x, desc.y, desc.zoom);
            const request = loadTexture(this.context, url, {
                clampToEdge: true,
            });
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

    private getTileUrl(x: number, y: number, zoom: number) {
        return this.urlTemplate
            .replace("{x}", x.toString())
            .replace("{y}", y.toString())
            .replace("{z}", zoom.toString());
    }
}