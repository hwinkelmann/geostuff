import { TileDescriptor } from "../../../models/TileDescriptor";
import { RenderContext } from "../../../rendering/RenderContext";
import { Loader } from "../../Loader";
import { Layer, MatchType, ResourceRequestType } from "../Layer";

export abstract class TextureLayer extends Layer<WebGLTexture> {
    protected abstract getTileUrl(tile: TileDescriptor): string;

    private cache: Map<string, {
        desc: TileDescriptor,
        url: string,
        texture: WebGLTexture,
        refCount: number,
    }> = new Map();

    private loader: Loader<WebGLTexture, TileDescriptor> = new Loader<WebGLTexture, TileDescriptor>(async response => {
        const gl = this.context.gl;
        if (!gl)
            throw new Error("Failed to create texture");

        const blob = await response.blob();
        const image = new Image();
        image.src = URL.createObjectURL(blob);
        await image.decode();

        const texture = gl.createTexture();
        if (!texture)
            throw new Error("Failed to create texture");

        // Flip the image vertically
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        return texture;
    });

    constructor(protected context: RenderContext, public minLevel: number, public maxLevel: number) {
        super();

        this.doneHandler.bind(this);

        this.loader.onDone = (data, meta) => {
            this.doneHandler(data, meta);
        };
    }

    private doneHandler(texture: WebGLTexture, desc?: TileDescriptor) {
        if (!desc)
            throw new Error("No descriptor - this should never happen");

        console.log("loading texture done", desc.toString());
        this.cache.set(desc.toString(), {
            desc,
            url: this.getTileUrl(desc),
            texture,
            refCount: 0,
        });

        for (const listener of this.listeners ?? [])
            listener({
                descriptor: desc,
                data: texture,
            });
    }

    public dispose() {
        this.listeners.clear();

        for (const key of this.cache.keys())
            this.context.gl?.deleteTexture(this.cache.get(key)?.texture ?? null);

        this.cache.clear();

        this.loader.dispose();
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

    public getCached(desc: TileDescriptor): WebGLTexture | undefined {
        return this.cache.get(desc.toString())?.texture;
    }

    public decreaseRefCount(desc: TileDescriptor) {
        const elem = this.cache.get(desc.toString());
        if (!elem)
            return;

        elem.refCount--;

        if (elem.refCount === 0) {
            this.context.gl?.deleteTexture(elem.texture);
            this.cache.delete(desc.toString());
        }
    }

    public getBestMatch(desc: TileDescriptor): MatchType<WebGLTexture> | undefined {
        let bestMatch: TileDescriptor | undefined = undefined;

        for (const key of this.cache.keys()) {
            const elem = this.cache.get(key)!;

            if (elem.desc.includesOrEquals(desc)) {
                if (bestMatch === undefined) {
                    bestMatch = elem.desc;
                    continue;
                }

                const elemDelta = desc.zoom - elem.desc.zoom;
                if (elemDelta < 0)
                    // This tile is more detailed than what we need.
                    // We can't use it.
                    continue;

                const bestMatchDelta = desc.zoom - bestMatch.zoom;

                if (elemDelta < bestMatchDelta)
                    bestMatch = elem.desc;

                if (elemDelta === 0)
                    // We can't find a better match
                    break;
            }
        }

        if (bestMatch === undefined)
            return undefined;

        // Increase ref count. This function is called when a mesh is created,
        // and that mesh will use this texture.
        const elem = this.cache.get(bestMatch.toString())!;
        elem.refCount++;

        return {
            descriptor: elem.desc,
            data: elem.texture,
        };
    }
}