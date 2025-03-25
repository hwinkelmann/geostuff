import { TileDescriptor } from "../../../models/TileDescriptor";
import { RenderContext } from "../../../rendering/RenderContext";
import { Loader } from "../../Loader";
import { Layer, LayerStats, MatchType, ResourceRequestType } from "../Layer";

export abstract class TextureLayer extends Layer<WebGLTexture> {
    protected abstract getTileUrl(tile: TileDescriptor): string;

    private cache: Map<string, {
        desc: TileDescriptor,
        url: string,
        data: WebGLTexture,
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

        gl.generateMipmap(gl.TEXTURE_2D);

        return texture;
    });

    constructor(protected context: RenderContext, public minLevel: number, public maxLevel: number, private maxCacheSize: number = 1500) {
        super();

        this.doneHandler.bind(this);

        this.loader.onDone = (resource) => {
            this.doneHandler(resource.data, resource.descriptor);
        };
    }

    private doneHandler(texture: WebGLTexture, desc?: TileDescriptor) {
        if (!desc)
            throw new Error("No descriptor - this should never happen");

        console.log("loading texture done", desc.toString());
        this.cache.set(desc.toString(), {
            desc,
            url: this.getTileUrl(desc),
            data: texture,
            refCount: 0,
        });

        if (this.cache.size > this.maxCacheSize)
            this.preempt();
    }

    public dispose() {
        for (const key of this.cache.keys())
            this.context.gl?.deleteTexture(this.cache.get(key)?.data ?? null);

        this.cache.clear();

        this.loader.dispose();
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

        this.loader.prune(wishlist.map(w => w.desc));

        this.loader.processQueue();
    }

    public getCached(desc: TileDescriptor): WebGLTexture | undefined {
        return this.cache.get(desc.toString())?.data;
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

    private preempt() {
        const unreferenced = Array.from(this.cache.entries()).filter(e => e[1].refCount <= 0).map(e => e[1]);
        const numElementsToRemove = Math.max(1, Math.floor(unreferenced.length * 0.9));

        for (let i = 0; i < numElementsToRemove; i++) {
            const randomIndex = Math.floor(Math.random() * unreferenced.length);
            const key = unreferenced[randomIndex].desc.toString();
            const elem = this.cache.get(key);
            if (!elem)
                continue;

            this.context.gl?.deleteTexture(elem.data);
            this.cache.delete(key);

            unreferenced.splice(randomIndex, 1);
        }
    }

    public getBestAvailableMatch(desc: TileDescriptor): MatchType<WebGLTexture> | undefined {
        while (desc.zoom >= this.minLevel) {
            const elem = this.cache.get(desc.toString());
            if (elem) {
                return {
                    descriptor: elem.desc,
                    data: elem.data,
                };
            }

            desc = desc.getParent()!;
        }

        return undefined;
    }

    public getAppropriateDescriptor(mapDescriptor: TileDescriptor): TileDescriptor {
        return mapDescriptor;
    }

    public getStats(): LayerStats {
        return {
            ...this.loader.getStats(),
            size: this.cache.size,
            referenced: Array.from(this.cache.values()).filter(e => e.refCount > 0).length,
        };
    }
}