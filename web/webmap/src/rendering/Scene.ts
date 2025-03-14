import { Datum } from "../geography/Datum";
import { Projection } from "../geography/Projection";
import { DoubleMatrix } from "../geometry/DoubleMatrix";
import { DoubleVector3 } from "../geometry/DoubleVector3";
import { TileDescriptor } from "../models/TileDescriptor";
import { Camera } from "../scene/Camera";
import { ElevationLayer } from "../scene/layers/dem/ElevationLayer";
import { ResourceRequestType } from "../scene/layers/Layer";
import { TextureLayer } from "../scene/layers/texture/TextureLayer";
import { Lod, LodDetails } from "../scene/Lod";
import { GenericCache } from "../utils/GenericCache";
import { TileModel } from "./renderables/TileModel";
import { RenderContext } from "./RenderContext";
import { setBuffers, setMatrices } from "./Utils";

const tesselationSteps = 42;

export class Scene {
    public lod: Lod;

    public modelCache: GenericCache<string, TileModel>;

    constructor(
        private context: RenderContext,
        private datum: Datum,
        private projection: Projection,
        private textureLayer: TextureLayer | undefined,
        private elevationLayer: ElevationLayer | undefined,
        private minLevel = 2,
        private maxLevel = 17,
        maxModelCount = 300,
    ) {
        this.lod = new Lod(datum, projection);

        this.modelCache = new GenericCache<string, TileModel>(maxModelCount, (_, v) => {
            v.dispose();
        });
    }

    public dispose() {
        this.modelCache.clear();
        this.textureLayer?.dispose();
    }

    public render(camera: Camera) {
        const wishlist = this.lod.performLevelOfDetail(this.context, camera, this.minLevel, this.maxLevel, this.modelCache);
        const wishlistDescriptors = wishlist.map(w => w.desc);

        this.refreshModels(wishlistDescriptors);
        this.fetchTextures(camera, wishlist);

        const models = this.getBestModels(wishlistDescriptors);

        if (!camera || !this.context.gl || !this.context.tileProgram)
            return;

        for (const model of models)
            this.renderObject(this.context.tileProgram!, camera, model.boundingSphere.center, {
                vertexBuffer: model.vertexBuffer!,
                textureBuffer: model.textureBuffer!,
                indexBuffer: model.indexBuffer,
            }, model.texture, model.triCount);
    }

    /**
     * Returns a list of the models that match the requested tiles best.
     * This operation is non-blocking and will return immediately. Missing
     * models will be loaded asynchronously.
     */
    private getBestModels(wishlist: TileDescriptor[]): TileModel[] {
        const bestMatches: TileModel[] = [];

        // Check how we can best satisfy the necessary tiles
        for (const tile of wishlist) {
            let parent: TileDescriptor | undefined = tile;

            do {

                const existing = this.modelCache.peek(parent.toString());
                if (existing) {
                    bestMatches.push(existing);
                    break;
                }
                parent = parent.getParent();
            } while (parent);
        }

        // Remove all tiles that overlap with others
        const topDownSorted = bestMatches.sort((a, b) => a.textureDescriptor.zoom - b.textureDescriptor.zoom);
        const result = topDownSorted.filter(m => !topDownSorted.some(other => m.descriptor.getAllParents().includes(other.descriptor)));

        // Touch all models used in the result to prevent them from being removed.
        // Also touch their parents because we might need them later.
        const allInvolvedTiles = new Set<TileDescriptor>(result.map(m => [m.descriptor, m.descriptor.getAllParents()]).flat() as TileDescriptor[]);
        allInvolvedTiles.forEach(m => this.modelCache.touch(m.toString()));

        this.modelCache.age();

        return result;
    }

    private fetchTextures(camera: Camera, wishlist: LodDetails[]) {
        const texturesToFetch: ResourceRequestType[] = [];
        const camPosition = camera.getCameraPosition();

        for (const element of wishlist) {
            if (this.textureLayer?.getCached(element.desc))
                // This texture is already loaded
                continue;

            // Find the next texture to load. It is that tile that is closest to the
            // one that's already loaded.
            const parentDescriptors = element.desc.getAllParents(true).reverse().filter(d => d.zoom >= this.minLevel);
            const textureDesc = parentDescriptors.find(d => this.textureLayer?.getCached(d) === undefined);

            const distanceToCamera = -element.boundingSphere.center.distanceTo(camPosition);

            const priority = element.desc.zoom * -10000 - Math.min(9999, distanceToCamera);

            texturesToFetch.push({
                priority,
                desc: textureDesc!,
            });
        }

        this.textureLayer?.request(texturesToFetch);
    }


    /**
     * Checks what we have, and requests the next missing items. Triggers remodelling
     * of affected models if necessary.
     * This function is non-blocking and will return immediately.
     * @param wishlist All the tiles our view is currently wishing for
     */
    private refreshModels(wishlist: TileDescriptor[]) {
        for (const desc of wishlist) {
            const parentDescriptors = desc.getAllParents(true).filter(d => d.zoom >= this.minLevel);

            const bestModelDescriptor = parentDescriptors.find(d => this.modelCache.peek(d.toString()) !== undefined);
            const bestModel = this.modelCache.peek(bestModelDescriptor?.toString() ?? "");
            const bestTextureDescriptor = parentDescriptors.find(d => this.textureLayer?.getCached(d) !== undefined);

            // Check if there's a model that's already generated that could be updated with
            // a better texture.
            const updateModel = bestModel !== undefined && bestTextureDescriptor !== undefined &&
                bestModel.textureDescriptor.zoom < bestTextureDescriptor.zoom;

            if (updateModel) {
                const tile = new TileModel(this.context, bestTextureDescriptor, desc, this.textureLayer?.getCached(bestTextureDescriptor), tesselationSteps, this.datum, this.projection);
                this.modelCache.set(desc.toString(), tile);

                // Dispose existing model. Decreasing the ref count needs to happen after
                // setting up the new model, because otherwise the ref count might fall to zero
                // and the texture would be deleted.
                this.textureLayer?.decreaseRefCount(bestModel.textureDescriptor);
                bestModel.dispose();
                continue;
            }

            if (bestModelDescriptor?.equals(desc))
                // We already have a model for the desired zoom level.
                // No better resources are available, so let's continue.
                continue;

            // We need to generate a model. However, we don't just jump to the desired zoom
            // level. Instead we're walking down the resolution until we get there.            
            const nextModelDescriptor = parentDescriptors.find(d => bestModelDescriptor?.zoom === (d.zoom - 1)) ?? parentDescriptors.find(p => p.zoom === this.minLevel);

            const generateModel = nextModelDescriptor !== undefined &&
                bestTextureDescriptor !== undefined &&
                this.modelCache.peek(nextModelDescriptor.toString()) === undefined;

            if (generateModel) {
                const tile = new TileModel(this.context, bestTextureDescriptor, desc, this.textureLayer?.getCached(bestTextureDescriptor), tesselationSteps, this.datum, this.projection);
                this.modelCache.set(desc.toString(), tile);
                continue;
            }

            // Reaching this point can happen during startup, before the initial
            // root-level tiles are loaded.
        }
    }

    public renderObject(program: WebGLProgram, camera: Camera, modelPosition: DoubleVector3, buffers: {
        vertexBuffer: WebGLBuffer,
        textureBuffer?: WebGLBuffer,
        colorBuffer?: WebGLBuffer,
        indexBuffer?: WebGLBuffer,
    },
        texture: WebGLTexture | undefined,
        triCount: number) {
        const gl = this.context.gl;
        if (!gl)
            throw new Error("No GL context");

        gl.useProgram(program);

        // The model's origin is the bounding sphere's center, and we need to
        // calculate the relative position of that to the camera. The usual way
        // to do this is to multiply the model- and view matrix, but that would
        // involve very large numbers (the translation part of the model matrix)
        // which would be multiplied with very small numbers (the rotation part),
        // leading to a loss of precision.
        // To remedy this, we're calculating a "model-to-camera" translation matrix,
        // which is then multiplied by the rotation part of the view matrix.
        const cameraPosition = camera.getCameraPosition();

        const modelToCameraTranslation = DoubleMatrix.getTranslationMatrix(
            modelPosition!.x - cameraPosition!.x,
            modelPosition!.y - cameraPosition!.y,
            modelPosition!.z - cameraPosition!.z
        );

        setMatrices(this.context, program, {
            projectionMatrix: camera?.getProjectionMatrix(),
            modelMatrix: modelToCameraTranslation,
            viewMatrix: camera?.getViewMatrix().resetTranslation(),
        });

        setBuffers(this.context, program, {
            vertexBuffer: buffers.vertexBuffer,
            indexBuffer: buffers?.indexBuffer,
            colorBuffer: buffers?.colorBuffer,
            textureCoordBuffer: buffers?.textureBuffer,
            texture,
        });

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (texture) {
            // Tell WebGL we want to affect texture unit 0
            gl.activeTexture(gl.TEXTURE0);

            // Bind the texture to texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Tell the shader we bound the texture to texture unit 0
            gl.uniform1i(this.context.locations.sampler, 0);
        }

        if (buffers.indexBuffer)
            gl.drawElements(gl.TRIANGLES, triCount * 3, gl.UNSIGNED_SHORT, 0);
        else
            gl.drawArrays(gl.TRIANGLES, 0, triCount * 3);
    }
}